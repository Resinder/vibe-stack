/**
 * ============================================================================
 * VIBE STACK - Git Controller
 * ============================================================================
 * Git operations for version control with credential integration
 * @version 1.0.0
 * ============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Logger } from '../../../utils/logger.js';
import * as GitCredentials from '../../../shared/utils/gitCredentials.js';

const execAsync = promisify(exec);

/**
 * Git Controller
 * Handles git operations with credential support
 */
export class GitController {
  /**
   * Create a new GitController instance
   * @param {Object} credentialStorage - Credential storage instance (optional)
   */
  constructor(credentialStorage = null) {
    this.workspace = path.resolve(process.env.WORKSPACE_PATH || './repos');
    this.credentialStorage = credentialStorage;
  }

  /**
   * Set credential storage instance
   * @param {Object} credentialStorage - Credential storage instance
   */
  setCredentialStorage(credentialStorage) {
    this.credentialStorage = credentialStorage;
  }

  /**
   * Ensure credentials are configured for repository
   * @private
   * @param {string} repoPath - Repository path
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} True if credentials configured
   */
  async _ensureCredentials(repoPath, userId = 'default') {
    if (!this.credentialStorage) {
      return false;
    }

    try {
      const token = await this.credentialStorage.getGitHubToken(userId);
      if (token) {
        await GitCredentials.configureCredentialHelper({
          repoPath,
          token
        });
        return true;
      }
    } catch (error) {
      Logger.warn(`[GIT] Failed to configure credentials: ${error.message}`);
    }
    return false;
  }

  /**
   * Get repository path
   * @private
   */
  _getRepoPath(repo = '.') {
    return path.resolve(path.join(this.workspace, repo));
  }

  /**
   * Get git status
   * @param {Object} args - Status arguments
   * @returns {Promise<Object>} Git status
   */
  async getStatus(args = {}) {
    const { repo = '.' } = args;

    try {
      const repoPath = this._getRepoPath(repo);

      const { stdout } = await execAsync('git status --porcelain', {
        cwd: repoPath,
        timeout: 10000
      });

      const lines = stdout.trim().split('\n').filter(Boolean);
      const modified = [];
      const added = [];
      const deleted = [];
      const untracked = [];

      for (const line of lines) {
        const status = line.substring(0, 2);
        const filePath = line.substring(3);

        if (status.includes('M')) modified.push(filePath);
        if (status.includes('A')) added.push(filePath);
        if (status.includes('D')) deleted.push(filePath);
        if (status === '??') untracked.push(filePath);
      }

      // Get current branch
      const { stdout: branchOut } = await execAsync('git branch --show-current', {
        cwd: repoPath,
        timeout: 5000
      });
      const branch = branchOut.trim();

      Logger.info(`Got git status for: ${repo}`);

      return {
        success: true,
        repository: repo,
        branch,
        status: {
          modified,
          added,
          deleted,
          untracked,
          total: modified.length + added.length + deleted.length + untracked.length
        },
        clean: modified.length + added.length + deleted.length + untracked.length === 0
      };
    } catch (error) {
      Logger.error(`Failed to get git status: ${error.message}`);
      throw new Error(`Failed to get git status: ${error.message}`);
    }
  }

  /**
   * Commit changes
   * @param {Object} args - Commit arguments
   * @returns {Promise<Object>} Commit result
   */
  async commit(args = {}) {
    const { repo = '.', message, files = '.' } = args;

    if (!message) {
      throw new Error('Commit message is required');
    }

    try {
      const repoPath = this._getRepoPath(repo);

      // Stage files
      await execAsync(`git add ${files}`, {
        cwd: repoPath,
        timeout: 30000
      });

      // Commit
      const { stdout } = await execAsync(`git commit -m "${message}"`, {
        cwd: repoPath,
        timeout: 30000
      });

      // Get commit hash
      const { stdout: hashOut } = await execAsync('git rev-parse --short HEAD', {
        cwd: repoPath,
        timeout: 5000
      });
      const hash = hashOut.trim();

      Logger.info(`Committed changes: ${hash} - ${message}`);

      return {
        success: true,
        message: 'Changes committed successfully',
        commit: {
          hash,
          message,
          repository: repo
        }
      };
    } catch (error) {
      if (error.stderr && error.stderr.includes('nothing to commit')) {
        return {
          success: true,
          message: 'Nothing to commit',
          commit: null
        };
      }
      Logger.error(`Failed to commit: ${error.message}`);
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  /**
   * Push changes to remote
   * @param {Object} args - Push arguments
   * @param {string} args.repo - Repository path (default: '.')
   * @param {string} args.remote - Remote name (default: 'origin')
   * @param {string} args.branch - Branch to push (optional)
   * @param {string} args.userId - User identifier for credentials (optional)
   * @returns {Promise<Object>} Push result
   */
  async push(args = {}) {
    const { repo = '.', remote = 'origin', branch, userId = 'default' } = args;

    try {
      const repoPath = this._getRepoPath(repo);

      // Ensure credentials are configured before pushing
      await this._ensureCredentials(repoPath, userId);

      let command = `git push ${remote}`;
      if (branch) {
        command += ` ${branch}`;
      }

      const { stdout } = await execAsync(command, {
        cwd: repoPath,
        timeout: 60000
      });

      Logger.info(`[GIT] Pushed changes: ${remote}/${branch || 'current'}`);

      return {
        success: true,
        message: 'Changes pushed successfully',
        push: {
          remote,
          branch: branch || 'current',
          repository: repo
        }
      };
    } catch (error) {
      Logger.error(`[GIT] Failed to push: ${error.message}`);
      throw new Error(`Failed to push: ${error.message}`);
    }
  }

  /**
   * Pull changes from remote
   * @param {Object} args - Pull arguments
   * @param {string} args.repo - Repository path (default: '.')
   * @param {string} args.remote - Remote name (default: 'origin')
   * @param {string} args.branch - Branch to pull (optional)
   * @param {string} args.userId - User identifier for credentials (optional)
   * @returns {Promise<Object>} Pull result
   */
  async pull(args = {}) {
    const { repo = '.', remote = 'origin', branch, userId = 'default' } = args;

    try {
      const repoPath = this._getRepoPath(repo);

      // Ensure credentials are configured before pulling
      await this._ensureCredentials(repoPath, userId);

      let command = `git pull ${remote}`;
      if (branch) {
        command += ` ${branch}`;
      }

      const { stdout } = await execAsync(command, {
        cwd: repoPath,
        timeout: 60000
      });

      Logger.info(`[GIT] Pulled changes: ${remote}/${branch || 'current'}`);

      return {
        success: true,
        message: 'Changes pulled successfully',
        pull: {
          remote,
          branch: branch || 'current',
          repository: repo
        }
      };
    } catch (error) {
      Logger.error(`[GIT] Failed to pull: ${error.message}`);
      throw new Error(`Failed to pull: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   * @param {Object} args - Branch arguments
   * @returns {Promise<Object>} Branch result
   */
  async createBranch(args = {}) {
    const { repo = '.', name, checkout = true } = args;

    if (!name) {
      throw new Error('Branch name is required');
    }

    try {
      const repoPath = this._getRepoPath(repo);

      const command = checkout
        ? `git checkout -b ${name}`
        : `git branch ${name}`;

      const { stdout } = await execAsync(command, {
        cwd: repoPath,
        timeout: 10000
      });

      Logger.info(`Created branch: ${name}`);

      return {
        success: true,
        message: `Branch ${name} created successfully`,
        branch: {
          name,
          checkedOut: checkout,
          repository: repo
        }
      };
    } catch (error) {
      Logger.error(`Failed to create branch: ${error.message}`);
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Switch to a branch
   * @param {Object} args - Switch arguments
   * @returns {Promise<Object>} Switch result
   */
  async switchBranch(args = {}) {
    const { repo = '.', name, create = false } = args;

    if (!name) {
      throw new Error('Branch name is required');
    }

    try {
      const repoPath = this._getRepoPath(repo);

      let command = create ? `git checkout -b ${name}` : `git checkout ${name}`;

      const { stdout } = await execAsync(command, {
        cwd: repoPath,
        timeout: 10000
      });

      Logger.info(`Switched to branch: ${name}`);

      return {
        success: true,
        message: `Switched to branch ${name}`,
        branch: {
          name,
          repository: repo,
          created: create
        }
      };
    } catch (error) {
      Logger.error(`Failed to switch branch: ${error.message}`);
      throw new Error(`Failed to switch branch: ${error.message}`);
    }
  }

  /**
   * Get commit history
   * @param {Object} args - Log arguments
   * @returns {Promise<Object>} Commit history
   */
  async getLog(args = {}) {
    const { repo = '.', limit = 10 } = args;

    try {
      const repoPath = this._getRepoPath(repo);

      const { stdout } = await execAsync(
        `git log -${limit} --pretty=format:"%H|%h|%an|%ae|%ad|%s" --date=iso`,
        {
          cwd: repoPath,
          timeout: 10000
        }
      );

      const lines = stdout.trim().split('\n');
      const commits = [];

      for (const line of lines) {
        const [hash, shortHash, author, email, date, ...messageParts] = line.split('|');
        commits.push({
          hash,
          shortHash,
          author,
          email,
          date,
          message: messageParts.join('|')
        });
      }

      return {
        success: true,
        repository: repo,
        commits,
        count: commits.length
      };
    } catch (error) {
      Logger.error(`Failed to get log: ${error.message}`);
      throw new Error(`Failed to get log: ${error.message}`);
    }
  }

  /**
   * Get repository info
   * @param {Object} args - Info arguments
   * @returns {Promise<Object>} Repository info
   */
  async getInfo(args = {}) {
    const { repo = '.' } = args;

    try {
      const repoPath = this._getRepoPath(repo);

      // Get current branch
      const { stdout: branchOut } = await execAsync('git branch --show-current', {
        cwd: repoPath,
        timeout: 5000
      });
      const branch = branchOut.trim();

      // Get remote URL
      let remoteUrl = null;
      try {
        const { stdout: urlOut } = await execAsync('git remote get-url origin', {
          cwd: repoPath,
          timeout: 5000
        });
        remoteUrl = urlOut.trim();
      } catch {}

      // Get latest commit
      const { stdout: hashOut } = await execAsync('git rev-parse --short HEAD', {
        cwd: repoPath,
        timeout: 5000
      });
      const hash = hashOut.trim();

      // Get commit count
      const { stdout: countOut } = await execAsync('git rev-list --count HEAD', {
        cwd: repoPath,
        timeout: 10000
      });
      const commitCount = parseInt(countOut.trim());

      return {
        success: true,
        repository: repo,
        info: {
          branch,
          remoteUrl,
          latestCommit: hash,
          totalCommits: commitCount
        }
      };
    } catch (error) {
      Logger.error(`Failed to get repo info: ${error.message}`);
      throw new Error(`Failed to get repo info: ${error.message}`);
    }
  }
}

/**
 * Create git controller instance
 * @param {Object} credentialStorage - Credential storage instance (optional)
 * @returns {GitController} Git controller instance
 */
export function createGitController(credentialStorage = null) {
  return new GitController(credentialStorage);
}
