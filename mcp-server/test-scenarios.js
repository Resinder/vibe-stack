/**
 * ============================================================================
 * VIBE STACK - Scenario Tests
 * ============================================================================
 * Testing all credential scenarios
 * @version 1.0.0
 * ============================================================================
 */

import { GitHubProvider } from './src/shared/credentials/providers/GitHubProvider.js';
import { GitLabProvider } from './src/shared/credentials/providers/GitLabProvider.js';
import { OpenAIProvider } from './src/shared/credentials/providers/OpenAIProvider.js';
import { providerRegistry } from './src/shared/credentials/providers/index.js';

async function runAllTests() {
  let totalTests = 0;
  let passedTests = 0;

  console.log('========================================');
  console.log('  VIBE STACK - SCENARIO TESTS');
  console.log('========================================\n');

  // Test 1: Provider Registry
  console.log('=== Test 1: Provider Registry ===');
  try {
    const providers = providerRegistry.getProviderIds();
    const hasAll = providers.includes('github') && providers.includes('gitlab') &&
                   providers.includes('openai') && providers.includes('anthropic') &&
                   providers.includes('bitbucket');
    console.log(`All providers registered: ${hasAll ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Providers: ${providers.join(', ')}`);
    totalTests++; if (hasAll) passedTests++;
  } catch (e) {
    console.log(`Provider Registry: ❌ FAIL - ${e.message}`);
  }
  console.log('');

  // Test 2: Provider Validation
  console.log('=== Test 2: Provider Validation ===');
  const github = new GitHubProvider();
  const gitlab = new GitLabProvider();
  const openai = new OpenAIProvider();

  // Valid GitHub token
  const ghValid = github.validateCredential('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
  console.log(`GitHub valid token: ${ghValid.valid ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (ghValid.valid) passedTests++;

  // Invalid GitHub token
  const ghInvalid = github.validateCredential('short');
  console.log(`GitHub rejects short token: ${!ghInvalid.valid ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (!ghInvalid.valid) passedTests++;

  // Valid GitLab token
  const glValid = gitlab.validateCredential('glpat-1234567890abcdefghijklmn');
  console.log(`GitLab valid token: ${glValid.valid ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (glValid.valid) passedTests++;

  // Valid OpenAI token
  const oaiValid = openai.validateCredential('sk-1234567890abcdefghijklmn');
  console.log(`OpenAI valid token: ${oaiValid.valid ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (oaiValid.valid) passedTests++;
  console.log('');

  // Test 3: Storage Key Generation
  console.log('=== Test 3: Storage Key Generation ===');

  const keyTests = [
    { name: 'No scope', fn: () => github.getStorageKey('user123'), expected: 'user123:github' },
    { name: 'Simple scope', fn: () => github.getStorageKey('user123', 'work'), expected: 'user123:github:work' },
    { name: 'Repo scope', fn: () => github.getStorageKey('user123', 'repo:owner/repo'), expected: 'user123:github:repo:owner/repo' },
    { name: 'Project scope', fn: () => github.getStorageKey('user123', 'project:myapp'), expected: 'user123:github:project:myapp' },
    { name: 'Project env scope', fn: () => github.getStorageKey('user123', 'project:myapp:staging'), expected: 'user123:github:project:myapp:staging' }
  ];

  for (const test of keyTests) {
    const result = test.fn();
    const passed = result === test.expected;
    console.log(`${test.name}: ${passed ? '✅ PASS' : '❌ FAIL'} (${result})`);
    totalTests++; if (passed) passedTests++;
  }
  console.log('');

  // Test 4: Auth Headers
  console.log('=== Test 4: Auth Headers ===');

  const ghHeaders = github.getAuthHeaders('test_token_123');
  const hasAuth = ghHeaders['Authorization'] === 'Bearer test_token_123';
  const hasAccept = ghHeaders['Accept'] === 'application/vnd.github.v3+json';
  const hasUserAgent = ghHeaders['User-Agent'] === 'Vibe-Stack/3.0.0';

  console.log(`GitHub auth header: ${hasAuth ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (hasAuth) passedTests++;
  console.log(`GitHub accept header: ${hasAccept ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (hasAccept) passedTests++;
  console.log(`GitHub user agent: ${hasUserAgent ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (hasUserAgent) passedTests++;

  const oaiHeaders = openai.getAuthHeaders('sk-test');
  const hasOaiAuth = oaiHeaders['Authorization'] === 'Bearer sk-test';
  console.log(`OpenAI auth header: ${hasOaiAuth ? '✅ PASS' : '❌ FAIL'}`);
  totalTests++; if (hasOaiAuth) passedTests++;
  console.log('');

  // Test 5: Token Masking
  console.log('=== Test 5: Token Masking ===');

  const masked = github.maskCredential('ghp_1234567890abcdefghijklmnopqrstuvwxyz', 4);
  const correctlyMasked = masked === 'ghp_...wxyz';  // Shows first 4 + last 4
  console.log(`Token masking (4 chars): ${correctlyMasked ? '✅ PASS' : '❌ FAIL'} (${masked})`);
  totalTests++; if (correctlyMasked) passedTests++;

  const shortToken = github.maskCredential('abc', 4);
  const correctlyHidden = shortToken === '***';
  console.log(`Short token hidden: ${correctlyHidden ? '✅ PASS' : '❌ FAIL'} (${shortToken})`);
  totalTests++; if (correctlyHidden) passedTests++;
  console.log('');

  // Test 6: Credential Types
  console.log('=== Test 6: Credential Types ===');

  const { CredentialType } = await import('./src/shared/credentials/CredentialProvider.js');
  const types = {
    OAUTH_TOKEN: 'oauth_token',
    API_KEY: 'api_key',
    SSH_KEY: 'ssh_key',
    BASIC_AUTH: 'basic_auth',
    BEARER_TOKEN: 'bearer_token',
    SESSION_COOKIE: 'session_cookie'
  };

  let typesPass = true;
  for (const [key, expected] of Object.entries(types)) {
    if (CredentialType[key] !== expected) {
      typesPass = false;
      console.log(`  ${key}: ❌ FAIL`);
    }
  }

  if (typesPass) {
    console.log('All credential types defined: ✅ PASS');
  }
  totalTests++; if (typesPass) passedTests++;
  console.log('');

  // Summary
  console.log('========================================');
  console.log(`  SUMMARY: ${passedTests}/${totalTests} tests passed`);
  console.log(`  Success Rate: ${Math.round((passedTests/totalTests)*100)}%`);
  console.log('========================================');

  return { totalTests, passedTests };
}

// Run tests
runAllTests().catch(console.error);
