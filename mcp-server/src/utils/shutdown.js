/**
 * ============================================================================
 * VIBE STACK - Shutdown & Cleanup Utilities
 * ============================================================================
 * Graceful shutdown and resource cleanup
 * Enhanced with external MCP client cleanup and PostgreSQL storage
 * @version 1.0.0 - Added WebSocket server shutdown
 * ============================================================================
 */

import { Logger } from '../utils/logger.js';
import { mcpClientManager } from '../mcp/clientManager.js';

/**
 * Setup graceful shutdown handlers
 * @param {http.Server} httpServer - HTTP server instance
 * @param {BoardService} boardService - Board service instance
 * @param {PostgresStorage} storage - PostgreSQL storage instance
 * @param {WebSocketSyncServer} wsServer - WebSocket server instance (optional)
 */
export function setupGracefulShutdown(httpServer, boardService, storage = null, wsServer = null) {
  const shutdown = async (signal) => {
    Logger.info(`Received ${signal}, shutting down gracefully...`);

    try {
      // Shutdown external MCP clients
      try {
        await mcpClientManager.shutdown();
        Logger.info('External MCP clients shutdown');
      } catch (error) {
        Logger.warn('Error shutting down external MCP clients (continuing)', error);
      }

      // Shutdown WebSocket server
      if (wsServer) {
        try {
          wsServer.shutdown();
          Logger.info('WebSocket server shutdown');
        } catch (error) {
          Logger.warn('Error shutting down WebSocket server (continuing)', error);
        }
      }

      if (httpServer) {
        await new Promise((resolve) => {
          httpServer.close(() => {
            Logger.info('HTTP server closed');
            resolve();
          });
        });
      }

      if (boardService) {
        await boardService.destroy();
        Logger.info('Board service destroyed');
      }

      if (storage) {
        await storage.close();
        Logger.info('PostgreSQL storage closed');
      }

      Logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      Logger.error(`Error during shutdown`, error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Cleanup resources on error
 * @param {http.Server} httpServer - HTTP server instance
 * @param {PostgresStorage} storage - PostgreSQL storage instance
 * @param {WebSocketSyncServer} wsServer - WebSocket server instance (optional)
 */
export async function cleanupOnError(httpServer, storage = null, wsServer = null) {
  // Cleanup external MCP clients
  try {
    await mcpClientManager.shutdown();
  } catch (e) {
    // Ignore cleanup errors
  }

  // Cleanup WebSocket server
  if (wsServer) {
    try {
      wsServer.shutdown();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  if (httpServer) {
    try {
      httpServer.close();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  if (storage) {
    try {
      await storage.close();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
