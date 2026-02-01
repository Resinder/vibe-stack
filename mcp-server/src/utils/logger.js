/**
 * ============================================================================
 * VIBE STACK - Logging Utility
 * ============================================================================
 * Structured logging with log levels, request tracing, and configurable output
 * @version 1.0.0 - Added request tracing and structured logging
 * ============================================================================
 */

/**
 * Log levels in order of severity
 * @constant {Object}
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Current log level (can be configured via environment)
 * @type {number}
 */
let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Request context storage for distributed tracing
 * @type {Map}
 */
const requestContextStore = new Map();

/**
 * Generate a unique request ID
 * @returns {string} UUID-like request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ANSI color codes for terminal output
 * @constant {Object}
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m'
};

/**
 * Format timestamp for log entries
 * @returns {string} ISO timestamp with milliseconds
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Colorize text for terminal output
 * @param {string} text - Text to colorize
 * @param {string} color - Color name from COLORS
 * @returns {string} Colorized text
 */
function colorize(text, color) {
  // Only colorize in TTY environment (not when output is redirected)
  if (process.stdout.isTTY) {
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }
  return text;
}

/**
 * Format log entry with timestamp, level, and context
 * @param {string} level - Log level name
 * @param {string} message - Log message
 * @param {Object} context - Additional context data
 * @param {string} color - Color for the level indicator
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, message, context = null, color = 'reset') {
  const timestamp = getTimestamp();
  const levelTag = colorize(`[${level}]`, color);

  if (context && Object.keys(context).length > 0) {
    return `${levelTag} ${timestamp} ${message} ${JSON.stringify(context)}`;
  }

  return `${levelTag} ${timestamp} ${message}`;
}

/**
 * Logger class with static methods for different log levels
 */
export class Logger {
  /**
   * Set the minimum log level
   * @param {string} level - Log level name (ERROR, WARN, INFO, DEBUG)
   * @throws {Error} If level is invalid
   *
   * @example
   * Logger.setLevel('DEBUG'); // Enable all logs
   * Logger.setLevel('ERROR'); // Only show errors
   */
  static setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (!(upperLevel in LOG_LEVELS)) {
      throw new Error(`Invalid log level: ${level}. Must be one of: ${Object.keys(LOG_LEVELS).join(', ')}`);
    }
    currentLogLevel = LOG_LEVELS[upperLevel];
  }

  /**
   * Get the current log level
   * @returns {string} Current log level name
   */
  static getLevel() {
    return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel);
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Object|Error} context - Additional context or Error object
   *
   * @example
   * Logger.error('Failed to connect to database', { host: 'localhost' });
   * Logger.error('Connection failed', new Error('ECONNREFUSED'));
   */
  static error(message, context = null) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      const output = context instanceof Error
        ? formatLogEntry('ERROR', message, {
            message: context.message,
            stack: context.stack
          }, 'red')
        : formatLogEntry('ERROR', message, context, 'red');

      console.error(output);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   *
   * @example
   * Logger.warn('Deprecated API usage', { endpoint: '/v1/old' });
   */
  static warn(message, context = null) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLogEntry('WARN', message, context, 'yellow'));
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   *
   * @example
   * Logger.info('Server started', { port: 3000 });
   */
  static info(message, context = null) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatLogEntry('INFO', message, context, 'green'));
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   *
   * @example
   * Logger.debug('Processing request', { userId: 123 });
   */
  static debug(message, context = null) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatLogEntry('DEBUG', message, context, 'gray'));
    }
  }

  /**
   * Log a startup message (always shown, used for initialization)
   * @param {string} message - Startup message
   * @param {Object} context - Additional context
   *
   * @example
   * Logger.startup('MCP Server v1.0.0 initializing...');
   */
  static startup(message, context = null) {
    const timestamp = getTimestamp();
    const tag = colorize('[STARTUP]', 'cyan');

    if (context && Object.keys(context).length > 0) {
      console.log(`${tag} ${timestamp} ${message} ${JSON.stringify(context)}`);
    } else {
      console.log(`${tag} ${timestamp} ${message}`);
    }
  }

  /**
   * Create a context-specific logger
   * @param {string} context - Context prefix for all log messages
   * @returns {Object} Logger with bound context
   *
   * @example
   * const log = Logger.withContext('BoardService');
   * log.info('Initialized'); // [INFO] timestamp [BoardService] Initialized
   */
  static withContext(context) {
    return {
      error: (message, data = null) => Logger.error(`[${context}] ${message}`, data),
      warn: (message, data = null) => Logger.warn(`[${context}] ${message}`, data),
      info: (message, data = null) => Logger.info(`[${context}] ${message}`, data),
      debug: (message, data = null) => Logger.debug(`[${context}] ${message}`, data)
    };
  }

  /**
   * Initialize logger from environment variables
   * Reads LOG_LEVEL environment variable and sets log level accordingly
   *
   * @example
   * Logger.initFromEnv(); // Uses process.env.LOG_LEVEL
   */
  static initFromEnv() {
    const envLevel = process.env.LOG_LEVEL || process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';
    try {
      Logger.setLevel(envLevel);
    } catch {
      // If invalid, default to INFO
      Logger.setLevel('INFO');
    }
  }

  /**
   * Create a request-scoped logger with distributed tracing
   * @param {string} requestId - Request identifier (auto-generated if not provided)
   * @param {Object} metadata - Request metadata (user, ip, etc.)
   * @returns {Object} Request-scoped logger with cleanup
   *
   * @example
   * const log = Logger.withRequest();
   * log.info('Processing request'); // [INFO] timestamp [req_xxx] Processing request {requestId: 'req_xxx'}
   * log.cleanup(); // Remove request context
   */
  static withRequest(requestId = null, metadata = {}) {
    const id = requestId || generateRequestId();
    const context = { requestId: id, ...metadata };

    requestContextStore.set(id, context);

    return {
      error: (message, data = null) => Logger.error(`[${id}] ${message}`, { ...context, ...data }),
      warn: (message, data = null) => Logger.warn(`[${id}] ${message}`, { ...context, ...data }),
      info: (message, data = null) => Logger.info(`[${id}] ${message}`, { ...context, ...data }),
      debug: (message, data = null) => Logger.debug(`[${id}] ${message}`, { ...context, ...data }),
      cleanup: () => requestContextStore.delete(id),
      getContext: () => ({ ...context })
    };
  }

  /**
   * Get current request context by ID
   * @param {string} requestId - Request identifier
   * @returns {Object|null} Request context or null
   */
  static getRequestContext(requestId) {
    return requestContextStore.get(requestId) || null;
  }

  /**
   * Log structured data (JSON format for log aggregation)
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Structured data to log
   *
   * @example
   * Logger.struct('info', 'API Request', { method: 'POST', path: '/api/tasks', duration: 45 });
   */
  static struct(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...data
    };

    const output = JSON.stringify(logEntry);

    switch (level.toLowerCase()) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Log metrics for monitoring
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Metric tags
   *
   * @example
   * Logger.metric('http_request_duration', 125, { method: 'GET', path: '/api/tasks' });
   */
  static metric(metric, value, tags = {}) {
    Logger.struct('info', 'Metric', {
      metric,
      value,
      tags,
      _type: 'metric'
    });
  }

  /**
   * Log a health check status with detailed information
   * @param {Object} status - Health check status object
   *
   * @example
   * Logger.healthCheck({
   *   status: 'healthy',
   *   uptime: process.uptime(),
   *   memory: process.memoryUsage(),
   *   database: { connected: true, latency: 5 }
   * });
   */
  static healthCheck(status) {
    Logger.struct('info', 'Health Check', {
      ...status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      _type: 'health_check'
    });
  }
}

// Initialize logger from environment on import
Logger.initFromEnv();
