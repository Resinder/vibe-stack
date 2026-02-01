/**
 * ============================================================================
 * VIBE STACK - WebSocket Logger
 * ============================================================================
 * Structured logging for WebSocket operations
 * @version 1.0.0
 * ============================================================================
 */

/**
 * WebSocket Logger
 */
class Logger {
  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static info(message, ...args) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`, ...args);
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static error(message, ...args) {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`, ...args);
  }

  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static debug(message, ...args) {
    if (process.env.WS_DEBUG === 'true' || process.env.DEBUG === 'true') {
      console.debug(`[${new Date().toISOString()}] 🔍 ${message}`, ...args);
    }
  }
}

export { Logger };
