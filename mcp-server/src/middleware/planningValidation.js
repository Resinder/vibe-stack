/**
 * ============================================================================
 * VIBE STACK - Planning Input Validation
 * ============================================================================
 * Planning-specific validation and sanitization
 * @version 1.0.0
 * ============================================================================
 */

import { ValidationError } from '../core/models.js';
import { TaskValidator } from './taskValidation.js';

/**
 * Maximum lengths for planning inputs
 * @constant {Object}
 */
const MAX_LENGTHS = {
  goal: 1000,
  context: 2000,
  query: 500
};

/**
 * Planning-specific validation utilities
 */
export class PlanningValidator extends TaskValidator {
  /**
   * Maximum lengths for planning inputs
   * @constant {Object}
   */
  static MAX_LENGTHS = MAX_LENGTHS;

  /**
   * Validate goal input for planning
   * @param {string} goal - Goal to validate
   * @returns {string} Validated goal
   * @throws {ValidationError} If validation fails
   */
  static validateGoal(goal) {
    if (!goal || typeof goal !== 'string') {
      throw new ValidationError('Goal is required and must be a string');
    }

    const sanitized = this.sanitizeString(goal, MAX_LENGTHS.goal);

    if (sanitized.length === 0) {
      throw new ValidationError('Goal cannot be empty');
    }

    return sanitized;
  }

  /**
   * Validate context input for planning
   * @param {string} context - Context to validate
   * @returns {string} Validated context
   * @throws {ValidationError} If validation fails
   */
  static validateContext(context) {
    if (context === undefined || context === null) {
      return '';
    }

    if (typeof context !== 'string') {
      throw new ValidationError('Context must be a string');
    }

    return this.sanitizeString(context, MAX_LENGTHS.context);
  }

  /**
   * Validate search query
   * @param {string} query - Query to validate
   * @returns {string} Validated query
   * @throws {ValidationError} If validation fails
   */
  static validateQuery(query) {
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Query is required and must be a string');
    }

    const sanitized = this.sanitizeString(query, MAX_LENGTHS.query);

    if (sanitized.length === 0) {
      throw new ValidationError('Query cannot be empty');
    }

    return sanitized;
  }

  /**
   * Validate plan generation parameters
   * @param {Object} args - Arguments to validate
   * @returns {Object} Validated arguments
   * @throws {ValidationError} If validation fails
   */
  static validatePlanGeneration(args) {
    if (!args || typeof args !== 'object') {
      throw new ValidationError('Plan arguments must be an object');
    }

    const validated = {};

    // Validate required goal
    validated.goal = this.validateGoal(args.goal);

    // Validate optional context
    if (args.context !== undefined) {
      validated.context = this.validateContext(args.context);
    } else {
      validated.context = '';
    }

    // Validate target lane
    if (args.targetLane !== undefined) {
      validated.targetLane = this.validateLane(args.targetLane);
    } else {
      validated.targetLane = 'backlog';
    }

    return validated;
  }

  /**
   * Validate goal analysis parameters
   * @param {Object} args - Arguments to validate
   * @returns {Object} Validated arguments
   * @throws {ValidationError} If validation fails
   */
  static validateGoalAnalysis(args) {
    if (!args || typeof args !== 'object') {
      throw new ValidationError('Analysis arguments must be an object');
    }

    return {
      goal: this.validateGoal(args.goal)
    };
  }
}
