/**
 * ============================================================================
 * VIBE STACK - Controller Method Tests
 * ============================================================================
 * Testing credential controller methods
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialController } from './src/controllers/credentialController.js';
import { CredentialStorage } from './src/shared/credentials/CredentialStorage.js';
import { GitHubController } from './src/modules/github/index.js';

// Mock storage
class MockStorage {
  constructor() {
    this.credentials = new Map();
    this.pool = {
      query: async (query, params) => {
        // Simulate successful INSERT
        if (query.includes('INSERT')) {
          return { rows: [{ id: '1', user_id: params[0], type: params[1], created_at: new Date() }] };
        }
        // Simulate SELECT
        if (query.includes('SELECT')) {
          const key = params[1]; // storage key
          if (this.credentials.has(key)) {
            return { rows: [this.credentials.get(key)] };
          }
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
  }
}

async function testControllerMethods() {
  console.log('========================================');
  console.log('  CONTROLLER METHOD TESTS');
  console.log('========================================\n');

  const storage = new CredentialStorage(new MockStorage());
  const githubController = new GitHubController();
  const credentialController = new CredentialController(storage, githubController, null);

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Credential Help
  console.log('=== Test 1: Credential Help ===');
  try {
    const help = credentialController.getCredentialHelp({});
    const hasSupportedProviders = help.supportedProviders &&
      help.supportedProviders.includes('github') &&
      help.supportedProviders.includes('openai');
    console.log(`General help has providers: ${hasSupportedProviders ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (hasSupportedProviders) passedTests++;

    const githubHelp = credentialController.getCredentialHelp({ provider: 'github' });
    const hasGithubDetails = githubHelp.details && githubHelp.details.name === 'GitHub';
    console.log(`GitHub help details: ${hasGithubDetails ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (hasGithubDetails) passedTests++;
  } catch (e) {
    console.log(`Credential help: ❌ FAIL - ${e.message}`);
    totalTests += 2;
  }
  console.log('');

  // Test 2: List Projects (empty)
  console.log('=== Test 2: List Projects (Empty) ===');
  try {
    const projects = await credentialController.listProjects({ userId: 'testuser' });
    const isEmpty = projects.totalProjects === 0;
    console.log(`Empty project list: ${isEmpty ? '✅ PASS' : '❌ FAIL'} (${projects.totalProjects} projects)`);
    totalTests++; if (isEmpty) passedTests++;
  } catch (e) {
    console.log(`List projects: ❌ FAIL - ${e.message}`);
    totalTests++;
  }
  console.log('');

  // Test 3: Quick Setup Scenarios
  console.log('=== Test 3: Quick Setup Scenarios ===');
  try {
    const scenarios = ['fullstack', 'ml_engineer', 'devops'];

    for (const scenario of scenarios) {
      const result = await credentialController.quickSetup({ scenario });
      const hasConfig = result.config && result.config.name;
      console.log(`${scenario}: ${hasConfig ? '✅ PASS' : '❌ FAIL'} (${result.config?.name || 'no name'})`);
      totalTests++; if (hasConfig) passedTests++;
    }
  } catch (e) {
    console.log(`Quick setup: ❌ FAIL - ${e.message}`);
    totalTests += 3;
  }
  console.log('');

  // Test 4: Recommendations
  console.log('=== Test 4: Context Recommendations ===');
  try {
    const rec1 = await credentialController.getRecommendations({ context: 'clone_repo' });
    const isContextCorrect = rec1.context === 'clone_repo';
    console.log(`Clone repo context: ${isContextCorrect ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (isContextCorrect) passedTests++;

    const rec2 = await credentialController.getRecommendations({ context: 'ai_features' });
    const isAIContext = rec2.context === 'ai_features';
    console.log(`AI features context: ${isAIContext ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (isAIContext) passedTests++;
  } catch (e) {
    console.log(`Recommendations: ❌ FAIL - ${e.message}`);
    totalTests += 2;
  }
  console.log('');

  // Test 5: Validate Credential (format check only)
  console.log('=== Test 5: Validate Credential ===');
  try {
    // Use OpenAI instead (no API call, just format check)
    const validResult = await credentialController.validateCredential({
      provider: 'openai',
      credential: 'sk-1234567890abcdefghijklmn'
    });
    const isValid = validResult.valid === true || validResult.formatChecked === true;
    const status = validResult.valid ? 'valid' : (validResult.formatChecked ? 'format-checked' : 'error');
    console.log(`Valid OpenAI credential: ${isValid ? '✅ PASS' : '❌ FAIL'} (${status}: ${JSON.stringify(validResult).slice(0, 80)}...)`);
    totalTests++; if (isValid) passedTests++;

    const invalidResult = await credentialController.validateCredential({
      provider: 'openai',
      credential: 'invalid'
    });
    const isInvalid = invalidResult.valid === false && (invalidResult.error || invalidResult.reason);
    console.log(`Invalid credential rejected: ${isInvalid ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (isInvalid) passedTests++;
  } catch (e) {
    console.log(`Validate credential: ❌ FAIL - ${e.message}`);
    totalTests += 2;
  }
  console.log('');

  // Summary
  console.log('========================================');
  console.log(`  SUMMARY: ${passedTests}/${totalTests} controller tests passed`);
  console.log(`  Success Rate: ${Math.round((passedTests/totalTests)*100)}%`);
  console.log('========================================');

  return { totalTests, passedTests };
}

// Run tests
testControllerMethods().catch(console.error);
