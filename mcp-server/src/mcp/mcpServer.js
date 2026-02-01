/**
 * ============================================================================
 * VIBE STACK - MCP Server
 * ============================================================================
 * MCP server initialization and handler registration
 * Enhanced with external MCP server support
 * @version 1.0.0
 * ============================================================================
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../utils/logger.js';
import { ErrorHandler } from '../middleware/errorHandler.js';
import { mcpClientManager } from './clientManager.js';

/**
 * Create MCP server instance
 * @param {Object} config - Server configuration
 * @returns {Server} MCP server instance
 * @throws {Error} If server creation fails
 */
export function createMcpServer(config) {
  try {
    const server = new Server(
      { name: config.name, version: config.version },
      { capabilities: { tools: {} } }
    );
    Logger.info('MCP server created');
    return server;
  } catch (error) {
    throw new Error(`Failed to create MCP server: ${error.message}`);
  }
}

/**
 * Register MCP request handlers
 * @param {Server} mcpServer - MCP server instance
 * @param {Object} controllers - Controller instances
 * @param {Array} tools - Tool definitions
 * @param {Function} handleToolCall - Tool call handler function
 * @throws {Error} If handler registration fails
 */
export function registerMcpHandlers(mcpServer, controllers, tools, handleToolCall) {
  try {
    const {
      taskController,
      boardController,
      planningController,
      repoController,
      githubController,
      fileController,
      commandController,
      gitController,
      codeQualityController,
      apiTestingController,
      environmentController,
      dockerController,
      documentationController
    } = controllers;

    mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        // Get native tools
        const nativeTools = tools;

        // Get external tools from connected MCP servers
        const externalTools = await mcpClientManager.getTools();

        // Combine and return all tools
        const allTools = [
          ...nativeTools,
          ...externalTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        ];

        Logger.debug(`Listing ${allTools.length} tools (${nativeTools.length} native, ${externalTools.length} external)`);

        return { tools: allTools };
      } catch (error) {
        Logger.error(`Error listing tools`, error);
        return ErrorHandler.handle(error);
      }
    });

    mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await handleToolCall(name, args || {}, {
          taskController,
          boardController,
          planningController,
          repoController,
          githubController,
          fileController,
          commandController,
          gitController,
          codeQualityController,
          apiTestingController,
          environmentController,
          dockerController,
          documentationController
        });
      } catch (error) {
        Logger.error(`Error calling tool ${name}`, error);
        return ErrorHandler.handle(error);
      }
    });

    Logger.info('MCP handlers registered');
  } catch (error) {
    throw new Error(`Failed to register MCP handlers: ${error.message}`);
  }
}

/**
 * Connect MCP server to stdio transport
 * @param {Server} mcpServer - MCP server instance
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
export async function connectMcpTransport(mcpServer) {
  try {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    Logger.info('MCP stdio transport connected');
  } catch (error) {
    throw new Error(`Failed to connect MCP stdio transport: ${error.message}`);
  }
}
