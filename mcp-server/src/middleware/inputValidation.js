/**
 * ============================================================================
 * VIBE STACK - General Input Validation
 * ============================================================================
 * General input sanitization and validation utilities
 * Uses shared Sanitizer for consistent security
 * @version 1.0.0
 * ============================================================================
 */

import { ValidationError } from '../core/models.js';
import { TaskValidator } from './taskValidation.js';
import { Sanitizer } from '../utils/sanitizer.js';
import path from 'path';

/**
 * General input validation utilities
 * Extends TaskValidator with shared sanitization capabilities
 */
export class InputValidator extends TaskValidator {
  /**
   * Validate and sanitize file path for security
   * Enhanced with path normalization and base directory enforcement
   * @param {string} filePath - Path to validate
   * @param {string} [allowedBaseDir] - Optional base directory to restrict to
   * @returns {string} Validated and normalized path
   * @throws {ValidationError} If path is invalid
   */
  static validateFilePath(filePath, allowedBaseDir = null) {
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path is required');
    }

    // Use shared sanitizer for basic sanitization
    let sanitized;
    try {
      sanitized = Sanitizer.sanitizePath(filePath);
    } catch (error) {
      // Convert generic Error to ValidationError
      throw new ValidationError(error.message);
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

  /**
   * Sanitize a string input
   * Delegates to shared Sanitizer utility
   * @param {string} input - Raw input
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized string
   * @throws {ValidationError} If input is not a string
   */
  static sanitizeString(input, maxLength) {
    try {
      return Sanitizer.sanitizeString(input, maxLength);
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }

  /**
   * Validate a non-empty string
   * Delegates to shared Sanitizer utility
   * @param {string} input - Input to validate
   * @param {string} fieldName - Name of the field for error messages
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Validated string
   * @throws {ValidationError} If validation fails
   */
  static validateNonEmptyString(input, fieldName, maxLength) {
    try {
      return Sanitizer.validateRequiredString(input, fieldName, maxLength);
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }

  /**
   * Validate an array of items
   * Delegates to shared Sanitizer utility
   * @param {Array} items - Items to validate
   * @param {string} itemName - Name of the item for error messages
   * @param {number} maxItems - Maximum number of items allowed
   * @returns {Array} Validated array
   * @throws {ValidationError} If validation fails
   */
  static validateArray(items, itemName, maxItems = 100) {
    try {
      return Sanitizer.validateArray(items, itemName, maxItems);
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }

  /**
   * Validate a number within range
   * Delegates to shared Sanitizer utility
   * @param {number} value - Value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Validated number
   * @throws {ValidationError} If validation fails
   */
  static validateNumberRange(value, fieldName, min = 0, max = Number.MAX_SAFE_INTEGER) {
    try {
      return Sanitizer.validateNumberRange(value, fieldName, min, max);
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }

  /**
   * Validate an object type
   * Delegates to shared Sanitizer utility
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @returns {Object} Validated object
   * @throws {ValidationError} If validation fails
   */
  static validateObject(value, fieldName) {
    try {
      return Sanitizer.validateObject(value, fieldName);
    } catch (error) {
      throw new ValidationError(error.message);
    }
  }
}
