/**
 * ============================================================================
 * VIBE STACK - Tool Default Configuration
 * ============================================================================
 * Centralized default values for MCP tools and validation
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Default values for task and board operations
 */
export const TOOL_DEFAULTS = {
  // Lane defaults
  lanes: {
    DEFAULT: 'backlog',
    CREATE_TARGETS: ['backlog', 'todo'],
    ALL: ['backlog', 'todo', 'in_progress', 'done', 'recovery']
  },

  // Priority defaults
  priority: {
    DEFAULT: 'medium',
    ALL: ['low', 'medium', 'high', 'critical']
  },

  // Validation limits
  validation: {
    // Task validation
    MAX_TITLE_LENGTH: 200,
    MIN_TITLE_LENGTH: 1,
    MAX_DESCRIPTION_LENGTH: 5000,
    MAX_ESTIMATED_HOURS: 1000,
    MAX_TAGS: 10,

    // Board validation
    MAX_TASKS_PER_LANE: 100,
    MAX_TOTAL_TASKS: 500,

    // Repository validation
    MAX_REPO_SIZE: 1000000000, // 1GB in bytes
    MAX_FILE_SIZE: 10000000, // 10MB in bytes
    MAX_SEARCH_RESULTS: 100,

    // Command validation
    MAX_COMMAND_TIMEOUT: 120000, // 2 minutes in ms
    MAX_OUTPUT_SIZE: 1000000, // 1MB in bytes

    // API testing validation
    MAX_REDIRECTS: 5,
    MAX_RESPONSE_SIZE: 10000000 // 10MB in bytes
  },

  // Pagination defaults
  pagination: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Timeout defaults
  timeouts: {
    DEFAULT: 30000, // 30 seconds
    QUICK: 5000, // 5 seconds
    LONG: 120000, // 2 minutes
    OPERATION: 60000 // 1 minute
  },

  // Retry defaults
  retry: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_MULTIPLIER: 2
  },

  // Cache defaults
  cache: {
    ENABLED: false,
    TTL: 3600, // 1 hour in seconds
    MAX_SIZE: 100 // Maximum number of cached items
  },

  // File operation defaults
  files: {
    MAX_READ_SIZE: 10000000, // 10MB
    DEFAULT_ENCODING: 'utf-8',
    BACKUP_ENABLED: true,
    BACKUP_RETENTION: 5 // Number of backups to keep
  },

  // Docker defaults
  docker: {
    DEFAULT_IMAGE: 'node:20-alpine',
    DEFAULT_NETWORK: 'vibe-stack',
    CONTAINER_TIMEOUT: 60000, // 1 minute
    LOG_LINES: 100 // Number of log lines to return
  },

  // Git defaults
  git: {
    DEFAULT_BRANCH: 'main',
    COMMIT_MESSAGE_MAX_LENGTH: 200,
    MAX_COMMITS_TO_RETURN: 50,
    DEFAULT_CLONE_DEPTH: 1 // Shallow clone
  },

  // AI planning defaults
  planning: {
    MAX_TASKS: 50,
    DEFAULT_TARGET_LANE: 'backlog',
    ENABLE_PATTERN_DETECTION: true,
    MIN_PATTERN_CONFIDENCE: 0.7,
    DEFAULT_ESTIMATION_HOURS_PER_TASK: 4
  },

  // MCP protocol defaults
  mcp: {
    MAX_TOOL_CALL_SIZE: 10000000, // 10MB
    MAX_RESULT_SIZE: 10000000, // 10MB
    REQUEST_TIMEOUT: 30000, // 30 seconds
    ENABLE_STREAMING: true
  }
};

/**
 * Get a default value by path
 * @param {string} path - Dot notation path (e.g., 'validation.MAX_TITLE_LENGTH')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Default value
 */
export function getDefault(path, defaultValue = null) {
  const parts = path.split('.');
  let current = TOOL_DEFAULTS;

  for (const part of parts) {
    if (current[part] === undefined) {
      return defaultValue;
    }
    current = current[part];
  }

  return current;
}

/**
 * Check if a default value exists
 * @param {string} path - Dot notation path
 * @returns {boolean} True if default exists
 */
export function hasDefault(path) {
  return getDefault(path, null) !== null;
}

/**
 * Validate a value against default constraints
 * @param {string} path - Dot notation path to constraint
 * @param {*} value - Value to validate
 * @returns {Object} Validation result {valid, error}
 */
export function validateAgainstDefault(path, value) {
  const constraint = TOOL_DEFAULTS.validation[path.split('.')[1]];

  if (!constraint) {
    return { valid: true };
  }

  if (path.includes('MAX_') || path.includes('MIN_')) {
    const maxLength = TOOL_DEFAULTS.validation[path];
    if (maxLength && value > maxLength) {
      return {
        valid: false,
        error: `Value exceeds maximum of ${maxLength}`
      };
    }
  }

  return { valid: true };
}

export default TOOL_DEFAULTS;
