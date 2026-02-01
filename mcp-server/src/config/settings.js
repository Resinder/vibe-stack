/**
 * Centralized Settings Management
 *
 * Provides environment-based configuration management with support for
 * development, staging, and production environments.
 *
 * @module config/settings
 */

import { Logger } from '../utils/logger.js';

/**
 * Get current environment
 * @returns {string} Current environment (development, staging, production, test)
 */
export function getEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * Check if running in development mode
 * @returns {boolean}
 */
export function isDevelopment() {
  return getEnvironment() === 'development';
}

/**
 * Check if running in production mode
 * @returns {boolean}
 */
export function isProduction() {
  return getEnvironment() === 'production';
}

/**
 * Check if running in test mode
 * @returns {boolean}
 */
export function isTest() {
  return getEnvironment() === 'test';
}

/**
 * Get configuration value with fallback
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value
 */
export function getConfig(key, defaultValue = null) {
  // Check environment variable first
  if (process.env[key] !== undefined) {
    return process.env[key];
  }

  // Check environment-specific configuration
  const env = getEnvironment();
  const envKey = `${key}_${env.toUpperCase()}`;
  if (process.env[envKey] !== undefined) {
    return process.env[envKey];
  }

  return defaultValue;
}

/**
 * Get numeric configuration value
 * @param {string} key - Configuration key
 * @param {number} defaultValue - Default value
 * @returns {number} Configuration value as number
 */
export function getNumberConfig(key, defaultValue = 0) {
  const value = getConfig(key, defaultValue);
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get boolean configuration value
 * @param {string} key - Configuration key
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} Configuration value as boolean
 */
export function getBooleanConfig(key, defaultValue = false) {
  const value = getConfig(key, defaultValue);
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}

/**
 * Get JSON configuration value
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value
 * @returns {*} Parsed JSON value or default
 */
export function getJsonConfig(key, defaultValue = null) {
  const value = getConfig(key);
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    Logger.warn(`Failed to parse JSON config for key "${key}"`, { error: error.message });
    return defaultValue;
  }
}

/**
 * Server configuration
 */
export const server = {
  /**
   * Get HTTP port
   * @returns {number}
   */
  getPort() {
    return getNumberConfig('HTTP_PORT', 4001);
  },

  /**
   * Get host
   * @returns {string}
   */
  getHost() {
    return getConfig('HOST', '0.0.0.0');
  },

  /**
   * Check if debug mode is enabled
   * @returns {boolean}
   */
  isDebug() {
    return getBooleanConfig('DEBUG', isDevelopment());
  },

  /**
   * Get log level
   * @returns {string}
   */
  getLogLevel() {
    return getConfig('LOG_LEVEL', isDevelopment() ? 'debug' : 'info');
  },

  /**
   * Get request timeout in milliseconds
   * @returns {number}
   */
  getTimeout() {
    return getNumberConfig('REQUEST_TIMEOUT', 120000);
  }
};

/**
 * Vibe-Kanban configuration
 */
export const vibeKanban = {
  /**
   * Get Vibe-Kanban URL
   * @returns {string}
   */
  getUrl() {
    return getConfig('VIBE_KANBAN_URL', 'http://localhost:4000');
  },

  /**
   * Get Vibe-Kanban port
   * @returns {number}
   */
  getPort() {
    return getNumberConfig('VIBE_PORT', 4000);
  },

  /**
   * Check if Vibe-Kanban is available
   * @returns {boolean}
   */
  isEnabled() {
    return getBooleanConfig('VIBE_KANBAN_ENABLED', true);
  }
};

/**
 * Bridge file configuration
 */
export const bridgeFile = {
  /**
   * Get bridge file path
   * @returns {string}
   */
  getPath() {
    return getConfig('BRIDGE_FILE', '/data/.vibe-kanban-bridge.json');
  },

  /**
   * Check if bridge file is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return getBooleanConfig('BRIDGE_ENABLED', true);
  },

  /**
   * Get sync interval in milliseconds
   * @returns {number}
   */
  getSyncInterval() {
    return getNumberConfig('BRIDGE_SYNC_INTERVAL', 5000);
  }
};

/**
 * MCP configuration
 */
export const mcp = {
  /**
   * Get MCP server name
   * @returns {string}
   */
  getName() {
    return getConfig('MCP_SERVER_NAME', 'vibe-kanban-mcp');
  },

  /**
   * Get MCP version
   * @returns {string}
   */
  getVersion() {
    return getConfig('MCP_VERSION', '1.0.0');
  },

  /**
   * Check if MCP is in debug mode
   * @returns {boolean}
   */
  isDebug() {
    return getBooleanConfig('MCP_DEBUG', isDevelopment());
  },

  /**
   * Get maximum number of tasks to generate
   * @returns {number}
   */
  getMaxTasks() {
    return getNumberConfig('MCP_MAX_TASKS', 50);
  },

  /**
   * Get default task priority
   * @returns {string}
   */
  getDefaultPriority() {
    return getConfig('MCP_DEFAULT_PRIORITY', 'medium');
  }
};

/**
 * Pattern configuration
 */
export const patterns = {
  /**
   * Get patterns directory path
   * @returns {string}
   */
  getDirectory() {
    return getConfig('PATTERNS_DIR', './config/patterns');
  },

  /**
   * Check if custom patterns are enabled
   * @returns {boolean}
   */
  areCustomEnabled() {
    return getBooleanConfig('PATTERNS_CUSTOM_ENABLED', true);
  },

  /**
   * Get pattern matching threshold (0-1)
   * @returns {number}
   */
  getMatchThreshold() {
    const value = getNumberConfig('PATTERN_MATCH_THRESHOLD', 70);
    return Math.min(Math.max(value, 0), 100) / 100;
  }
};

/**
 * AI Provider configuration
 */
export const aiProvider = {
  /**
   * Get active provider
   * @returns {string}
   */
  getActive() {
    return getConfig('AI_PROVIDER', 'anthropic');
  },

  /**
   * Get provider directory path
   * @returns {string}
   */
  getDirectory() {
    return getConfig('AI_PROVIDERS_DIR', './config/providers');
  },

  /**
   * Get API key for provider
   * @param {string} provider - Provider name
   * @returns {string|null}
   */
  getApiKey(provider) {
    const keyMap = {
      anthropic: 'ANTHROPIC_API_KEY',
      zai: 'ZAI_API_KEY',
      openai: 'OPENAI_API_KEY',
      google: 'GOOGLE_API_KEY',
      ollama: 'OLLAMA_API_KEY'
    };
    return getConfig(keyMap[provider] || `${provider.toUpperCase()}_API_KEY`);
  },

  /**
   * Check if provider is enabled
   * @param {string} provider - Provider name
   * @returns {boolean}
   */
  isEnabled(provider) {
    return getBooleanConfig(`AI_PROVIDER_${provider.toUpperCase()}_ENABLED`, true);
  }
};

/**
 * Cache configuration
 */
export const cache = {
  /**
   * Check if caching is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return getBooleanConfig('CACHE_ENABLED', !isDevelopment());
  },

  /**
   * Get cache TTL in seconds
   * @returns {number}
   */
  getTTL() {
    return getNumberConfig('CACHE_TTL', 3600);
  },

  /**
   * Get cache size limit
   * @returns {number}
   */
  getMaxSize() {
    return getNumberConfig('CACHE_MAX_SIZE', 100);
  }
};

/**
 * Open WebUI configuration
 */
export const openWebUI = {
  /**
   * Get Open WebUI URL
   * @returns {string}
   */
  getUrl() {
    const port = getNumberConfig('OPEN_WEBUI_PORT', 8081);
    const host = getConfig('OPEN_WEBUI_HOST', 'localhost');
    return getConfig('OPEN_WEBUI_URL', `http://${host}:${port}`);
  },

  /**
   * Get Open WebUI port
   * @returns {number}
   */
  getPort() {
    return getNumberConfig('OPEN_WEBUI_PORT', 8081);
  },

  /**
   * Get Open WebUI host
   * @returns {string}
   */
  getHost() {
    return getConfig('OPEN_WEBUI_HOST', 'localhost');
  },

  /**
   * Check if Open WebUI is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return getBooleanConfig('OPEN_WEBUI_ENABLED', true);
  }
};

/**
 * code-server configuration
 */
export const codeServer = {
  /**
   * Get code-server URL
   * @returns {string}
   */
  getUrl() {
    const port = getNumberConfig('CODE_SERVER_PORT', 8443);
    const host = getConfig('CODE_SERVER_HOST', 'localhost');
    return getConfig('CODE_SERVER_URL', `http://${host}:${port}`);
  },

  /**
   * Get code-server port
   * @returns {number}
   */
  getPort() {
    return getNumberConfig('CODE_SERVER_PORT', 8443);
  },

  /**
   * Get code-server host
   * @returns {string}
   */
  getHost() {
    return getConfig('CODE_SERVER_HOST', 'localhost');
  },

  /**
   * Check if code-server is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return getBooleanConfig('CODE_SERVER_ENABLED', true);
  }
};

/**
 * Security configuration
 */
export const security = {
  /**
   * Check if rate limiting is enabled
   * @returns {boolean}
   */
  isRateLimitEnabled() {
    return getBooleanConfig('RATE_LIMIT_ENABLED', isProduction());
  },

  /**
   * Get rate limit requests per window
   * @returns {number}
   */
  getRateLimitRequests() {
    return getNumberConfig('RATE_LIMIT_REQUESTS', 100);
  },

  /**
   * Get rate limit window in milliseconds
   * @returns {number}
   */
  getRateLimitWindow() {
    return getNumberConfig('RATE_LIMIT_WINDOW', 900000);
  },

  /**
   * Check if CORS is enabled
   * @returns {boolean}
   */
  isCORSEnabled() {
    return getBooleanConfig('CORS_ENABLED', true);
  },

  /**
   * Get CORS origin
   * @returns {string}
   */
  getCORSOrigin() {
    return getConfig('CORS_ORIGIN', '*');
  },

  /**
   * Check if authentication is enabled
   * @returns {boolean}
   */
  isAuthEnabled() {
    return getBooleanConfig('AUTH_ENABLED', isProduction());
  }
};

/**
 * Get all configuration for debugging
 * @returns {object} All configuration values (without sensitive data)
 */
export function getAllConfig() {
  return {
    environment: getEnvironment(),
    server: {
      port: server.getPort(),
      host: server.getHost(),
      debug: server.isDebug(),
      logLevel: server.getLogLevel(),
      timeout: server.getTimeout()
    },
    vibeKanban: {
      url: vibeKanban.getUrl(),
      port: vibeKanban.getPort(),
      enabled: vibeKanban.isEnabled()
    },
    openWebUI: {
      url: openWebUI.getUrl(),
      port: openWebUI.getPort(),
      host: openWebUI.getHost(),
      enabled: openWebUI.isEnabled()
    },
    codeServer: {
      url: codeServer.getUrl(),
      port: codeServer.getPort(),
      host: codeServer.getHost(),
      enabled: codeServer.isEnabled()
    },
    bridgeFile: {
      path: bridgeFile.getPath(),
      enabled: bridgeFile.isEnabled(),
      syncInterval: bridgeFile.getSyncInterval()
    },
    mcp: {
      name: mcp.getName(),
      version: mcp.getVersion(),
      debug: mcp.isDebug(),
      maxTasks: mcp.getMaxTasks(),
      defaultPriority: mcp.getDefaultPriority()
    },
    patterns: {
      directory: patterns.getDirectory(),
      customEnabled: patterns.areCustomEnabled(),
      matchThreshold: patterns.getMatchThreshold()
    },
    aiProvider: {
      active: aiProvider.getActive(),
      directory: aiProvider.getDirectory(),
      // Note: API keys are intentionally excluded
    },
    cache: {
      enabled: cache.isEnabled(),
      ttl: cache.getTTL(),
      maxSize: cache.getMaxSize()
    },
    security: {
      rateLimitEnabled: security.isRateLimitEnabled(),
      corsEnabled: security.isCORSEnabled(),
      authEnabled: security.isAuthEnabled()
    }
  };
}

/**
 * Log current configuration (for debugging)
 */
export function logConfig() {
  if (server.isDebug()) {
    Logger.debug('Current configuration', {
      config: getAllConfig(),
      environment: getEnvironment()
    });
  }
}

export default {
  getEnvironment,
  isDevelopment,
  isProduction,
  isTest,
  getConfig,
  getNumberConfig,
  getBooleanConfig,
  getJsonConfig,
  server,
  vibeKanban,
  openWebUI,
  codeServer,
  bridgeFile,
  mcp,
  patterns,
  aiProvider,
  cache,
  security,
  getAllConfig,
  logConfig
};
