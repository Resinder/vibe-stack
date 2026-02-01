/**
 * ============================================================================
 * VIBE STACK - OpenAI Credential Provider
 * ============================================================================
 * OpenAI API key validation and handling
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialProvider, CredentialType } from '../CredentialProvider.js';

/**
 * OpenAI credential provider
 */
export class OpenAIProvider extends CredentialProvider {
  constructor() {
    super({
      providerId: 'openai',
      displayName: 'OpenAI',
      supportedTypes: [CredentialType.API_KEY],
      requiredScopes: []
    });
  }

  validateCredential(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, reason: 'API key must be a non-empty string' };
    }

    // OpenAI API keys start with 'sk-'
    if (!apiKey.startsWith('sk-')) {
      return { valid: false, reason: 'API key must start with sk-' };
    }

    if (apiKey.length < 20) {
      return { valid: false, reason: 'API key is too short (minimum 20 characters)' };
    }

    if (apiKey.length > 255) {
      return { valid: false, reason: 'API key exceeds maximum length (255 characters)' };
    }

    return { valid: true };
  }

  getAuthHeaders(apiKey) {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
}

export default OpenAIProvider;
