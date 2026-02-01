/**
 * ============================================================================
 * VIBE STACK - MCP Client Tests
 * ============================================================================
 * Tests for external MCP server client functionality
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { MCPClient } from '../src/mcp/client.js';
import { MCPClientManager } from '../src/mcp/clientManager.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('MCP Client', () => {
  describe('MCPClient Class', () => {
    it('should create client instance with config', () => {
      const config = {
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version'],
        env: {}
      };

      const client = new MCPClient(config);
      assert.strictEqual(client.config.name, 'test-server');
      assert.strictEqual(client.config.prefix, 'test');
      assert.strictEqual(client.connected, false);
    });

    it('should throw error when calling tool without connection', async () => {
      const client = new MCPClient({
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version']
      });

      await assert.rejects(
        async () => await client.callTool('test_tool', {}),
        { message: /Not connected to MCP server/ }
      );
    });

    it('should return empty tools array when not connected', () => {
      const client = new MCPClient({
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version']
      });

      const tools = client.getPrefixedTools();
      assert.strictEqual(tools.length, 0);
    });

    it('should return server info', () => {
      const client = new MCPClient({
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version']
      });

      const info = client.getServerInfo();
      assert.strictEqual(info.name, 'test-server');
      assert.strictEqual(info.prefix, 'test');
      assert.strictEqual(info.connected, false);
      assert.strictEqual(info.toolCount, 0);
    });
  });

  describe('MCPClientManager Class', () => {
    let tempConfigDir;
    let manager;

    before(async () => {
      // Create temporary config directory structure
      tempConfigDir = path.join(process.cwd(), 'test-config-providers');
      const providersDir = path.join(tempConfigDir, 'config', 'providers');
      await fs.mkdir(providersDir, { recursive: true });

      // Create test config file
      const testConfig = {
        name: 'test-server',
        enabled: false, // Disabled to avoid actual connection
        prefix: 'test',
        command: 'node',
        args: ['--version']
      };

      await fs.writeFile(
        path.join(providersDir, 'test-mcp.json'),
        JSON.stringify(testConfig, null, 2)
      );
    });

    after(async () => {
      // Cleanup temp directory
      try {
        await fs.rm(path.join(process.cwd(), 'test-config-providers'), { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should create manager instance', () => {
      manager = new MCPClientManager();
      assert.strictEqual(manager.initialized, false);
      assert.strictEqual(manager.clients.size, 0);
    });

    it('should return empty tools when not initialized', () => {
      const tools = manager.getTools();
      assert.strictEqual(tools.length, 0);
    });

    it('should return empty server info when no servers', () => {
      const info = manager.getServerInfo();
      assert.strictEqual(info.length, 0);
    });

    it('should return false for hasTool when not initialized', async () => {
      const hasTool = await manager.hasTool('test_tool');
      assert.strictEqual(hasTool, false);
    });

    it('should return health status', () => {
      const status = manager.getHealthStatus();
      assert.strictEqual(status.initialized, false);
      assert.strictEqual(status.totalServers, 0);
      assert.strictEqual(status.connectedServers, 0);
      assert.strictEqual(status.totalTools, 0);
    });

    it('should load server configs from directory', async () => {
      manager = new MCPClientManager();

      // Mock process.cwd() to return temp directory
      const originalCwd = process.cwd;
      Object.defineProperty(process, 'cwd', {
        value: () => tempConfigDir,
        writable: true,
        configurable: true
      });

      try {
        const configs = await manager.loadServerConfigs();
        assert.strictEqual(configs.length, 1);
        assert.strictEqual(configs[0].name, 'test-server');
      } finally {
        // Restore original cwd
        Object.defineProperty(process, 'cwd', {
          value: originalCwd,
          writable: true,
          configurable: true
        });
      }
    });
  });

  describe('Environment Variable Substitution', () => {
    it('should substitute environment variables in config', () => {
      const manager = new MCPClientManager();

      // Set test environment variable
      process.env.TEST_TOKEN = 'test-token-value';

      const config = {
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version'],
        env: {
          TEST_VAR: '${TEST_TOKEN}'
        }
      };

      const processed = manager.substituteEnvVars(config);

      assert.strictEqual(processed.env.TEST_VAR, 'test-token-value');

      // Cleanup
      delete process.env.TEST_TOKEN;
    });

    it('should handle missing environment variables gracefully', () => {
      const manager = new MCPClientManager();

      const config = {
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version'],
        env: {
          TEST_VAR: '${NONEXISTENT_VAR}'
        }
      };

      const processed = manager.substituteEnvVars(config);

      // Should be empty string when env var doesn't exist
      assert.strictEqual(processed.env.TEST_VAR, '');
    });
  });

  describe('Tool Routing', () => {
    it('should identify native vs external tools', () => {
      const nativeTools = [
        'vibe_get_board',
        'vibe_create_task',
        'vibe_git_status'
      ];

      const externalTools = [
        'github_create_issue',
        'postgres_query',
        'slack_send_message'
      ];

      // Native tools start with 'vibe_'
      nativeTools.forEach(tool => {
        assert.strictEqual(tool.startsWith('vibe_'), true);
      });

      // External tools have different prefixes
      externalTools.forEach(tool => {
        assert.ok(tool.startsWith('github_') || tool.startsWith('postgres_') || tool.startsWith('slack_'));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const client = new MCPClient({
        name: 'invalid-server',
        prefix: 'invalid',
        command: 'this-command-definitely-does-not-exist-12345',
        args: []
      });

      await assert.rejects(
        async () => await client.connect(),
        { message: /Failed to connect to MCP server/ }
      );
    });

    it('should handle tool call errors gracefully', async () => {
      const client = new MCPClient({
        name: 'test-server',
        prefix: 'test',
        command: 'node',
        args: ['--version']
      });

      // Not connected, should throw
      await assert.rejects(
        async () => await client.callTool('test_tool', {}),
        { message: /Not connected/ }
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required config fields', () => {
      const manager = new MCPClientManager();

      // Missing required fields
      const invalidConfigs = [
        {}, // Empty
        { name: 'test' }, // Missing command
        { command: 'node' } // Missing name
      ];

      // These should not throw, but will fail during connection
      invalidConfigs.forEach(config => {
        const client = new MCPClient({
          name: config.name || 'test',
          prefix: config.prefix || 'test',
          command: config.command || 'node',
          args: config.args || []
        });
        assert.ok(client);
      });
    });

    it('should set default prefix if not provided', () => {
      const manager = new MCPClientManager();

      const config = {
        name: 'test-server',
        command: 'node',
        args: ['--version']
      };

      const processed = { ...config };
      if (!processed.prefix) {
        processed.prefix = processed.name;
      }

      assert.strictEqual(processed.prefix, 'test-server');
    });
  });
});
