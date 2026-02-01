/**
 * ============================================================================
 * VIBE STACK - Bitbucket Credential Provider
 * ============================================================================
 * Bitbucket-specific credential validation and handling
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialProvider, CredentialType } from '../CredentialProvider.js';

/**
 * Bitbucket credential provider
 */
export class BitbucketProvider extends CredentialProvider {
  constructor() {
    super({
      providerId: 'bitbucket',
      displayName: 'Bitbucket',
      supportedTypes: [CredentialType.OAUTH_TOKEN, CredentialType.BEARER_TOKEN],
      requiredScopes: ['repository:write', 'pullrequest:write']
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

    return { valid: true };
  }

  getAuthHeaders(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
  }
}

export default BitbucketProvider;
