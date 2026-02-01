/**
 * ============================================================================
 * VIBE STACK - GitHub Controller
 * ============================================================================
 * GitHub integration for repository and issue management
 * @version 1.0.0
 * ============================================================================
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../../utils/logger.js';

const execAsync = promisify(exec);

/**
 * GitHub Controller
 * Handles GitHub operations using gh CLI or API
 */
export class GitHubController {
  constructor() {
    this.authenticated = false;
    this.token = process.env.GITHUB_TOKEN || null;
    this.checkAuth();
  }

  /**
   * Check GitHub authentication status
   * @private
   */
  async checkAuth() {
    try {
      if (this.token) {
        // Token is set, consider authenticated
        this.authenticated = true;
        Logger.info('GitHub authenticated via token');
      } else {
        // Check if gh CLI is authenticated
        const { stdout } = await execAsync('gh auth status');
        this.authenticated = stdout.includes('Logged in');
        if (this.authenticated) {
          Logger.info('GitHub authenticated via gh CLI');
        }
      }
    } catch {
      this.authenticated = false;
      Logger.warn('GitHub not authenticated');
    }
  }

  /**
   * Ensure authentication before operations
   * @private
   */
  ensureAuthenticated() {
    if (!this.authenticated) {
      throw new Error(
        'GitHub not authenticated. Please set GITHUB_TOKEN environment variable or authenticate with gh CLI'
      );
    }
  }

  /**
   * Create a new GitHub repository
   * @param {Object} args - Repository arguments
   * @returns {Promise<Object>} Created repository
   */
  async createRepository(args = {}) {
    this.ensureAuthenticated();

    const { name, description = '', private: isPrivate = false, autoInit = true } = args;

    if (!name) {
      throw new Error('Repository name is required');
    }

    try {
      let cmd = `gh repo create ${name} --description "${description}"`;

      if (isPrivate) {
        cmd += ' --private';
      } else {
        cmd += ' --public';
      }

      if (autoInit) {
        cmd += ' --initialize';
      } else {
        cmd += ' --disable-issues';
      }

      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

      Logger.info(`Created GitHub repository: ${name}`);

      return {
        success: true,
        message: `Repository ${name} created successfully`,
        repository: {
          name,
          description,
          private: isPrivate,
          url: `https://github.com/${this.getUsername()}/${name}`
        }
      };
    } catch (error) {
      Logger.error(`Failed to create repository: ${error.message}`);
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  /**
   * Create a GitHub issue
   * @param {Object} args - Issue arguments
   * @returns {Promise<Object>} Created issue
   */
  async createIssue(args = {}) {
    this.ensureAuthenticated();

    const { repo, title, body = '', labels = [], assignees = [] } = args;

    if (!repo || !title) {
      throw new Error('Repository and title are required');
    }

    try {
      let cmd = `gh issue create --repo ${repo} --title "${title}" --body "${body}"`;

      if (labels.length > 0) {
        cmd += ` --label "${labels.join(',')}"`;
      }

      if (assignees.length > 0) {
        cmd += ` --assignee "${assignees.join(',')}"`;
      }

      const { stdout } = await execAsync(cmd, { timeout: 30000 });

      // Extract issue URL from output
      const urlMatch = stdout.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/\d+/);
      const issueUrl = urlMatch ? urlMatch[0] : '';

      // Extract issue number
      const numMatch = issueUrl.match(/\/issues\/(\d+)/);
      const issueNumber = numMatch ? parseInt(numMatch[1]) : null;

      Logger.info(`Created GitHub issue: ${issueNumber}`);

      return {
        success: true,
        message: `Issue #${issueNumber} created successfully`,
        issue: {
          number: issueNumber,
          title,
          url: issueUrl,
          repository: repo,
          labels,
          assignees
        }
      };
    } catch (error) {
      Logger.error(`Failed to create issue: ${error.message}`);
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  /**
   * Create a pull request
   * @param {Object} args - PR arguments
   * @returns {Promise<Object>} Created PR
   */
  async createPullRequest(args = {}) {
    this.ensureAuthenticated();

    const { repo, title, body = '', head, base = 'main', draft = false } = args;

    if (!repo || !title || !head) {
      throw new Error('Repository, title, and head branch are required');
    }

    try {
      let cmd = `gh pr create --repo ${repo} --title "${title}" --body "${body}" --head ${head} --base ${base}`;

      if (draft) {
        cmd += ' --draft';
      }

      const { stdout } = await execAsync(cmd, { timeout: 30000 });

      // Extract PR URL from output
      const urlMatch = stdout.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/);
      const prUrl = urlMatch ? urlMatch[0] : '';

      // Extract PR number
      const numMatch = prUrl.match(/\/pull\/(\d+)/);
      const prNumber = numMatch ? parseInt(numMatch[1]) : null;

      Logger.info(`Created GitHub PR: ${prNumber}`);

      return {
        success: true,
        message: `Pull request #${prNumber} created successfully`,
        pullRequest: {
          number: prNumber,
          title,
          url: prUrl,
          repository: repo,
          head,
          base,
          draft
        }
      };
    } catch (error) {
      Logger.error(`Failed to create pull request: ${error.message}`);
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  /**
   * List issues for a repository
   * @param {Object} args - List arguments
   * @returns {Promise<Object>} List of issues
   */
  async listIssues(args = {}) {
    this.ensureAuthenticated();

    const { repo, state = 'open', limit = 50 } = args;

    if (!repo) {
      throw new Error('Repository is required');
    }

    try {
      const cmd = `gh issue list --repo ${repo} --state ${state} --limit ${limit} --json number,title,state,author,labels,url`;

      const { stdout } = await execAsync(cmd, { timeout: 30000 });

      const issues = JSON.parse(stdout);

      Logger.info(`Listed ${issues.length} issues from ${repo}`);

      return {
        success: true,
        issues,
        count: issues.length,
        repository: repo,
        state
      };
    } catch (error) {
      Logger.error(`Failed to list issues: ${error.message}`);
      throw new Error(`Failed to list issues: ${error.message}`);
    }
  }

  /**
   * Update an issue
   * @param {Object} args - Update arguments
   * @returns {Promise<Object>} Updated issue
   */
  async updateIssue(args = {}) {
    this.ensureAuthenticated();

    const { repo, issueNumber, state, comment, labels } = args;

    if (!repo || !issueNumber) {
      throw new Error('Repository and issue number are required');
    }

    try {
      let cmd = `gh issue update ${issueNumber} --repo ${repo}`;

      if (state) {
        cmd += ` --state ${state}`;
      }

      if (comment) {
        cmd += ` --comment "${comment}"`;
      }

      if (labels && labels.length > 0) {
        cmd += ` --add-label "${labels.join(',')}"`;
      }

      await execAsync(cmd, { timeout: 30000 });

      Logger.info(`Updated GitHub issue: ${issueNumber}`);

      return {
        success: true,
        message: `Issue #${issueNumber} updated successfully`,
        issue: {
          number: issueNumber,
          repository: repo,
          state,
          labels: labels || []
        }
      };
    } catch (error) {
      Logger.error(`Failed to update issue: ${error.message}`);
      throw new Error(`Failed to update issue: ${error.message}`);
    }
  }

  /**
   * Get current authenticated username
   * @private
   */
  async getUsername() {
    try {
      const { stdout } = await execAsync('gh api user --jq .login', { timeout: 5000 });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get authentication status
   * @returns {Promise<Object>} Auth status
   */
  async getAuthStatus() {
    try {
      const username = await this.getUsername();
      return {
        authenticated: this.authenticated,
        method: this.token ? 'token' : 'gh-cli',
        username: this.authenticated ? username : null
      };
    } catch {
      return {
        authenticated: false,
        method: null,
        username: null
      };
    }
  }
}

/**
 * Create GitHub controller instance
 * @returns {GitHubController} GitHub controller instance
 */
export function createGitHubController() {
  return new GitHubController();
}
