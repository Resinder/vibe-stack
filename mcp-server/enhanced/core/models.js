/**
 * ============================================================================
 * VIBE STACK - Domain Models
 * ============================================================================
 * Core domain models with full validation for type safety
 * @version 2.0.0
 * ============================================================================
 */

import { LANES, PRIORITY } from '../config/constants.js';

/**
 * Task domain model with validation
 * @class Task
 * @description Represents a single task in the Kanban board with full validation
 */
export class Task {
  /** @type {string} Unique task identifier */
  id;

  /** @type {string} Task title (required) */
  title;

  /** @type {string} Detailed description */
  description;

  /** @type {'backlog'|'todo'|'in_progress'|'done'|'recovery'} Current lane */
  lane;

  /** @type {'low'|'medium'|'high'|'critical'} Task priority */
  priority;

  /** @type {string} Task status */
  status;

  /** @type {string[]} Associated tags */
  tags;

  /** @type {string|null} Assigned user */
  assignee;

  /** @type {number|null} Estimated hours */
  estimatedHours;

  /** @type {string} ISO timestamp of creation */
  createdAt;

  /** @type {string} ISO timestamp of last update */
  updatedAt;

  /** @type {Object} Additional metadata */
  metadata;

  /** @type {string[]} Valid lane values */
  static VALID_LANES = LANES.ALL;

  /** @type {string[]} Valid priority values */
  static VALID_PRIORITIES = PRIORITY.ALL;

  /**
   * Create a new Task instance with validation
   * @param {Object} data - Task data
   * @throws {Error} If validation fails
   */
  constructor(data = {}) {
    // Validate required fields
    if (data.title && typeof data.title !== 'string') {
      throw new Error('Task title must be a string');
    }

    // Validate lane
    const lane = data.lane || 'backlog';
    if (!Task.VALID_LANES.includes(lane)) {
      throw new Error(`Invalid lane: ${lane}. Must be one of: ${Task.VALID_LANES.join(', ')}`);
    }

    // Validate priority
    const priority = data.priority || 'medium';
    if (!Task.VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}. Must be one of: ${Task.VALID_PRIORITIES.join(', ')}`);
    }

    // Validate estimatedHours
    if (data.estimatedHours !== undefined && data.estimatedHours !== null) {
      if (typeof data.estimatedHours !== 'number' || data.estimatedHours < 0) {
        throw new Error('estimatedHours must be a non-negative number');
      }
    }

    // Validate tags
    const tags = Array.isArray(data.tags) ? data.tags : [];
    if (!tags.every(t => typeof t === 'string')) {
      throw new Error('All tags must be strings');
    }

    // Assign validated properties
    this.id = data.id || this._generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.lane = lane;
    this.priority = priority;
    this.status = data.status || 'pending';
    this.tags = tags;
    this.assignee = data.assignee || null;
    this.estimatedHours = data.estimatedHours || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = typeof data.metadata === 'object' && data.metadata !== null ? data.metadata : {};
  }

  /**
   * Generate a unique task ID
   * @private
   * @returns {string} Unique identifier
   */
  _generateId() {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Convert task to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return { ...this };
  }

  /**
   * Create Task from plain object
   * @static
   * @param {Object} data - Plain object data
   * @returns {Task} New Task instance
   */
  static fromJSON(data) {
    return new Task(data);
  }
}

/**
 * Board domain model with validation
 * @class Board
 * @description Represents the Kanban board with all lanes and metadata
 */
export class Board {
  /** @type {Object} Lane-based task storage */
  lanes;

  /** @type {Object} Board metadata */
  metadata;

  /** @type {string[]} Valid lane names */
  static VALID_LANES = LANES.ALL;

  /**
   * Create a new Board instance
   * @param {Object} [data={}] - Board data
   * @throws {Error} If validation fails
   */
  constructor(data = {}) {
    // Validate lanes structure
    const inputLanes = data.lanes || {};
    this.lanes = {};

    for (const lane of Board.VALID_LANES) {
      if (inputLanes[lane]) {
        if (!Array.isArray(inputLanes[lane])) {
          throw new Error(`Lane '${lane}' must be an array`);
        }
        this.lanes[lane] = inputLanes[lane];
      } else {
        this.lanes[lane] = [];
      }
    }

    // Set metadata with defaults
    const inputMetadata = data.metadata || {};
    this.metadata = {
      lastSync: inputMetadata.lastSync || new Date().toISOString(),
      version: inputMetadata.version || '2.0.0',
      ...inputMetadata
    };
  }

  /**
   * Add a task to the board
   * @param {Task} task - Task to add
   * @throws {Error} If lane is invalid
   */
  addTask(task) {
    if (!this.lanes[task.lane]) {
      throw new Error(`Invalid lane: ${task.lane}. Must be one of: ${Board.VALID_LANES.join(', ')}`);
    }
    this.lanes[task.lane].push(task.toJSON());
    this.metadata.lastSync = new Date().toISOString();
  }

  /**
   * Get all tasks in a specific lane
   * @param {string} lane - Lane name
   * @returns {Array} Tasks in the lane
   */
  getTasksByLane(lane) {
    return this.lanes[lane] || [];
  }

  /**
   * Get all tasks across all lanes
   * @returns {Array} All tasks
   */
  getAllTasks() {
    return Object.values(this.lanes).flat();
  }

  /**
   * Convert board to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      lanes: this.lanes,
      lastSync: this.metadata.lastSync,
      version: this.metadata.version
    };
  }

  /**
   * Create Board from plain object
   * @static
   * @param {Object} data - Plain object data
   * @returns {Board} New Board instance
   */
  static fromJSON(data) {
    return new Board(data);
  }
}

/**
 * ValidationError for validation failures
 * @class ValidationError
 * @extends Error
 */
export class ValidationError extends Error {
  /** @type {string} Field that failed validation */
  field;

  /** @type {*} Invalid value */
  value;

  /** @type {string} Error code */
  code;

  /**
   * Create a ValidationError
   * @param {string} message - Error message
   * @param {string} [field] - Field that failed validation
   * @param {*} [value] - Invalid value
   */
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.field = field;
    this.value = value;
  }
}
