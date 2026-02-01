/**
 * Centralized Path Management
 *
 * Provides centralized path management with environment-based resolution
 * and path validation. Uses centralized settings from settings.js.
 *
 * @module config/paths
 */

import path from 'path';
import { Logger } from '../utils/logger.js';
import { getEnvironment, isDevelopment, getConfig, getNumberConfig, vibeKanban, openWebUI, codeServer, bridgeFile, patterns, aiProvider } from './settings.js';

/**
 * Base directory paths
 */
const BASE_DIRS = {
  root: process.cwd(),
  src: path.join(process.cwd(), 'mcp-server', 'src'),
  config: path.join(process.cwd(), 'config'),
  data: process.env.DATA_DIR || '/data',
  logs: process.env.LOGS_DIR || '/var/log/vibe-stack'
};

/**
 * Service paths
 */
export const services = {
  /**
   * Get Vibe-Kanban base URL
   * @returns {string}
   */
  getVibeKanbanUrl() {
    return vibeKanban.getUrl();
  },

  /**
   * Get Vibe-Kanban health endpoint
   * @returns {string}
   */
  getVibeKanbanHealthEndpoint() {
    return `${this.getVibeKanbanUrl()}/health`;
  },

  /**
   * Get Vibe-Kanban tasks endpoint
   * @returns {string}
   */
  getVibeKanbanTasksEndpoint() {
    return `${this.getVibeKanbanUrl()}/api/tasks`;
  },

  /**
   * Get Open WebUI URL
   * @returns {string}
   */
  getOpenWebUIUrl() {
    return openWebUI.getUrl();
  },

  /**
   * Get code-server URL
   * @returns {string}
   */
  getCodeServerUrl() {
    return codeServer.getUrl();
  }
};

/**
 * File system paths
 */
export const files = {
  /**
   * Get bridge file path
   * @returns {string}
   */
  getBridgeFile() {
    return bridgeFile.getPath();
  },

  /**
   * Get state file path
   * @returns {string}
   */
  getStateFile() {
    return getConfig('STATE_FILE', path.join(BASE_DIRS.data, '.vibe-state.json'));
  },

  /**
   * Get dashboard file path
   * @returns {string}
   */
  getDashboardFile() {
    return path.join(BASE_DIRS.data, '.vibe-dashboard.json');
  },

  /**
   * Get patterns directory path
   * @returns {string}
   */
  getPatternsDir() {
    return patterns.getDirectory();
  },

  /**
   * Get providers directory path
   * @returns {string}
   */
  getProvidersDir() {
    return aiProvider.getDirectory();
  },

  /**
   * Get environments directory path
   * @returns {string}
   */
  getEnvironmentsDir() {
    return path.join(BASE_DIRS.config, 'environments');
  },

  /**
   * Get active provider config path
   * @returns {string}
   */
  getActiveProviderConfig() {
    return path.join(this.getProvidersDir(), 'active.json');
  },

  /**
   * Get log file path
   * @param {string} serviceName - Service name
   * @returns {string}
   */
  getLogFile(serviceName = 'mcp-server') {
    return path.join(BASE_DIRS.logs, `${serviceName}.log`);
  },

  /**
   * Get error log file path
   * @param {string} serviceName - Service name
   * @returns {string}
   */
  getErrorLogFile(serviceName = 'mcp-server') {
    return path.join(BASE_DIRS.logs, `${serviceName}-error.log`);
  }
};

/**
 * Custom panel paths
 */
export const panels = {
  /**
   * Get kanban panel path
   * @returns {string}
   */
  getKanbanPanel() {
    return '/custom/kanban-panel.html';
  },

  /**
   * Get kanban panel full URL
   * @returns {string}
   */
  getKanbanPanelUrl() {
    return `${services.getVibeKanbanUrl()}${this.getKanbanPanel()}`;
  }
};

/**
 * Pattern file paths
 */
export const patternPaths = {
  /**
   * Get authentication pattern path
   * @returns {string}
   */
  getAuthentication() {
    return path.join(files.getPatternsDir(), 'authentication.json');
  },

  /**
   * Get database pattern path
   * @returns {string}
   */
  getDatabase() {
    return path.join(files.getPatternsDir(), 'database.json');
  },

  /**
   * Get API pattern path
   * @returns {string}
   */
  getAPI() {
    return path.join(files.getPatternsDir(), 'api.json');
  },

  /**
   * Get frontend pattern path
   * @returns {string}
   */
  getFrontend() {
    return path.join(files.getPatternsDir(), 'frontend.json');
  },

  /**
   * Get testing pattern path
   * @returns {string}
   */
  getTesting() {
    return path.join(files.getPatternsDir(), 'testing.json');
  },

  /**
   * Get deployment pattern path
   * @returns {string}
   */
  getDeployment() {
    return path.join(files.getPatternsDir(), 'deployment.json');
  },

  /**
   * Get all pattern files
   * @returns {object}
   */
  getAll() {
    return {
      authentication: this.getAuthentication(),
      database: this.getDatabase(),
      api: this.getAPI(),
      frontend: this.getFrontend(),
      testing: this.getTesting(),
      deployment: this.getDeployment()
    };
  }
};

/**
 * Provider config paths
 */
export const providers = {
  /**
   * Get Anthropic provider config path
   * @returns {string}
   */
  getAnthropic() {
    return path.join(files.getProvidersDir(), 'anthropic.example.json');
  },

  /**
   * Get Z.ai provider config path
   * @returns {string}
   */
  getZai() {
    return path.join(files.getProvidersDir(), 'zai.example.json');
  },

  /**
   * Get OpenAI provider config path
   * @returns {string}
   */
  getOpenAI() {
    return path.join(files.getProvidersDir(), 'openai.example.json');
  },

  /**
   * Get Google provider config path
   * @returns {string}
   */
  getGoogle() {
    return path.join(files.getProvidersDir(), 'google.example.json');
  },

  /**
   * Get Ollama provider config path
   * @returns {string}
   */
  getOllama() {
    return path.join(files.getProvidersDir(), 'ollama.example.json');
  },

  /**
   * Get all provider config paths
   * @returns {object}
   */
  getAll() {
    return {
      anthropic: this.getAnthropic(),
      zai: this.getZai(),
      openai: this.getOpenAI(),
      google: this.getGoogle(),
      ollama: this.getOllama()
    };
  }
};

/**
 * Environment config paths
 */
export const environments = {
  /**
   * Get development config directory
   * @returns {string}
   */
  getDevelopment() {
    return path.join(files.getEnvironmentsDir(), 'development');
  },

  /**
   * Get production config directory
   * @returns {string}
   */
  getProduction() {
    return path.join(files.getEnvironmentsDir(), 'production');
  },

  /**
   * Get staging config directory
   * @returns {string}
   */
  getStaging() {
    return path.join(files.getEnvironmentsDir(), 'staging');
  },

  /**
   * Get development docker-compose file
   * @returns {string}
   */
  getDevelopmentDockerCompose() {
    return path.join(this.getDevelopment(), 'docker-compose.yml');
  },

  /**
   * Get production docker-compose file
   * @returns {string}
   */
  getProductionDockerCompose() {
    return path.join(this.getProduction(), 'docker-compose.yml');
  },

  /**
   * Get development .env file
   * @returns {string}
   */
  getDevelopmentEnv() {
    return path.join(this.getDevelopment(), '.env');
  },

  /**
   * Get production .env file
   * @returns {string}
   */
  getProductionEnv() {
    return path.join(this.getProduction(), '.env');
  }
};

/**
 * Validate path exists and is accessible
 * @param {string} filePath - Path to validate
 * @returns {boolean}
 */
export function validatePath(filePath) {
  try {
    const fs = require('fs');
    return fs.existsSync(filePath);
  } catch (error) {
    Logger.warn(`Path validation failed for ${filePath}`, { error: error.message });
    return false;
  }
}

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 * @returns {boolean}
 */
export function ensureDirectory(dirPath) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      Logger.debug(`Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    Logger.error(`Failed to create directory: ${dirPath}`, { error: error.message });
    return false;
  }
}

/**
 * Get all paths for debugging
 * @returns {object} All path values
 */
export function getAllPaths() {
  return {
    baseDirs: BASE_DIRS,
    services: {
      vibeKanban: services.getVibeKanbanUrl(),
      openWebUI: services.getOpenWebUIUrl(),
      codeServer: services.getCodeServerUrl()
    },
    files: {
      bridge: files.getBridgeFile(),
      state: files.getStateFile(),
      dashboard: files.getDashboardFile(),
      patterns: files.getPatternsDir(),
      providers: files.getProvidersDir()
    },
    patterns: patterns.getAll(),
    providers: providers.getAll(),
    environments: {
      development: environments.getDevelopment(),
      production: environments.getProduction(),
      staging: environments.getStaging()
    }
  };
}

/**
 * Log current paths (for debugging)
 */
export function logPaths() {
  if (isDevelopment()) {
    Logger.debug('Current paths', {
      paths: getAllPaths(),
      environment: getEnvironment()
    });
  }
}

export default {
  services,
  files,
  panels,
  patterns,
  providers,
  environments,
  validatePath,
  ensureDirectory,
  getAllPaths,
  logPaths
};
