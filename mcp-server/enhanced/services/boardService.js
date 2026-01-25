/**
 * ============================================================================
 * VIBE STACK - Board Service
 * ============================================================================
 * Manages board state with file persistence and real-time sync
 * @version 2.0.0
 * ============================================================================
 */

import { readFileSync, writeFileSync, watchFile, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { Board } from '../core/models.js';
import { BoardError, TaskNotFoundError, InvalidLaneError } from '../middleware/errorHandler.js';

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

  /** @type {boolean} Whether board has been modified */
  #isDirty;

  /**
   * Create a new BoardService
   * @param {string} bridgeFilePath - Path to bridge file
   * @throws {BoardError} If file path is invalid
   */
  constructor(bridgeFilePath) {
    if (!bridgeFilePath || typeof bridgeFilePath !== 'string') {
      throw new BoardError('Bridge file path is required and must be a string', 'constructor');
    }

    // Validate and sanitize file path
    this.#bridgeFilePath = this.#validateFilePath(bridgeFilePath);
    this.#board = this.#loadBoard();
    this.#watchers = [];
    this.#isDirty = false;
    this.#setupWatcher();
  }

  /**
   * Validate and sanitize file path for security
   * @private
   * @param {string} filePath - Path to validate
   * @returns {string} Validated path
   * @throws {BoardError} If path is invalid
   */
  #validateFilePath(filePath) {
    // Remove null bytes
    const sanitized = filePath.replace(/\0/g, '');

    // Check for path traversal attempts
    if (sanitized.includes('..')) {
      throw new BoardError('Path traversal detected in file path', 'validatePath');
    }

    // Ensure directory exists, create if not
    try {
      const dir = dirname(sanitized);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      throw new BoardError(`Failed to create directory: ${error.message}`, 'createDirectory');
    }

    return sanitized;
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

        // Validate JSON structure
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (parseError) {
          throw new BoardError(`Invalid JSON in bridge file: ${parseError.message}`, 'loadBoard');
        }

        return Board.fromJSON(parsed);
      }
    } catch (e) {
      if (e instanceof BoardError) {
        throw e;
      }
      console.error(`[BoardService] Failed to load board: ${e.message}`);
    }
    return new Board();
  }

  /**
   * Save board to file
   * @private
   * @throws {BoardError} If save fails
   */
  #saveBoard() {
    try {
      const data = JSON.stringify(this.#board.toJSON(), null, 2);
      writeFileSync(this.#bridgeFilePath, data, 'utf-8');
      this.#isDirty = false;
      this.#notifyWatchers();
    } catch (e) {
      throw new BoardError(`Failed to save board: ${e.message}`, 'saveBoard');
    }
  }

  /**
   * Set up file watcher for real-time updates
   * @private
   */
  #setupWatcher() {
    try {
      watchFile(this.#bridgeFilePath, { interval: 1000 }, () => {
        try {
          this.#board = this.#loadBoard();
          this.#notifyWatchers();
        } catch (error) {
          console.error(`[BoardService] Failed to reload board: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`[BoardService] Failed to setup file watcher: ${error.message}`);
    }
  }

  /**
   * Register a change callback
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    if (typeof callback !== 'function') {
      throw new BoardError('Callback must be a function', 'onChange');
    }
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
        console.error(`[BoardService] Watcher error: ${e.message}`);
      }
    }
  }

  /**
   * Add a task to the board
   * @param {Task} task - Task to add
   * @returns {Task} Added task
   * @throws {BoardError} If lane is invalid
   */
  addTask(task) {
    try {
      this.#board.addTask(task);
      this.#saveBoard();
      return task;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid lane')) {
        throw new InvalidLaneError(task.lane, Board.VALID_LANES);
      }
      throw new BoardError(`Failed to add task: ${error.message}`, 'addTask');
    }
  }

  /**
   * Move a task to a different lane
   * @param {string} taskId - Task ID
   * @param {string} targetLane - Target lane name
   * @returns {Object} Moved task
   * @throws {TaskNotFoundError} If task not found
   * @throws {InvalidLaneError} If lane is invalid
   */
  moveTask(taskId, targetLane) {
    // Validate lane
    if (!Board.VALID_LANES.includes(targetLane)) {
      throw new InvalidLaneError(targetLane, Board.VALID_LANES);
    }

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

    throw new TaskNotFoundError(taskId);
  }

  /**
   * Update task properties
   * @param {string} taskId - Task ID
   * @param {Object} updates - Properties to update
   * @returns {Object} Updated task
   * @throws {TaskNotFoundError} If task not found
   * @throws {BoardError} If update fails
   */
  updateTask(taskId, updates) {
    for (const tasks of Object.values(this.#board.lanes)) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        // Sanitize updates before applying
        const sanitized = this.#sanitizeUpdates(updates);
        Object.assign(task, sanitized);
        task.updatedAt = new Date().toISOString();
        this.#saveBoard();
        return task;
      }
    }

    throw new TaskNotFoundError(taskId);
  }

  /**
   * Sanitize task updates to prevent injection attacks
   * @private
   * @param {Object} updates - Updates to sanitize
   * @returns {Object} Sanitized updates
   */
  #sanitizeUpdates(updates) {
    const sanitized = {};
    const allowedFields = ['title', 'description', 'lane', 'priority', 'status', 'estimatedHours', 'tags'];

    for (const [key, value] of Object.entries(updates)) {
      // Only allow known fields
      if (!allowedFields.includes(key)) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        // Remove null bytes and control characters
        sanitized[key] = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
      }
      // Sanitize arrays
      else if (Array.isArray(value)) {
        sanitized[key] = value
          .filter(item => typeof item === 'string')
          .map(item => item.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim())
          .filter(item => item.length > 0);
      }
      // Allow numbers and booleans as-is
      else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }

    return sanitized;
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

    // Sanitize query to prevent ReDoS
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 500);
    const queryLower = sanitizedQuery.toLowerCase();

    for (const [laneName, tasks] of Object.entries(this.#board.lanes)) {
      if (lane && laneName !== lane) continue;

      for (const task of tasks) {
        const searchContent = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')}`.toLowerCase();
        if (searchContent.includes(queryLower)) {
          // Return a copy to prevent external mutation
          results.push({ ...task, lane: laneName });
        }
      }
    }

    return results;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.#watchers = [];
  }
}
