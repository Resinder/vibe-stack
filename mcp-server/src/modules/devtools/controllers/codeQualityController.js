/**
 * ============================================================================
 * VIBE STACK - Code Quality Controller
 * ============================================================================
 * Code analysis, linting, formatting, and security scanning
 * @version 1.0.0
 * ============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Code Quality Controller
 * Handles code quality operations
 */
export class CodeQualityController {
  constructor() {
    this.workspace = path.resolve(process.env.WORKSPACE_PATH || './repos');
  }

  /**
   * Lint code using appropriate linter
   * @param {Object} args - Lint arguments
   * @returns {Promise<Object>} Lint results
   */
  async lintCode(args = {}) {
    const { directory = '.', framework, fix = false } = args;

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Auto-detect linter
      let lintCommand = framework;

      if (!lintCommand) {
        // Check for ESLint
        try {
          await execAsync('npx eslint --version', { cwd, timeout: 5000 });
          lintCommand = `npx eslint .${fix ? ' --fix' : ''}`;
        } catch {
          // Check for Pylint
          try {
            await execAsync('pylint --version', { cwd, timeout: 5000 });
            lintCommand = `pylint .${fix ? ' --fix' : ''}`;
          } catch {
            // Check for flake8
            try {
              await execAsync('flake8 --version', { cwd, timeout: 5000 });
              lintCommand = 'flake8 .';
            } catch {
              throw new Error('No linter found. Please install eslint, pylint, or flake8.');
            }
          }
        }
      }

      Logger.info(`Running linter: ${lintCommand}`);

      const { stdout, stderr } = await execAsync(lintCommand, {
        cwd,
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10
      });

      // Parse results
      const issues = this._parseLintOutput(stdout + stderr);

      return {
        success: true,
        framework: framework || 'auto-detected',
        directory,
        fixed,
        results: {
          issues,
          summary: {
            total: issues.length,
            errors: issues.filter(i => i.severity === 'error').length,
            warnings: issues.filter(i => i.severity === 'warning').length
          }
        }
      };
    } catch (error) {
      Logger.error(`Lint failed: ${error.message}`);
      throw new Error(`Lint failed: ${error.message}`);
    }
  }

  /**
   * Format code using appropriate formatter
   * @param {Object} args - Format arguments
   * @returns {Promise<Object>} Format results
   */
  async formatCode(args = {}) {
    const { directory = '.', files = '.', framework, check = false } = args;

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Auto-detect formatter
      let formatCommand = framework;

      if (!formatCommand) {
        // Check for Prettier
        try {
          await execAsync('npx prettier --version', { cwd, timeout: 5000 });
          formatCommand = `npx prettier --write ${files}`;
          if (check) {
            formatCommand = `npx prettier --check ${files}`;
          }
        } catch {
          // Check for Black (Python)
          try {
            await execAsync('black --version', { cwd, timeout: 5000 });
            formatCommand = `black ${files}`;
            if (check) {
              formatCommand = `black --check ${files}`;
            }
          } catch {
            throw new Error('No formatter found. Please install prettier or black.');
          }
        }
      }

      Logger.info(`Running formatter: ${formatCommand}`);

      const { stdout, stderr } = await execAsync(formatCommand, {
        cwd,
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10
      });

      // Parse results
      const output = stdout + stderr;
      const formatted = output.match(/Formatting \d+ files/g)?.map(m => parseInt(m.match(/\d+/)[0])) || [];
      const totalFiles = formatted.reduce((a, b) => a + b, 0);

      return {
        success: true,
        framework: framework || 'auto-detected',
        directory,
        check,
        results: {
          filesFormatted: totalFiles,
          output: output.trim()
        }
      };
    } catch (error) {
      Logger.error(`Format failed: ${error.message}`);
      throw new Error(`Format failed: ${error.message}`);
    }
  }

  /**
   * Analyze code complexity
   * @param {Object} args - Analysis arguments
   * @returns {Promise<Object>} Complexity analysis
   */
  async analyzeComplexity(args = {}) {
    const { directory = '.', file } = args;

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Use complexity-report or eslint-plugin-complexity
      let command = 'npx eslint . --format json';

      if (file) {
        command = `npx eslint ${file} --format json`;
      }

      Logger.info(`Analyzing complexity: ${file || '.'}`);

      const { stdout } = await execAsync(command, {
        cwd,
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10
      });

      // Parse ESLint output
      const results = JSON.parse(stdout);
      const issues = results.flatMap(r => r.messages || []);

      const complexityIssues = issues.filter(i =>
        i.ruleId && i.ruleId.includes('complexity')
      );

      const avgComplexity = complexityIssues.length > 0
        ? complexityIssues.reduce((sum, i) => sum + (i.message.match(/\d+/)?.[0] || 0), 0) / complexityIssues.length
        : 0;

      return {
        success: true,
        directory,
        file: file || null,
        results: {
          totalIssues: issues.length,
          complexityIssues: complexityIssues.length,
          averageComplexity: Math.round(avgComplexity * 10) / 10,
          recommendation: avgComplexity > 10 ? 'High complexity detected. Consider refactoring.' : 'Complexity is acceptable.'
        }
      };
    } catch (error) {
      Logger.error(`Complexity analysis failed: ${error.message}`);
      // Don't throw, return basic info
      return {
        success: true,
        directory,
        results: {
          totalIssues: 0,
          complexityIssues: 0,
          averageComplexity: 0,
          recommendation: 'Unable to analyze complexity.'
        }
      };
    }
  }

  /**
   * Security scan code
   * @param {Object} args - Scan arguments
   * @returns {Promise<Object>} Security scan results
   */
  async securityScan(args = {}) {
    const { directory = '.', severity = 'moderate' } = args;

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Try npm audit
      let command = 'npm audit --json';
      let auditType = 'dependencies';

      try {
        const { stdout } = await execAsync(command, {
          cwd,
          timeout: 60000,
          maxBuffer: 1024 * 1024 * 10
        });

        const results = JSON.parse(stdout);

        // Filter by severity
        const vulnerabilities = results.vulnerabilities || {};
        const filtered = Object.entries(vulnerabilities).filter(([_, v]) => {
          const sev = v.severity || 'low';
          const levels = ['low', 'moderate', 'high', 'critical'];
          return levels.indexOf(sev) >= levels.indexOf(severity);
        });

        return {
          success: true,
          type: auditType,
          directory,
          results: {
            totalVulnerabilities: filtered.length,
            vulnerabilities: filtered.map(([name, data]) => ({
              package: name,
              severity: data.severity,
              title: data.title
            })),
            recommendation: filtered.length > 0
              ? `${filtered.length} vulnerabilities found. Run 'npm audit fix' to attempt automatic fixes.`
              : 'No vulnerabilities found.'
          }
        };
      } catch (npmError) {
        // Try safety-cli for Python
        try {
          const { stdout } = await execAsync('safety check --json', {
            cwd,
            timeout: 60000
          });

          return {
            success: true,
            type: 'python-dependencies',
            directory,
            results: {
              vulnerabilities: JSON.parse(stdout),
              recommendation: 'Vulnerabilities found in Python packages.'
            }
          };
        } catch {
          throw new Error('No security scan tool found. Please install npm (Node.js) or safety (Python).');
        }
      }
    } catch (error) {
      Logger.error(`Security scan failed: ${error.message}`);
      throw new Error(`Security scan failed: ${error.message}`);
    }
  }

  /**
   * Parse lint output
   * @private
   */
  _parseLintOutput(output) {
    const issues = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // ESLint format: file:line:col:message
      const eslintMatch = line.match(/^([^:]+):(\d+):(\d+):\s+(.+)$/);
      if (eslintMatch) {
        const [, file, line, col, message] = eslintMatch;
        const severity = message.includes('error') ? 'error' : 'warning';
        issues.push({ file, line: parseInt(line), column: parseInt(col), message, severity });
        continue;
      }

      // Pylint format: file:line: [type] message
      const pylintMatch = line.match(/^([^:]+):(\d+):\s+\[([EWRF])\d+\]\s+(.+)$/);
      if (pylintMatch) {
        const [, file, line, type, message] = pylintMatch;
        const severity = ['E', 'F'].includes(type) ? 'error' : 'warning';
        issues.push({ file, line: parseInt(line), message, severity, type });
        continue;
      }

      // Flake8 format: file:line:col: type message
      const flake8Match = line.match(/^([^:]+):(\d+):(\d+):\s+([EWFC])\d+\s+(.+)$/);
      if (flake8Match) {
        const [, file, line, col, type, message] = flake8Match;
        const severity = ['E', 'F'].includes(type) ? 'error' : 'warning';
        issues.push({ file, line: parseInt(line), column: parseInt(col), message, severity, type });
        continue;
      }
    }

    return issues;
  }
}

/**
 * Create code quality controller instance
 * @returns {CodeQualityController} Code quality controller instance
 */
export function createCodeQualityController() {
  return new CodeQualityController();
}
