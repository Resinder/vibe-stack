/**
 * ============================================================================
 * VIBE STACK - Task Controller
 * ============================================================================
 * Handles task-related MCP tool calls with validation and error handling
 * @version 1.0.0
 * ============================================================================
 */

import { TaskValidator } from '../../../middleware/taskValidation.js';
import { PlanningValidator } from '../../../middleware/planningValidation.js';
import { ErrorHandler, TaskNotFoundError, InvalidLaneError } from '../../../middleware/errorHandler.js';
import { TaskFactory } from '../../../factories/taskFactory.js';
import { CONFIG } from '../../../config/constants.js';

/**
 * Task Controller - Task-related operations
 * @class TaskController
 * @description Handles create, update, move, and search operations for tasks
 */
export class TaskController {
  /** @type {BoardService} Board service instance */
  #boardService;

  /**
   * Create a new TaskController
   * @param {BoardService} boardService - Board service instance
   */
  constructor(boardService) {
    this.#boardService = boardService;
  }

  /**
   * Create a new task
   * @param {Object} args - Task data
   * @returns {Promise<Object>} MCP tool response
   */
  async createTask(args) {
    try {
      // Create task using factory (handles validation and defaults)
      const task = TaskFactory.create(args);
      const createdTask = await this.#boardService.addTask(task);

      return {
        content: [{
          type: 'text',
          text: `✓ Task created: "${createdTask.title}"\n` +
                `  Lane: ${createdTask.lane}\n` +
                `  Priority: ${createdTask.priority}\n` +
                `  ID: ${createdTask.id}\n` +
                `  View at: ${CONFIG.vibeKanbanUrl}`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Move a task to a different lane
   * @param {Object} args - Arguments with taskId and targetLane
   * @returns {Promise<Object>} MCP tool response
   */
  async moveTask(args) {
    try {
      // Validate inputs
      const taskId = TaskValidator.validateTaskId(args.taskId);
      const targetLane = TaskValidator.validateLane(args.targetLane);

      // Move task
      const task = await this.#boardService.moveTask(taskId, targetLane);

      return {
        content: [{
          type: 'text',
          text: `✓ Task moved to ${targetLane}\n` +
                `  Task: ${task.title}\n` +
                `  ID: ${task.id}`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Update task properties
   * @param {Object} args - Arguments with taskId and updates
   * @returns {Promise<Object>} MCP tool response
   */
  async updateTask(args) {
    try {
      // Validate inputs
      const taskId = TaskValidator.validateTaskId(args.taskId);
      const { taskId: _, ...updates } = args;
      const validated = TaskValidator.validateTaskUpdate(updates);

      // Update task
      const task = await this.#boardService.updateTask(taskId, validated);

      return {
        content: [{
          type: 'text',
          text: `✓ Task updated: ${task.title}\n` +
                `  Changes: ${Object.keys(validated).join(', ')}`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Search tasks by query
   * @param {Object} args - Arguments with query and optional lane
   * @returns {Promise<Object>} MCP tool response
   */
  async searchTasks(args) {
    try {
      // Validate inputs
      const query = PlanningValidator.validateQuery(args.query);
      const lane = args.lane ? TaskValidator.validateLane(args.lane) : null;

      // Search
      const results = await this.#boardService.searchTasks(query, lane);

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} task(s):\n\n${JSON.stringify(results, null, 2)}`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Batch create multiple tasks
   * @param {Object} args - Arguments with tasks array
   * @returns {Promise<Object>} MCP tool response
   */
  async batchCreate(args) {
    try {
      // Create tasks using factory (handles validation and defaults)
      const created = TaskFactory.createMany(args.tasks);
      const createdTasks = [];

      // Add all tasks to board
      for (const task of created) {
        const createdTask = await this.#boardService.addTask(task);
        createdTasks.push(createdTask);
      }

      return {
        content: [{
          type: 'text',
          text: `✓ Batch created ${createdTasks.length} tasks\n\n` +
                `IDs: ${createdTasks.map(t => t.id).join(', ')}`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }
}
