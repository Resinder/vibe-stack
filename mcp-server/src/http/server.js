/**
 * ============================================================================
 * VIBE STACK - HTTP Server
 * ============================================================================
 * HTTP server initialization and configuration with rate limiting
 * @version 1.0.0 - Added rate limiting middleware
 * ============================================================================
 */

import express from 'express';
import { Logger } from '../utils/logger.js';
import { standardRateLimit, healthCheckRateLimit } from '../middleware/rateLimit.js';

/**
 * Create and configure Express application with rate limiting
 * @returns {express.Application} Configured Express app
 */
export function createApp() {
  const app = express();

  // Trust proxy for accurate rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Setup middleware
  app.use(express.json());
  app.use(express.static('/custom'));

  // Apply standard rate limiting to all API routes
  // Health check endpoints get their own lenient rate limit
  app.get('/health', healthCheckRateLimit, (req, res) => {
    res.json({ status: 'healthy', server: 'Vibe Stack MCP Server', version: '1.0.0' });
  });

  return app;
}

/**
 * Start HTTP server with error handling
 * @param {Object} controllers - Controller instances
 * @param {BoardService} boardService - Board service instance
 * @param {express.Application} app - Express app
 * @param {Function} setupRoutes - Route setup function
 * @param {Object} config - Server configuration
 * @returns {Promise<http.Server>} HTTP server instance
 * @throws {Error} If HTTP server fails to start
 */
export async function startHttpServer(controllers, boardService, app, setupRoutes, config) {
  const { taskController, boardController, planningController, repoController, githubController, fileController, commandController, gitController, codeQualityController, apiTestingController, environmentController, dockerController, documentationController, credentialController } = controllers;

  // Setup routes with all controllers
  setupRoutes(app, taskController, boardController, planningController, boardService, {
    repoController,
    githubController,
    fileController,
    commandController,
    gitController,
    codeQualityController,
    apiTestingController,
    environmentController,
    dockerController,
    documentationController,
    credentialController
  }, config);

  // Start server with promise wrapper for better error handling
  return new Promise((resolve, reject) => {
    const server = app.listen(config.httpPort, () => {
      Logger.info(`HTTP server listening on port ${config.httpPort}`);
      resolve(server);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        Logger.error(`Port ${config.httpPort} is already in use`);
      } else {
        Logger.error(`HTTP server error`, error);
      }
      reject(error);
    });
  });
}
