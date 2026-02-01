/**
 * ============================================================================
 * VIBE STACK - Board Service
 * ============================================================================
 * Manages board state with PostgreSQL persistence and real-time sync
 * @version 1.0.0 - Added WebSocket real-time sync
 * ============================================================================
 */

import { Board } from '../core/models.js';
import { PostgresStorage } from '../shared/storage/index.js';
import { BoardError, TaskNotFoundError, InvalidLaneError } from '../middleware/errorHandler.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Logger } from '../utils/logger.js';

/**
 * Board WebSocket Integration (optional, loaded dynamically)
 * @typedef {Object} BoardWebSocketIntegration
 */

/**
 * Board Service - Manages board state with PostgreSQL storage and WebSocket sync
 * @class BoardService
 * @description Handles board CRUD operations with async PostgreSQL persistence and real-time WebSocket notifications
 */
export class BoardService {
  /** @type {PostgresStorage} PostgreSQL storage instance */
  #storage;

  /** @type {Board} Current board state */
  #board;

  /** @type {Array} Change watchers */
  #watchers;

  /** @type {BoardWebSocketIntegration} WebSocket integration */
  #wsIntegration;

  /**
   * Create a new BoardService
   * @param {PostgresStorage} storage - PostgreSQL storage instance
   * @throws {BoardError} If storage is invalid
   */
  constructor(storage) {
    if (!(storage instanceof PostgresStorage)) {
      throw new BoardError('Storage must be a PostgresStorage instance', 'constructor');
    }

    this.#storage = storage;
    this.#board = null; // Will be loaded on first access
    this.#watchers = [];
    this.#wsIntegration = null;
  }

  /**
   * Set WebSocket integration for real-time updates
   * @param {BoardWebSocketIntegration} wsIntegration - WebSocket integration instance
   */
  setWebSocketIntegration(wsIntegration) {
    this.#wsIntegration = wsIntegration;
    Logger.info('[BoardService] WebSocket integration enabled');
  }

  /**
   * Initialize the service (must be called after constructor)
   * @returns {Promise<void>}
   * @throws {BoardError} If initialization fails
   */
  async initialize() {
    try {
      await this.#storage.initialize();
      await this.#loadBoard();
      Logger.info('[BoardService] Initialized with PostgreSQL storage');
    } catch (error) {
      throw new BoardError(`Failed to initialize BoardService: ${error.message}`, 'initialize');
    }
  }

  /**
   * Get current board (lazy loaded)
   * @returns {Promise<Board>} Current board state
   */
  async getBoard() {
    if (!this.#board) {
      await this.#loadBoard();
    }
    return this.#board;
  }

  /**
   * Load board from PostgreSQL
   * @private
   * @returns {Promise<void>}
   */
  async #loadBoard() {
    try {
      const lanes = await this.#storage.loadTasks();
      this.#board = new Board();
      this.#board.lanes = lanes;
    } catch (error) {
      if (error instanceof BoardError) {
        throw error;
      }
      Logger.error('[BoardService] Failed to load board from PostgreSQL', error);
      this.#board = new Board();
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
        Logger.error(`[BoardService] Watcher error`, e);
      }
    }
  }

  /**
   * Add a task to the board
   * @param {Task} task - Task to add
   * @returns {Promise<Task>} Added task
   * @throws {BoardError} If lane is invalid
   */
  async addTask(task) {
    try {
      // Validate lane before creating task
      if (!Board.VALID_LANES.includes(task.lane)) {
        throw new InvalidLaneError(task.lane, Board.VALID_LANES);
      }

      const createdTask = await this.#storage.createTask(task);

      // Update in-memory board
      await this.#loadBoard();
      this.#notifyWatchers();

      // Notify WebSocket clients
      if (this.#wsIntegration) {
        this.#wsIntegration.notifyTaskCreated(createdTask, '00000000-0000-0000-0000-000000000001');
      }

      return createdTask;
    } catch (error) {
      if (error instanceof InvalidLaneError) {
        throw error;
      }
      throw new BoardError(`Failed to add task: ${error.message}`, 'addTask');
    }
  }

  /**
   * Move a task to a different lane
   * @param {string} taskId - Task ID
   * @param {string} targetLane - Target lane name
   * @returns {Promise<Object>} Moved task
   * @throws {TaskNotFoundError} If task not found
   * @throws {InvalidLaneError} If lane is invalid
   */
  async moveTask(taskId, targetLane) {
    // Validate lane
    if (!Board.VALID_LANES.includes(targetLane)) {
      throw new InvalidLaneError(targetLane, Board.VALID_LANES);
    }

    // Get current task to track lane change
    const currentTask = await this.#getTaskById(taskId);
    const fromLane = currentTask?.lane;

    // Update task lane in database
    const updatedTask = await this.#storage.updateTask(taskId, { lane: targetLane });

    // Reload board and notify watchers
    await this.#loadBoard();
    this.#notifyWatchers();

    // Notify WebSocket clients
    if (this.#wsIntegration) {
      this.#wsIntegration.notifyTaskMoved(updatedTask, fromLane, targetLane, '00000000-0000-0000-0000-000000000001');
    }

    return updatedTask;
  }

  /**
   * Update task properties
   * @param {string} taskId - Task ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} Updated task
   * @throws {TaskNotFoundError} If task not found
   * @throws {BoardError} If update fails
   */
  async updateTask(taskId, updates) {
    // Sanitize updates before applying
    const sanitized = this.#sanitizeUpdates(updates);

    // Update in database
    const updatedTask = await this.#storage.updateTask(taskId, sanitized);

    // Reload board and notify watchers
    await this.#loadBoard();
    this.#notifyWatchers();

    // Notify WebSocket clients
    if (this.#wsIntegration) {
      this.#wsIntegration.notifyTaskUpdated(updatedTask, sanitized, '00000000-0000-0000-0000-000000000001');
    }

    return updatedTask;
  }

  /**
   * Sanitize task updates to prevent injection attacks
   * Uses shared Sanitizer utility for consistent security
   * @private
   * @param {Object} updates - Updates to sanitize
   * @returns {Object} Sanitized updates
   */
  #sanitizeUpdates(updates) {
    const allowedFields = ['title', 'description', 'lane', 'priority', 'status', 'estimatedHours', 'tags'];
    return Sanitizer.sanitizeUpdates(updates, allowedFields);
  }

  /**
   * Get task by ID from current board state
   * @private
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task object or null
   */
  async #getTaskById(taskId) {
    if (!this.#board) {
      await this.#loadBoard();
    }

    // Search through all lanes
    for (const lane of Object.values(this.#board.lanes || {})) {
      const task = lane.find(t => t.id === taskId);
      if (task) {
        return task;
      }
    }

    return null;
  }

  /**
   * Get board statistics
   * @returns {Promise<Object>} Board statistics
   */
  async getStats() {
    return await this.#storage.getStats();
  }

  /**
   * Search tasks by query
   * @param {string} query - Search query
   * @param {string} [lane] - Optional lane filter
   * @returns {Promise<Array>} Matching tasks
   */
  async searchTasks(query, lane) {
    const sanitizedQuery = this.#sanitizeSearchQuery(query);
    return await this.#storage.searchTasks(sanitizedQuery, lane);
  }

  /**
   * Sanitize search query to prevent ReDoS attacks
   * Uses shared Sanitizer utility for consistent security
   * @private
   * @param {string} query - Raw search query
   * @returns {string} Sanitized query
   */
  #sanitizeSearchQuery(query) {
    return Sanitizer.sanitizeQuery(query);
  }

  /**
   * Delete a task
   * @param {string} taskId - Task ID to delete
   * @returns {Promise<boolean>} True if deleted
   * @throws {TaskNotFoundError} If task not found
   */
  async deleteTask(taskId) {
    // Get task before deleting for WebSocket notification
    const taskToDelete = await this.#getTaskById(taskId);

    const deleted = await this.#storage.deleteTask(taskId);

    if (!deleted) {
      throw new TaskNotFoundError(taskId);
    }

    // Reload board and notify watchers
    await this.#loadBoard();
    this.#notifyWatchers();

    // Notify WebSocket clients
    if (this.#wsIntegration) {
      this.#wsIntegration.notifyTaskDeleted(taskId, '00000000-0000-0000-0000-000000000001');
    }

    return true;
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async destroy() {
    // Close database connection
    try {
      await this.#storage.close();
      this.#watchers = [];
    } catch (e) {
      Logger.error('[BoardService] Error during cleanup', e);
    }
  }
}
