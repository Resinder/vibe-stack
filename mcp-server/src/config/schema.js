/**
 * Configuration Schema Definition
 *
 * Central schema definition for all configuration values with validation,
 * defaults, and environment variable mappings.
 *
 * @module config/schema
 */

import { LANES, PRIORITY } from './constants.js';

/**
 * Configuration schema with all system defaults
 * No hardcoded values - everything is configurable via environment variables
 */
export const CONFIG_SCHEMA = {
  // Server Configuration
  server: {
    name: {
      type: 'string',
      default: 'vibe-stack-mcp',
      env: 'MCP_SERVER_NAME',
      description: 'MCP server identification name'
    },
    version: {
      type: 'string',
      default: '2.0.0',
      env: 'MCP_VERSION',
      description: 'MCP server version'
    },
    host: {
      type: 'string',
      default: '0.0.0.0',
      env: 'HOST',
      description: 'Server bind address'
    },
    port: {
      type: 'number',
      default: 4001,
      env: 'HTTP_PORT',
      min: 1024,
      max: 65535,
      description: 'HTTP server port'
    },
    timeout: {
      type: 'number',
      default: 120000,
      env: 'REQUEST_TIMEOUT',
      min: 1000,
      description: 'Request timeout in milliseconds'
    },
    debug: {
      type: 'boolean',
      default: false,
      env: 'DEBUG',
      description: 'Enable debug mode'
    },
    logLevel: {
      type: 'enum',
      default: 'info',
      env: 'LOG_LEVEL',
      values: ['error', 'warn', 'info', 'debug'],
      description: 'Logging level'
    }
  },

  // Vibe-Kanban Configuration
  vibeKanban: {
    url: {
      type: 'string',
      format: 'uri',
      default: null, // No default - must be configured
      env: 'VIBE_KANBAN_URL',
      required: true,
      description: 'Vibe-Kanban service URL'
    },
    port: {
      type: 'number',
      default: 4000,
      env: 'VIBE_PORT',
      min: 1024,
      max: 65535,
      description: 'Vibe-Kanban service port'
    },
    host: {
      type: 'string',
      default: 'localhost',
      env: 'VIBE_HOST',
      description: 'Vibe-Kanban service host'
    },
    enabled: {
      type: 'boolean',
      default: true,
      env: 'VIBE_KANBAN_ENABLED',
      description: 'Enable Vibe-Kanban integration'
    },
    healthCheckPath: {
      type: 'string',
      default: '/health',
      env: 'VIBE_HEALTH_PATH',
      description: 'Vibe-Kanban health check endpoint'
    },
    healthCheckInterval: {
      type: 'number',
      default: 30000,
      env: 'VIBE_HEALTH_INTERVAL',
      min: 5000,
      description: 'Health check interval in milliseconds'
    }
  },

  // Open WebUI Configuration
  openWebUI: {
    url: {
      type: 'string',
      format: 'uri',
      default: null,
      env: 'OPEN_WEBUI_URL',
      description: 'Open WebUI service URL'
    },
    port: {
      type: 'number',
      default: 8081,
      env: 'OPEN_WEBUI_PORT',
      min: 1024,
      max: 65535,
      description: 'Open WebUI service port'
    },
    host: {
      type: 'string',
      default: 'localhost',
      env: 'OPEN_WEBUI_HOST',
      description: 'Open WebUI service host'
    }
  },

  // code-server Configuration
  codeServer: {
    url: {
      type: 'string',
      format: 'uri',
      default: null,
      env: 'CODE_SERVER_URL',
      description: 'code-server service URL'
    },
    port: {
      type: 'number',
      default: 8443,
      env: 'CODE_SERVER_PORT',
      min: 1024,
      max: 65535,
      description: 'code-server service port'
    },
    host: {
      type: 'string',
      default: 'localhost',
      env: 'CODE_SERVER_HOST',
      description: 'code-server service host'
    },
    password: {
      type: 'string',
      default: null,
      env: 'CODE_SERVER_PASSWORD',
      sensitive: true,
      required: true,
      description: 'code-server access password'
    }
  },

  // Bridge File Configuration
  bridgeFile: {
    path: {
      type: 'string',
      default: '/data/.vibe-kanban-bridge.json',
      env: 'BRIDGE_FILE',
      description: 'Bridge file path for state synchronization'
    },
    enabled: {
      type: 'boolean',
      default: true,
      env: 'BRIDGE_ENABLED',
      description: 'Enable bridge file synchronization'
    },
    syncInterval: {
      type: 'number',
      default: 5000,
      env: 'BRIDGE_SYNC_INTERVAL',
      min: 1000,
      description: 'Bridge sync interval in milliseconds'
    },
    autoSync: {
      type: 'boolean',
      default: true,
      env: 'BRIDGE_AUTO_SYNC',
      description: 'Enable automatic synchronization'
    },
    retryAttempts: {
      type: 'number',
      default: 3,
      env: 'BRIDGE_RETRY_ATTEMPTS',
      min: 0,
      max: 10,
      description: 'Number of retry attempts for bridge operations'
    },
    retryDelay: {
      type: 'number',
      default: 1000,
      env: 'BRIDGE_RETRY_DELAY',
      min: 100,
      description: 'Retry delay in milliseconds'
    }
  },

  // Pattern Configuration
  patterns: {
    directory: {
      type: 'string',
      default: './config/patterns',
      env: 'PATTERNS_DIR',
      description: 'Pattern definitions directory'
    },
    enabled: {
      type: 'boolean',
      default: true,
      env: 'PATTERNS_ENABLED',
      description: 'Enable pattern-based task generation'
    },
    customEnabled: {
      type: 'boolean',
      default: true,
      env: 'PATTERNS_CUSTOM_ENABLED',
      description: 'Enable custom pattern loading'
    },
    matchThreshold: {
      type: 'number',
      default: 0.7,
      env: 'PATTERN_MATCH_THRESHOLD',
      min: 0,
      max: 1,
      description: 'Pattern matching threshold (0-1)'
    },
    maxPatterns: {
      type: 'number',
      default: 10,
      env: 'MAX_PATTERNS',
      min: 1,
      description: 'Maximum number of patterns to match'
    }
  },

  // AI Provider Configuration
  aiProvider: {
    active: {
      type: 'string',
      default: 'anthropic',
      env: 'AI_PROVIDER',
      description: 'Active AI provider'
    },
    directory: {
      type: 'string',
      default: './config/providers',
      env: 'AI_PROVIDERS_DIR',
      description: 'Provider configurations directory'
    },
    apiKey: {
      type: 'string',
      default: null,
      env: 'AI_API_KEY',
      sensitive: true,
      description: 'Default API key (not recommended - use provider-specific keys)'
    },
    timeout: {
      type: 'number',
      default: 30000,
      env: 'AI_TIMEOUT',
      min: 5000,
      description: 'AI API request timeout in milliseconds'
    },
    maxRetries: {
      type: 'number',
      default: 3,
      env: 'AI_MAX_RETRIES',
      min: 0,
      max: 10,
      description: 'Maximum retry attempts for AI requests'
    },
    fallbackEnabled: {
      type: 'boolean',
      default: false,
      env: 'AI_FALLBACK_ENABLED',
      description: 'Enable fallback to secondary provider'
    },
    fallbackProvider: {
      type: 'string',
      default: 'openai',
      env: 'AI_FALLBACK_PROVIDER',
      description: 'Fallback AI provider'
    }
  },

  // MCP Configuration
  mcp: {
    debug: {
      type: 'boolean',
      default: false,
      env: 'MCP_DEBUG',
      description: 'Enable MCP debug mode'
    },
    maxTasks: {
      type: 'number',
      default: 50,
      env: 'MCP_MAX_TASKS',
      min: 1,
      max: 200,
      description: 'Maximum number of tasks to generate'
    },
    defaultPriority: {
      type: 'enum',
      default: 'medium',
      env: 'MCP_DEFAULT_PRIORITY',
      values: PRIORITY.ALL,
      description: 'Default task priority'
    },
    defaultLane: {
      type: 'enum',
      default: 'backlog',
      env: 'MCP_DEFAULT_LANE',
      values: LANES.ALL,
      description: 'Default task lane'
    },
    enableStreaming: {
      type: 'boolean',
      default: true,
      env: 'MCP_ENABLE_STREAMING',
      description: 'Enable streaming responses'
    },
    // External MCP Server Configuration
    externalEnabled: {
      type: 'boolean',
      default: false,
      env: 'MCP_EXTERNAL_ENABLED',
      description: 'Enable external MCP server connections'
    },
    externalProvidersDir: {
      type: 'string',
      default: './config/providers',
      env: 'MCP_EXTERNAL_PROVIDERS_DIR',
      description: 'Directory containing external MCP server configurations'
    },
    connectionTimeout: {
      type: 'number',
      default: 30000,
      env: 'MCP_EXTERNAL_TIMEOUT',
      min: 5000,
      max: 120000,
      description: 'Connection timeout for external MCP servers (ms)'
    },
    maxRetries: {
      type: 'number',
      default: 3,
      env: 'MCP_EXTERNAL_MAX_RETRIES',
      min: 0,
      max: 10,
      description: 'Maximum connection retry attempts'
    },
    retryDelay: {
      type: 'number',
      default: 2000,
      env: 'MCP_EXTERNAL_RETRY_DELAY',
      min: 500,
      max: 30000,
      description: 'Delay between retries (ms)'
    },
    toolPrefixEnabled: {
      type: 'boolean',
      default: true,
      env: 'MCP_EXTERNAL_PREFIX_ENABLED',
      description: 'Enable tool name prefixing for external servers'
    },
    healthCheckInterval: {
      type: 'number',
      default: 60000,
      env: 'MCP_EXTERNAL_HEALTH_CHECK',
      min: 10000,
      description: 'Health check interval for external servers (ms)'
    }
  },

  // Cache Configuration
  cache: {
    enabled: {
      type: 'boolean',
      default: false,
      env: 'CACHE_ENABLED',
      description: 'Enable caching'
    },
    ttl: {
      type: 'number',
      default: 3600,
      env: 'CACHE_TTL',
      min: 60,
      description: 'Cache TTL in seconds'
    },
    maxSize: {
      type: 'number',
      default: 100,
      env: 'CACHE_MAX_SIZE',
      min: 10,
      description: 'Maximum cache size'
    },
    strategy: {
      type: 'enum',
      default: 'lru',
      env: 'CACHE_STRATEGY',
      values: ['lru', 'fifo', 'lfu'],
      description: 'Cache eviction strategy'
    }
  },

  // Security Configuration
  security: {
    rateLimitEnabled: {
      type: 'boolean',
      default: false,
      env: 'RATE_LIMIT_ENABLED',
      description: 'Enable rate limiting'
    },
    rateLimitRequests: {
      type: 'number',
      default: 100,
      env: 'RATE_LIMIT_REQUESTS',
      min: 1,
      description: 'Rate limit requests per window'
    },
    rateLimitWindow: {
      type: 'number',
      default: 900000,
      env: 'RATE_LIMIT_WINDOW',
      min: 1000,
      description: 'Rate limit window in milliseconds'
    },
    corsEnabled: {
      type: 'boolean',
      default: true,
      env: 'CORS_ENABLED',
      description: 'Enable CORS'
    },
    corsOrigin: {
      type: 'string',
      default: '*',
      env: 'CORS_ORIGIN',
      description: 'CORS origin'
    },
    corsMethods: {
      type: 'array',
      default: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      env: 'CORS_METHODS',
      description: 'CORS allowed methods'
    },
    authEnabled: {
      type: 'boolean',
      default: false,
      env: 'AUTH_ENABLED',
      description: 'Enable authentication'
    },
    authToken: {
      type: 'string',
      default: null,
      env: 'AUTH_TOKEN',
      sensitive: true,
      description: 'Authentication token'
    }
  },

  // Validation Configuration
  validation: {
    strictMode: {
      type: 'boolean',
      default: true,
      env: 'VALIDATION_STRICT',
      description: 'Enable strict validation mode'
    },
    sanitizeInput: {
      type: 'boolean',
      default: true,
      env: 'VALIDATION_SANITIZE',
      description: 'Enable input sanitization'
    },
    maxTitleLength: {
      type: 'number',
      default: 100,
      env: 'MAX_TITLE_LENGTH',
      min: 10,
      max: 500,
      description: 'Maximum task title length'
    },
    maxDescriptionLength: {
      type: 'number',
      default: 5000,
      env: 'MAX_DESC_LENGTH',
      min: 100,
      max: 50000,
      description: 'Maximum task description length'
    },
    maxEstimatedHours: {
      type: 'number',
      default: 1000,
      env: 'MAX_ESTIMATED_HOURS',
      min: 1,
      description: 'Maximum estimated hours per task'
    },
    allowedTags: {
      type: 'array',
      default: null,
      env: 'ALLOWED_TAGS',
      description: 'Allowed task tags (null = all tags allowed)'
    }
  },

  // Feature Flags
  features: {
    taskGeneration: {
      type: 'boolean',
      default: true,
      env: 'FEATURE_TASK_GENERATION',
      description: 'Enable AI task generation'
    },
    boardManagement: {
      type: 'boolean',
      default: true,
      env: 'FEATURE_BOARD_MANAGEMENT',
      description: 'Enable board management features'
    },
    autoSync: {
      type: 'boolean',
      default: true,
      env: 'FEATURE_AUTO_SYNC',
      description: 'Enable automatic synchronization'
    },
    analytics: {
      type: 'boolean',
      default: false,
      env: 'FEATURE_ANALYTICS',
      description: 'Enable analytics collection'
    },
    experimental: {
      type: 'boolean',
      default: false,
      env: 'FEATURE_EXPERIMENTAL',
      description: 'Enable experimental features'
    }
  },

  // Monitoring Configuration
  monitoring: {
    enabled: {
      type: 'boolean',
      default: false,
      env: 'MONITORING_ENABLED',
      description: 'Enable monitoring'
    },
    metricsPath: {
      type: 'string',
      default: '/metrics',
      env: 'METRICS_PATH',
      description: 'Metrics endpoint path'
    },
    healthCheckEnabled: {
      type: 'boolean',
      default: true,
      env: 'HEALTH_CHECK_ENABLED',
      description: 'Enable health check endpoint'
    },
    loggingEnabled: {
      type: 'boolean',
      default: true,
      env: 'LOGGING_ENABLED',
      description: 'Enable logging'
    },
    logLevel: {
      type: 'enum',
      default: 'info',
      env: 'MONITORING_LOG_LEVEL',
      values: ['error', 'warn', 'info', 'debug'],
      description: 'Monitoring log level'
    }
  }
};

/**
 * Get all configuration keys from schema
 * @returns {Array<string>} All configuration keys
 */
export function getAllConfigKeys() {
  const keys = [];

  function traverse(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value.type) {
        keys.push(fullKey);
      } else if (typeof value === 'object') {
        traverse(value, fullKey);
      }
    }
  }

  traverse(CONFIG_SCHEMA);
  return keys;
}

/**
 * Get configuration schema for a specific key
 * @param {string} key - Configuration key (dot notation)
 * @returns {object|null} Schema definition
 */
export function getSchemaForKey(key) {
  const parts = key.split('.');
  let current = CONFIG_SCHEMA;

  for (const part of parts) {
    if (current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current.type ? current : null;
}

/**
 * Validate configuration value against schema
 * @param {string} key - Configuration key
 * @param {*} value - Value to validate
 * @returns {object} Validation result
 */
export function validateConfigValue(key, value) {
  const schema = getSchemaForKey(key);

  if (!schema) {
    return { valid: false, error: `Unknown configuration key: ${key}` };
  }

  // Type validation
  if (schema.type && value === null || value === undefined) {
    if (schema.required) {
      return { valid: false, error: `Required configuration key: ${key}` };
    }
    return { valid: true }; // Use default
  }

  // Type-specific validation
  switch (schema.type) {
    case 'number':
      if (typeof value !== 'number') {
        return { valid: false, error: `${key} must be a number` };
      }
      if (schema.min !== undefined && value < schema.min) {
        return { valid: false, error: `${key} must be at least ${schema.min}` };
      }
      if (schema.max !== undefined && value > schema.max) {
        return { valid: false, error: `${key} must be at most ${schema.max}` };
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `${key} must be a string` };
      }
      if (schema.format === 'uri') {
        try {
          new URL(value);
        } catch (e) {
          return { valid: false, error: `${key} must be a valid URI` };
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${key} must be a boolean` };
      }
      break;

    case 'enum':
      if (!schema.values.includes(value)) {
        return { valid: false, error: `${key} must be one of: ${schema.values.join(', ')}` };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { valid: false, error: `${key} must be an array` };
      }
      break;
  }

  return { valid: true };
}

/**
 * Get default value for configuration key
 * @param {string} key - Configuration key
 * @returns {*} Default value
 */
export function getDefaultValue(key) {
  const schema = getSchemaForKey(key);
  return schema?.default;
}

/**
 * Get environment variable name for configuration key
 * @param {string} key - Configuration key
 * @returns {string|null} Environment variable name
 */
export function getEnvVarName(key) {
  const schema = getSchemaForKey(key);
  return schema?.env || null;
}

/**
 * Check if configuration key is required
 * @param {string} key - Configuration key
 * @returns {boolean}
 */
export function isRequired(key) {
  const schema = getSchemaForKey(key);
  return schema?.required || false;
}

/**
 * Check if configuration key is sensitive
 * @param {string} key - Configuration key
 * @returns {boolean}
 */
export function isSensitive(key) {
  const schema = getSchemaForKey(key);
  return schema?.sensitive || false;
}

export default {
  CONFIG_SCHEMA,
  getAllConfigKeys,
  getSchemaForKey,
  validateConfigValue,
  getDefaultValue,
  getEnvVarName,
  isRequired,
  isSensitive
};
