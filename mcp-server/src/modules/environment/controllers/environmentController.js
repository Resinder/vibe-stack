/**
 * ============================================================================
 * VIBE STACK - Environment Controller
 * ============================================================================
 * Environment variable and configuration management
 * @version 1.0.0
 * ============================================================================
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../../../utils/logger.js';

/**
 * Environment Controller
 * Handles environment variables and configuration
 */
export class EnvironmentController {
  constructor() {
    this.workspace = path.resolve(process.env.WORKSPACE_PATH || './repos');
    this.envFile = '.env';
    this.sensitiveKeys = ['password', 'secret', 'token', 'key', 'api_key', 'apikey', 'private'];
  }

  /**
   * Get path to .env file
   * @private
   */
  _getEnvPath(directory = '.') {
    return path.join(this.workspace, directory, this.envFile);
  }

  /**
   * Mask sensitive values
   * @private
   */
  _maskValue(key, value) {
    const lowerKey = key.toLowerCase();
    if (this.sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      return '***MASKED***';
    }
    return value;
  }

  /**
   * Parse .env file content
   * @private
   */
  _parseEnv(content) {
    const env = {};
    const lines = content.split('\n');

    for (let line of lines) {
      line = line.trim();
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        env[key] = value
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/\\n/g, '\n')        // Handle newlines
          .replace(/\\r/g, '\r');       // Handle carriage returns
      }
    }

    return env;
  }

  /**
   * Serialize env object to .env format
   * @private
   */
  _serializeEnv(env) {
    return Object.entries(env)
      .map(([key, value]) => {
        // Wrap values with spaces or special chars in quotes
        if (value.includes(' ') || value.includes('"') || value.includes("'")) {
          return `${key}="${value.replace(/"/g, '\\"')}"`;
        }
        return `${key}=${value}`;
      })
      .join('\n');
  }

  /**
   * List all environment variables
   * @param {Object} args - List arguments
   * @returns {Promise<Object>} Environment variables
   */
  async listEnv(args = {}) {
    const { directory = '.', includeSystem = false } = args;

    try {
      const envPath = this._getEnvPath(directory);
      const env = {};

      // Try to read .env file
      try {
        const content = await fs.readFile(envPath, 'utf-8');
        Object.assign(env, this._parseEnv(content));
      } catch {
        // .env doesn't exist, that's okay
      }

      // Optionally include system env vars
      const systemEnv = includeSystem ? process.env : {};

      // Mask sensitive values in output
      const maskedEnv = {};
      for (const [key, value] of Object.entries(env)) {
        maskedEnv[key] = this._maskValue(key, value);
      }

      const maskedSystemEnv = {};
      for (const [key, value] of Object.entries(systemEnv)) {
        maskedSystemEnv[key] = this._maskValue(key, value);
      }

      return {
        success: true,
        directory,
        env: maskedEnv,
        systemEnv: includeSystem ? maskedSystemEnv : undefined,
        summary: {
          totalEnvVars: Object.keys(env).length,
          systemEnvVars: includeSystem ? Object.keys(systemEnv).length : 0
        }
      };
    } catch (error) {
      Logger.error(`Failed to list env vars: ${error.message}`);
      throw new Error(`Failed to list env vars: ${error.message}`);
    }
  }

  /**
   * Get a specific environment variable
   * @param {Object} args - Get arguments
   * @returns {Promise<Object>} Environment variable value
   */
  async getEnv(args = {}) {
    const { key, directory = '.' } = args;

    if (!key) {
      throw new Error('Key is required');
    }

    try {
      const envPath = this._getEnvPath(directory);
      let value = null;

      // Try to read from .env file
      try {
        const content = await fs.readFile(envPath, 'utf-8');
        const env = this._parseEnv(content);
        value = env[key] || null;
      } catch {
        // .env doesn't exist
      }

      // Fall back to system env if not found
      if (value === null) {
        value = process.env[key] || null;
      }

      const maskedValue = value !== null ? this._maskValue(key, value) : null;

      return {
        success: true,
        key,
        value: maskedValue,
        masked: maskedValue !== value,
        found: value !== null
      };
    } catch (error) {
      Logger.error(`Failed to get env var: ${error.message}`);
      throw new Error(`Failed to get env var: ${error.message}`);
    }
  }

  /**
   * Set an environment variable
   * @param {Object} args - Set arguments
   * @returns {Promise<Object>} Set result
   */
  async setEnv(args = {}) {
    const { key, value, directory = '.', createFile = true } = args;

    if (!key) {
      throw new Error('Key is required');
    }

    if (value === undefined || value === null) {
      throw new Error('Value is required');
    }

    try {
      const envPath = this._getEnvPath(directory);
      let env = {};

      // Read existing .env file
      try {
        const content = await fs.readFile(envPath, 'utf-8');
        env = this._parseEnv(content);
      } catch {
        if (!createFile) {
          throw new Error(`.env file does not exist in ${directory}`);
        }
      }

      // Set the new value
      env[key] = value;

      // Write back to .env file
      const content = this._serializeEnv(env);
      await fs.writeFile(envPath, content, 'utf-8');

      Logger.info(`Set env var: ${key}`);

      return {
        success: true,
        key,
        value: this._maskValue(key, value),
        masked: true,
        file: envPath
      };
    } catch (error) {
      Logger.error(`Failed to set env var: ${error.message}`);
      throw new Error(`Failed to set env var: ${error.message}`);
    }
  }

  /**
   * Remove an environment variable
   * @param {Object} args - Remove arguments
   * @returns {Promise<Object>} Remove result
   */
  async removeEnv(args = {}) {
    const { key, directory = '.' } = args;

    if (!key) {
      throw new Error('Key is required');
    }

    try {
      const envPath = this._getEnvPath(directory);

      // Read existing .env file
      const content = await fs.readFile(envPath, 'utf-8');
      const env = this._parseEnv(content);

      // Remove the key
      const hadKey = key in env;
      delete env[key];

      // Write back to .env file
      const newContent = this._serializeEnv(env);
      await fs.writeFile(envPath, newContent, 'utf-8');

      Logger.info(`Removed env var: ${key}`);

      return {
        success: true,
        key,
        removed: hadKey
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: true,
          key,
          removed: false
        };
      }
      Logger.error(`Failed to remove env var: ${error.message}`);
      throw new Error(`Failed to remove env var: ${error.message}`);
    }
  }

  /**
   * Validate .env file
   * @param {Object} args - Validation arguments
   * @returns {Promise<Object>} Validation results
   */
  async validateEnv(args = {}) {
    const { directory = '.', requiredVars = [] } = args;

    try {
      const envPath = this._getEnvPath(directory);
      const issues = [];

      // Try to read .env file
      try {
        const content = await fs.readFile(envPath, 'utf-8');
        const env = this._parseEnv(content);

        // Check for required variables
        for (const key of requiredVars) {
          if (!env[key]) {
            issues.push({
              type: 'missing',
              key,
              message: `Required variable "${key}" is missing`
            });
          }
        }

        // Check for invalid keys
        for (const key of Object.keys(env)) {
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
            issues.push({
              type: 'invalid',
              key,
              message: `Invalid variable name "${key}". Must start with letter or underscore and contain only letters, numbers, and underscores.`
            });
          }
        }

        return {
          success: true,
          valid: issues.length === 0,
          directory,
          issues,
          summary: {
            totalVars: Object.keys(env).length,
            missingRequired: issues.filter(i => i.type === 'missing').length,
            invalidNames: issues.filter(i => i.type === 'invalid').length
          }
        };
      } catch {
        return {
          success: true,
          valid: requiredVars.length === 0,
          directory,
          issues: requiredVars.map(key => ({
            type: 'missing',
            key,
            message: `Required variable "${key}" is missing (no .env file)`
          })),
          summary: {
            totalVars: 0,
            missingRequired: requiredVars.length,
            invalidNames: 0
          }
        };
      }
    } catch (error) {
      Logger.error(`Failed to validate env: ${error.message}`);
      throw new Error(`Failed to validate env: ${error.message}`);
    }
  }
}

/**
 * Create environment controller instance
 * @returns {EnvironmentController} Environment controller instance
 */
export function createEnvironmentController() {
  return new EnvironmentController();
}
