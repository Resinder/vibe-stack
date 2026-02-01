/**
 * ============================================================================
 * VIBE STACK - Repository Controller
 * ============================================================================
 * Repository management operations for cloning, listing, analyzing repos
 * @version 1.0.0
 * ============================================================================
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { Logger } from '../../../utils/logger.js';
import * as GitCredentials from '../../../shared/utils/gitCredentials.js';

const execAsync = promisify(exec);
const REPOS_DIR = path.resolve(process.env.REPOS_PATH || './repos');

/**
 * Repository Controller
 * Handles repository operations with credential integration
 */
export class RepoController {
  /**
   * Create a new RepoController instance
   * @param {Object} credentialStorage - Credential storage instance (optional)
   */
  constructor(credentialStorage = null) {
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
   * Clone a git repository with optional authentication
   * @param {Object} args - Clone arguments
   * @param {string} args.url - Repository URL
   * @param {string} args.name - Repository name (optional, derived from URL if not provided)
   * @param {string} args.branch - Branch to clone (optional, defaults to main/master)
   * @param {string} args.userId - User identifier for credential lookup (optional)
   * @param {boolean} args.useCredentials - Force use of stored credentials (optional)
   * @returns {Promise<Object>} Clone result
   */
  async cloneRepo(args = {}) {
    const { url, name, branch, userId = 'default', useCredentials = false } = args;

    if (!url) {
      throw new Error('Repository URL is required');
    }

    // Validate URL format
    if (!GitCredentials.isValidGitUrl(url)) {
      throw new Error('Invalid git repository URL');
    }

    // Derive repo name from URL if not provided
    const repoName = name || GitCredentials.extractRepoName(url);
    const repoPath = path.join(REPOS_DIR, repoName);

    try {
      // Check if repo already exists
      try {
        await fs.access(repoPath);
        return {
          success: true,
          message: 'Repository already exists',
          repo: {
            name: repoName,
            path: repoPath,
            url
          }
        };
      } catch {
        // Repo doesn't exist, proceed with clone
      }

      // Ensure repos directory exists
      await fs.mkdir(REPOS_DIR, { recursive: true });

      // Determine if we should use authentication
      let token = null;
      const needsAuth = GitCredentials.requiresAuthentication(url);

      if (needsAuth && useCredentials && this.credentialStorage) {
        try {
          token = await this.credentialStorage.getGitHubToken(userId);
          if (token) {
            Logger.info(`[REPO] Using stored credentials for user: ${userId}`);
          }
        } catch (error) {
          Logger.warn(`[REPO] Failed to retrieve credentials, continuing without auth: ${error.message}`);
        }
      }

      // Build authenticated clone command if token available
      const cloneUrl = token ? GitCredentials.injectTokenIntoUrl(url, token) : url;
      const branchFlag = branch ? `--branch ${branch} --single-branch` : '';

      Logger.info(`[REPO] Cloning repository: ${repoName} from ${GitCredentials.sanitizeUrlForLogging(cloneUrl)}`);

      const { stdout, stderr } = await execAsync(
        `git clone ${branchFlag} ${cloneUrl} "${repoPath}"`,
        { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }
      );

      // Configure credential helper if token was used
      if (token) {
        try {
          await GitCredentials.configureCredentialHelper({
            repoPath,
            token
          });
          Logger.info(`[REPO] Configured credential helper for: ${repoName}`);
        } catch (error) {
          Logger.warn(`[REPO] Failed to configure credential helper: ${error.message}`);
        }
      }

      Logger.info(`[REPO] Cloned repository: ${repoName}`);

      return {
        success: true,
        message: 'Repository cloned successfully',
        repo: {
          name: repoName,
          path: repoPath,
          url: GitCredentials.sanitizeUrlForLogging(cloneUrl),
          branch: branch || 'default',
          authenticated: !!token
        }
      };
    } catch (error) {
      Logger.error(`[REPO] Failed to clone repository: ${error.message}`);
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * List all repositories
   * @returns {Promise<Object>} List of repositories
   */
  async listRepos() {
    try {
      await fs.mkdir(REPOS_DIR, { recursive: true });

      const entries = await fs.readdir(REPOS_DIR, { withFileTypes: true });
      const repos = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const repoPath = path.join(REPOS_DIR, entry.name);
          const gitPath = path.join(repoPath, '.git');

          try {
            await fs.access(gitPath);
            // Get git remote URL
            const { stdout } = await execAsync(
              `git -C "${repoPath}" remote get-url origin`,
              { timeout: 5000 }
            );

            // Get current branch
            const { stdout: branchOut } = await execAsync(
              `git -C "${repoPath}" branch --show-current`,
              { timeout: 5000 }
            );

            repos.push({
              name: entry.name,
              path: repoPath,
              url: stdout.trim(),
              branch: branchOut.trim()
            });
          } catch {
            // Not a git repo, skip
          }
        }
      }

      return {
        success: true,
        repos,
        count: repos.length
      };
    } catch (error) {
      Logger.error(`Failed to list repositories: ${error.message}`);
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  }

  /**
   * Analyze a repository structure
   * @param {Object} args - Analysis arguments
   * @param {string} args.name - Repository name
   * @returns {Promise<Object>} Repository analysis
   */
  async analyzeRepo(args = {}) {
    const { name } = args;

    if (!name) {
      throw new Error('Repository name is required');
    }

    const repoPath = path.join(REPOS_DIR, name);

    try {
      await fs.access(repoPath);
    } catch {
      throw new Error(`Repository not found: ${name}`);
    }

    try {
      const analysis = {
        name,
        path: repoPath,
        structure: await this._analyzeStructure(repoPath),
        languages: await this._detectLanguages(repoPath),
        size: await this._calculateSize(repoPath)
      };

      return {
        success: true,
        analysis
      };
    } catch (error) {
      Logger.error(`Failed to analyze repository: ${error.message}`);
      throw new Error(`Failed to analyze repository: ${error.message}`);
    }
  }

  /**
   * Read a file from repository
   * @param {Object} args - File read arguments
   * @param {string} args.repo - Repository name
   * @param {string} args.path - File path relative to repo root
   * @param {number} args.limit - Max lines to read (optional, default 1000)
   * @returns {Promise<Object>} File content
   */
  async readFile(args = {}) {
    const { repo, filePath: relativePath, limit = 1000 } = args;

    if (!repo) {
      throw new Error('Repository name is required');
    }

    if (!relativePath) {
      throw new Error('File path is required');
    }

    const repoPath = path.join(REPOS_DIR, repo);
    const fullPath = path.join(repoPath, relativePath);

    try {
      // Security check: ensure path is within repo
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(path.resolve(repoPath))) {
        throw new Error('Invalid file path');
      }

      const content = await fs.readFile(resolvedPath, 'utf-8');
      const lines = content.split('\n');

      return {
        success: true,
        file: {
          path: relativePath,
          content: limit > 0 ? lines.slice(0, limit).join('\n') : content,
          totalLines: lines.length,
          truncated: limit > 0 && lines.length > limit,
          encoding: 'utf-8'
        }
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${relativePath}`);
      }
      Logger.error(`Failed to read file: ${error.message}`);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Search code in repository
   * @param {Object} args - Search arguments
   * @param {string} args.repo - Repository name
   * @param {string} args.query - Search query
   * @param {string} args.filePattern - File pattern to search (optional, e.g., "*.js")
   * @param {number} args.maxResults - Maximum results to return (optional, default 50)
   * @returns {Promise<Object>} Search results
   */
  async searchCode(args = {}) {
    const { repo, query, filePattern, maxResults = 50 } = args;

    if (!repo) {
      throw new Error('Repository name is required');
    }

    if (!query) {
      throw new Error('Search query is required');
    }

    const repoPath = path.join(REPOS_DIR, repo);

    try {
      await fs.access(repoPath);
    } catch {
      throw new Error(`Repository not found: ${repo}`);
    }

    try {
      const pattern = filePattern || '';
      const { stdout } = await execAsync(
        `grep -r -n -i --include="${pattern}" --color=never "${query}" "${repoPath}" | head -n ${maxResults}`,
        { timeout: 30000, maxBuffer: 1024 * 1024 * 5 }
      );

      const results = stdout.trim().split('\n')
        .filter(line => line.length > 0)
        .map(line => {
          const [filePath, lineNum, ...contentParts] = line.split(':');
          return {
            file: path.relative(repoPath, filePath),
            line: parseInt(lineNum),
            content: contentParts.join(':').trim()
          };
        });

      return {
        success: true,
        query,
        results,
        count: results.length
      };
    } catch (error) {
      if (error.status === 1) {
        // grep returns 1 when no matches found
        return {
          success: true,
          query,
          results: [],
          count: 0
        };
      }
      Logger.error(`Failed to search code: ${error.message}`);
      throw new Error(`Failed to search code: ${error.message}`);
    }
  }

  /**
   * Validate git URL format
   * @private
   * @deprecated Use GitCredentials.isValidGitUrl() instead
   */
  _isValidGitUrl(url) {
    return GitCredentials.isValidGitUrl(url);
  }

  /**
   * Extract repo name from URL
   * @private
   * @deprecated Use GitCredentials.extractRepoName() instead
   */
  _extractRepoName(url) {
    return GitCredentials.extractRepoName(url);
  }

  /**
   * Analyze repository structure
   * @private
   */
  async _analyzeStructure(repoPath) {
    const structure = {
      directories: [],
      files: [],
      totalFiles: 0,
      totalDirectories: 0
    };

    async function walkDir(dir, basePath = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip .git directory
        if (entry.name === '.git') continue;
        // Skip node_modules
        if (entry.name === 'node_modules') continue;

        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          structure.directories.push(relativePath);
          structure.totalDirectories++;
          await walkDir(path.join(dir, entry.name), relativePath);
        } else {
          structure.files.push(relativePath);
          structure.totalFiles++;
        }
      }
    }

    await walkDir(repoPath);

    // Limit results for large repos
    if (structure.files.length > 500) {
      structure.files = structure.files.slice(0, 500);
      structure.filesTruncated = true;
    }
    if (structure.directories.length > 200) {
      structure.directories = structure.directories.slice(0, 200);
      structure.directoriesTruncated = true;
    }

    return structure;
  }

  /**
   * Detect programming languages
   * @private
   */
  async _detectLanguages(repoPath) {
    const extensions = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript (React)',
      '.tsx': 'TypeScript (React)',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.kt': 'Kotlin',
      '.c': 'C',
      '.cpp': 'C++',
      '.h': 'C/C++ Header',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.swift': 'Swift',
      '.dart': 'Dart',
      '.scala': 'Scala',
      '.sh': 'Shell',
      '.md': 'Markdown',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.xml': 'XML',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'Sass',
      '.vue': 'Vue',
      '.svelte': 'Svelte'
    };

    const languages = {};

    async function countFiles(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await countFiles(fullPath);
        } else {
          const ext = path.extname(entry.name);
          if (extensions[ext]) {
            languages[extensions[ext]] = (languages[extensions[ext]] || 0) + 1;
          }
        }
      }
    }

    await countFiles(repoPath);

    // Sort by count
    const sorted = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({ language: lang, files: count }));

    return sorted;
  }

  /**
   * Calculate repository size
   * @private
   */
  async _calculateSize(repoPath) {
    const { stdout } = await execAsync(
      `du -sh "${repoPath}"`,
      { timeout: 10000 }
    );
    const size = stdout.split('\t')[0];
    return size;
  }

  /**
   * Delete a repository
   * @param {Object} args - Delete arguments
   * @param {string} args.name - Repository name
   * @returns {Promise<Object>} Delete result
   */
  async deleteRepo(args = {}) {
    const { name } = args;

    if (!name) {
      throw new Error('Repository name is required');
    }

    const repoPath = path.join(REPOS_DIR, name);

    try {
      await fs.access(repoPath);
    } catch {
      throw new Error(`Repository not found: ${name}`);
    }

    try {
      await fs.rm(repoPath, { recursive: true, force: true });
      Logger.info(`Deleted repository: ${name}`);

      return {
        success: true,
        message: `Repository ${name} deleted successfully`
      };
    } catch (error) {
      Logger.error(`Failed to delete repository: ${error.message}`);
      throw new Error(`Failed to delete repository: ${error.message}`);
    }
  }
}

/**
 * Create repo controller instance
 * @param {Object} credentialStorage - Credential storage instance (optional)
 * @returns {RepoController} Repo controller instance
 */
export function createRepoController(credentialStorage = null) {
  return new RepoController(credentialStorage);
}
