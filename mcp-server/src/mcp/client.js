/**
 * ============================================================================
 * VIBE STACK - MCP Client Module
 * ============================================================================
 * Client for connecting to external MCP servers via STDIO transport
 * @version 1.0.0
 * ============================================================================
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Logger } from '../utils/logger.js';

/**
 * MCP Client for connecting to external MCP servers
 * Implements JSON-RPC 2.0 over STDIO transport
 */
export class MCPClient {
  /**
   * @param {Object} config - Client configuration
   * @param {string} config.name - Server name for identification
   * @param {string} config.prefix - Tool name prefix to avoid conflicts
   * @param {string} config.command - Command to start the server
   * @param {string[]} config.args - Arguments for the command
   * @param {Object} config.env - Environment variables
   */
  constructor(config) {
    this.config = config;
    this.client = null;
    this.transport = null;
    this.tools = [];
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.connected = false;
  }

  /**
   * Connect to the external MCP server
   * @async
   * @throws {Error} If connection fails
   */
  async connect() {
    try {
      // Create STDIO transport to external MCP server
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: {
          ...process.env,
          ...this.config.env
        }
      });

      // Create MCP client
      this.client = new Client(
        {
          name: `vibe-stack-mcp-client-${this.config.name}`,
          version: '2.1.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      // Connect to the server
      await this.client.connect(this.transport);
      this.connected = true;

      Logger.info(`Connected to MCP server: ${this.config.name}`, {
        command: this.config.command,
        args: this.config.args
      });

      // Discover available tools
      await this.discoverTools();

    } catch (error) {
      Logger.error(`Failed to connect to MCP server: ${this.config.name}`, error);
      this.connected = false;
      throw new Error(`Failed to connect to MCP server: ${this.config.name} - ${error.message}`);
    }
  }

  /**
   * Discover available tools from the connected server
   * @async
   */
  async discoverTools() {
    try {
      const response = await this.client.listTools();

      this.tools = response.tools.map(tool => ({
        ...tool,
        _server: this.config.name, // Track which server provides this tool
        _prefix: this.config.prefix || this.config.name, // Add prefix to avoid conflicts
        _originalName: tool.name // Store original name
      }));

      Logger.info(`Discovered ${this.tools.length} tools from ${this.config.name}`, {
        tools: this.tools.map(t => t.name)
      });

    } catch (error) {
      Logger.error(`Failed to discover tools from ${this.config.name}`, error);
      this.tools = [];
    }
  }

  /**
   * Call a tool on the external MCP server
   * @async
   * @param {string} name - Tool name (with prefix)
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   * @throws {Error} If tool call fails
   */
  async callTool(name, args) {
    if (!this.connected || !this.client) {
      throw new Error(`Not connected to MCP server: ${this.config.name}`);
    }

    try {
      // Remove prefix to get original tool name
      const originalName = name.replace(`${this.config.prefix}_`, '').replace(`${this.config.name}_`, '');

      Logger.debug(`Calling tool on ${this.config.name}: ${originalName}`, { args });

      const response = await this.client.callTool({
        name: originalName,
        arguments: args
      });

      Logger.debug(`Tool call completed: ${originalName}`, {
        success: response.content !== undefined
      });

      return response;

    } catch (error) {
      Logger.error(`Tool call failed on ${this.config.name}: ${name}`, error);
      throw new Error(`Tool call failed: ${error.message}`);
    }
  }

  /**
   * Get tools from this server with prefixed names
   * @returns {Array<Object>} Array of tool definitions
   */
  getPrefixedTools() {
    return this.tools.map(tool => ({
      name: `${tool._prefix}_${tool.name}`,
      description: tool.description,
      inputSchema: tool.inputSchema,
      _server: tool._server,
      _originalName: tool._originalName
    }));
  }

  /**
   * Check if this client has a specific tool
   * @param {string} toolName - Tool name to check (with or without prefix)
   * @returns {boolean} True if tool exists
   */
  hasTool(toolName) {
    const normalizedName = toolName.replace(`${this.config.prefix}_`, '').replace(`${this.config.name}_`, '');
    return this.tools.some(tool => tool.name === normalizedName);
  }

  /**
   * Disconnect from the external MCP server
   * @async
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        Logger.info(`Disconnected from MCP server: ${this.config.name}`);
      }
      if (this.transport) {
        // Note: StdioClientTransport doesn't have a close method in the SDK
        // The child process will be terminated when the client closes
      }
      this.connected = false;
    } catch (error) {
      Logger.error(`Error disconnecting from ${this.config.name}`, error);
    }
  }

  /**
   * Check if the client is connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get server information
   * @returns {Object} Server info
   */
  getServerInfo() {
    return {
      name: this.config.name,
      prefix: this.config.prefix,
      connected: this.connected,
      toolCount: this.tools.length,
      tools: this.tools.map(t => t.name)
    };
  }
}
