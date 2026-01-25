/**
 * ============================================================================
 * VIBE STACK - Task Controller
 * ============================================================================
 * Handles task-related MCP tool calls
 * @version 2.0.0
 * ============================================================================
 */

import { Task } from '../core/models.js';

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
      const task = new Task(args);
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
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  /**
   * Move a task to a different lane
   * @param {Object} args - Arguments with taskId and targetLane
   * @returns {Object} MCP tool response
   */
  moveTask(args) {
    try {
      const { taskId, targetLane } = args;

      if (!taskId || !targetLane) {
        throw new Error('taskId and targetLane are required');
      }

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
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  /**
   * Update task properties
   * @param {Object} args - Arguments with taskId and updates
   * @returns {Object} MCP tool response
   */
  updateTask(args) {
    try {
      const { taskId, ...updates } = args;

      if (!taskId) {
        throw new Error('taskId is required');
      }

      const task = this.#boardService.updateTask(taskId, updates);

      return {
        content: [{
          type: 'text',
          text: `✓ Task updated: ${task.title}\n` +
                `  Changes: ${Object.keys(updates).join(', ')}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  /**
   * Search tasks by query
   * @param {Object} args - Arguments with query and optional lane
   * @returns {Object} MCP tool response
   */
  searchTasks(args) {
    try {
      const { query, lane } = args;

      if (!query) {
        throw new Error('query is required');
      }

      const results = this.#boardService.searchTasks(query, lane);

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} task(s):\n\n${JSON.stringify(results, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  /**
   * Batch create multiple tasks
   * @param {Object} args - Arguments with tasks array
   * @returns {Object} MCP tool response
   */
  batchCreate(args) {
    try {
      const { tasks } = args;

      if (!Array.isArray(tasks)) {
        throw new Error('tasks must be an array');
      }

      const created = [];

      for (const taskData of tasks) {
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
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
}
