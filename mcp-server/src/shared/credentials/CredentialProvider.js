/**
 * ============================================================================
 * VIBE STACK - Credential Provider Base Class
 * ============================================================================
 * Abstract base class for credential providers
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Supported credential types
 * @constant {Object}
 */
export const CredentialType = {
  OAUTH_TOKEN: 'oauth_token',       // GitHub, GitLab personal access tokens
  API_KEY: 'api_key',               // OpenAI, Anthropic API keys
  SSH_KEY: 'ssh_key',               // SSH private keys
  BASIC_AUTH: 'basic_auth',         // Username/password
  BEARER_TOKEN: 'bearer_token',     // Generic bearer tokens
  SESSION_COOKIE: 'session_cookie'  // Session-based auth
};

/**
 * Provider configuration
 * @typedef {Object} ProviderConfig
 * @property {string} providerId - Unique provider identifier
 * @property {string} displayName - Human-readable name
 * @property {string[]} supportedTypes - Supported credential types
 * @property {string[]} requiredScopes - Required OAuth scopes (if applicable)
 * @property {string} authUrl - Authorization URL (if OAuth)
 * @property {string} tokenUrl - Token exchange URL (if OAuth)
 */

/**
 * Stored credential
 * @typedef {Object} StoredCredential
 * @property {string} id - Unique credential ID
 * @property {string} userId - User identifier
 * @property {string} provider - Provider ID
 * @property {string} type - Credential type
 * @property {string} scope - Optional scope (e.g., repo:owner/repo)
 * @property {string} encryptedValue - Encrypted credential value
 * @property {string} iv - Initialization vector
 * @property {string} authTag - Authentication tag
 * @property {Object} metadata - Additional metadata
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * Abstract credential provider
 * All providers must extend this class and implement required methods
 */
export class CredentialProvider {
  /**
   * Create a new credential provider
   * @param {ProviderConfig} config - Provider configuration
   */
  constructor(config) {
    if (this.constructor === CredentialProvider) {
      throw new Error('CredentialProvider is abstract and cannot be instantiated directly');
    }

    /** @type {string} */
    this.providerId = config.providerId;

    /** @type {string} */
    this.displayName = config.displayName;

    /** @type {Set<string>} */
    this.supportedTypes = new Set(config.supportedTypes || []);

    /** @type {Set<string>} */
    this.requiredScopes = new Set(config.requiredScopes || []);

    /** @type {string|undefined} */
    this.authUrl = config.authUrl;

    /** @type {string|undefined} */
    this.tokenUrl = config.tokenUrl;
  }

  /**
   * Validate credential format and structure
   * Must be implemented by subclasses
   * @abstract
   * @param {string} credential - Credential to validate
   * @returns {{valid: boolean, reason?: string}} Validation result
   */
  validateCredential(credential) {
    throw new Error(`${this.constructor.name}.validateCredential() must be implemented`);
  }

  /**
   * Get storage key for this credential
   * Combines userId, providerId, and optional scope
   * @param {string} userId - User identifier
   * @param {string} [scope] - Optional scope
   * @returns {string} Storage key
   */
  getStorageKey(userId, scope) {
    const parts = [userId, this.providerId];
    if (scope) {
      parts.push(scope);
    }
    return parts.join(':');
  }

  /**
   * Check if credential type is supported
   * @param {string} type - Credential type
   * @returns {boolean} True if supported
   */
  isTypeSupported(type) {
    return this.supportedTypes.has(type);
  }

  /**
   * Get metadata for credential storage
   * Override to add provider-specific metadata
   * @param {string} credential - Credential value
   * @returns {Object} Metadata object
   */
  getMetadata(credential) {
    return {
      provider: this.providerId,
      version: '3.0.0'
    };
  }

  /**
   * Sanitize credential for logging/display
   * @param {string} credential - Credential to mask
   * @param {number} [visibleChars=4] - Number of visible characters
   * @returns {string} Masked credential
   */
  maskCredential(credential, visibleChars = 4) {
    if (!credential || typeof credential !== 'string') {
      return '***';
    }
    if (credential.length <= visibleChars * 2) {
      return '***';
    }
    return credential.slice(0, visibleChars) + '...' + credential.slice(-visibleChars);
  }

  /**
   * Extract scope from credential if applicable
   * Override for provider-specific scope extraction
   * @param {string} credential - Credential value
   * @returns {string|null} Scope or null
   */
  extractScope(credential) {
    return null;
  }

  /**
   * Get authentication headers for API requests
   * Override for provider-specific auth headers
   * @param {string} credential - Decrypted credential
   * @returns {Object} Headers object
   */
  getAuthHeaders(credential) {
    return {
      'Authorization': `Bearer ${credential}`
    };
  }
}

export default CredentialProvider;
