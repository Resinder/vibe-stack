#!/usr/bin/env node
/**
 * ============================================================================
 * VIBE STACK - Enhanced MCP Server (Modular)
 * ============================================================================
 * Advanced integration between Open WebUI and Vibe Kanban with:
 * - Real-time bidirectional sync
 * - Intelligent task planning with project context awareness
 * - Webhook support for live updates
 * - Full workflow management
 * - Clean modular architecture (no spaghetti)
 *
 * Architecture:
 *   config/ - Configuration and constants
 *   core/ - Domain models (Task, Board)
 *   services/ - Business logic (TaskPlanning, Board)
 *   controllers/ - MCP tool handlers
 *   http/ - HTTP server and routes
 *   mcp/ - MCP server and initialization
 *   index.js - Main entry point (orchestration only)
 *
 * @version 1.0.0
 * ============================================================================
 */

// Import modular components
import { createApp, startHttpServer } from './src/http/server.js';
import { initializeServices, initializeControllers, initializeExternalMCP } from './src/mcp/initializers.js';
import { createMcpServer, registerMcpHandlers, connectMcpTransport } from './src/mcp/mcpServer.js';
import { setupGracefulShutdown, cleanupOnError } from './src/utils/shutdown.js';
import { setupRoutes } from './src/http/routes.js';
import { handleToolCall } from './src/utils/toolRouter.js';
import { CONFIG } from './src/config/constants.js';
import { TOOLS } from './src/config/tools.js';
import { Logger } from './src/utils/logger.js';
import { WebSocketSyncServer, EventType } from './src/websocket/server.js';
import { BoardWebSocketIntegration } from './src/websocket/boardSync.js';

// ============================================================================
// MAIN SERVER ENTRY POINT
// ============================================================================

/**
 * Initialize and start MCP server with comprehensive error handling
 * @async
 */
async function main() {
  let httpServer = null;
  let mcpServer = null;
  let storage = null;
  let wsServer = null;

  try {
    // Initialize services with PostgreSQL storage (now async)
    const { boardService, planningService, storage: pgStorage, credentialStorage } = await initializeServices({
      postgres: CONFIG.postgres,
      cache: CONFIG.cache
    });
    storage = pgStorage;

    // Initialize controllers
    const controllers = initializeControllers(boardService, planningService, credentialStorage);

    // Initialize external MCP servers (non-blocking)
    await initializeExternalMCP();

    // Setup Express app
    const app = createApp();

    // Start HTTP server
    httpServer = await startHttpServer(controllers, boardService, app, setupRoutes, {
      name: CONFIG.name,
      version: CONFIG.version,
      httpPort: CONFIG.httpPort,
      toolDefinitions: TOOLS
    });

    // Initialize WebSocket server for real-time sync
    wsServer = new WebSocketSyncServer(httpServer, {
      path: '/ws'
    });

    // Initialize WebSocket integration with BoardService
    const wsIntegration = new BoardWebSocketIntegration(wsServer);
    boardService.setWebSocketIntegration(wsIntegration);

    Logger.startup('WebSocket server initialized for real-time task synchronization');

    // Create MCP server
    mcpServer = createMcpServer(CONFIG);

    // Register MCP handlers
    registerMcpHandlers(mcpServer, controllers, TOOLS, handleToolCall);

    // Connect to stdio
    await connectMcpTransport(mcpServer);

    // Server is running
    Logger.startup(`${CONFIG.name} v${CONFIG.version} running`);
    Logger.startup(`Enhanced features: pattern-based planning, real-time sync, webhooks`);
    Logger.startup(`Modular architecture: no spaghetti code!`);
    Logger.startup(`External MCP support: GitHub, PostgreSQL, Slack (when configured)`);
    Logger.startup(`Storage backend: PostgreSQL (async, non-blocking)`);
    Logger.startup(`WebSocket: Real-time task updates enabled on ws://localhost:${CONFIG.httpPort}/ws`);

    // Setup graceful shutdown
    setupGracefulShutdown(httpServer, boardService, storage, wsServer);

  } catch (error) {
    Logger.error(`Fatal error during server startup`, error);
    await cleanupOnError(httpServer, storage);
    if (wsServer) {
      wsServer.shutdown();
    }
    process.exit(1);
  }
}

// Start the server
main().catch((error) => Logger.error('Unhandled error', error));
