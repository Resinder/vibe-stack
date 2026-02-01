/**
 * ============================================================================
 * VIBE STACK - Configuration Constants
 * ============================================================================
 * Centralized configuration management with environment-based overrides
 * @version 1.0.0 - Added PostgreSQL configuration
 * ============================================================================
 */

import { server, vibeKanban, bridgeFile, mcp } from './settings.js';
import { files, panels } from './paths.js';

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

/**
 * Application configuration (now using centralized settings)
 * @constant {Object}
 */
export const CONFIG = {
  // Server identification
  name: mcp.getName(),
  version: mcp.getVersion(),

  // External service URLs (from centralized settings)
  vibeKanbanUrl: vibeKanban.getUrl(),
  vibeKanbanPort: vibeKanban.getPort(),

  // File paths (from centralized paths)
  bridgeFilePath: bridgeFile.getPath(),
  customPanelPath: panels.getKanbanPanel(),

  // HTTP server configuration (from centralized settings)
  httpPort: server.getPort(),
  host: server.getHost(),
  timeout: server.getTimeout(),
  debug: server.isDebug(),
  logLevel: server.getLogLevel(),

  // PostgreSQL configuration (from environment variables)
  // SECURITY: Never use default credentials in production!
  // Always set PGHOST, PGPORT, PGDATABASE, PGUSER, and PGPASSWORD in production
  postgres: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'vibestack',
    user: process.env.PGUSER || 'vibeuser',
    password: process.env.PGPASSWORD,
    max: parseInt(process.env.PGPOOL_MAX || '20'),
    idleTimeout: parseInt(process.env.PGPOOL_IDLE || '30000'),
    connectionTimeout: parseInt(process.env.PGPOOL_CONNECTION_TIMEOUT || '10000')
  },

  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '5000'), // 5 seconds
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100')
  }
};

// ============================================================================
// RUNTIME CONFIGURATION (dynamic based on environment)
// ============================================================================

/**
 * Get runtime configuration
 * @returns {Object} Current runtime configuration
 */
export function getRuntimeConfig() {
  return {
    ...CONFIG,
    environment: server.getLogLevel(),
    mcpDebug: mcp.isDebug(),
    bridgeSyncInterval: bridgeFile.getSyncInterval(),
    maxTasks: mcp.getMaxTasks(),
    defaultPriority: mcp.getDefaultPriority()
  };
}

// ============================================================================
// ENUMERATION CONSTANTS
// ============================================================================

/**
 * Lane constants
 * @constant {Object}
 */
export const LANES = {
  /** Backlog lane for new tasks */
  BACKLOG: 'backlog',

  /** Todo lane for tasks ready to start */
  TODO: 'todo',

  /** In Progress lane for active tasks */
  IN_PROGRESS: 'in_progress',

  /** Done lane for completed tasks */
  DONE: 'done',

  /** Recovery lane for tasks that need attention */
  RECOVERY: 'recovery',

  /** All valid lane values */
  ALL: ['backlog', 'todo', 'in_progress', 'done', 'recovery']
};

/**
 * Priority constants
 * @constant {Object}
 */
export const PRIORITY = {
  /** Low priority */
  LOW: 'low',

  /** Medium priority (default) */
  MEDIUM: 'medium',

  /** High priority */
  HIGH: 'high',

  /** Critical priority */
  CRITICAL: 'critical',

  /** All valid priority values */
  ALL: ['low', 'medium', 'high', 'critical']
};

// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================

// Tool definitions are imported directly from tools.js to avoid circular dependency
// Use: import { TOOLS } from './tools.js'
