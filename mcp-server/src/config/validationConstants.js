/**
 * ============================================================================
 * VIBE STACK - Validation Constants
 * ============================================================================
 * Shared validation constants across all validators
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Maximum length constraints for various input types
 * @constant {Object}
 */
export const MAX_LENGTHS = {
  /** General string inputs */
  string: 1000,

  /** Task-specific fields */
  title: 200,
  description: 5000,
  taskId: 50,
  tags: 100,

  /** Planning-specific fields */
  goal: 1000,
  context: 2000,
  query: 500,

  /** File paths */
  filePath: 500,

  /** Estimated hours */
  estimatedHours: 1000,

  /** Number of items in batch operations */
  batchMax: 100
};

/**
 * Validation constraints
 * @constant {Object}
 */
export const CONSTRAINTS = {
  /** Minimum value for estimated hours */
  MIN_ESTIMATED_HOURS: 0,

  /** Maximum value for estimated hours */
  MAX_ESTIMATED_HOURS: 1000,

  /** Maximum number of tasks in batch */
  MAX_BATCH_SIZE: 100,

  /** Maximum query length */
  MAX_QUERY_LENGTH: 500
};

/**
 * Control character removal regex
 * Removes null bytes and most control characters, but preserves:
 * - \t (tab, 0x09)
 * - \n (newline, 0x0A)
 * - \r (carriage return, 0x0D)
 * @constant {RegExp}
 */
export const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Regex special characters that need escaping for ReDoS prevention
 * @constant {RegExp}
 */
export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Allowed fields for task updates
 * @constant {Array<string>}
 */
export const ALLOWED_TASK_FIELDS = [
  'title',
  'description',
  'lane',
  'priority',
  'status',
  'estimatedHours',
  'tags'
];

/**
 * Valid webhook event types
 * @constant {Array<string>}
 */
export const VALID_WEBHOOK_EVENTS = [
  'task.created',
  'task.updated',
  'task.moved',
  'task.deleted',
  'board.changed',
  'plan.generated'
];
