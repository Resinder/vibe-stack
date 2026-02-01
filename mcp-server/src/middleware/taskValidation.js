/**
 * ============================================================================
 * VIBE STACK - Task Input Validation
 * ============================================================================
 * Task-specific validation and sanitization
 * @version 1.0.0
 * ============================================================================
 */

import { ValidationError } from '../core/models.js';
import { LANES, PRIORITY } from '../config/constants.js';
import { MAX_LENGTHS, CONSTRAINTS } from '../config/validationConstants.js';
import { Sanitizer } from '../utils/sanitizer.js';

/**
 * Task-specific validation utilities
 */
export class TaskValidator {
  /**
   * Valid lanes
   * @constant {Array<string>}
   */
  static VALID_LANES = LANES.ALL;

  /**
   * Valid priorities
   * @constant {Array<string>}
   */
  static VALID_PRIORITIES = PRIORITY.ALL;

  /**
   * Maximum lengths (imported from validationConstants)
   * @constant {Object}
   */
  static MAX_LENGTHS = MAX_LENGTHS;

  /**
   * Validation constraints (imported from validationConstants)
   * @constant {Object}
   */
  static CONSTRAINTS = CONSTRAINTS;

  /**
   * Sanitize and validate a task ID
   * @param {string} taskId - Task ID to validate
   * @returns {string} Validated task ID
   * @throws {ValidationError} If task ID is invalid
   */
  static validateTaskId(taskId) {
    if (!taskId || typeof taskId !== 'string') {
      throw new ValidationError('Task ID is required and must be a string');
    }

    const sanitized = this.sanitizeString(taskId, MAX_LENGTHS.taskId);

    // Task ID should be alphanumeric with hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      throw new ValidationError('Invalid task ID format');
    }

    return sanitized;
  }

  /**
   * Validate a lane name
   * @param {string} lane - Lane to validate
   * @returns {string} Validated lane
   * @throws {ValidationError} If lane is invalid
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
   * @throws {ValidationError} If priority is invalid
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
   * Validate estimated hours
   * @param {number} hours - Hours to validate
   * @returns {number} Validated hours
   * @throws {ValidationError} If hours are invalid
   */
  static validateEstimatedHours(hours) {
    if (hours === undefined || hours === null) {
      return null;
    }

    const numHours = Number(hours);
    if (isNaN(numHours) || numHours < 0 || numHours > MAX_LENGTHS.estimatedHours) {
      throw new ValidationError(`Estimated hours must be between 0 and ${MAX_LENGTHS.estimatedHours}`);
    }

    return numHours;
  }

  /**
   * Validate tags array
   * @param {Array} tags - Tags to validate
   * @returns {Array} Validated tags
   * @throws {ValidationError} If tags are invalid
   */
  static validateTags(tags) {
    if (tags === undefined || tags === null) {
      return [];
    }

    if (!Array.isArray(tags)) {
      throw new ValidationError('Tags must be an array');
    }

    return tags
      .filter(tag => typeof tag === 'string')
      .map(tag => this.sanitizeString(tag, MAX_LENGTHS.tags))
      .filter(tag => tag.length > 0);
  }

  /**
   * Sanitize a string input (delegates to Sanitizer utility)
   * @param {string} input - Raw input
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized string
   * @throws {ValidationError} If input is not a string
   */
  static sanitizeString(input, maxLength = 1000) {
    try {
      // Delegate to centralized Sanitizer utility
      return Sanitizer.sanitizeString(input, maxLength);
    } catch (error) {
      // Convert TypeError to ValidationError for consistency
      if (error instanceof TypeError) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Validate and sanitize task data
   * @param {Object} data - Task data to validate
   * @returns {Object} Validated task data
   * @throws {ValidationError} If validation fails
   */
  static validateTaskData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Task data must be an object');
    }

    const validated = {};

    // Validate title (required)
    if (data.title) {
      validated.title = this.sanitizeString(data.title, MAX_LENGTHS.title);
      if (validated.title.length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
    } else {
      throw new ValidationError('Title is required');
    }

    // Validate optional fields
    if (data.description !== undefined) {
      validated.description = this.sanitizeString(data.description, MAX_LENGTHS.description);
    }

    if (data.lane !== undefined) {
      validated.lane = this.validateLane(data.lane);
    }

    if (data.priority !== undefined) {
      validated.priority = this.validatePriority(data.priority);
    }

    if (data.estimatedHours !== undefined) {
      validated.estimatedHours = this.validateEstimatedHours(data.estimatedHours);
    }

    if (data.tags !== undefined) {
      validated.tags = this.validateTags(data.tags);
    }

    return validated;
  }

  /**
   * Validate task update data
   * @param {Object} data - Update data to validate
   * @returns {Object} Validated update data
   * @throws {ValidationError} If validation fails
   */
  static validateTaskUpdate(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Update data must be an object');
    }

    const validated = {};

    // All fields are optional for updates
    if (data.title !== undefined) {
      validated.title = this.sanitizeString(data.title, MAX_LENGTHS.title);
      if (validated.title.length === 0) {
        throw new ValidationError('Title cannot be empty');
      }
    }

    if (data.description !== undefined) {
      validated.description = this.sanitizeString(data.description, MAX_LENGTHS.description);
    }

    if (data.lane !== undefined) {
      validated.lane = this.validateLane(data.lane);
    }

    if (data.priority !== undefined) {
      validated.priority = this.validatePriority(data.priority);
    }

    if (data.estimatedHours !== undefined) {
      validated.estimatedHours = this.validateEstimatedHours(data.estimatedHours);
    }

    if (data.status !== undefined) {
      validated.status = this.sanitizeString(data.status, 50);
    }

    if (data.tags !== undefined) {
      validated.tags = this.validateTags(data.tags);
    }

    return validated;
  }

  /**
   * Validate batch tasks array
   * @param {Array} tasks - Tasks array to validate
   * @returns {Array} Validated tasks array
   * @throws {ValidationError} If validation fails
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
}
