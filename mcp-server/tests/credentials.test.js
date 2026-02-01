import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GitHubProvider } from '../src/shared/credentials/providers/GitHubProvider.js';
import { providerRegistry } from '../src/shared/credentials/providers/index.js';

describe('Credential System', () => {
  describe('GitHub Provider', () => {
    const provider = new GitHubProvider();
    it('should have correct provider ID', () => {
      assert.strictEqual(provider.providerId, 'github');
    });
    it('should validate valid tokens', () => {
      const result = provider.validateCredential('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
      assert.strictEqual(result.valid, true);
    });
    it('should reject invalid tokens', () => {
      const result = provider.validateCredential('invalid');
      assert.strictEqual(result.valid, false);
    });
  });
  describe('Provider Registry', () => {
    it('should have all providers', () => {
      const ids = providerRegistry.getProviderIds();
      assert.ok(ids.includes('github'));
      assert.ok(ids.includes('gitlab'));
      assert.ok(ids.includes('openai'));
    });
    it('should get provider by ID', () => {
      const github = providerRegistry.get('github');
      assert.ok(github instanceof GitHubProvider);
    });
  });
});
