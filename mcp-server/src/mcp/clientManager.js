/**
 * ============================================================================
 * VIBE STACK - MCP Client Manager
 * ============================================================================
 * Manages multiple external MCP client connections
 * Handles tool discovery, aggregation, and routing
 * @version 1.0.0
 * ============================================================================
 */

import { MCPClient } from './client.js';
import { getConfig } from '../config/settings.js';
import { Logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Manages multiple MCP client connections
 * Handles tool discovery and routing
 */
export class MCPClientManager {
  constructor() {
    this.clients = new Map();
    this.allTools = [];
    this.initialized = false;
  }

  /**
   * Initialize all configured external MCP servers
   * @async
   */
  async initialize() {
    if (this.initialized) {
      Logger.warn('MCPClientManager already initialized');
      return;
    }

    Logger.info('Initializing MCP Client Manager...');

    // Check if external MCP is enabled
    const externalEnabled = getConfig('mcp.externalEnabled', false);
    if (!externalEnabled) {
      Logger.info('External MCP servers disabled in configuration');
      this.initialized = true;
      return;
    }

    // Get external server configurations
    const externalServers = await this.loadServerConfigs();

    if (externalServers.length === 0) {
      Logger.info('No external MCP servers configured');
      this.initialized = true;
      return;
    }

    // Connect to each enabled server
    const connectionPromises = externalServers
      .filter(serverConfig => serverConfig.enabled !== false)
      .map(serverConfig => this.connectServer(serverConfig));

    const results = await Promise.allSettled(connectionPromises);

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    Logger.info(`MCP server initialization complete: ${successful} connected, ${failed} failed`);

    // Aggregate tools from all connected servers
    this.aggregateTools();

    this.initialized = true;
  }

  /**
   * Load external MCP server configurations
   * @async
   * @returns {Promise<Array<Object>>} Array of server configurations
   */
  async loadServerConfigs() {
    const configs = [];
    const providersDir = path.join(process.cwd(), 'config', 'providers');

    try {
      // Check if providers directory exists
      await fs.access(providersDir);

      // Read all JSON files in providers directory
      const files = await fs.readdir(providersDir);
      const configFiles = files.filter(f => f.endsWith('-mcp.json') && !f.endsWith('.example'));

      for (const file of configFiles) {
        try {
          const filePath = path.join(providersDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const config = JSON.parse(content);

          // Substitute environment variables
          const processedConfig = this.substituteEnvVars(config);

          // Set prefix if not provided
          if (!processedConfig.prefix) {
            processedConfig.prefix = processedConfig.name;
          }

          configs.push(processedConfig);

          Logger.debug(`Loaded MCP server config: ${file}`, {
            name: processedConfig.name,
            enabled: processedConfig.enabled
          });

        } catch (error) {
          Logger.error(`Failed to load MCP server config: ${file}`, error);
        }
      }

    } catch (error) {
      Logger.warn('No providers directory found, using built-in configs only');
    }

    return configs;
  }

  /**
   * Substitute environment variables in configuration
   * @param {Object} config - Configuration object
   * @returns {Object} Configuration with substituted values
   */
  substituteEnvVars(config) {
    const processed = { ...config };

    // Substitute in env object
    if (processed.env) {
      processed.env = {};
      for (const [key, value] of Object.entries(config.env)) {
        if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
          const envVar = value.slice(2, -1);
          processed.env[key] = process.env[envVar] || '';
        } else {
          processed.env[key] = value;
        }
      }
    }

    return processed;
  }

  /**
   * Connect to a single external MCP server
   * @async
   * @param {Object} serverConfig - Server configuration
   */
  async connectServer(serverConfig) {
    const client = new MCPClient(serverConfig);

    try {
      await client.connect();
      this.clients.set(serverConfig.name, client);

      Logger.info(`Connected to external MCP server: ${serverConfig.name}`, {
        tools: client.tools.length,
        prefix: serverConfig.prefix
      });

    } catch (error) {
      Logger.error(`Failed to connect to MCP server: ${serverConfig.name}`, error);
      throw error;
    }
  }

  /**
   * Aggregate tools from all connected servers
   */
  aggregateTools() {
    this.allTools = [];

    for (const [name, client] of this.clients) {
      if (client.isConnected()) {
        const tools = client.getPrefixedTools();
        this.allTools.push(...tools);
      }
    }

    Logger.info(`Aggregated ${this.allTools.length} tools from ${this.clients.size} external servers`, {
      servers: Array.from(this.clients.keys()),
      tools: this.allTools.map(t => t.name)
    });
  }

  /**
   * Call a tool on the appropriate external server
   * @async
   * @param {string} toolName - Tool name (with prefix)
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   * @throws {Error} If tool not found or call fails
   */
  async callTool(toolName, args) {
    // Find which client has this tool
    const tool = this.allTools.find(t => t.name === toolName);

    if (!tool) {
      // Try to find by removing common prefixes
      const fallbackTool = this.allTools.find(t =>
        toolName.endsWith(`_${t._originalName}`) ||
        t._originalName === toolName
      );

      if (!fallbackTool) {
        throw new Error(`Tool not found in any external server: ${toolName}`);
      }
    }

    // Get the client that provides this tool
    const serverName = tool ? tool._server : null;
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`No active client for server: ${serverName}`);
    }

    return await client.callTool(toolName, args);
  }

  /**
   * Get all tools from all connected servers
   * @returns {Array<Object>} Array of tool definitions
   */
  getTools() {
    return this.allTools;
  }

  /**
   * Get information about all connected servers
   * @returns {Array<Object>} Array of server information
   */
  getServerInfo() {
    const info = [];

    for (const [name, client] of this.clients) {
      info.push(client.getServerInfo());
    }

    return info;
  }

  /**
   * Check if a specific tool exists
   * @param {string} toolName - Tool name to check
   * @returns {boolean} True if tool exists
   */
  hasTool(toolName) {
    return this.allTools.some(t => t.name === toolName);
  }

  /**
   * Get tools for a specific server
   * @param {string} serverName - Server name
   * @returns {Array<Object>} Array of tools from the server
   */
  getToolsForServer(serverName) {
    const client = this.clients.get(serverName);
    if (!client) {
      return [];
    }

    return client.getPrefixedTools();
  }

  /**
   * Reconnect to a specific server
   * @async
   * @param {string} serverName - Server name
   */
  async reconnectServer(serverName) {
    const client = this.clients.get(serverName);

    if (client) {
      await client.disconnect();
    }

    // Reload config and reconnect
    const serverConfigs = await this.loadServerConfigs();
    const serverConfig = serverConfigs.find(s => s.name === serverName);

    if (serverConfig) {
      await this.connectServer(serverConfig);
      this.aggregateTools();
    }
  }

  /**
   * Shutdown all client connections
   * @async
   */
  async shutdown() {
    Logger.info('Shutting down MCP Client Manager...');

    const shutdownPromises = [];

    for (const [name, client] of this.clients) {
      shutdownPromises.push(
        client.disconnect().catch(error => {
          Logger.error(`Error disconnecting ${name}`, error);
        })
      );
    }

    await Promise.all(shutdownPromises);
    this.clients.clear();
    this.allTools = [];
    this.initialized = false;

    Logger.info('MCP Client Manager shutdown complete');
  }

  /**
   * Get health status of all connections
   * @returns {Object} Health status
   */
  getHealthStatus() {
    const servers = {};

    for (const [name, client] of this.clients) {
      servers[name] = {
        connected: client.isConnected(),
        tools: client.tools.length,
        prefix: client.config.prefix
      };
    }

    return {
      initialized: this.initialized,
      totalServers: this.clients.size,
      connectedServers: Array.from(this.clients.values()).filter(c => c.isConnected()).length,
      totalTools: this.allTools.length,
      servers
    };
  }
}

// Export singleton instance
export const mcpClientManager = new MCPClientManager();
