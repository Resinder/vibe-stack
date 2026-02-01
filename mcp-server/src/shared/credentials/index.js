/**
 * ============================================================================
 * VIBE STACK - Shared Credentials Module
 * ============================================================================
 * Export all credential-related classes and utilities
 * @version 1.0.0
 * ============================================================================
 */

export { CredentialStorage, createCredentialStorage } from './CredentialStorage.js';
export { CredentialProvider, CredentialType } from './CredentialProvider.js';
export { providerRegistry, CredentialProviderRegistry } from './providers/index.js';

export { GitHubProvider } from './providers/GitHubProvider.js';
export { GitLabProvider } from './providers/GitLabProvider.js';
export { OpenAIProvider } from './providers/OpenAIProvider.js';
export { AnthropicProvider } from './providers/AnthropicProvider.js';
export { BitbucketProvider } from './providers/BitbucketProvider.js';
