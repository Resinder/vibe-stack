/**
 * ============================================================================
 * VIBE STACK - Anthropic Credential Provider
 * ============================================================================
 * Anthropic API key validation and handling
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialProvider, CredentialType } from '../CredentialProvider.js';

/**
 * Anthropic credential provider
 */
export class AnthropicProvider extends CredentialProvider {
  constructor() {
    super({
      providerId: 'anthropic',
      displayName: 'Anthropic',
      supportedTypes: [CredentialType.API_KEY],
      requiredScopes: []
    });
  }

  validateCredential(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, reason: 'API key must be a non-empty string' };
    }

    // Anthropic API keys start with 'sk-ant-'
    if (!apiKey.startsWith('sk-ant-')) {
      return { valid: false, reason: 'API key must start with sk-ant-' };
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
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    };
  }
}

export default AnthropicProvider;
