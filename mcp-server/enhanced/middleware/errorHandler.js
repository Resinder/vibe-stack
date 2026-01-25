/**
 * ============================================================================
 * VIBE STACK - Centralized Error Handling
 * ============================================================================
 * Custom error classes and error handling utilities
 * @version 2.0.0
 * ============================================================================
 */

import { ValidationError } from '../core/models.js';

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  /** @type {string} Error code */
  code;

  /** @type {number} HTTP status code */
  statusCode;

  /** @type {Object} Additional error details */
  details;

  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @param {Object} details - Additional details
   */
  constructor(message, code = 'APP_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to MCP response format
   * @returns {Object} MCP error response
   */
  toMCPResponse() {
    return {
      content: [{
        type: 'text',
        text: `[${this.code}] ${this.message}${
          Object.keys(this.details).length > 0
            ? `\nDetails: ${JSON.stringify(this.details, null, 2)}`
            : ''
        }`
      }],
      isError: true
    };
  }

  /**
   * Convert to JSON (sanitized)
   * @returns {Object} Sanitized error object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

/**
 * Task not found error
 */
export class TaskNotFoundError extends AppError {
  /**
   * @param {string} taskId - Task ID that wasn't found
   */
  constructor(taskId) {
    super(
      `Task not found: ${taskId}`,
      'TASK_NOT_FOUND',
      404,
      { taskId }
    );
  }
}

/**
 * Invalid lane error
 */
export class InvalidLaneError extends AppError {
  /**
   * @param {string} lane - Invalid lane name
   * @param {Array} validLanes - List of valid lanes
   */
  constructor(lane, validLanes) {
    super(
      `Invalid lane: ${lane}`,
      'INVALID_LANE',
      400,
      { lane, validLanes }
    );
  }
}

/**
 * Board operation error
 */
export class BoardError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {string} operation - Operation that failed
   */
  constructor(message, operation = 'unknown') {
    super(
      message,
      'BOARD_ERROR',
      500,
      { operation }
    );
  }
}

/**
 * Planning error
 */
export class PlanningError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message) {
    super(
      message,
      'PLANNING_ERROR',
      400,
      {}
    );
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {string} configKey - Configuration key that's invalid
   */
  constructor(message, configKey = null) {
    super(
      message,
      'CONFIGURATION_ERROR',
      500,
      { configKey }
    );
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle an error and return appropriate response
   * @param {Error} error - Error to handle
   * @returns {Object} MCP response
   */
  static handle(error) {
    // Log error for debugging (sanitized)
    ErrorHandler.log(error);

    // Handle known error types
    if (error instanceof AppError) {
      return error.toMCPResponse();
    }

    if (error instanceof ValidationError) {
      return {
        content: [{ type: 'text', text: `Validation Error: ${error.message}` }],
        isError: true
      };
    }

    // Handle unknown errors
    const message = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message;

    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true
    };
  }

  /**
   * Log error (sanitized for security)
   * @param {Error} error - Error to log
   */
  static log(error) {
    const sanitized = {
      name: error.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      statusCode: error.statusCode || 500
    };

    // Use console.error for structured logging
    console.error('[ERROR]', JSON.stringify(sanitized));

    // In development, include stack trace
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @returns {Function} Wrapped function
   */
  static wrap(fn) {
    return function(...args) {
      try {
        const result = fn.apply(this, args);

        // Handle async functions
        if (result && typeof result.then === 'function') {
          return result.catch(error => ErrorHandler.handle(error));
        }

        return result;
      } catch (error) {
        return ErrorHandler.handle(error);
      }
    };
  }

  /**
   * Create a safe error response (hides sensitive data)
   * @param {Error} error - Error to sanitize
   * @returns {Object} Safe error response
   */
  static toSafeResponse(error) {
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && !(error instanceof AppError)) {
      return {
        error: {
          message: 'An internal error occurred',
          code: 'INTERNAL_ERROR'
        }
      };
    }

    return {
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN',
        ...(error.details ? { details: error.details } : {})
      }
    };
  }
}

/**
 * Decorator to add error handling to controller methods
 * @param {Function} target - Class method
 * @param {string} name - Method name
 * @param {Object} descriptor - Property descriptor
 */
export function handleErrors(target, name, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args) {
    try {
      const result = originalMethod.apply(this, args);

      // Handle async methods
      if (result && typeof result.then === 'function') {
        return result.catch(error => ErrorHandler.handle(error));
      }

      return result;
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  };

  return descriptor;
}
