/**
 * ============================================================================
 * VIBE STACK - HTTP Routes
 * ============================================================================
 * HTTP API endpoints for external access
 * @version 2.0.0
 * ============================================================================
 */

import express from 'express';
import { TaskController } from '../controllers/taskController.js';
import { BoardController } from '../controllers/boardController.js';
import { PlanningController } from '../controllers/planningController.js';
import { CONFIG } from '../config/constants.js';

/**
 * Setup HTTP routes
 * @param {express.Application} app - Express app
 * @param {TaskController} taskController - Task controller
 * @param {BoardController} boardController - Board controller
 * @param {PlanningController} planningController - Planning controller
 * @param {BoardService} boardService - Board service instance
 * @param {Object} config - Configuration object
 */
export function setupRoutes(app, taskController, boardController, planningController, boardService, config) {
  // ============================================================================
  // HEALTH & INFO ENDPOINTS
  // ============================================================================

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: config.name, version: config.version });
  });

  app.get('/.well-known/mcp', (req, res) => {
    res.json({
      name: config.name,
      version: config.version,
      capabilities: ['tools'],
      tools: config.toolDefinitions.map(t => ({ name: t.name, description: t.description })),
    });
  });

  app.get('/.vibe-kanban-bridge.json', (req, res) => {
    res.json(boardService.board.toJSON() || {});
  });

  // ============================================================================
  // OPENAI-COMPATIBLE API
  // ============================================================================

  app.get('/v1/functions', (req, res) => {
    res.json({
      object: 'list',
      data: config.toolDefinitions.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }))
    });
  });

  app.post('/v1/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const args = req.body || {};

    try {
      const result = await handleToolCall(toolName, args, { taskController, boardController, planningController });
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

  app.post('/v1/plan', async (req, res) => {
    const { goal, context, targetLane = 'backlog' } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Missing required field: goal' });
    }

    try {
      const result = await planningController.generatePlan({ goal, context, targetLane });
      const tasks = boardService.board.getAllTasks() || [];

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

  app.get('/v1/board/snapshot', (req, res) => {
    const board = boardService.board.toJSON();
    const stats = boardService.getStats();

    res.json({
      board,
      stats,
      timestamp: new Date().toISOString(),
      url: CONFIG.vibeKanbanUrl
    });
  });

  // Serve custom panel
  app.get('/custom/kanban-panel.html', (req, res) => {
    res.sendFile('/custom/kanban-panel.html');
  });

  // Webhook receiver
  app.post('/webhook', (req, res) => {
    const { event, data } = req.body;
    res.json({ received: true });
  });
}

/**
 * Handle tool call - routes to appropriate controller
 * @private
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
