/**
 * ============================================================================
 * VIBE STACK - Shared Sanitization Utilities
 * ============================================================================
 * Centralized string sanitization to prevent injection attacks and ReDoS
 * @version 1.0.0
 * ============================================================================
 */

import { MAX_LENGTHS, CONTROL_CHARS_REGEX, REGEX_SPECIAL_CHARS } from '../config/validationConstants.js';

/**
 * Shared sanitization utilities for input validation and security
 */
export class Sanitizer {
  /**
   * Maximum safe lengths for various input types
   * @constant {Object}
   */
  static MAX_LENGTHS = MAX_LENGTHS;

  /**
   * Sanitize a string by removing control characters and trimming
   * @param {string} input - Raw input string
   * @param {number} [maxLength=MAX_LENGTHS.string] - Maximum allowed length
   * @returns {string} Sanitized string
   * @throws {TypeError} If input is not a string
   *
   * @example
   * Sanitizer.sanitizeString('  test\\x00string  ', 100); // 'teststring'
   */
  static sanitizeString(input, maxLength = MAX_LENGTHS.string) {
    if (typeof input !== 'string') {
      throw new TypeError(`Input must be a string, got ${typeof input}`);
    }

    // Remove null bytes and control characters (except \t, \n, \r)
    let sanitized = input.replace(CONTROL_CHARS_REGEX, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Enforce max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize an array of strings
   * @param {Array<string>} strings - Array of strings to sanitize
   * @param {number} [maxLength=MAX_LENGTHS.string] - Maximum length per string
   * @returns {Array<string>} Sanitized array with empty strings filtered out
   * @throws {TypeError} If input is not an array
   *
   * @example
   * Sanitizer.sanitizeArray(['tag1', 'tag\\x00', '', 'tag3']); // ['tag1', 'tag', 'tag3']
   */
  static sanitizeArray(strings, maxLength = MAX_LENGTHS.string) {
    if (!Array.isArray(strings)) {
      throw new TypeError(`Input must be an array, got ${typeof strings}`);
    }

    return strings
      .filter(item => typeof item === 'string')
      .map(item => this.sanitizeString(item, maxLength))
      .filter(item => item.length > 0);
  }

  /**
   * Sanitize a search query to prevent ReDoS attacks
   * @param {string} query - Raw search query
   * @param {number} [maxLength=MAX_LENGTHS.query] - Maximum allowed length
   * @returns {string} Sanitized and lowercased query
   * @throws {TypeError} If input is not a string
   *
   * @example
   * Sanitizer.sanitizeQuery('(.*){100}'); // '\\(\\.\\*\\)\\{100\\}'
   */
  static sanitizeQuery(query, maxLength = MAX_LENGTHS.query) {
    if (typeof query !== 'string') {
      throw new TypeError(`Query must be a string, got ${typeof query}`);
    }

    // First sanitize as a normal string
    const sanitized = this.sanitizeString(query, maxLength);

    // Escape regex special characters to prevent ReDoS
    return sanitized.replace(REGEX_SPECIAL_CHARS, '\\$&').toLowerCase();
  }

  /**
   * Sanitize a file path to prevent path traversal attacks
   * @param {string} filePath - File path to sanitize
   * @param {number} [maxLength=MAX_LENGTHS.filePath] - Maximum allowed length
   * @returns {string} Sanitized file path
   * @throws {TypeError} If input is not a string
   * @throws {Error} If path contains traversal attempts
   *
   * @example
   * Sanitizer.sanitizePath('/etc/passwd'); // '/etc/passwd'
   * Sanitizer.sanitizePath('../../../etc/passwd'); // Throws error
   */
  static sanitizePath(filePath, maxLength = MAX_LENGTHS.filePath) {
    if (typeof filePath !== 'string') {
      throw new TypeError(`Path must be a string, got ${typeof filePath}`);
    }

    // Remove null bytes
    const sanitized = filePath.replace(/\0/g, '');

    // Check for path traversal attempts
    if (sanitized.includes('..') || sanitized.includes('~')) {
      throw new Error('Path traversal detected');
    }

    // Trim and enforce length
    return sanitized.trim().substring(0, maxLength);
  }

  /**
   * Sanitize task updates object
   * @param {Object} updates - Updates object to sanitize
   * @param {Array<string>} allowedFields - List of allowed field names
   * @returns {Object} Sanitized updates object
   *
   * @example
   * const sanitized = Sanitizer.sanitizeUpdates(
   *   { title: 'Test\\x00', priority: 'high', invalid: 'value' },
   *   ['title', 'priority']
   * );
   * // { title: 'Test', priority: 'high' }
   */
  static sanitizeUpdates(updates, allowedFields) {
    const sanitized = {};

    for (const [key, value] of Object.entries(updates)) {
      // Only allow known fields
      if (!allowedFields.includes(key)) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      }
      // Sanitize arrays
      else if (Array.isArray(value)) {
        sanitized[key] = this.sanitizeArray(value);
      }
      // Allow numbers and booleans as-is
      else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
      // Reject objects and null
      else {
        continue;
      }
    }

    return sanitized;
  }

  /**
   * Validate that a value is within a numeric range
   * @param {number} value - Value to validate
   * @param {string} fieldName - Field name for error messages
   * @param {number} [min=0] - Minimum value (inclusive)
   * @param {number} [max=Number.MAX_SAFE_INTEGER] - Maximum value (inclusive)
   * @returns {number} Validated number
   * @throws {TypeError} If value is not a number
   * @throws {RangeError} If value is out of range
   *
   * @example
   * Sanitizer.validateNumberRange(5, 'hours', 0, 24); // 5
   * Sanitizer.validateNumberRange(-1, 'hours', 0, 24); // Throws RangeError
   */
  static validateNumberRange(value, fieldName, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const numValue = Number(value);

    if (isNaN(numValue)) {
      throw new TypeError(`${fieldName} must be a number`);
    }

    if (numValue < min || numValue > max) {
      throw new RangeError(`${fieldName} must be between ${min} and ${max}`);
    }

    return numValue;
  }

  /**
   * Validate and normalize an enum value
   * @param {string} value - Value to validate
   * @param {Array<string>} allowedValues - Array of allowed values
   * @param {string} enumName - Name of the enum for error messages
   * @returns {string} Normalized (lowercased) value
   * @throws {TypeError} If value is not a string
   * @throws {Error} If value is not in allowed values
   *
   * @example
   * Sanitizer.validateEnum('HIGH', ['low', 'medium', 'high'], 'priority');
   * // 'high'
   */
  static validateEnum(value, allowedValues, enumName) {
    if (typeof value !== 'string') {
      throw new TypeError(`${enumName} must be a string`);
    }

    const normalized = value.toLowerCase();

    if (!allowedValues.includes(normalized)) {
      throw new Error(
        `Invalid ${enumName}: ${value}. Must be one of: ${allowedValues.join(', ')}`
      );
    }

    return normalized;
  }

  /**
   * Generate searchable content from a task object
   * @param {Object} task - Task object
   * @returns {string} Lowercase searchable content
   *
   * @example
   * const task = { title: 'Test', description: 'Desc', tags: ['tag1', 'tag2'] };
   * Sanitizer.generateSearchContent(task);
   * // 'test desc tag1 tag2'
   */
  static generateSearchContent(task) {
    const title = task.title || '';
    const description = task.description || '';
    const tags = (task.tags || []).join(' ');

    return `${title} ${description} ${tags}`.toLowerCase();
  }

  /**
   * Check if a value is a non-empty object
   * @param {*} value - Value to check
   * @param {string} [fieldName='value'] - Field name for error messages
   * @returns {Object} The validated object
   * @throws {TypeError} If value is not an object or is an array
   *
   * @example
   * Sanitizer.validateObject({ key: 'value' }); // { key: 'value' }
   * Sanitizer.validateObject(null); // Throws TypeError
   * Sanitizer.validateObject([1, 2, 3]); // Throws TypeError
   */
  static validateObject(value, fieldName = 'value') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`${fieldName} must be an object`);
    }

    return value;
  }

  /**
   * Validate that a required string field is present and non-empty
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error messages
   * @param {number} [maxLength=MAX_LENGTHS.string] - Maximum allowed length
   * @returns {string} Sanitized string
   * @throws {TypeError} If value is not a string
   * @throws {Error} If value is empty after sanitization
   *
   * @example
   * Sanitizer.validateRequiredString('  test  ', 'title'); // 'test'
   * Sanitizer.validateRequiredString('', 'title'); // Throws Error
   */
  static validateRequiredString(value, fieldName, maxLength = MAX_LENGTHS.string) {
    if (!value || typeof value !== 'string') {
      throw new TypeError(`${fieldName} is required and must be a string`);
    }

    const sanitized = this.sanitizeString(value, maxLength);

    if (sanitized.length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }

    return sanitized;
  }

  /**
   * Validate an array of items
   * @param {Array} items - Items to validate
   * @param {string} itemName - Name of the item for error messages
   * @param {number} [maxItems=100] - Maximum number of items allowed
   * @returns {Array} Validated array
   * @throws {TypeError} If items is not an array
   * @throws {Error} If array is empty or exceeds max size
   *
   * @example
   * Sanitizer.validateArray([1, 2, 3], 'tasks', 10); // [1, 2, 3]
   * Sanitizer.validateArray([], 'tasks'); // Throws Error
   * Sanitizer.validateArray(new Array(101).fill(0), 'tasks', 100); // Throws Error
   */
  static validateArray(items, itemName, maxItems = 100) {
    if (!Array.isArray(items)) {
      throw new TypeError(`${itemName} must be an array`);
    }

    if (items.length === 0) {
      throw new Error(`${itemName} array cannot be empty`);
    }

    if (items.length > maxItems) {
      throw new Error(`Cannot have more than ${maxItems} ${itemName}`);
    }

    return items;
  }
}
