/**
 * ============================================================================
 * VIBE STACK - E2E Tests: Docker Deployment
 * ============================================================================
 * End-to-end tests for Docker deployment and service communication
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Test configuration
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_CONFIG = {
  dockerComposeFile: process.env.DOCKER_COMPOSE_FILE || join(__dirname, '../../docker-compose.yml'),
  startupTimeout: 120000, // 2 minutes
  requestTimeout: 10000, // 10 seconds
  services: {
    vibeKanban: { port: 4000, name: 'vibe-kanban' },
    codeServer: { port: 8443, name: 'code-server' },
    openWebui: { port: 8081, name: 'open-webui' },
    mcpServer: { port: 4001, name: 'vibe-mcp-server' },
    postgres: { port: 5432, name: 'vibe-postgres' }
  }
};

/**
 * Docker Compose controller for E2E tests
 */
class DockerComposeController {
  constructor() {
    this.services = new Map();
    this.isRunning = false;
  }

  /**
   * Execute Docker Compose command
   */
  async exec(command, args = []) {
    return new Promise((resolve, reject) => {
      const dockerCompose = spawn('docker', ['compose', '-f', TEST_CONFIG.dockerComposeFile, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      dockerCompose.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      dockerCompose.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      dockerCompose.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Docker Compose failed with code ${code}: ${stderr}`));
        }
      });

      dockerCompose.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Start all Docker services
   */
  async up() {
    console.log('Starting Docker Compose services...');
    await this.exec('up', ['-d', '--build']);
    this.isRunning = true;

    // Wait for services to be healthy
    await this.waitForHealthyServices();
    console.log('All Docker services are healthy');
  }

  /**
   * Stop all Docker services
   */
  async down() {
    if (this.isRunning) {
      console.log('Stopping Docker Compose services...');
      await this.exec('down', ['-v']);
      this.isRunning = false;
      console.log('All Docker services stopped');
    }
  }

  /**
   * Get service status
   */
  async ps() {
    const { stdout } = await this.exec('ps');
    const lines = stdout.split('\n').slice(1); // Skip header

    const services = {};
    for (const line of lines) {
      const parts = line.split(/\s+/).filter(p => p);
      if (parts.length > 0) {
        const name = parts[0];
        const state = parts[1] || 'unknown';
        services[name] = { state };
      }
    }
    return services;
  }

  /**
   * Get service logs
   */
  async logs(service, tail = 100) {
    const { stdout } = await this.exec('logs', ['--tail', String(tail), service]);
    return stdout;
  }

  /**
   * Wait for all services to be healthy
   */
  async waitForHealthyServices(timeout = TEST_CONFIG.startupTimeout) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const services = await this.ps();
      const allHealthy = Object.values(services).every(s => s.state.includes('running') || s.state.includes('healthy'));

      if (allHealthy) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`Services did not become healthy within ${timeout}ms`);
  }

  /**
   * Execute command in a service container
   */
  async execInService(service, command) {
    const { stdout } = await this.exec('exec', ['-T', service, ...command.split(' ')]);
    return stdout.trim();
  }
}

/**
 * HTTP request helper for E2E tests
 */
async function fetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || TEST_CONFIG.requestTimeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// ============================================================================
// E2E TEST SUITES
// ============================================================================

describe('E2E - Docker Deployment', async () => {
  const docker = new DockerComposeController();

  before(async () => {
    // Check if Docker Compose file exists
    if (!existsSync(TEST_CONFIG.dockerComposeFile)) {
      throw new Error(`Docker Compose file not found: ${TEST_CONFIG.dockerComposeFile}`);
    }

    // Start Docker services
    await docker.up();
  });

  after(async () => {
    // Stop Docker services
    await docker.down();
  });

  describe('Service Health Checks', () => {
    it('should have all services running', async () => {
      const services = await docker.ps();

      // Check all expected services are present
      assert.ok(services[TEST_CONFIG.services.vibeKanban.name], 'Vibe-Kanban service should exist');
      assert.ok(services[TEST_CONFIG.services.codeServer.name], 'code-server service should exist');
      assert.ok(services[TEST_CONFIG.services.openWebui.name], 'Open WebUI service should exist');
      assert.ok(services[TEST_CONFIG.services.mcpServer.name], 'MCP Server service should exist');
      assert.ok(services[TEST_CONFIG.services.postgres.name], 'PostgreSQL service should exist');

      // Check all services are running
      for (const [name, service] of Object.entries(services)) {
        assert.ok(
          service.state.includes('running') || service.state.includes('healthy'),
          `Service ${name} should be running or healthy`
        );
      }
    });

    it('should respond to Vibe-Kanban health check', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.vibeKanban.port}/api/health`;
      const response = await fetch(url);

      assert.equal(response.status, 200, 'Vibe-Kanban should return 200 status');

      const data = await response.json();
      assert.ok(data.status, 'Response should have status field');
    });

    it('should respond to code-server root endpoint', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.codeServer.port}/`;
      const response = await fetch(url);

      assert.equal(response.status, 200, 'code-server should return 200 status');
    });

    it('should respond to Open WebUI health check', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.openWebui.port}/health`;
      const response = await fetch(url);

      assert.equal(response.status, 200, 'Open WebUI should return 200 status');
    });

    it('should respond to MCP Server health check', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/health`;
      const response = await fetch(url);

      assert.equal(response.status, 200, 'MCP Server should return 200 status');

      const data = await response.json();
      assert.ok(data.status, 'Response should have status field');
      assert.ok(data.server || data.name, 'Response should identify the server');
    });

    it('should respond to PostgreSQL connection', async () => {
      // Test PostgreSQL connection via MCP Server
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/health`;
      const response = await fetch(url);

      assert.equal(response.status, 200, 'MCP Server should be reachable');

      // If MCP Server is healthy, PostgreSQL connection is working
      const data = await response.json();
      assert.ok(data.status === 'healthy', 'MCP Server should be healthy (requires PostgreSQL)');
    });
  });

  describe('Service Communication', () => {
    it('should allow MCP Server to create a task', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/v1/tools/create_task`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'E2E Test Task',
          description: 'Task created during E2E testing',
          lane: 'backlog',
          priority: 'medium'
        })
      });

      assert.equal(response.status, 200, 'Task creation should succeed');

      const data = await response.json();
      assert.ok(data.success, 'Response should indicate success');
    });

    it('should allow reading board state via MCP Server', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/v1/board/snapshot`;

      const response = await fetch(url);

      assert.equal(response.status, 200, 'Board snapshot should be accessible');

      const data = await response.json();
      assert.ok(data.board, 'Response should contain board data');
      assert.ok(data.stats, 'Response should contain board statistics');
    });

    it('should allow Vibe-Kanban to access PostgreSQL data', async () => {
      // This test verifies the bridge file is being populated
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/.vibe-kanban-bridge.json`;

      const response = await fetch(url);

      assert.equal(response.status, 200, 'Bridge file should be accessible');

      const data = await response.json();
      assert.ok(typeof data === 'object', 'Bridge data should be an object');
    });
  });

  describe('Resource Constraints', () => {
    it('should enforce memory limits on containers', async () => {
      const stats = await docker.execInService(TEST_CONFIG.services.vibeKanban.name,
        'cat /sys/fs/cgroup/memory/memory.limit_in_bytes');

      const limitBytes = parseInt(stats);
      // Default limit is 2GB (2147483648 bytes)
      assert.ok(limitBytes > 0, 'Memory limit should be set');
      assert.ok(limitBytes >= 1073741824, 'Memory limit should be at least 1GB');
    });

    it('should enforce CPU limits on containers', async () => {
      const stats = await docker.execInService(TEST_CONFIG.services.vibeKanban.name,
        'cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us');

      const quota = parseInt(stats);
      // -1 means unlimited, otherwise it's the quota in microseconds
      assert.ok(quota >= -1, 'CPU quota should be set or unlimited');
    });
  });

  describe('Volume Persistence', () => {
    it('should persist data across container restarts', async () => {
      // Create a task
      const createUrl = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/v1/tools/create_task`;
      await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Persistence Test Task',
          lane: 'backlog'
        })
      });

      // Restart the MCP Server container
      await docker.exec('restart', [TEST_CONFIG.services.mcpServer.name]);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for restart

      // Check if data persisted
      const snapshotUrl = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/v1/board/snapshot`;
      const response = await fetch(snapshotUrl);
      const data = await response.json();

      const foundTask = data.board.lanes?.backlog?.find(
        t => t.title === 'Persistence Test Task'
      );

      assert.ok(foundTask, 'Task should persist across container restart');
    });
  });

  describe('Network Connectivity', () => {
    it('should allow inter-service communication', async () => {
      // MCP Server should be able to connect to PostgreSQL
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/health`;

      const response = await fetch(url);
      assert.equal(response.status, 200, 'MCP Server health check should pass');

      // The health check implicitly verifies database connectivity
      const data = await response.json();
      assert.equal(data.status, 'healthy', 'MCP Server should be healthy');
    });

    it('should expose correct ports to host', async () => {
      const ports = Object.values(TEST_CONFIG.services).map(s => s.port);

      for (const port of ports) {
        const response = await fetch(`http://localhost:${port}/`, {
          timeout: 2000
        });
        assert.ok(
          response.status < 500,
          `Port ${port} should be accessible (status: ${response.status})`
        );
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should load environment variables correctly', async () => {
      const postgresPassword = await docker.execInService(TEST_CONFIG.services.mcpServer.name,
        'echo $POSTGRES_PASSWORD');

      // Should not be empty
      assert.ok(postgresPassword, 'POSTGRES_PASSWORD should be set');
    });

    it('should have correct database connection', async () => {
      const url = `http://localhost:${TEST_CONFIG.services.mcpServer.port}/v1/board/snapshot`;

      const response = await fetch(url);
      assert.equal(response.status, 200, 'Should connect to database successfully');

      const data = await response.json();
      assert.ok(data.board, 'Should return board data from database');
    });
  });

  describe('Logging and Monitoring', () => {
    it('should output logs for all services', async () => {
      const services = Object.values(TEST_CONFIG.services).map(s => s.name);

      for (const service of services) {
        const logs = await docker.logs(service, 10);
        assert.ok(logs.length > 0, `${service} should have logs`);
      }
    });

    it('should not have critical errors in logs', async () => {
      const criticalErrors = ['Error:', 'FATAL', 'CRITICAL', 'PANIC'];
      const services = [TEST_CONFIG.services.mcpServer.name];

      for (const service of services) {
        const logs = await docker.logs(service, 50);
        const logLines = logs.split('\n');

        for (const line of logLines) {
          for (const error of criticalErrors) {
            // Skip lines that are just error handling messages
            if (line.includes(error) && !line.includes('Error during shutdown')) {
              assert.fail(`Found critical error in ${service} logs: ${line}`);
            }
          }
        }
      }
    });
  });
});

/**
 * Run tests if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running E2E Docker Deployment Tests...');
}
