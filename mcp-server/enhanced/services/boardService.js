/**
 * ============================================================================
 * VIBE STACK - Board Service
 * ============================================================================
 * Manages board state with file persistence and real-time sync
 * @version 2.0.0
 * ============================================================================
 */

import { readFileSync, writeFileSync, watchFile, existsSync } from 'fs';
import { Board } from '../core/models.js';

/**
 * Board Service - Manages board state
 * @class BoardService
 * @description Handles board CRUD operations with file persistence
 */
export class BoardService {
  /** @type {string} Path to bridge file */
  #bridgeFilePath;

  /** @type {Board} Current board state */
  #board;

  /** @type {Array} Change watchers */
  #watchers;

  /**
   * Create a new BoardService
   * @param {string} bridgeFilePath - Path to bridge file
   */
  constructor(bridgeFilePath) {
    this.#bridgeFilePath = bridgeFilePath;
    this.#board = this.#loadBoard();
    this.#watchers = [];
    this.#setupWatcher();
  }

  /**
   * Get current board
   * @returns {Board} Current board state
   */
  get board() {
    return this.#board;
  }

  /**
   * Load board from file
   * @private
   * @returns {Board} Loaded board
   */
  #loadBoard() {
    try {
      if (existsSync(this.#bridgeFilePath)) {
        const data = readFileSync(this.#bridgeFilePath, 'utf-8');
        return Board.fromJSON(JSON.parse(data));
      }
    } catch (e) {
      console.error(`Failed to load board: ${e.message}`);
    }
    return new Board();
  }

  /**
   * Save board to file
   * @private
   * @throws {Error} If save fails
   */
  #saveBoard() {
    try {
      writeFileSync(this.#bridgeFilePath, JSON.stringify(this.#board.toJSON(), null, 2), 'utf-8');
      this.#notifyWatchers();
    } catch (e) {
      console.error(`Failed to save board: ${e.message}`);
      throw e;
    }
  }

  /**
   * Set up file watcher for real-time updates
   * @private
   */
  #setupWatcher() {
    watchFile(this.#bridgeFilePath, { interval: 1000 }, () => {
      this.#board = this.#loadBoard();
      this.#notifyWatchers();
    });
  }

  /**
   * Register a change callback
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.#watchers.push(callback);
  }

  /**
   * Notify all watchers of changes
   * @private
   */
  #notifyWatchers() {
    for (const callback of this.#watchers) {
      try {
        callback(this.#board);
      } catch (e) {
        console.error(`Watcher error: ${e.message}`);
      }
    }
  }

  /**
   * Add a task to the board
   * @param {Task} task - Task to add
   * @returns {Task} Added task
   */
  addTask(task) {
    this.#board.addTask(task);
    this.#saveBoard();
    return task;
  }

  /**
   * Move a task to a different lane
   * @param {string} taskId - Task ID
   * @param {string} targetLane - Target lane name
   * @returns {Object} Moved task
   * @throws {Error} If task not found
   */
  moveTask(taskId, targetLane) {
    for (const [lane, tasks] of Object.entries(this.#board.lanes)) {
      const index = tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        const [task] = tasks.splice(index, 1);
        task.lane = targetLane;
        task.updatedAt = new Date().toISOString();
        this.#board.lanes[targetLane].push(task);
        this.#saveBoard();
        return task;
      }
    }
    throw new Error(`Task not found: ${taskId}`);
  }

  /**
   * Update task properties
   * @param {string} taskId - Task ID
   * @param {Object} updates - Properties to update
   * @returns {Object} Updated task
   * @throws {Error} If task not found
   */
  updateTask(taskId, updates) {
    for (const tasks of Object.values(this.#board.lanes)) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        this.#saveBoard();
        return task;
      }
    }
    throw new Error(`Task not found: ${taskId}`);
  }

  /**
   * Get board statistics
   * @returns {Object} Board statistics
   */
  getStats() {
    const stats = {
      totalTasks: 0,
      byLane: {},
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      totalEstimatedHours: 0
    };

    for (const [lane, tasks] of Object.entries(this.#board.lanes)) {
      stats.byLane[lane] = tasks.length;
      stats.totalTasks += tasks.length;

      for (const task of tasks) {
        const priority = task.priority || 'medium';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        stats.totalEstimatedHours += task.estimatedHours || 0;
      }
    }

    return stats;
  }

  /**
   * Search tasks by query
   * @param {string} query - Search query
   * @param {string} [lane] - Optional lane filter
   * @returns {Array} Matching tasks
   */
  searchTasks(query, lane) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [laneName, tasks] of Object.entries(this.#board.lanes)) {
      if (lane && laneName !== lane) continue;

      for (const task of tasks) {
        const searchContent = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')}`.toLowerCase();
        if (searchContent.includes(queryLower)) {
          results.push({ ...task, lane: laneName });
        }
      }
    }

    return results;
  }
}
