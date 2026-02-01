/**
 * ============================================================================
 * VIBE STACK - Docker Controller
 * ============================================================================
 * Docker container and compose management
 * @version 1.0.0
 * ============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Docker Controller
 * Handles Docker operations
 */
export class DockerController {
  /**
   * Check if Docker is available
   * @private
   */
  async _checkDocker() {
    try {
      await execAsync('docker --version', { timeout: 5000 });
      return true;
    } catch {
      throw new Error('Docker is not installed or not running. Please install Docker to use Docker tools.');
    }
  }

  /**
   * List running containers
   * @param {Object} args - List arguments
   * @returns {Promise<Object>} Container list
   */
  async listContainers(args = {}) {
    await this._checkDocker();

    const { all = false } = args;

    try {
      const command = all
        ? 'docker ps -a --format "{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"'
        : 'docker ps --format "{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"';

      const { stdout } = await execAsync(command, { timeout: 10000 });

      const lines = stdout.trim().split('\n');
      const containers = [];

      for (const line of lines) {
        if (!line) continue;
        const [id, names, status, ports] = line.split('\t');
        containers.push({ id, names, status, ports });
      }

      return {
        success: true,
        containers,
        count: containers.length,
        summary: {
          running: containers.filter(c => c.status.includes('Up')).length
        }
      };
    } catch (error) {
      Logger.error(`Failed to list containers: ${error.message}`);
      throw new Error(`Failed to list containers: ${error.message}`);
    }
  }

  /**
   * Get container logs
   * @param {Object} args - Logs arguments
   * @returns {Promise<Object>} Container logs
   */
  async getLogs(args = {}) {
    await this._checkDocker();

    const { container, tail = 100, follow = false } = args;

    if (!container) {
      throw new Error('Container name or ID is required');
    }

    try {
      let command = `docker logs --tail ${tail}`;
      if (follow) {
        command += ' --follow';
      }
      command += ` ${container}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: follow ? 60000 : 10000,
        maxBuffer: 1024 * 1024 * 10
      });

      const logs = (stdout + stderr).trim();

      return {
        success: true,
        container,
        follow,
        logs,
        lines: logs.split('\n').length,
        summary: `Retrieved ${logs.split('\n').length} log lines`
      };
    } catch (error) {
      Logger.error(`Failed to get logs: ${error.message}`);
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  /**
   * Execute command in container
   * @param {Object} args - Exec arguments
   * @returns {Promise<Object>} Exec result
   */
  async execCommand(args = {}) {
    await this._checkDocker();

    const { container, command, interactive = false } = args;

    if (!container || !command) {
      throw new Error('Container and command are required');
    }

    try {
      const execCmd = interactive
        ? `docker exec -it ${container} ${command}`
        : `docker exec ${container} ${command}`;

      const { stdout, stderr } = await execAsync(execCmd, {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10
      });

      return {
        success: true,
        container,
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error) {
      Logger.error(`Failed to exec command: ${error.message}`);
      throw new Error(`Failed to exec command: ${error.message}`);
    }
  }

  /**
   * Restart container
   * @param {Object} args - Restart arguments
   * @returns {Promise<Object>} Restart result
   */
  async restartContainer(args = {}) {
    await this._checkDocker();

    const { container } = args;

    if (!container) {
      throw new Error('Container name or ID is required');
    }

    try {
      const command = `docker restart ${container}`;
      await execAsync(command, { timeout: 30000 });

      Logger.info(`Restarted container: ${container}`);

      return {
        success: true,
        message: `Container ${container} restarted successfully`
      };
    } catch (error) {
      Logger.error(`Failed to restart container: ${error.message}`);
      throw new Error(`Failed to restart container: ${error.message}`);
    }
  }

  /**
   * Stop container
   * @param {Object} args - Stop arguments
   * @returns {Promise<Object>} Stop result
   */
  async stopContainer(args = {}) {
    await this._checkDocker();

    const { container } = args;

    if (!container) {
      throw new Error('Container name or ID is required');
    }

    try {
      const command = `docker stop ${container}`;
      await execAsync(command, { timeout: 30000 });

      Logger.info(`Stopped container: ${container}`);

      return {
        success: true,
        message: `Container ${container} stopped successfully`
      };
    } catch (error) {
      Logger.error(`Failed to stop container: ${error.message}`);
      throw new Error(`Failed to stop container: ${error.message}`);
    }
  }

  /**
   * Start container
   * @param {Object} args - Start arguments
   * @returns {Promise<Object>} Start result
   */
  async startContainer(args = {}) {
    await this._checkDocker();

    const { container } = args;

    if (!container) {
      throw new Error('Container name or ID is required');
    }

    try {
      const command = `docker start ${container}`;
      await execAsync(command, { timeout: 30000 });

      Logger.info(`Started container: ${container}`);

      return {
        success: true,
        message: `Container ${container} started successfully`
      };
    } catch (error) {
      Logger.error(`Failed to start container: ${error.message}`);
      throw new Error(`Failed to start container: ${error.message}`);
    }
  }

  /**
   * Run Docker Compose command
   * @param {Object} args - Compose arguments
   * @returns {Promise<Object>} Compose result
   */
  async compose(args = {}) {
    await this._checkDocker();

    const { action = 'up', directory, services = [], detached = true } = args;

    try {
      let command = 'docker-compose';

      if (directory) {
        command = `cd ${directory} && docker-compose`;
      }

      command += ` ${action}`;

      if (action === 'up' && detached) {
        command += ' -d';
      }

      if (services.length > 0) {
        command += ` ${services.join(' ')}`;
      }

      Logger.info(`Running compose: ${action}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10
      });

      return {
        success: true,
        action,
        directory,
        services,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error) {
      Logger.error(`Compose failed: ${error.message}`);
      throw new Error(`Compose failed: ${error.message}`);
    }
  }

  /**
   * Get container stats
   * @param {Object} args - Stats arguments
   * @returns {Promise<Object>} Container stats
   */
  async getStats(args = {}) {
    await this._checkDocker();

    const { container } = args;

    try {
      const command = container
        ? `docker stats ${container} --no-stream --format "{{.ID}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"`
        : `docker stats --no-stream --format "{{.ID}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"`;

      const { stdout } = await execAsync(command, { timeout: 10000 });

      const lines = stdout.trim().split('\n');
      const stats = [];

      for (const line of lines) {
        if (!line) continue;
        const [id, name, cpu, mem, memPerc, netIO, blockIO] = line.split('\t');
        stats.push({
          id,
          name,
          cpuPercent: cpu,
          memoryUsage: mem,
          memoryPercent: memPerc,
          networkIO: netIO,
          blockIO
        });
      }

      return {
        success: true,
        container: container || 'all',
        stats,
        count: stats.length
      };
    } catch (error) {
      Logger.error(`Failed to get stats: ${error.message}`);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
}

/**
 * Create Docker controller instance
 * @returns {DockerController} Docker controller instance
 */
export function createDockerController() {
  return new DockerController();
}
