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
 *   http/ - HTTP routes
 *   index.js - Main entry point (orchestration only)
 *
 * @version 2.0.0
 * ============================================================================
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';

// Import modular components
import { BoardService } from './services/boardService.js';
import { TaskPlanningService } from './services/taskPlanningService.js';
import { TaskController } from './controllers/taskController.js';
import { BoardController } from './controllers/boardController.js';
import { PlanningController } from './controllers/planningController.js';
import { setupRoutes } from './http/routes.js';
import { CONFIG, TOOLS } from './config/constants.js';

// ============================================================================
// MAIN SERVER ENTRY POINT
// ============================================================================

/**
 * Start HTTP server
 * @param {Object} controllers - Controller instances
 * @param {BoardService} boardService - Board service instance
 * @param {express.Application} app - Express app
 */
function startHttpServer(controllers, boardService, app) {
  const { taskController, boardController, planningController } = controllers;

  // Setup middleware
  app.use(express.json());
  app.use(express.static('/custom'));

  // Setup routes
  setupRoutes(app, taskController, boardController, planningController, boardService, {
    name: CONFIG.name,
    version: CONFIG.version,
    toolDefinitions: TOOLS
  });

  // Start server
  app.listen(CONFIG.httpPort, () => {
    console.error(`HTTP server listening on port ${CONFIG.httpPort}`);
  });
}

/**
 * Initialize and start MCP server
 */
async function main() {
  // Initialize services
  const boardService = new BoardService(CONFIG.bridgeFilePath);
  const planningService = new TaskPlanningService();

  // Initialize controllers
  const taskController = new TaskController(boardService);
  const boardController = new BoardController(boardService);
  const planningController = new PlanningController(boardService, planningService);

  // Setup Express app
  const app = express();
  startHttpServer({ taskController, boardController, planningController }, boardService, app);

  // Create MCP server
  const server = new Server(
    { name: CONFIG.name, version: CONFIG.version },
    { capabilities: { tools: {} } }
  );

  // Register MCP handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await handleToolCall(name, args || {}, { taskController, boardController, planningController });
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  // Connect to stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${CONFIG.name} v${CONFIG.version} running`);
  console.error(`Enhanced features: pattern-based planning, real-time sync, webhooks`);
  console.error(`Modular architecture: no spaghetti code!`);
}

/**
 * Handle MCP tool call - routes to appropriate controller
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @param {Object} controllers - Controller instances
 * @returns {Object} Tool result
 */
async function handleToolCall(name, args, { taskController, boardController, planningController }) {
  switch (name) {
    case 'vibe_get_board':
      return boardController.getBoard(args);
    case 'vibe_create_task':
      return taskController.createTask(args);
    case 'vibe_move_task':
      return taskController.moveTask(args);
    case 'vibe_update_task':
      return taskController.updateTask(args);
    case 'vibe_generate_plan':
      return planningController.generatePlan(args);
    case 'vibe_search_tasks':
      return taskController.searchTasks(args);
    case 'vibe_get_stats':
      return boardController.getStats(args);
    case 'vibe_analyze_goal':
      return planningController.analyzeGoal(args);
    case 'vibe_batch_create':
      return taskController.batchCreate(args);
    case 'vibe_get_context':
      return boardController.getContext(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Start the server
main().catch(console.error);
