/**
 * ============================================================================
 * VIBE STACK - Board Controller
 * ============================================================================
 * Handles board-related MCP tool calls with error handling
 * @version 2.0.0
 * ============================================================================
 */

import { ErrorHandler } from '../middleware/errorHandler.js';

/**
 * Board Controller - Board operations
 * @class BoardController
 * @description Handles get board, get stats, get context operations
 */
export class BoardController {
  /** @type {BoardService} Board service instance */
  #boardService;

  /**
   * Create a new BoardController
   * @param {BoardService} boardService - Board service instance
   */
  constructor(boardService) {
    this.#boardService = boardService;
  }

  /**
   * Get complete board state
   * @param {Object} args - Empty object
   * @returns {Object} MCP tool response
   */
  getBoard(args) {
    try {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(this.#boardService.board.toJSON(), null, 2)
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Get board statistics
   * @param {Object} args - Empty object
   * @returns {Object} MCP tool response
   */
  getStats(args) {
    try {
      const stats = this.#boardService.getStats();

      return {
        content: [{
          type: 'text',
          text: `📊 Board Statistics:\n\n` +
                `Tasks by Lane:\n` +
                `  • Backlog: ${stats.byLane.backlog || 0}\n` +
                `  • Todo: ${stats.byLane.todo || 0}\n` +
                `  • In Progress: ${stats.byLane.in_progress || 0}\n` +
                `  • Done: ${stats.byLane.done || 0}\n` +
                `  • Recovery: ${stats.byLane.recovery || 0}\n\n` +
                `Tasks by Priority:\n` +
                `  • Critical: ${stats.byPriority.critical}\n` +
                `  • High: ${stats.byPriority.high}\n` +
                `  • Medium: ${stats.byPriority.medium}\n` +
                `  • Low: ${stats.byPriority.low}\n\n` +
                `Total: ${stats.totalTasks} tasks (~${stats.totalEstimatedHours}h estimated)`
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Get current board context for AI decision-making
   * @param {Object} args - Empty object
   * @returns {Object} MCP tool response
   */
  getContext(args) {
    try {
      const board = this.#boardService.board.toJSON();
      const stats = this.#boardService.getStats();

      return {
        content: [{
          type: 'text',
          text: `📋 Vibe Kanban Context\n\n` +
                `Current Board State:\n` +
                `  • Total Tasks: ${stats.totalTasks}\n` +
                `  • In Progress: ${stats.byLane.in_progress || 0}\n` +
                `  • Completed: ${stats.byLane.done || 0}\n\n` +
                `Work Distribution:\n` +
                `  • High Priority: ${stats.byPriority.high}\n` +
                `  • Medium Priority: ${stats.byPriority.medium}\n` +
                `  • Low Priority: ${stats.byPriority.low}\n\n` +
                `Estimated Remaining: ${stats.totalEstimatedHours}h\n\n` +
                `Active Work:\n` +
                this.#formatActiveWork(board.lanes.in_progress)
        }]
      };
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Format active work for display
   * @private
   * @param {Array} tasks - Active tasks
   * @returns {string} Formatted output
   */
  #formatActiveWork(tasks) {
    if (!tasks || tasks.length === 0) return '  • No active tasks';
    return tasks.map(t =>
      `  • ${t.title} (${t.estimatedHours || 0}h)`
    ).join('\n');
  }
}
