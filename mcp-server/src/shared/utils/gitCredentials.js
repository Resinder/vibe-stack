/**
 * ============================================================================
 * VIBE STACK - Git Credential Utilities
 * ============================================================================
 * Secure git credential injection and management
 * @version 1.0.0
 * ============================================================================
 */

import { Logger } from '../../utils/logger.js';

/**
 * Parse git URL to extract components
 * @param {string} url - Git URL to parse
 * @returns {Object|null} Parsed URL components or null if invalid
 */
export function parseGitUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // SSH format: git@github.com:user/repo.git
  const sshMatch = url.match(/^git@([\w.-]+):([\w-]+)\/([\w.-]+)\.git$/);
  if (sshMatch) {
    return {
      host: sshMatch[1],
      owner: sshMatch[2],
      repo: sshMatch[3].replace(/\.git$/, ''),
      protocol: 'ssh',
      original: url
    };
  }

  // HTTPS format: https://github.com/user/repo.git
  const httpsMatch = url.match(/^https?:\/\/([\w.-]+)\/([\w-]+)\/([\w.-]+)(\.git)?$/);
  if (httpsMatch) {
    return {
      host: httpsMatch[1],
      owner: httpsMatch[2],
      repo: httpsMatch[3].replace(/\.git$/, ''),
      protocol: 'https',
      original: url
    };
  }

  return null;
}

/**
 * Inject authentication token into git URL
 * @param {string} url - Original git URL
 * @param {string} token - Authentication token
 * @returns {string|null} Authenticated URL or null if invalid
 */
export function injectTokenIntoUrl(url, token) {
  if (!url || !token) {
    return url;
  }

  const parsed = parseGitUrl(url);
  if (!parsed) {
    Logger.warn(`[GIT] Unable to parse URL for token injection: ${url}`);
    return url;
  }

  // Only support HTTPS for token injection
  if (parsed.protocol !== 'https') {
    Logger.warn(`[GIT] Token injection only supported for HTTPS URLs, got: ${parsed.protocol}`);
    return url;
  }

  // Build authenticated URL: https://TOKEN@github.com/user/repo.git
  const authenticatedUrl = `https://${token}@${parsed.host}/${parsed.owner}/${parsed.repo}.git`;
  return authenticatedUrl;
}

/**
 * Check if URL requires authentication (private repo detection heuristic)
 * @param {string} url - Git URL to check
 * @returns {boolean} True if authentication likely needed
 */
export function requiresAuthentication(url) {
  // We can't know for sure without trying, but we can assume
  // that users want to use stored credentials when available
  return true;
}

/**
 * Build authenticated git clone command
 * @param {Object} options - Command options
 * @param {string} options.url - Repository URL
 * @param {string} options.token - Authentication token (optional)
 * @param {string} options.branch - Branch to clone (optional)
 * @param {string} options.targetPath - Target directory path
 * @returns {string} Git clone command
 */
export function buildAuthenticatedCloneCommand(options) {
  const { url, token, branch, targetPath } = options;

  if (!url) {
    throw new Error('Repository URL is required');
  }

  // Use authenticated URL if token provided
  const cloneUrl = token ? injectTokenIntoUrl(url, token) : url;
  const branchFlag = branch ? `--branch ${branch} --single-branch` : '';

  return `git clone ${branchFlag} ${cloneUrl} "${targetPath}"`;
}

/**
 * Build git config for credential storage
 * @param {string} token - GitHub token
 * @returns {Array<string>} Git config commands
 */
export function buildGitCredentialConfig(token) {
  // For GitHub, we can use the token in the URL or configure credential.helper
  // The simplest approach is to use credential.helper with store
  return [
    `git config --global credential.helper 'store --file=.git-credentials'`,
    `git config --global url."https://${token}@github.com/".insteadOf "https://github.com/"`
  ];
}

/**
 * Sanitize URL for logging (remove token)
 * @param {string} url - URL that may contain token
 * @returns {string} Sanitized URL safe for logging
 */
export function sanitizeUrlForLogging(url) {
  if (!url) {
    return '(no url)';
  }

  // Replace token in URL: https://TOKEN@github.com/... -> https://***@github.com/...
  return url.replace(/https:\/\/([^@]+)@/, 'https://***@');
}

/**
 * Validate git repository URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid git URL
 */
export function isValidGitUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const gitPatterns = [
    /^https?:\/\/.+\.git$/,
    /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+/,
    /^https?:\/\/gitlab\.com\/[\w-]+\/[\w.-]+/,
    /^https?:\/\/bitbucket\.org\/[\w-]+\/[\w.-]+/,
    /^git@.+:.+\.git$/
  ];

  return gitPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract repository name from URL
 * @param {string} url - Git URL
 * @returns {string} Repository name
 */
export function extractRepoName(url) {
  const parsed = parseGitUrl(url);
  if (parsed) {
    return parsed.repo;
  }

  // Fallback: extract last path component
  let name = url;
  if (name.endsWith('.git')) {
    name = name.slice(0, -4);
  }
  const parts = name.split('/');
  return parts[parts.length - 1];
}

/**
 * Get GitHub username from token (via API)
 * @param {string} token - GitHub token
 * @returns {Promise<string|null>} GitHub username or null
 */
export async function getGitHubUsername(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Vibe-Stack/3.4.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.login || null;
  } catch (error) {
    Logger.warn('[GIT] Failed to get GitHub username from token', error);
    return null;
  }
}

/**
 * Configure git user.name and user.email for commits
 * @param {Object} options - Configuration options
 * @param {string} options.repoPath - Path to repository
 * @param {string} options.userName - Git user name
 * @param {string} options.userEmail - Git user email
 * @returns {Promise<void>}
 */
export async function configureGitUser(options) {
  const { execAsync } = await import('child_process');
  const { promisify } = await import('util');
  const exec = promisify(execAsync);

  const { repoPath, userName, userEmail } = options;

  if (!repoPath) {
    throw new Error('Repository path is required');
  }

  try {
    if (userName) {
      await exec(`git config user.name "${userName}"`, {
        cwd: repoPath,
        timeout: 5000
      });
      Logger.info(`[GIT] Configured git user.name: ${userName}`);
    }

    if (userEmail) {
      await exec(`git config user.email "${userEmail}"`, {
        cwd: repoPath,
        timeout: 5000
      });
      Logger.info(`[GIT] Configured git user.email: ${userEmail}`);
    }
  } catch (error) {
    Logger.error('[GIT] Failed to configure git user', error);
    throw new Error(`Failed to configure git user: ${error.message}`);
  }
}

/**
 * Configure git credential helper for stored token
 * @param {Object} options - Configuration options
 * @param {string} options.repoPath - Path to repository (or global if empty)
 * @param {string} options.token - GitHub token
 * @returns {Promise<void>}
 */
export async function configureCredentialHelper(options) {
  const { execAsync } = await import('child_process');
  const { promisify } = await import('util');
  const exec = promisify(execAsync);

  const { repoPath, token } = options;

  if (!token) {
    throw new Error('Token is required for credential helper configuration');
  }

  try {
    const cwd = repoPath || undefined;
    const scope = repoPath ? 'local' : 'global';

    // Configure URL rewriting for GitHub
    const rewriteCmd = `git config ${scope} url."https://${token}@github.com/".insteadOf "https://github.com/"`;
    await exec(rewriteCmd, {
      cwd,
      timeout: 5000
    });

    Logger.info(`[GIT] Configured ${scope} credential helper for GitHub`);

    // Also set up credential helper to cache credentials
    const cacheCmd = `git config ${scope} credential.helper 'cache --timeout=3600'`;
    await exec(cacheCmd, {
      cwd,
      timeout: 5000
    });

    Logger.info(`[GIT] Configured ${scope} credential cache (1 hour)`);
  } catch (error) {
    Logger.error('[GIT] Failed to configure credential helper', error);
    throw new Error(`Failed to configure credential helper: ${error.message}`);
  }
}

/**
 * Check if git is available in the environment
 * @returns {Promise<boolean>} True if git is available
 */
export async function isGitAvailable() {
  try {
    const { execAsync } = await import('child_process');
    const { promisify } = await import('util');
    const exec = promisify(execAsync);

    await exec('git --version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export default {
  parseGitUrl,
  injectTokenIntoUrl,
  requiresAuthentication,
  buildAuthenticatedCloneCommand,
  buildGitCredentialConfig,
  sanitizeUrlForLogging,
  isValidGitUrl,
  extractRepoName,
  getGitHubUsername,
  configureGitUser,
  configureCredentialHelper,
  isGitAvailable
};
