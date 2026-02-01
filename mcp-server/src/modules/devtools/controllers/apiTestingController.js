/**
 * ============================================================================
 * VIBE STACK - API Testing Controller
 * ============================================================================
 * API endpoint testing and HTTP request utilities
 * @version 1.0.0
 * ============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * API Testing Controller
 * Handles API testing operations
 */
export class ApiTestingController {
  /**
   * Test an API endpoint
   * @param {Object} args - Test arguments
   * @returns {Promise<Object>} Test results
   */
  async testEndpoint(args = {}) {
    const { method = 'GET', url, headers = {}, body, timeout = 30000, expectedStatus = 200 } = args;

    if (!url) {
      throw new Error('URL is required');
    }

    try {
      // Build curl command
      let command = `curl -X ${method} -s -w "\\n%{http_code}"`;

      // Add headers
      for (const [key, value] of Object.entries(headers)) {
        command += ` -H "${key}: ${value}"`;
      }

      // Add body for POST/PUT/PATCH
      if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        command += ` -d '${JSON.stringify(body)}'`;
        command += ` -H "Content-Type: application/json"`;
      }

      command += ` --max-time ${Math.ceil(timeout / 1000)} "${url}"`;

      Logger.info(`Testing endpoint: ${method} ${url}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: timeout + 5000,
        maxBuffer: 1024 * 1024 * 10
      });

      // Parse response
      const lines = (stdout + stderr).trim().split('\n');
      const statusCode = parseInt(lines[lines.length - 1]);
      const responseBody = lines.slice(0, -1).join('\n');

      // Validate response
      let parsedBody = responseBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {}

      const success = statusCode === expectedStatus;

      return {
        success,
        url,
        method: method.toUpperCase(),
        results: {
          statusCode,
          expectedStatus,
          statusMatch: success,
          headers: this._extractResponseHeaders(stdout),
          body: parsedBody,
          responseTime: Date.now()
        },
        recommendation: success
          ? 'Endpoint responded as expected.'
          : `Expected status ${expectedStatus}, got ${statusCode}.`
      };
    } catch (error) {
      Logger.error(`API test failed: ${error.message}`);
      throw new Error(`API test failed: ${error.message}`);
    }
  }

  /**
   * Make HTTP request with detailed output
   * @param {Object} args - Request arguments
   * @returns {Promise<Object>} Request results
   */
  async httpRequest(args = {}) {
    const { method = 'GET', url, headers = {}, body, timeout = 30000, verbose = false } = args;

    if (!url) {
      throw new Error('URL is required');
    }

    try {
      // Build curl command with verbose output
      let command = `curl -X ${method}`;

      if (verbose) {
        command += ' -v';
      } else {
        command += ' -s';
      }

      command += ' -i'; // Include headers

      // Add headers
      for (const [key, value] of Object.entries(headers)) {
        command += ` -H "${key}: ${value}"`;
      }

      // Add body
      if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        command += ` -d '${JSON.stringify(body)}'`;
        command += ` -H "Content-Type: application/json"`;
      }

      command += ` --max-time ${Math.ceil(timeout / 1000)} "${url}"`;

      Logger.info(`HTTP request: ${method} ${url}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: timeout + 5000,
        maxBuffer: 1024 * 1024 * 10
      });

      const response = stdout + stderr;

      // Parse response
      const parts = response.split('\r\n\r\n');
      const headerSection = parts[0];
      const bodySection = parts.slice(1).join('\r\n\r\n');

      const headers = this._parseHeaders(headerSection);
      const body = bodySection.trim();

      let parsedBody = body;
      try {
        parsedBody = JSON.parse(body);
      } catch {}

      return {
        success: true,
        request: {
          method: method.toUpperCase(),
          url,
          headers
        },
        response: {
          statusCode: parseInt(headers['status-code'] || headers.status?.split(' ')[1] || 0),
          headers,
          body: parsedBody,
          rawBody: body
        }
      };
    } catch (error) {
      Logger.error(`HTTP request failed: ${error.message}`);
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  /**
   * Validate API against OpenAPI spec
   * @param {Object} args - Validation arguments
   * @returns {Promise<Object>} Validation results
   */
  async validateApi(args = {}) {
    const { specFile, endpoint } = args;

    if (!specFile) {
      throw new Error('Spec file is required');
    }

    try {
      // Try using swagger-cli or openapi-validator
      let command = 'npx @apidevtools/swagger-cli validate';

      if (endpoint) {
        command += ` --endpoint ${endpoint}`;
      }

      command += ` ${specFile}`;

      Logger.info(`Validating API spec: ${specFile}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10
      });

      const isValid = stdout.includes('No errors') || !stderr.includes('error');

      return {
        success: isValid,
        specFile,
        endpoint: endpoint || null,
        results: {
          valid: isValid,
          errors: isValid ? [] : this._parseValidationErrors(stderr),
          warnings: this._parseValidationWarnings(stdout + stderr)
        },
        recommendation: isValid
          ? 'API specification is valid.'
          : 'API specification has errors. Please fix the issues above.'
      };
    } catch (error) {
      Logger.error(`API validation failed: ${error.message}`);
      return {
        success: false,
        specFile,
        results: {
          valid: false,
          errors: [{ message: error.message }],
          warnings: []
        },
        recommendation: 'Validation failed. Make sure the spec file exists and is valid.'
      };
    }
  }

  /**
   * Extract response headers from curl output
   * @private
   */
  _extractResponseHeaders(output) {
    const headers = {};
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        headers[match[1]] = match[2];
      }
    }

    return headers;
  }

  /**
   * Parse headers from response
   * @private
   */
  _parseHeaders(headerSection) {
    const headers = {};
    const lines = headerSection.split('\r\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const colon = line.indexOf(':');
      if (colon > 0) {
        const key = line.substring(0, colon).trim();
        const value = line.substring(colon + 1).trim();
        headers[key] = value;
      }
    }

    return headers;
  }

  /**
   * Parse validation errors
   * @private
   */
  _parseValidationErrors(output) {
    const errors = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('error')) {
        errors.push({ message: line.trim() });
      }
    }

    return errors;
  }

  /**
   * Parse validation warnings
   * @private
   */
  _parseValidationWarnings(output) {
    const warnings = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('warning')) {
        warnings.push({ message: line.trim() });
      }
    }

    return warnings;
  }
}

/**
 * Create API testing controller instance
 * @returns {ApiTestingController} API testing controller instance
 */
export function createApiTestingController() {
  return new ApiTestingController();
}
