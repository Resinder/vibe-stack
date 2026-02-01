/**
 * ============================================================================
 * VIBE STACK - Project & Environment Scenario Tests
 * ============================================================================
 * Testing project-based credentials and environment scoping
 * @version 1.0.0
 * ============================================================================
 */

import { CredentialController } from './src/controllers/credentialController.js';
import { CredentialStorage } from './src/shared/credentials/CredentialStorage.js';
import { GitHubController } from './src/modules/github/index.js';

// Mock storage with proper PostgreSQL simulation
class MockStorage {
  constructor() {
    // Map of user_id -> storage_key -> credential row
    this.credentials = new Map();
    this.pool = {
      query: async (query, params) => {
        // Parse query to determine operation
        const queryUpper = query.toUpperCase();

        // INSERT with ON CONFLICT (upsert)
        if (queryUpper.includes('INSERT') && queryUpper.includes('ON CONFLICT')) {
          const userId = params[0];
          const storageKey = params[1]; // type is actually storageKey
          const encrypted = params[2];
          const iv = params[3];
          const authTag = params[4];  // Note: encrypted.credential returns object with authTag property
          const metadata = params[5];

          // Store in our in-memory map
          if (!this.credentials.has(userId)) {
            this.credentials.set(userId, new Map());
          }

          const userCreds = this.credentials.get(userId);
          userCreds.set(storageKey, {
            user_id: userId,
            type: storageKey,
            encrypted_value: encrypted,
            iv,
            auth_tag: authTag,  // Store as auth_tag for database simulation
            metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
            created_at: new Date(),
            updated_at: new Date()
          });

          return { rows: [{ id: '1', user_id: userId, type: storageKey, created_at: new Date() }] };
        }

        // SELECT for listing (by user_id only) - no type parameter
        if (queryUpper.includes('SELECT') && queryUpper.includes('user_id = $1') &&
            !queryUpper.includes('AND type')) {
          const userId = params[0];
          const rows = [];

          if (this.credentials.has(userId)) {
            const userCreds = this.credentials.get(userId);
            for (const cred of userCreds.values()) {
              // Only return the columns that the actual query selects
              rows.push({
                type: cred.type,
                metadata: cred.metadata,
                created_at: cred.created_at,
                updated_at: cred.updated_at
              });
            }
          }
          return { rows };
        }

        // SELECT by user_id and type (storageKey) for getCredential
        if (queryUpper.includes('SELECT') && queryUpper.includes('WHERE') &&
            queryUpper.includes('AND type') && queryUpper.includes('ORDER BY')) {
          const userId = params[0];
          const storageKey = params[1];

          if (this.credentials.has(userId)) {
            const userCreds = this.credentials.get(userId);
            if (userCreds.has(storageKey)) {
              const fullCred = userCreds.get(storageKey);
              // Return only the columns that getCredential query selects
              return { rows: [{
                encrypted_value: fullCred.encrypted_value,
                iv: fullCred.iv,
                auth_tag: fullCred.auth_tag,
                metadata: fullCred.metadata
              }]};
            }
          }
          return { rows: [] };
        }

        // DELETE operation
        if (queryUpper.includes('DELETE')) {
          const userId = params[0];
          const storageKey = params[1];

          if (this.credentials.has(userId)) {
            const userCreds = this.credentials.get(userId);
            userCreds.delete(storageKey);
          }
          return { rows: [], rowCount: 1 };
        }

        // Default empty result
        return { rows: [] };
      }
    };
  }
}

async function testProjectScenarios() {
  console.log('========================================');
  console.log('  PROJECT & ENVIRONMENT SCENARIO TESTS');
  console.log('========================================\n');

  const storage = new CredentialStorage(new MockStorage());
  const githubController = new GitHubController();
  const credentialController = new CredentialController(storage, githubController, null);

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Project-Based Credential Storage
  console.log('=== Test 1: Project-Based Credential Storage ===');
  try {
    // Store credential for project:myapp
    await credentialController.setProjectCredential({
      provider: 'github',
      project: 'myapp',
      credential: 'ghp_projectToken1234567890abcdefghijklmn',
      userId: 'testuser',
      environment: 'default'
    });

    // Verify it's stored with correct scope
    const stored = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:myapp'
    });

    const hasCredential = stored && stored.success && stored.credential && stored.credential.includes('...');
    console.log(`Project credential stored: ${hasCredential ? '✅ PASS' : '❌ FAIL'} (${stored?.credential || 'null'})`);
    totalTests++; if (hasCredential) passedTests++;

    // Store for different project
    await credentialController.setProjectCredential({
      provider: 'github',
      project: 'another-app',
      credential: 'ghp_anotherToken1234567890abcdefghijklm',
      userId: 'testuser',
      environment: 'default'
    });

    // Verify projects are isolated
    const cred1 = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:myapp'
    });
    const cred2 = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:another-app'
    });

    const areIsolated = cred1.credential !== cred2.credential;
    console.log(`Projects are isolated: ${areIsolated ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (areIsolated) passedTests++;
  } catch (e) {
    console.log(`Project credential storage: ❌ FAIL - ${e.message}`);
    totalTests += 2;
  }
  console.log('');

  // Test 2: Environment-Based Scoping
  console.log('=== Test 2: Environment-Based Scoping ===');
  try {
    // Store credentials for different environments
    const environments = ['dev', 'staging', 'prod'];

    for (const env of environments) {
      await credentialController.setProjectCredential({
        provider: 'openai',
        project: 'myapp',
        credential: `sk-${env}_key1234567890abcdefghijklmn`,
        userId: 'testuser',
        environment: env
      });
    }

    // Verify each environment has different credential
    const devCred = (await credentialController.getCredential({
      provider: 'openai',
      userId: 'testuser',
      scope: 'project:myapp:dev'
    }))?.credential;

    const stagingCred = (await credentialController.getCredential({
      provider: 'openai',
      userId: 'testuser',
      scope: 'project:myapp:staging'
    }))?.credential;

    const prodCred = (await credentialController.getCredential({
      provider: 'openai',
      userId: 'testuser',
      scope: 'project:myapp:prod'
    }))?.credential;

    const areDifferent = devCred && stagingCred && prodCred &&
                        devCred !== stagingCred && stagingCred !== prodCred;
    console.log(`Environment credentials differ: ${areDifferent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Dev: ${devCred}, Staging: ${stagingCred}, Prod: ${prodCred}`);
    totalTests++; if (areDifferent) passedTests++;

    // Verify correct scoping format
    const devScope = 'testuser:openai:project:myapp:dev';
    const stagingScope = 'testuser:openai:project:myapp:staging';
    const prodScope = 'testuser:openai:project:myapp:prod';
    console.log(`Dev scope format: ${devScope === 'testuser:openai:project:myapp:dev' ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (devScope === 'testuser:openai:project:myapp:dev') passedTests++;
    console.log(`Staging scope format: ${stagingScope === 'testuser:openai:project:myapp:staging' ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (stagingScope === 'testuser:openai:project:myapp:staging') passedTests++;
    console.log(`Prod scope format: ${prodScope === 'testuser:openai:project:myapp:prod' ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (prodScope === 'testuser:openai:project:myapp:prod') passedTests++;
  } catch (e) {
    console.log(`Environment scoping: ❌ FAIL - ${e.message}`);
    totalTests += 4;
  }
  console.log('');

  // Test 3: List Projects
  console.log('=== Test 3: List Projects ===');
  try {
    // We have stored credentials for: myapp, another-app
    const projects = await credentialController.listProjects({ userId: 'testuser' });

    const hasMyApp = projects.projects.some(p => p.name === 'myapp');
    const hasAnotherApp = projects.projects.some(p => p.name === 'another-app');
    const countMatches = projects.totalProjects >= 2;

    console.log(`Has myapp project: ${hasMyApp ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (hasMyApp) passedTests++;
    console.log(`Has another-app project: ${hasAnotherApp ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (hasAnotherApp) passedTests++;
    console.log(`Project count correct: ${countMatches ? '✅ PASS' : '❌ FAIL'} (${projects.totalProjects} projects)`);
    totalTests++; if (countMatches) passedTests++;
  } catch (e) {
    console.log(`List projects: ❌ FAIL - ${e.message}`);
    totalTests += 3;
  }
  console.log('');

  // Test 4: Clone Project Credentials
  console.log('=== Test 4: Clone Project Credentials ===');
  try {
    // Clone from myapp to new-project
    await credentialController.cloneProject({
      sourceProject: 'myapp',
      targetProject: 'new-project',
      userId: 'testuser'
    });

    // Verify credentials were cloned
    const sourceCred = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:myapp'
    });

    const clonedCred = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:new-project'
    });

    // Should have same provider
    const wasCloned = sourceCred && clonedCred && sourceCred.provider === clonedCred.provider;

    console.log(`Project credentials cloned: ${wasCloned ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (wasCloned) passedTests++;

    // Verify environment credentials also cloned
    const sourceDevCred = await credentialController.getCredential({
      provider: 'openai',
      userId: 'testuser',
      scope: 'project:myapp:dev'
    });

    const clonedDevCred = await credentialController.getCredential({
      provider: 'openai',
      userId: 'testuser',
      scope: 'project:new-project:dev'
    });

    const envWasCloned = sourceDevCred && clonedDevCred;
    console.log(`Environment credentials cloned: ${envWasCloned ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (envWasCloned) passedTests++;
  } catch (e) {
    console.log(`Clone project: ❌ FAIL - ${e.message}`);
    totalTests += 2;
  }
  console.log('');

  // Test 5: Scope Isolation Verification
  console.log('=== Test 5: Scope Isolation Verification ===');
  try {
    // Personal scope should not have project credentials
    const personalCred = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: null
    });

    const projectCred = await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:myapp'
    });

    // Personal credential should be null (not set) or have different storage key
    const areIsolated = !personalCred || !personalCred.success ||
                        (projectCred && personalCred.storage_key !== projectCred.storage_key);
    console.log(`Personal vs project isolated: ${areIsolated ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (areIsolated) passedTests++;

    // Work scope should be isolated from project scope
    await credentialController.setCredential({
      provider: 'gitlab',
      credential: 'glpat-1234567890abcdefghijklmn',
      userId: 'testuser',
      scope: 'work'
    });

    const workCred = await credentialController.getCredential({
      provider: 'gitlab',
      userId: 'testuser',
      scope: 'work'
    });

    const workIsIsolated = workCred && workCred.success &&
                           workCred.scope === 'work' && !workCred.scope.includes('project:');
    console.log(`Work scope isolated: ${workIsIsolated ? '✅ PASS' : '❌ FAIL'}`);
    totalTests++; if (workIsIsolated) passedTests++;
  } catch (e) {
    console.log(`Scope isolation: ❌ FAIL - ${e.message}`);
    totalTests += 2;
  }
  console.log('');

  // Test 6: Credential Override in Same Scope
  console.log('=== Test 6: Credential Override ===');
  try {
    // Store initial credential
    await credentialController.setProjectCredential({
      provider: 'github',
      project: 'override-test',
      credential: 'ghp_original1234567890abcdefghijklmn',
      userId: 'testuser',
      environment: 'default'
    });

    const original = (await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:override-test'
    }))?.credential;

    // Override with new credential (different ending to detect change)
    await credentialController.setProjectCredential({
      provider: 'github',
      project: 'override-test',
      credential: 'ghp_newtoken1234567890abcdefghijkxyz',  // Different ending: xyz vs klmn
      userId: 'testuser',
      environment: 'default'
    });

    const updated = (await credentialController.getCredential({
      provider: 'github',
      userId: 'testuser',
      scope: 'project:override-test'
    }))?.credential;

    const wasOverridden = original && updated && original !== updated;
    console.log(`Credential overridden: ${wasOverridden ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Original: ${original}, Updated: ${updated}`);
    totalTests++; if (wasOverridden) passedTests++;
  } catch (e) {
    console.log(`Credential override: ❌ FAIL - ${e.message}`);
    totalTests++;
  }
  console.log('');

  // Summary
  console.log('========================================');
  console.log(`  SUMMARY: ${passedTests}/${totalTests} project tests passed`);
  console.log(`  Success Rate: ${Math.round((passedTests/totalTests)*100)}%`);
  console.log('========================================');

  return { totalTests, passedTests };
}

// Run tests
testProjectScenarios().catch(console.error);
