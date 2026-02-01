import { CredentialController } from './src/controllers/credentialController.js';
import { CredentialStorage } from './src/shared/credentials/CredentialStorage.js';
import { GitHubController } from './src/modules/github/index.js';

class MockStorage {
  constructor() {
    this.credentials = new Map();
    this.pool = {
      query: async (query, params) => {
        const queryUpper = query.toUpperCase();
        console.log('Query:', query.substring(0, 100) + '...');

        if (queryUpper.includes('INSERT')) {
          const userId = params[0];
          const storageKey = params[1];
          console.log('INSERT for userId:', userId, 'storageKey:', storageKey);
          if (!this.credentials.has(userId)) {
            this.credentials.set(userId, new Map());
          }
          this.credentials.get(userId).set(storageKey, {
            user_id: userId,
            type: storageKey,
            metadata: { scope: storageKey.split(':').slice(2).join(':') },
            created_at: new Date(),
            updated_at: new Date()
          });
          return { rows: [{ id: '1' }] };
        }

        if (queryUpper.includes('SELECT')) {
          const userId = params[0];
          console.log('SELECT for userId:', userId, 'params:', params.length);
          console.log('Stored keys:', Array.from(this.credentials.get(userId)?.keys() || []));
          const rows = [];
          if (this.credentials.has(userId)) {
            for (const cred of this.credentials.get(userId).values()) {
              rows.push({
                type: cred.type,
                metadata: cred.metadata,
                created_at: cred.created_at,
                updated_at: cred.updated_at
              });
            }
          }
          console.log('Returning rows:', rows.length);
          return { rows };
        }

        return { rows: [] };
      }
    };
  }
}

async function runTest() {
  const storage = new CredentialStorage(new MockStorage());
  const controller = new CredentialController(storage, new GitHubController(), null);

  await controller.setProjectCredential({
    provider: 'github',
    project: 'testproj',
    credential: 'ghp_test1234567890abcdefghijklmnopqrstuvwxyz123',
    userId: 'testuser'
  });

  const result = await controller.listProjects({ userId: 'testuser' });
  console.log('\nFinal result:', result);
  console.log('Projects:', result.projects);
  console.log('Total:', result.totalProjects);
}

runTest().catch(console.error);
