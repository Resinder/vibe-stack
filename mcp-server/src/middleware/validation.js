/**
 * ============================================================================
 * VIBE STACK - Input Validation & Sanitization Middleware
 * ============================================================================
 * Comprehensive input validation, sanitization, and security checks
 * @version 1.0.0
 * ============================================================================
 *
 * This module provides a unified interface to all validation utilities.
 * For modular usage, import from specific modules:
 * - taskValidation.js - Task-specific validation
 * - planningValidation.js - Planning-specific validation
 * - inputValidation.js - General input validation
 *
 * Usage:
 *   import { Validator } from './middleware/validation.js';
 *   const validated = Validator.validateTaskData(data);
 *
 * Or import specific validators:
 *   import { TaskValidator } from './middleware/taskValidation.js';
 *   import { PlanningValidator } from './middleware/planningValidation.js';
 *   import { InputValidator } from './middleware/inputValidation.js';
 * ============================================================================
 */

// Re-export all validation utilities for unified access
export { TaskValidator as Validator } from './taskValidation.js';
export { PlanningValidator } from './planningValidation.js';
export { InputValidator } from './inputValidation.js';

// Re-export ValidationError for convenience
export { ValidationError } from '../core/models.js';
