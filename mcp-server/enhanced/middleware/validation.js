/**
 * ============================================================================
 * VIBE STACK - Input Validation & Sanitization Middleware
 * ============================================================================
 * Comprehensive input validation, sanitization, and security checks
 * @version 2.0.0
 * ============================================================================
 */

import { ValidationError } from '../core/models.js';
import path from 'path';

/**
 * Validation and sanitization utilities
 */
export class Validator {
  /**
   * Maximum lengths for inputs
   */
  static MAX_LENGTHS = {
    title: 200,
    description: 5000,
    tags: 100,
    taskId: 50,
    goal: 1000,
    context: 2000,
    query: 500
  };

  /**
   * Valid lanes
   */
  static VALID_LANES = ['backlog', 'todo', 'in_progress', 'done', 'recovery'];

  /**
   * Valid priorities
   */
  static VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

  /**
   * Sanitize a string input
   * @param {string} input - Raw input
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized string
   */
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }

    // Remove null bytes and control characters (except newline, tab, carriage return)
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Enforce max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize and validate a task ID
   * @param {string} taskId - Task ID to validate
   * @returns {string} Validated task ID
   */
  static validateTaskId(taskId) {
    if (!taskId || typeof taskId !== 'string') {
      throw new ValidationError('Task ID is required and must be a string');
    }

    const sanitized = this.sanitizeString(taskId, this.MAX_LENGTHS.taskId);

    // Task ID should be alphanumeric with hyphens, underscores, and common UUID format
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      throw new ValidationError('Invalid task ID format');
    }

    return sanitized;
  }

  /**
   * Validate a lane name
   * @param {string} lane - Lane to validate
   * @returns {string} Validated lane
   */
  static validateLane(lane) {
    if (!lane || typeof lane !== 'string') {
      throw new ValidationError('Lane is required and must be a string');
    }

    const sanitized = this.sanitizeString(lane, 50).toLowerCase();

    if (!this.VALID_LANES.includes(sanitized)) {
      throw new ValidationError(
        `Invalid lane: ${lane}. Must be one of: ${this.VALID_LANES.join(', ')}`
      );
    }

    return sanitized;
  }

  /**
   * Validate a priority
   * @param {string} priority - Priority to validate
   * @returns {string} Validated priority
   */
  static validatePriority(priority) {
    if (!priority || typeof priority !== 'string') {
      throw new ValidationError('Priority is required and must be a string');
    }

    const sanitized = this.sanitizeString(priority, 20).toLowerCase();

    if (!this.VALID_PRIORITIES.includes(sanitized)) {
      throw new ValidationError(
        `Invalid priority: ${priority}. Must be one of: ${this.VALID_PRIORITIES.join(', ')}`
      );
    }

    return sanitized;
  }

  /**
   * Validate and sanitize task data
   * @param {Object} data - Task data to validate
   * @returns {Object} Validated task data
   */
  static validateTaskData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Task data must be an object');
    }

    const validated = {};

    // Validate title (required)
    if (data.title) {
      validated.title = this.sanitizeString(data.title, this.MAX_LENGTHS.title);
      if (validated.title.length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
    } else {
      throw new ValidationError('Title is required');
    }

    // Validate optional fields
    if (data.description !== undefined) {
      validated.description = this.sanitizeString(data.description, this.MAX_LENGTHS.description);
    }

    if (data.lane !== undefined) {
      validated.lane = this.validateLane(data.lane);
    }

    if (data.priority !== undefined) {
      validated.priority = this.validatePriority(data.priority);
    }

    if (data.estimatedHours !== undefined) {
      const hours = Number(data.estimatedHours);
      if (isNaN(hours) || hours < 0 || hours > 1000) {
        throw new ValidationError('Estimated hours must be a number between 0 and 1000');
      }
      validated.estimatedHours = hours;
    }

    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        throw new ValidationError('Tags must be an array');
      }
      validated.tags = data.tags
        .filter(tag => typeof tag === 'string')
        .map(tag => this.sanitizeString(tag, this.MAX_LENGTHS.tags))
        .filter(tag => tag.length > 0);
    }

    return validated;
  }

  /**
   * Validate task update data
   * @param {Object} data - Update data to validate
   * @returns {Object} Validated update data
   */
  static validateTaskUpdate(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Update data must be an object');
    }

    const validated = {};

    // All fields are optional for updates
    if (data.title !== undefined) {
      validated.title = this.sanitizeString(data.title, this.MAX_LENGTHS.title);
      if (validated.title.length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
    }

    if (data.description !== undefined) {
      validated.description = this.sanitizeString(data.description, this.MAX_LENGTHS.description);
    }

    if (data.lane !== undefined) {
      validated.lane = this.validateLane(data.lane);
    }

    if (data.priority !== undefined) {
      validated.priority = this.validatePriority(data.priority);
    }

    if (data.estimatedHours !== undefined) {
      const hours = Number(data.estimatedHours);
      if (isNaN(hours) || hours < 0 || hours > 1000) {
        throw new ValidationError('Estimated hours must be a number between 0 and 1000');
      }
      validated.estimatedHours = hours;
    }

    if (data.status !== undefined) {
      validated.status = this.sanitizeString(data.status, 50);
    }

    return validated;
  }

  /**
   * Validate goal input for planning
   * @param {string} goal - Goal to validate
   * @returns {string} Validated goal
   */
  static validateGoal(goal) {
    if (!goal || typeof goal !== 'string') {
      throw new ValidationError('Goal is required and must be a string');
    }

    const sanitized = this.sanitizeString(goal, this.MAX_LENGTHS.goal);

    if (sanitized.length === 0) {
      throw new ValidationError('Goal cannot be empty');
    }

    return sanitized;
  }

  /**
   * Validate context input for planning
   * @param {string} context - Context to validate
   * @returns {string} Validated context
   */
  static validateContext(context) {
    if (context === undefined || context === null) {
      return '';
    }

    if (typeof context !== 'string') {
      throw new ValidationError('Context must be a string');
    }

    return this.sanitizeString(context, this.MAX_LENGTHS.context);
  }

  /**
   * Validate search query
   * @param {string} query - Query to validate
   * @returns {string} Validated query
   */
  static validateQuery(query) {
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string');
    }

    const sanitized = this.sanitizeString(query, this.MAX_LENGTHS.query);

    if (sanitized.length === 0) {
      throw new ValidationError('Query cannot be empty');
    }

    return sanitized;
  }

  /**
   * Validate batch tasks array
   * @param {Array} tasks - Tasks array to validate
   * @returns {Array} Validated tasks array
   */
  static validateBatchTasks(tasks) {
    if (!Array.isArray(tasks)) {
      throw new ValidationError('Tasks must be an array');
    }

    if (tasks.length === 0) {
      throw new ValidationError('Tasks array cannot be empty');
    }

    if (tasks.length > 100) {
      throw new ValidationError('Cannot create more than 100 tasks at once');
    }

    return tasks.map((task, index) => {
      try {
        return this.validateTaskData(task);
      } catch (error) {
        throw new ValidationError(`Task at index ${index}: ${error.message}`);
      }
    });
  }

  /**
   * Validate file path for security (prevent path traversal)
   * @param {string} filePath - Path to validate
   * @param {string} [allowedBaseDir] - Optional base directory to restrict to
   * @returns {string} Validated and normalized path
   */
  static validateFilePath(filePath, allowedBaseDir = null) {
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path is required');
    }

    // Remove null bytes
    const sanitized = filePath.replace(/\0/g, '');

    // Check for path traversal attempts
    if (sanitized.includes('..') || sanitized.includes('~')) {
      throw new ValidationError('Path traversal detected');
    }

    // If base directory is specified, ensure path is within it
    if (allowedBaseDir) {
      const resolved = path.resolve(allowedBaseDir, sanitized);
      if (!resolved.startsWith(allowedBaseDir)) {
        throw new ValidationError('Path is outside allowed directory');
      }
      return resolved;
    }

    return sanitized;
  }
}

/**
 * Create a validation wrapper for controller methods
 * @param {Function} validator - Validation function
 * @param {Function} handler - Handler function
 * @returns {Function} Wrapped handler
 */
export function withValidation(validator, handler) {
  return function(args) {
    try {
      const validated = validator(args);
      return handler(validated);
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          content: [{ type: 'text', text: `Validation Error: ${error.message}` }],
          isError: true
        };
      }
      throw error;
    }
  };
}
