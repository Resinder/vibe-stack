/**
 * ============================================================================
 * VIBE STACK - GitHub Credential Provider
 * ============================================================================
 * GitHub-specific credential validation and handling
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialProvider, CredentialType } from '../CredentialProvider.js';

/**
 * GitHub token prefixes
 */
const GITHUB_TOKEN_PREFIXES = [
  'ghp_',  // GitHub Personal Access Token (Classic)
  'gho_',  // GitHub OAuth Token
  'ghu_',  // GitHub User Token
  'ghs_',  // GitHub Server Token (for GitHub Actions/Enterprise)
  'ghr_',  // GitHub Refresh Token
  'ghb_',  // GitHub Build Token
  'ghc_'   // GitHub Customer Token
];

/**
 * GitHub credential provider
 */
export class GitHubProvider extends CredentialProvider {
  constructor() {
    super({
      providerId: 'github',
      displayName: 'GitHub',
      supportedTypes: [CredentialType.OAUTH_TOKEN, CredentialType.BEARER_TOKEN],
      requiredScopes: ['repo', 'read:org'],
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token'
    });
  }

  validateCredential(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'Token must be a non-empty string' };
    }

    if (token.length < 36) {
      return { valid: false, reason: 'Token is too short (minimum 36 characters)' };
    }

    if (token.length > 255) {
      return { valid: false, reason: 'Token exceeds maximum length (255 characters)' };
    }

    const hasValidPrefix = GITHUB_TOKEN_PREFIXES.some(prefix => token.startsWith(prefix));

    if (!hasValidPrefix) {
      return { valid: false, reason: 'Token must start with valid GitHub prefix' };
    }

    const parts = token.split('_');
    const tokenPart = parts[1];

    if (!tokenPart || !/^[a-zA-Z0-9]+$/.test(tokenPart)) {
      return { valid: false, reason: 'Token contains invalid characters' };
    }

    return { valid: true };
  }

  async getUsername(token) {
    try {
      const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.login || null;
    } catch {
      return null;
    }
  }

  async getMetadata(token) {
    const username = await this.getUsername(token);
    return {
      provider: this.providerId,
      version: '3.0.0',
      username: username || undefined,
      tokenPrefix: token.split('_')[0] || 'unknown'
    };
  }

  getAuthHeaders(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vibe-Stack/3.0.0',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }
}

export default GitHubProvider;
