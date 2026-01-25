/**
 * ============================================================================
 * VIBE STACK - Task Controller
 * ============================================================================
 * Handles task-related MCP tool calls with validation and error handling
 * @version 2.0.0
 * ============================================================================
 */

import { Task } from '../core/models.js';
import { Validator } from '../middleware/validation.js';
import { ErrorHandler, TaskNotFoundError, InvalidLaneError } from '../middleware/errorHandler.js';

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
   * @returns {Object} MCP tool response
   */
  createTask(args) {
    try {
      // Validate input
      const validated = Validator.validateTaskData(args);

      // Create task
      const task = new Task(validated);
      this.#boardService.addTask(task);

      return {
        content: [{
          type: 'text',
          text: `✓ Task created: "${task.title}"\n` +
                `  Lane: ${task.lane}\n` +
                `  Priority: ${task.priority}\n` +
                `  ID: ${task.id}\n` +
                `  View at: http://localhost:4000`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Move a task to a different lane
   * @param {Object} args - Arguments with taskId and targetLane
   * @returns {Object} MCP tool response
   */
  moveTask(args) {
    try {
      // Validate inputs
      const taskId = Validator.validateTaskId(args.taskId);
      const targetLane = Validator.validateLane(args.targetLane);

      // Move task
      const task = this.#boardService.moveTask(taskId, targetLane);

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
   * @returns {Object} MCP tool response
   */
  updateTask(args) {
    try {
      // Validate inputs
      const taskId = Validator.validateTaskId(args.taskId);
      const { taskId: _, ...updates } = args;
      const validated = Validator.validateTaskUpdate(updates);

      // Update task
      const task = this.#boardService.updateTask(taskId, validated);

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
   * @returns {Object} MCP tool response
   */
  searchTasks(args) {
    try {
      // Validate inputs
      const query = Validator.validateQuery(args.query);
      const lane = args.lane ? Validator.validateLane(args.lane) : null;

      // Search
      const results = this.#boardService.searchTasks(query, lane);

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
   * @returns {Object} MCP tool response
   */
  batchCreate(args) {
    try {
      // Validate inputs
      const validatedTasks = Validator.validateBatchTasks(args.tasks);

      // Create tasks
      const created = [];
      for (const taskData of validatedTasks) {
        const task = new Task(taskData);
        this.#boardService.addTask(task);
        created.push(task);
      }

      return {
        content: [{
          type: 'text',
          text: `✓ Batch created ${created.length} tasks\n\n` +
                `IDs: ${created.map(t => t.id).join(', ')}`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }
}
