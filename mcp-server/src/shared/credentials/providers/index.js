/**
 * ============================================================================
 * VIBE STACK - Credential Provider Registry
 * ============================================================================
 * Central registry for all credential providers
 * @version 1.0.0
 * ============================================================================
 */

import { GitHubProvider } from './GitHubProvider.js';
import { GitLabProvider } from './GitLabProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { BitbucketProvider } from './BitbucketProvider.js';

/**
 * Credential provider registry
 * Manages all available credential providers
 */
export class CredentialProviderRegistry {
  /** @type {Map<string, import('../CredentialProvider.js').CredentialProvider>} */
  #providers;

  constructor() {
    this.#providers = new Map();
    this.registerDefaults();
  }

  /**
   * Register default providers
   * @private
   */
  registerDefaults() {
    this.register(new GitHubProvider());
    this.register(new GitLabProvider());
    this.register(new OpenAIProvider());
    this.register(new AnthropicProvider());
    this.register(new BitbucketProvider());
  }

  /**
   * Register a new provider
   * @param {import('../CredentialProvider.js').CredentialProvider} provider - Provider to register
   */
  register(provider) {
    this.#providers.set(provider.providerId, provider);
  }

  /**
   * Get provider by ID
   * @param {string} providerId - Provider ID
   * @returns {import('../CredentialProvider.js').CredentialProvider|undefined} Provider or undefined
   */
  get(providerId) {
    return this.#providers.get(providerId);
  }

  /**
   * Check if provider exists
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if provider exists
   */
  has(providerId) {
    return this.#providers.has(providerId);
  }

  /**
   * Get all registered provider IDs
   * @returns {string[]} Array of provider IDs
   */
  getProviderIds() {
    return Array.from(this.#providers.keys());
  }

  /**
   * Get all providers
   * @returns {import('../CredentialProvider.js').CredentialProvider[]} Array of providers
   */
  getAll() {
    return Array.from(this.#providers.values());
  }
}

/**
 * Global provider registry instance
 * @constant {CredentialProviderRegistry}
 */
export const providerRegistry = new CredentialProviderRegistry();

// Export individual providers
export { GitHubProvider } from './GitHubProvider.js';
export { GitLabProvider } from './GitLabProvider.js';
export { OpenAIProvider } from './OpenAIProvider.js';
export { AnthropicProvider } from './AnthropicProvider.js';
export { BitbucketProvider } from './BitbucketProvider.js';

export default CredentialProviderRegistry;
