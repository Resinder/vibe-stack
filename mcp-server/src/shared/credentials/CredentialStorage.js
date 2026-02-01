/**
 * ============================================================================
 * VIBE STACK - Secure Credential Storage Service
 * ============================================================================
 * Secure storage and retrieval of user credentials with comprehensive security
 * @version 1.0.0 - Production-ready security implementation
 * ============================================================================
 */

import crypto from 'crypto';
import { Logger } from '../../utils/logger.js';

/**
 * Validate and get encryption key from environment
 * CRITICAL: Production requires proper key configuration
 * @throws {Error} If key is not configured or invalid in production
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const keyFromEnv = process.env.CREDENTIAL_ENCRYPTION_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, encryption key is mandatory
  if (isProduction && !keyFromEnv) {
    throw new Error(
      '[SECURITY] CREDENTIAL_ENCRYPTION_KEY environment variable is required in production. ' +
      'Generate a secure key: openssl rand -base64 48'
    );
  }

  // Development warning
  if (!keyFromEnv) {
    Logger.error('[SECURITY] CREDENTIAL_ENCRYPTION_KEY not configured. DO NOT USE IN PRODUCTION!');
    Logger.error('[SECURITY] Set CREDENTIAL_ENCRYPTION_KEY environment variable with a 32+ character random string.');
    // For development, generate a temporary key
    Logger.warn('[SECURITY] Generated temporary encryption key for development only.');
    return crypto.randomBytes(32);
  }

  // Validate key length (minimum 32 bytes for AES-256)
  const minLength = 32;
  if (keyFromEnv.length < minLength) {
    throw new Error(`CREDENTIAL_ENCRYPTION_KEY must be at least ${minLength} characters long (got ${keyFromEnv.length})`);
  }

  // Use provided salt or generate deterministic salt from key
  const salt = process.env.CREDENTIAL_ENCRYPTION_SALT ||
               crypto.createHash('sha256').update(keyFromEnv + 'vibe-stack-credential-salt').digest();

  // Derive a proper 32-byte key using PBKDF2
  const key = crypto.pbkdf2Sync(
    keyFromEnv,
    salt,
    100000, // iterations - OWASP recommended minimum
    32,     // key length for AES-256
    'sha256'
  );

  return key;
}

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-gcm';

/**
 * Sanitize user ID to prevent injection and enumeration attacks
 * @param {string} userId - User identifier to sanitize
 * @returns {string} Sanitized user ID
 * @throws {Error} If user ID contains invalid characters
 */
function sanitizeUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID must be a non-empty string');
  }

  // Allow only alphanumeric, underscore, hyphen, and dot
  const sanitized = userId.replace(/[^a-zA-Z0-9_.-]/g, '');

  if (sanitized !== userId) {
    Logger.warn(`[SECURITY] User ID contained invalid characters and was sanitized`);
  }

  if (sanitized.length === 0) {
    throw new Error('Invalid user ID after sanitization');
  }

  // Limit length to prevent DoS
  const maxUserIdLength = 255;
  if (sanitized.length > maxUserIdLength) {
    throw new Error(`User ID exceeds maximum length of ${maxUserIdLength}`);
  }

  // Prevent user enumeration with common patterns
  const sensitiveUserIds = ['admin', 'root', 'system', 'superuser', 'test'];
  if (sensitiveUserIds.includes(sanitized.toLowerCase())) {
    Logger.warn(`[SECURITY] Sensitive user ID detected: ${sanitized}`);
  }

  return sanitized;
}

/**
 * Validate GitHub token format and structure
 * @param {string} token - Token to validate
 * @returns {Object} Validation result with valid flag and reason
 */
function validateGitHubToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token must be a non-empty string' };
  }

  // Check minimum length (GitHub tokens are typically 40+ characters)
  if (token.length < 36) {
    return { valid: false, reason: 'Token is too short (minimum 36 characters)' };
  }

  // Check maximum length
  if (token.length > 255) {
    return { valid: false, reason: 'Token exceeds maximum length (255 characters)' };
  }

  // Check for valid prefixes
  const validPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'ghb_', 'ghc_'];
  const hasValidPrefix = validPrefixes.some(prefix => token.startsWith(prefix));

  if (!hasValidPrefix) {
    return { valid: false, reason: 'Token must start with one of: ghp_, gho_, ghu_, ghs_, ghr_, ghb_, ghc_' };
  }

  // Check for valid characters after prefix (alphanumeric)
  const parts = token.split('_');
  const tokenPart = parts[1];

  if (!tokenPart || !/^[a-zA-Z0-9]+$/.test(tokenPart)) {
    return { valid: false, reason: 'Token contains invalid characters (only alphanumeric allowed after prefix)' };
  }

  return { valid: true };
}

/**
 * Mask sensitive data for logging
 * @param {string} sensitive - Sensitive data to mask
 * @param {number} visibleChars - Number of characters to show at start
 * @returns {string} Masked string
 */
function maskSensitive(sensitive, visibleChars = 4) {
  if (!sensitive || typeof sensitive !== 'string') {
    return '***';
  }
  if (sensitive.length <= visibleChars * 2) {
    return '***';
  }
  // Fixed: Use slice() instead of substring() with negative index
  return sensitive.slice(0, visibleChars) + '...' + sensitive.slice(-visibleChars);
}

/**
 * Secure Credential Storage Service
 * Handles encrypted storage and retrieval with comprehensive security
 */
export class CredentialStorage {
  /** @type {Object} PostgreSQL storage instance */
  #storage;

  /** @type {Map} Runtime cache with TTL */
  #cache;

  /** @type {Map} Cache timestamps for TTL */
  #cacheTimestamps;

  /** @type {number} Cache TTL in milliseconds */
  #cacheTTL;

  /** @type {number} Maximum cache size */
  #maxCacheSize;

  /** @type {NodeJS.Timeout} Cache cleanup interval */
  #cleanupInterval;

  /**
   * Create a new CredentialStorage instance
   * @param {Object} postgresStorage - PostgreSQL storage instance
   * @param {Object} options - Configuration options
   */
  constructor(postgresStorage, options = {}) {
    this.#storage = postgresStorage;
    this.#cache = new Map();
    this.#cacheTimestamps = new Map();
    this.#cacheTTL = options.cacheTTL || 300000; // 5 minutes default
    this.#maxCacheSize = options.maxCacheSize || 100;

    // Start cache cleanup interval
    this.#startCacheCleanup();
  }

  /**
   * Start periodic cache cleanup for expired entries
   * @private
   */
  #startCacheCleanup() {
    this.#cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of this.#cacheTimestamps.entries()) {
        if (now - timestamp > this.#cacheTTL) {
          this.#cache.delete(key);
          this.#cacheTimestamps.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * Set value in cache with timestamp
   * @private
   */
  #setCache(key, value) {
    // Enforce max cache size
    if (this.#cache.size >= this.#maxCacheSize) {
      // Remove oldest entry
      const oldestKey = this.#cacheTimestamps.keys().next().value;
      if (oldestKey) {
        this.#cache.delete(oldestKey);
        this.#cacheTimestamps.delete(oldestKey);
      }
    }

    this.#cache.set(key, value);
    this.#cacheTimestamps.set(key, Date.now());
  }

  /**
   * Get value from cache if not expired
   * @private
   */
  #getCache(key) {
    const timestamp = this.#cacheTimestamps.get(key);
    if (!timestamp) {
      return null;
    }

    if (Date.now() - timestamp > this.#cacheTTL) {
      this.#cache.delete(key);
      this.#cacheTimestamps.delete(key);
      return null;
    }

    return this.#cache.get(key);
  }

  /**
   * Encrypt sensitive data with authentication
   * @param {string} text - Plain text to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   * @private
   */
  _encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      Logger.error('[SECURITY] Encryption failed', error);
      throw new Error('Credential encryption failed');
    }
  }

  /**
   * Decrypt and verify sensitive data
   * @param {Object} data - Encrypted data with IV and auth tag
   * @returns {string} Decrypted plain text
   * @throws {Error} If decryption or authentication fails
   * @private
   */
  _decrypt(data) {
    try {
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        ENCRYPTION_KEY,
        Buffer.from(data.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      Logger.error('[SECURITY] Decryption failed - possible data tampering or key mismatch', error);
      throw new Error('Credential decryption failed');
    }
  }

  /**
   * Store GitHub token securely with audit logging
   * @param {string} token - GitHub personal access token
   * @param {string} userId - User identifier (optional, defaults to 'default')
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Stored credential info
   */
  async storeGitHubToken(token, userId = 'default', metadata = {}) {
    try {
      // Sanitize user ID
      const sanitizedUserId = sanitizeUserId(userId);

      // Validate token format
      const validation = validateGitHubToken(token);
      if (!validation.valid) {
        Logger.warn(`[SECURITY] Invalid token format for user ${sanitizedUserId}: ${validation.reason}`);
        throw new Error(`Invalid GitHub token: ${validation.reason}`);
      }

      // Encrypt token
      const encrypted = this._encrypt(token);

      // Create audit-safe metadata
      const sanitizedMetadata = {
        ...metadata,
        createdAt: new Date().toISOString(),
        source: 'mcp-server',
        version: '3.0.0'
      };

      // Store in PostgreSQL credentials table
      const query = `
        INSERT INTO credentials (user_id, type, encrypted_value, iv, auth_tag, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (user_id, type)
        DO UPDATE SET
          encrypted_value = EXCLUDED.encrypted_value,
          iv = EXCLUDED.iv,
          auth_tag = EXCLUDED.auth_tag,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING id, user_id, type, created_at
      `;

      const result = await this.#storage.pool.query(query, [
        sanitizedUserId,
        'github_token',
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        JSON.stringify(sanitizedMetadata)
      ]);

      // Cache the decrypted token for runtime use
      this.#setCache(`${sanitizedUserId}:github_token`, token);

      // Audit log (without sensitive data)
      Logger.info(`[CREDENTIAL] GitHub token stored for user: ${sanitizedUserId}`);

      return {
        success: true,
        userId: sanitizedUserId,
        type: 'github_token',
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to store GitHub token', error);
      throw new Error(`Failed to store GitHub token: ${error.message}`);
    }
  }

  /**
   * Retrieve GitHub token with audit logging
   * @param {string} userId - User identifier
   * @returns {Promise<string|null>} Decrypted GitHub token or null
   */
  async getGitHubToken(userId = 'default') {
    try {
      // Sanitize user ID
      const sanitizedUserId = sanitizeUserId(userId);

      // Check cache first
      const cached = this.#getCache(`${sanitizedUserId}:github_token`);
      if (cached) {
        return cached;
      }

      // Retrieve from database
      const query = `
        SELECT encrypted_value, iv, auth_tag
        FROM credentials
        WHERE user_id = $1 AND type = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const result = await this.#storage.pool.query(query, [sanitizedUserId, 'github_token']);

      if (result.rows.length === 0) {
        return null;
      }

      // Decrypt token
      const decrypted = this._decrypt({
        encrypted: result.rows[0].encrypted_value,
        iv: result.rows[0].iv,
        authTag: result.rows[0].auth_tag
      });

      // Cache for future use
      this.#setCache(`${sanitizedUserId}:github_token`, decrypted);

      // Audit log
      Logger.info(`[CREDENTIAL] GitHub token retrieved for user: ${sanitizedUserId}`);

      return decrypted;
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to retrieve GitHub token', error);
      throw new Error(`Failed to retrieve GitHub token: ${error.message}`);
    }
  }

  /**
   * Delete stored GitHub token with audit logging
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteGitHubToken(userId = 'default') {
    try {
      // Sanitize user ID
      const sanitizedUserId = sanitizeUserId(userId);

      const query = `
        DELETE FROM credentials
        WHERE user_id = $1 AND type = $2
      `;

      const result = await this.#storage.pool.query(query, [sanitizedUserId, 'github_token']);

      // Remove from cache
      this.#cache.delete(`${sanitizedUserId}:github_token`);
      this.#cacheTimestamps.delete(`${sanitizedUserId}:github_token`);

      // Audit log
      Logger.info(`[CREDENTIAL] GitHub token deleted for user: ${sanitizedUserId}`);

      return result.rowCount > 0;
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to delete GitHub token', error);
      throw new Error(`Failed to delete GitHub token: ${error.message}`);
    }
  }

  /**
   * Store Git credentials for a specific repository
   * @param {string} repoUrl - Repository URL
   * @param {string} username - Git username
   * @param {string} password - Git password or token
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Stored credential info
   */
  async storeGitCredentials(repoUrl, username, password, userId = 'default') {
    try {
      // Sanitize user ID
      const sanitizedUserId = sanitizeUserId(userId);

      // Validate inputs
      if (!repoUrl || !username || !password) {
        throw new Error('Repository URL, username, and password are required');
      }

      // Validate URL format
      try {
        new URL(repoUrl);
      } catch {
        throw new Error('Invalid repository URL format');
      }

      const credential = `${username}:${password}`;
      const encrypted = this._encrypt(credential);

      const query = `
        INSERT INTO credentials (user_id, type, encrypted_value, iv, auth_tag, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (user_id, type, metadata)
        DO UPDATE SET
          encrypted_value = EXCLUDED.encrypted_value,
          iv = EXCLUDED.iv,
          auth_tag = EXCLUDED.auth_tag,
          updated_at = NOW()
        RETURNING id
      `;

      const result = await this.#storage.pool.query(query, [
        sanitizedUserId,
        'git_credentials',
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        JSON.stringify({ repoUrl, username })
      ]);

      // Audit log
      Logger.info(`[CREDENTIAL] Git credentials stored for user: ${sanitizedUserId}, repo: ${repoUrl}`);

      return {
        success: true,
        repoUrl,
        username
      };
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to store Git credentials', error);
      throw new Error(`Failed to store Git credentials: ${error.message}`);
    }
  }

  /**
   * Get Git credentials for a repository
   * @param {string} repoUrl - Repository URL
   * @param {string} userId - User identifier
   * @returns {Promise<Object|null>} Credentials or null
   */
  async getGitCredentials(repoUrl, userId = 'default') {
    try {
      // Sanitize user ID
      const sanitizedUserId = sanitizeUserId(userId);

      const query = `
        SELECT encrypted_value, iv, auth_tag, metadata
        FROM credentials
        WHERE user_id = $1 AND type = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const result = await this.#storage.pool.query(query, [sanitizedUserId, 'git_credentials']);

      if (result.rows.length === 0) {
        return null;
      }

      const decrypted = this._decrypt({
        encrypted: result.rows[0].encrypted_value,
        iv: result.rows[0].iv,
        authTag: result.rows[0].auth_tag
      });

      const [username, password] = decrypted.split(':');

      // Audit log
      Logger.info(`[CREDENTIAL] Git credentials retrieved for user: ${sanitizedUserId}`);

      return { username, password };
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to retrieve Git credentials', error);
      throw new Error(`Failed to retrieve Git credentials: ${error.message}`);
    }
  }

  /**
   * Check if user has credentials stored (without exposing sensitive data)
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Credential status
   */
  async getCredentialStatus(userId = 'default') {
    try {
      // Sanitize user ID
      const sanitizedUserId = sanitizeUserId(userId);

      const githubToken = await this.getGitHubToken(sanitizedUserId);

      // Don't expose the actual token, only masked prefix
      const tokenPrefix = githubToken
        ? maskSensitive(githubToken, 4)
        : null;

      return {
        hasGitHubToken: !!githubToken,
        githubTokenPrefix: tokenPrefix,
        userId: sanitizedUserId
      };
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to get credential status', error);
      return {
        hasGitHubToken: false,
        githubTokenPrefix: null,
        userId: sanitizedUserId
      };
    }
  }

  /**
   * Clear all cached credentials (for security events)
   */
  clearCache() {
    Logger.warn('[SECURITY] Clearing all credential caches');
    this.#cache.clear();
    this.#cacheTimestamps.clear();
  }

  // ============================================================================
  // GENERIC CREDENTIAL METHODS (Multi-Platform Support)
  // ============================================================================

  /**
   * Store a credential for any provider
   * @param {string} providerId - Provider ID (github, gitlab, openai, anthropic, bitbucket)
   * @param {string} credential - Credential value (token, API key, etc.)
   * @param {string} userId - User identifier (optional, defaults to 'default')
   * @param {string} scope - Optional scope (e.g., repo:owner/repo for specific repo)
   * @param {Object} additionalMetadata - Additional metadata
   * @returns {Promise<Object>} Stored credential info
   */
  async storeCredential(providerId, credential, userId = 'default', scope = null, additionalMetadata = {}) {
    try {
      const sanitizedUserId = sanitizeUserId(userId);

      // Import provider registry
      const { providerRegistry } = await import('./providers/index.js');
      const provider = providerRegistry.get(providerId);

      if (!provider) {
        throw new Error(`Unknown provider: ${providerId}. Supported: ${providerRegistry.getProviderIds().join(', ')}`);
      }

      // Validate credential using provider
      const validation = provider.validateCredential(credential);
      if (!validation.valid) {
        Logger.warn(`[CREDENTIAL] Invalid ${providerId} credential for user ${sanitizedUserId}: ${validation.reason}`);
        throw new Error(`Invalid ${providerId} credential: ${validation.reason}`);
      }

      // Encrypt credential
      const encrypted = this._encrypt(credential);

      // Get provider-specific metadata
      const providerMetadata = await provider.getMetadata(credential);

      // Create storage key (format: userId:providerId or userId:providerId:scope)
      const storageKey = provider.getStorageKey(sanitizedUserId, scope);

      // Create audit-safe metadata
      const metadata = {
        ...additionalMetadata,
        ...providerMetadata,
        scope: scope || null,
        storageKey,
        createdAt: new Date().toISOString(),
        source: 'mcp-server',
        version: '3.0.0'
      };

      // Store in PostgreSQL credentials table
      const query = `
        INSERT INTO credentials (user_id, type, encrypted_value, iv, auth_tag, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (user_id, type, metadata)
        DO UPDATE SET
          encrypted_value = EXCLUDED.encrypted_value,
          iv = EXCLUDED.iv,
          auth_tag = EXCLUDED.auth_tag,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING id, user_id, type, created_at
      `;

      const result = await this.#storage.pool.query(query, [
        sanitizedUserId,
        storageKey,
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        JSON.stringify(metadata)
      ]);

      // Cache the decrypted credential
      this.#setCache(storageKey, credential);

      Logger.info(`[CREDENTIAL] ${providerId} credential stored for user: ${sanitizedUserId}${scope ? ` (scope: ${scope})` : ''}`);

      return {
        success: true,
        userId: sanitizedUserId,
        providerId,
        scope,
        storageKey,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      Logger.error(`[CREDENTIAL] Failed to store ${providerId} credential`, error);
      throw new Error(`Failed to store ${providerId} credential: ${error.message}`);
    }
  }

  /**
   * Retrieve a credential for any provider
   * @param {string} providerId - Provider ID
   * @param {string} userId - User identifier
   * @param {string} scope - Optional scope
   * @returns {Promise<string|null>} Decrypted credential or null
   */
  async getCredential(providerId, userId = 'default', scope = null) {
    try {
      const sanitizedUserId = sanitizeUserId(userId);

      // Import provider registry
      const { providerRegistry } = await import('./providers/index.js');
      const provider = providerRegistry.get(providerId);

      if (!provider) {
        throw new Error(`Unknown provider: ${providerId}`);
      }

      // Create storage key
      const storageKey = provider.getStorageKey(sanitizedUserId, scope);

      // Check cache first
      const cached = this.#getCache(storageKey);
      if (cached) {
        return cached;
      }

      // Retrieve from database
      const query = `
        SELECT encrypted_value, iv, auth_tag, metadata
        FROM credentials
        WHERE user_id = $1 AND type = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const result = await this.#storage.pool.query(query, [sanitizedUserId, storageKey]);

      if (result.rows.length === 0) {
        return null;
      }

      // Decrypt credential
      const decrypted = this._decrypt({
        encrypted: result.rows[0].encrypted_value,
        iv: result.rows[0].iv,
        authTag: result.rows[0].auth_tag
      });

      // Cache for future use
      this.#setCache(storageKey, decrypted);

      Logger.info(`[CREDENTIAL] ${providerId} credential retrieved for user: ${sanitizedUserId}${scope ? ` (scope: ${scope})` : ''}`);

      return decrypted;
    } catch (error) {
      Logger.error(`[CREDENTIAL] Failed to retrieve ${providerId} credential`, error);
      throw new Error(`Failed to retrieve ${providerId} credential: ${error.message}`);
    }
  }

  /**
   * Delete a stored credential
   * @param {string} providerId - Provider ID
   * @param {string} userId - User identifier
   * @param {string} scope - Optional scope
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteCredential(providerId, userId = 'default', scope = null) {
    try {
      const sanitizedUserId = sanitizeUserId(userId);

      // Import provider registry
      const { providerRegistry } = await import('./providers/index.js');
      const provider = providerRegistry.get(providerId);

      if (!provider) {
        throw new Error(`Unknown provider: ${providerId}`);
      }

      // Create storage key
      const storageKey = provider.getStorageKey(sanitizedUserId, scope);

      const query = `
        DELETE FROM credentials
        WHERE user_id = $1 AND type = $2
      `;

      const result = await this.#storage.pool.query(query, [sanitizedUserId, storageKey]);

      // Remove from cache
      this.#cache.delete(storageKey);
      this.#cacheTimestamps.delete(storageKey);

      Logger.info(`[CREDENTIAL] ${providerId} credential deleted for user: ${sanitizedUserId}${scope ? ` (scope: ${scope})` : ''}`);

      return result.rowCount > 0;
    } catch (error) {
      Logger.error(`[CREDENTIAL] Failed to delete ${providerId} credential`, error);
      throw new Error(`Failed to delete ${providerId} credential: ${error.message}`);
    }
  }

  /**
   * List all credentials for a user
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} List of credentials (without exposing sensitive data)
   */
  async listCredentials(userId = 'default') {
    try {
      const sanitizedUserId = sanitizeUserId(userId);

      const query = `
        SELECT type, metadata, created_at, updated_at
        FROM credentials
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `;

      const result = await this.#storage.pool.query(query, [sanitizedUserId]);

      // Parse storage keys to extract provider and scope
      const credentials = result.rows.map(row => {
        const storageKey = row.type;
        const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;

        // Extract provider from storage key (format: userId:providerId or userId:providerId:scope)
        const parts = storageKey.split(':');
        const providerId = parts[1];
        const scope = parts.length > 2 ? parts.slice(2).join(':') : null;

        return {
          providerId,
          scope,
          storageKey,
          metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });

      return credentials;
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to list credentials', error);
      throw new Error(`Failed to list credentials: ${error.message}`);
    }
  }

  /**
   * Get credential status for a user (enhanced version)
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Credential status summary
   */
  async getCredentialStatus(userId = 'default') {
    try {
      const sanitizedUserId = sanitizeUserId(userId);
      const credentials = await this.listCredentials(sanitizedUserId);

      // Group by provider
      const byProvider = {};
      for (const cred of credentials) {
        if (!byProvider[cred.providerId]) {
          byProvider[cred.providerId] = [];
        }
        byProvider[cred.providerId].push(cred);
      }

      return {
        userId: sanitizedUserId,
        totalCredentials: credentials.length,
        byProvider,
        providers: Object.keys(byProvider)
      };
    } catch (error) {
      Logger.error('[CREDENTIAL] Failed to get credential status', error);
      return {
        userId: sanitizedUserId,
        totalCredentials: 0,
        byProvider: {},
        providers: []
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.#cleanupInterval) {
      clearInterval(this.#cleanupInterval);
    }
    this.clearCache();
  }
}

/**
 * Create credential storage instance
 * @param {Object} postgresStorage - PostgreSQL storage instance
 * @param {Object} options - Configuration options
 * @returns {CredentialStorage} Credential storage instance
 */
export function createCredentialStorage(postgresStorage, options = {}) {
  return new CredentialStorage(postgresStorage, options);
}
