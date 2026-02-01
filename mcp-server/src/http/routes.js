/**
 * ============================================================================
 * VIBE STACK - HTTP Routes
 * ============================================================================
 * HTTP API endpoints for external access with validation and rate limiting
 * @version 1.0.0 - Added rate limiting per endpoint type
 * ============================================================================
 */

import express from 'express';
// Module imports
import { TaskController, BoardController, PlanningController } from '../modules/kanban/index.js';
import { RepoController, GitController } from '../modules/repository/index.js';
import { GitHubController } from '../modules/github/index.js';
import { FileController, CommandController, CodeQualityController, ApiTestingController } from '../modules/devtools/index.js';
import { EnvironmentController, DockerController } from '../modules/environment/index.js';
import { DocumentationController } from '../modules/documentation/index.js';
// Legacy controllers
import { CredentialController } from '../controllers/credentialController.js';
// Utils
import { handleToolCall } from '../utils/toolRouter.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { VALID_WEBHOOK_EVENTS } from '../config/validationConstants.js';
import { CONFIG } from '../config/constants.js';
import { TOOLS } from '../config/tools.js';
import { Logger } from '../utils/logger.js';
import { standardRateLimit, strictRateLimit, planningRateLimit, readRateLimit } from '../middleware/rateLimit.js';
import { getMetrics } from '../utils/metrics.js';

/**
 * Validate webhook payload
 * @param {Object} body - Request body to validate
 * @returns {Object} Validated and sanitized webhook data
 * @throws {Error} If validation fails
 */
function validateWebhookPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid webhook payload: must be an object');
  }

  const event = Sanitizer.sanitizeString(body.event || '', 50);
  const data = body.data || null;

  // Validate event type
  if (!event) {
    throw new Error('Invalid webhook payload: missing event type');
  }

  if (!VALID_WEBHOOK_EVENTS.includes(event)) {
    throw new Error(`Invalid webhook event: ${event}. Must be one of: ${VALID_WEBHOOK_EVENTS.join(', ')}`);
  }

  // Sanitize data if present
  let sanitizedData = null;
  if (data) {
    if (typeof data !== 'object') {
      throw new Error('Invalid webhook payload: data must be an object');
    }

    // Sanitize string fields in data
    sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitizedData[key] = Sanitizer.sanitizeString(value, 500);
      } else if (Array.isArray(value)) {
        sanitizedData[key] = Sanitizer.sanitizeArray(value, 500);
      } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        sanitizedData[key] = value;
      }
      // Ignore nested objects for now
    }
  }

  return { event, data: sanitizedData };
}

/**
 * Setup HTTP routes
 * @param {express.Application} app - Express app
 * @param {TaskController} taskController - Task controller
 * @param {BoardController} boardController - Board controller
 * @param {PlanningController} planningController - Planning controller
 * @param {BoardService} boardService - Board service instance
 * @param {Object} controllers - Additional controller instances
 * @param {Object} config - Configuration object
 */
export function setupRoutes(app, taskController, boardController, planningController, boardService, {
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
}, config = { name: CONFIG.name, version: CONFIG.version, toolDefinitions: TOOLS }) {
  // ============================================================================
  // HEALTH & INFO ENDPOINTS (lenient rate limit)
  // ============================================================================

  app.get('/health', async (req, res) => {
    try {
      // Gather detailed health information
      const healthStatus = {
        status: 'healthy',
        server: config.name,
        version: config.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',

        // System resources
        system: {
          memory: process.memoryUsage(),
          cpu: {
            usage: process.cpuUsage(),
            loadAverage: require('os').loadavg()
          },
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        },

        // Service-specific health
        services: {
          database: {
            connected: true, // Will be verified by checking boardService
            latency: null
          },
          cache: {
            enabled: true,
            size: null // Will be populated if cache service available
          }
        },

        // Additional info
        metadata: {
          totalTasks: 0,
          toolsAvailable: config.toolDefinitions?.length || 0
        }
      };

      // Check database connectivity
      try {
        const board = await boardService.getBoard();
        healthStatus.services.database.connected = true;
        healthStatus.metadata.totalTasks = board.getAllTasks?.()?.length || 0;
      } catch (error) {
        healthStatus.services.database.connected = false;
        healthStatus.services.database.error = error.message;
        healthStatus.status = 'degraded';
      }

      // Return 200 if healthy, 503 if degraded
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Prometheus metrics endpoint (no rate limiting)
  app.get('/metrics', getMetrics);

  app.get('/.well-known/mcp', readRateLimit, (req, res) => {
    res.json({
      name: config.name,
      version: config.version,
      capabilities: ['tools'],
      tools: config.toolDefinitions.map(t => ({ name: t.name, description: t.description })),
    });
  });

  app.get('/.vibe-kanban-bridge.json', readRateLimit, async (req, res) => {
    const board = await boardService.getBoard();
    res.json(board.toJSON() || {});
  });

  // ============================================================================
  // OPENAI-COMPATIBLE API
  // ============================================================================

  app.get('/v1/functions', readRateLimit, (req, res) => {
    res.json({
      object: 'list',
      data: config.toolDefinitions.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }))
    });
  });

  app.post('/v1/tools/:toolName', strictRateLimit, async (req, res) => {
    const { toolName } = req.params;
    const args = req.body || {};

    try {
      const result = await handleToolCall(toolName, args, {
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
        documentationController,
        credentialController
      });
      res.json({
        success: true,
        tool: toolName,
        result: result.content[0]?.text || result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        tool: toolName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post('/v1/plan', planningRateLimit, async (req, res) => {
    const { goal, context, targetLane = 'backlog' } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Missing required field: goal' });
    }

    try {
      const result = await planningController.generatePlan({ goal, context, targetLane });
      const board = await boardService.getBoard();
      const tasks = board.getAllTasks() || [];

      res.json({
        success: true,
        goal,
        plan: {
          totalTasks: tasks.length,
          totalHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
          tasks: tasks.slice(-10).map(t => ({
            title: t.title,
            priority: t.priority,
            hours: t.estimatedHours
          }))
        },
        boardUrl: CONFIG.vibeKanbanUrl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/v1/board/snapshot', readRateLimit, async (req, res) => {
    const board = await boardService.getBoard();
    const stats = await boardService.getStats();

    res.json({
      board: board.toJSON(),
      stats,
      timestamp: new Date().toISOString(),
      url: CONFIG.vibeKanbanUrl
    });
  });

  // Serve custom panel
  app.get('/custom/kanban-panel.html', readRateLimit, (req, res) => {
    res.sendFile('/custom/kanban-panel.html');
  });

  // Webhook receiver with validation
  app.post('/webhook', standardRateLimit, (req, res) => {
    try {
      const validated = validateWebhookPayload(req.body);

      // Log webhook event (in production, would trigger handlers)
      Logger.info(`[Webhook] Received event: ${validated.event}`);

      res.json({
        success: true,
        received: true,
        event: validated.event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}
