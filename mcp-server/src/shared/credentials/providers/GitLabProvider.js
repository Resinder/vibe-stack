/**
 * ============================================================================
 * VIBE STACK - GitLab Credential Provider
 * ============================================================================
 * GitLab-specific credential validation and handling
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialProvider, CredentialType } from '../CredentialProvider.js';

/**
 * GitLab token prefixes
 */
const GITLAB_TOKEN_PREFIXES = [
  'glpat-',  // GitLab Personal Access Token
  'glft-',   // GitLab Feed Token
  'glt_'     // GitLab Deploy Token (JSON Web Token)
];

/**
 * GitLab credential provider
 */
export class GitLabProvider extends CredentialProvider {
  constructor() {
    super({
      providerId: 'gitlab',
      displayName: 'GitLab',
      supportedTypes: [CredentialType.OAUTH_TOKEN, CredentialType.BEARER_TOKEN],
      requiredScopes: ['api', 'read_repository', 'write_repository']
    });
  }

  validateCredential(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'Token must be a non-empty string' };
    }

    if (token.length < 20) {
      return { valid: false, reason: 'Token is too short (minimum 20 characters)' };
    }

    if (token.length > 255) {
      return { valid: false, reason: 'Token exceeds maximum length (255 characters)' };
    }

    const hasValidPrefix = GITLAB_TOKEN_PREFIXES.some(prefix => token.startsWith(prefix));

    if (!hasValidPrefix) {
      return { valid: false, reason: 'Token must start with valid GitLab prefix' };
    }

    return { valid: true };
  }

  async getUsername(token) {
    try {
      const response = await fetch('https://gitlab.com/api/v4/user', {
        method: 'GET',
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.username || null;
    } catch {
      return null;
    }
  }

  async getMetadata(token) {
    const username = await this.getUsername(token);
    return {
      provider: this.providerId,
      version: '3.0.0',
      username: username || undefined
    };
  }

  getAuthHeaders(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Vibe-Stack/3.0.0'
    };
  }
}

export default GitLabProvider;
