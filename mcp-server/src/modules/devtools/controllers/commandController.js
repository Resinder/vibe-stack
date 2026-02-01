/**
 * ============================================================================
 * VIBE STACK - Command Controller
 * ============================================================================
 * Command execution for scripts, tests, and operations
 * @version 1.0.0
 * ============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Command Controller
 * Handles command execution
 */
export class CommandController {
  constructor() {
    this.workspace = path.resolve(process.env.WORKSPACE_PATH || './repos');
    // Allowed commands for security
    this.allowedCommands = [
      'npm', 'pnpm', 'yarn', 'bun',
      'python', 'python3', 'pip', 'pip3',
      'node', 'npx',
      'git',
      'make', 'cmake',
      'cargo', 'rustc',
      'go',
      'java', 'javac',
      'mvn', 'gradle',
      'docker', 'docker-compose',
      'pytest', 'jest', 'vitest', 'mocha',
      'eslint', 'prettier',
      'tsc', 'ts-node',
      'ls', 'cd', 'pwd', 'cat', 'head', 'tail',
      'find', 'grep', 'wc',
      'mkdir', 'rm', 'cp', 'mv',
      'echo', 'printf'
    ];
  }

  /**
   * Validate command is allowed
   * @private
   */
  _validateCommand(command) {
    const baseCommand = command.trim().split(/\s+/)[0];
    const isAllowed = this.allowedCommands.includes(baseCommand);

    if (!isAllowed) {
      throw new Error(
        `Command not allowed: ${baseCommand}. ` +
        `Allowed commands: ${this.allowedCommands.join(', ')}`
      );
    }

    // Block dangerous patterns
    const dangerous = ['rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=', '> /dev/'];
    for (const pattern of dangerous) {
      if (command.includes(pattern)) {
        throw new Error(`Dangerous command pattern blocked: ${pattern}`);
      }
    }
  }

  /**
   * Run a shell command
   * @param {Object} args - Command arguments
   * @returns {Promise<Object>} Command result
   */
  async runCommand(args = {}) {
    const { command, directory = '.', timeout = 60000 } = args;

    if (!command) {
      throw new Error('Command is required');
    }

    try {
      this._validateCommand(command);

      const cwd = path.resolve(path.join(this.workspace, directory));

      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      Logger.info(`Executed command: ${command}`);

      return {
        success: true,
        command,
        directory,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0
      };
    } catch (error) {
      Logger.error(`Command failed: ${error.message}`);
      return {
        success: false,
        command,
        directory,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }

  /**
   * Run tests for a project
   * @param {Object} args - Test arguments
   * @returns {Promise<Object>} Test results
   */
  async runTests(args = {}) {
    const { directory = '.', framework, coverage = false } = args;

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Detect framework if not specified
      let testCommand = framework;

      if (!testCommand) {
        // Check for package.json
        const packageJsonPath = path.join(cwd, 'package.json');
        try {
          const { readFileSync } = await import('fs');
          const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

          if (pkg.scripts?.test) {
            testCommand = `npm run test${coverage ? ' -- --coverage' : ''}`;
          } else {
            // Try common frameworks
            const testFiles = ['jest.config.js', 'vitest.config.js', 'pytest.ini'];
            for (const file of testFiles) {
              try {
                await import('fs').then(fs => fs.promises.access(path.join(cwd, file)));
                if (file.includes('jest')) testCommand = 'npm test';
                else if (file.includes('vitest')) testCommand = 'npm test';
                else if (file.includes('pytest')) testCommand = 'pytest';
                break;
              } catch {}
            }
          }
        } catch {}
      }

      if (!testCommand) {
        throw new Error('No test framework detected. Please specify framework explicitly.');
      }

      Logger.info(`Running tests: ${testCommand}`);

      const { stdout, stderr } = await execAsync(testCommand, {
        cwd,
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10
      });

      // Parse test results
      const results = this._parseTestOutput(stdout);

      return {
        success: true,
        framework: framework || 'auto-detected',
        directory,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        results
      };
    } catch (error) {
      Logger.error(`Tests failed: ${error.message}`);
      return {
        success: false,
        framework,
        directory,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        results: { passed: 0, failed: 1, error: error.message }
      };
    }
  }

  /**
   * Run a specific script
   * @param {Object} args - Script arguments
   * @returns {Promise<Object>} Script result
   */
  async runScript(args = {}) {
    const { script, directory = '.', args: scriptArgs = '' } = args;

    if (!script) {
      throw new Error('Script name is required');
    }

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Try npm/yarn/pnpm
      let command = `npm run ${script}`;
      if (scriptArgs) {
        command += ` -- ${scriptArgs}`;
      }

      Logger.info(`Running script: ${script}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10
      });

      return {
        success: true,
        script,
        directory,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error) {
      Logger.error(`Script failed: ${error.message}`);
      throw new Error(`Script failed: ${error.message}`);
    }
  }

  /**
   * Install dependencies
   * @param {Object} args - Install arguments
   * @returns {Promise<Object>} Install result
   */
  async installDependencies(args = {}) {
    const { directory = '.', manager } = args;

    try {
      const cwd = path.resolve(path.join(this.workspace, directory));

      // Detect package manager
      let installCommand = manager;

      if (!installCommand) {
        // Check for lock files
        const { existsSync } = await import('fs');
        if (existsSync(path.join(cwd, 'package-lock.json'))) {
          installCommand = 'npm install';
        } else if (existsSync(path.join(cwd, 'yarn.lock'))) {
          installCommand = 'yarn install';
        } else if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
          installCommand = 'pnpm install';
        } else if (existsSync(path.join(cwd, 'bun.lockb'))) {
          installCommand = 'bun install';
        } else if (existsSync(path.join(cwd, 'requirements.txt'))) {
          installCommand = 'pip install -r requirements.txt';
        } else if (existsSync(path.join(cwd, 'Cargo.toml'))) {
          installCommand = 'cargo build';
        } else {
          installCommand = 'npm install';
        }
      }

      Logger.info(`Installing dependencies: ${installCommand}`);

      const { stdout, stderr } = await execAsync(installCommand, {
        cwd,
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10
      });

      return {
        success: true,
        manager: manager || 'auto-detected',
        directory,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error) {
      Logger.error(`Failed to install dependencies: ${error.message}`);
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  /**
   * Parse test output for results
   * @private
   */
  _parseTestOutput(output) {
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };

    // Try to parse Jest output
    const jestMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);
    if (jestMatch) {
      results.passed = parseInt(jestMatch[1]) || 0;
      results.failed = parseInt(jestMatch[2]) || 0;
      results.total = results.passed + results.failed;
      return results;
    }

    // Try to parse pytest output
    const pytestMatch = output.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);
    if (pytestMatch) {
      results.passed = parseInt(pytestMatch[1]) || 0;
      results.failed = parseInt(pytestMatch[2]) || 0;
      results.total = results.passed + results.failed;
      return results;
    }

    // Try to parse TAP output
    const tapMatch = output.match(/# tests?\s+(\d+)/);
    if (tapMatch) {
      results.total = parseInt(tapMatch[1]) || 0;
    }

    const passMatch = output.match(/# pass\s+(\d+)/);
    if (passMatch) {
      results.passed = parseInt(passMatch[1]) || 0;
    }

    const failMatch = output.match(/# fail\s+(\d+)/);
    if (failMatch) {
      results.failed = parseInt(failMatch[1]) || 0;
    }

    return results;
  }
}

/**
 * Create command controller instance
 * @returns {CommandController} Command controller instance
 */
export function createCommandController() {
  return new CommandController();
}
