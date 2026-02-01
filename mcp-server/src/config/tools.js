/**
 * ============================================================================
 * VIBE STACK - MCP Tool Definitions
 * ============================================================================
 * MCP tool definitions for Open WebUI integration
 * @version 1.0.0
 * ============================================================================
 */

import { LANES, PRIORITY } from './constants.js';

/**
 * MCP Tool definitions
 * @constant {Array<Object>}
 */
export const TOOLS = [
  {
    name: 'vibe_get_board',
    description: 'Get the complete Vibe Kanban board state',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'vibe_create_task',
    description: 'Create a new task in Vibe Kanban',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        lane: {
          type: 'string',
          enum: LANES.ALL,
          default: LANES.DEFAULT
        },
        priority: {
          type: 'string',
          enum: PRIORITY.ALL,
          default: PRIORITY.DEFAULT
        },
        estimatedHours: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
  },
  {
    name: 'vibe_generate_plan',
    description: 'Generate an intelligent task plan from a goal. Automatically detects patterns (auth, API, database, frontend, etc.) and creates appropriate tasks with time estimates.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'High-level goal (e.g., "Add OAuth authentication with Google and GitHub")',
        },
        context: {
          type: 'string',
          description: 'Additional context or constraints',
        },
        targetLane: {
          type: 'string',
          enum: ['backlog', 'todo'],
          default: 'backlog',
        },
      },
      required: ['goal'],
    },
  },
  {
    name: 'vibe_analyze_goal',
    description: 'Analyze a goal to detect patterns and estimate task count before generating',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string' },
      },
      required: ['goal'],
    },
  },
  {
    name: 'vibe_get_context',
    description: 'Get current board context for AI decision-making',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'vibe_move_task',
    description: 'Move a task to a different lane',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        targetLane: {
          type: 'string',
          enum: LANES.ALL,
        },
      },
      required: ['taskId', 'targetLane'],
    },
  },
  {
    name: 'vibe_update_task',
    description: 'Update task properties',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: {
          type: 'string',
          enum: PRIORITY.ALL,
        },
        status: { type: 'string' },
        estimatedHours: { type: 'number' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'vibe_search_tasks',
    description: 'Search tasks by title, description, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        lane: {
          type: 'string',
          enum: LANES.ALL,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'vibe_get_stats',
    description: 'Get board statistics and metrics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'vibe_batch_create',
    description: 'Create multiple tasks at once',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              lane: { type: 'string' },
              priority: { type: 'string' },
              estimatedHours: { type: 'number' },
            },
            required: ['title'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  // Repository Management Tools
  {
    name: 'vibe_clone_repo',
    description: 'Clone a git repository to the local workspace. Supports GitHub, GitLab, Bitbucket, and any git URL. Repository will be cloned to the repos directory.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Git repository URL (e.g., https://github.com/user/repo.git)',
        },
        name: {
          type: 'string',
          description: 'Custom repository name (optional, defaults to repo name from URL)',
        },
        branch: {
          type: 'string',
          description: 'Specific branch to clone (optional, defaults to default branch)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'vibe_list_repos',
    description: 'List all cloned repositories in the workspace with their details (name, URL, branch, path)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'vibe_analyze_repo',
    description: 'Analyze a repository to detect its structure, programming languages, file count, and size. Useful for understanding codebase before making changes.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name (as shown in vibe_list_repos)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'vibe_read_file',
    description: 'Read a file from a repository. Returns file content with line numbers. Useful for examining code, configuration files, documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        filePath: {
          type: 'string',
          description: 'File path relative to repository root (e.g., src/index.js or README.md)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to read (optional, default 1000)',
        },
      },
      required: ['repo', 'filePath'],
    },
  },
  {
    name: 'vibe_search_code',
    description: 'Search for text/patterns across all files in a repository. Returns matching files with line numbers and context. Useful for finding function definitions, variable usage, or specific code patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        query: {
          type: 'string',
          description: 'Search query (text to find in files)',
        },
        filePattern: {
          type: 'string',
          description: 'File pattern to limit search (optional, e.g., "*.js" for JavaScript files only)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum results to return (optional, default 50)',
        },
      },
      required: ['repo', 'query'],
    },
  },
  {
    name: 'vibe_delete_repo',
    description: 'Delete a cloned repository from the workspace. Use with caution - this cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name to delete',
        },
      },
      required: ['name'],
    },
  },
  // ==================== GitHub Tools ====================
  {
    name: 'vibe_github_auth_status',
    description: 'Check GitHub authentication status. Returns whether GitHub CLI or token is authenticated.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'vibe_github_create_repo',
    description: 'Create a new GitHub repository. Requires GitHub authentication (GITHUB_TOKEN or gh CLI).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name',
        },
        description: {
          type: 'string',
          description: 'Repository description',
        },
        private: {
          type: 'boolean',
          description: 'Whether repository is private (default: false)',
        },
        autoInit: {
          type: 'boolean',
          description: 'Initialize with README (default: true)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'vibe_github_create_issue',
    description: 'Create a GitHub issue. Links Vibe Stack tasks to GitHub issues for project tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository (format: owner/repo)',
        },
        title: {
          type: 'string',
          description: 'Issue title',
        },
        body: {
          type: 'string',
          description: 'Issue body/description',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Issue labels',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Assignees (GitHub usernames)',
        },
      },
      required: ['repo', 'title'],
    },
  },
  {
    name: 'vibe_github_create_pr',
    description: 'Create a pull request. Useful for automating PR creation when completing feature tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository (format: owner/repo)',
        },
        title: {
          type: 'string',
          description: 'PR title',
        },
        body: {
          type: 'string',
          description: 'PR description',
        },
        head: {
          type: 'string',
          description: 'Head branch (your branch)',
        },
        base: {
          type: 'string',
          description: 'Base branch (default: main)',
        },
        draft: {
          type: 'boolean',
          description: 'Create as draft PR (default: false)',
        },
      },
      required: ['repo', 'title', 'head'],
    },
  },
  {
    name: 'vibe_github_list_issues',
    description: 'List issues from a GitHub repository. Useful for syncing GitHub issues with Vibe Kanban tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository (format: owner/repo)',
        },
        state: {
          type: 'string',
          enum: ['open', 'closed', 'all'],
          description: 'Issue state filter (default: open)',
        },
        limit: {
          type: 'number',
          description: 'Maximum issues to return (default: 50)',
        },
      },
      required: ['repo'],
    },
  },
  {
    name: 'vibe_github_update_issue',
    description: 'Update a GitHub issue. Can add comments, change state, or add labels.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository (format: owner/repo)',
        },
        issueNumber: {
          type: 'string',
          description: 'Issue number',
        },
        state: {
          type: 'string',
          enum: ['open', 'closed'],
          description: 'New issue state',
        },
        comment: {
          type: 'string',
          description: 'Comment to add',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add',
        },
      },
      required: ['repo', 'issueNumber'],
    },
  },
  // ==================== File Tools ====================
  {
    name: 'vibe_write_file',
    description: 'Write content to a file in the workspace. Automatically creates parent directories if needed. Useful for code generation, configuration updates, documentation creation.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'File path relative to workspace (e.g., src/index.ts or README.md)',
        },
        content: {
          type: 'string',
          description: 'File content',
        },
        createDirs: {
          type: 'boolean',
          description: 'Create parent directories (default: true)',
        },
      },
      required: ['filePath', 'content'],
    },
  },
  {
    name: 'vibe_list_files',
    description: 'List files in a directory. Optionally recursive and with pattern filtering. Useful for exploring repository structure.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory path relative to workspace (default: current directory)',
        },
        recursive: {
          type: 'boolean',
          description: 'List files recursively (default: false)',
        },
        pattern: {
          type: 'string',
          description: 'File pattern filter (e.g., "*.js" for JavaScript only)',
        },
      },
    },
  },
  {
    name: 'vibe_delete_file',
    description: 'Delete a file or directory. Use with caution - this cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to file or directory',
        },
        recursive: {
          type: 'boolean',
          description: 'Delete directories recursively (default: true)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'vibe_move_file',
    description: 'Move or rename a file/directory. Automatically creates target directory if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Source path',
        },
        destination: {
          type: 'string',
          description: 'Destination path',
        },
      },
      required: ['source', 'destination'],
    },
  },
  {
    name: 'vibe_create_directory',
    description: 'Create a directory in the workspace. Automatically creates parent directories.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path',
        },
        recursive: {
          type: 'boolean',
          description: 'Create parent directories (default: true)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'vibe_get_file_info',
    description: 'Get detailed information about a file or directory including size, permissions, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to file or directory',
        },
      },
      required: ['path'],
    },
  },
  // ==================== Command Tools ====================
  {
    name: 'vibe_run_command',
    description: 'Run a shell command in the workspace. Security-filtered allowed commands. Supports npm, python, git, docker, and other common dev tools.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command to execute',
        },
        directory: {
          type: 'string',
          description: 'Working directory relative to workspace (default: current)',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 60000)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'vibe_run_tests',
    description: 'Run tests for a project. Auto-detects test framework (Jest, Vitest, pytest, etc.) or accepts explicit framework. Optionally generates coverage reports.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        framework: {
          type: 'string',
          description: 'Test framework (default: auto-detect)',
        },
        coverage: {
          type: 'boolean',
          description: 'Generate coverage report (default: false)',
        },
      },
    },
  },
  {
    name: 'vibe_run_script',
    description: 'Run an npm/yarn/pnpm script from package.json. Useful for running custom project scripts.',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'Script name from package.json',
        },
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        args: {
          type: 'string',
          description: 'Additional arguments to pass to script',
        },
      },
      required: ['script'],
    },
  },
  {
    name: 'vibe_install_deps',
    description: 'Install project dependencies. Auto-detects package manager (npm, yarn, pnpm, bun, pip, cargo) or accepts explicit manager.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        manager: {
          type: 'string',
          description: 'Package manager (default: auto-detect)',
        },
      },
    },
  },
  // ==================== Git Tools ====================
  {
    name: 'vibe_git_status',
    description: 'Get git status showing modified, added, deleted, and untracked files. Useful for reviewing changes before committing.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path relative to workspace (default: current)',
        },
      },
    },
  },
  {
    name: 'vibe_git_commit',
    description: 'Stage and commit changes to git. Useful for automating commit workflows when completing tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
        message: {
          type: 'string',
          description: 'Commit message',
        },
        files: {
          type: 'string',
          description: 'Files to stage (default: all changes)',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'vibe_git_push',
    description: 'Push commits to remote repository. Supports specifying remote and branch.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
        remote: {
          type: 'string',
          description: 'Remote name (default: origin)',
        },
        branch: {
          type: 'string',
          description: 'Branch name (default: current)',
        },
      },
    },
  },
  {
    name: 'vibe_git_pull',
    description: 'Pull changes from remote repository. Keeps local repository up to date.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
        remote: {
          type: 'string',
          description: 'Remote name (default: origin)',
        },
        branch: {
          type: 'string',
          description: 'Branch name (default: current)',
        },
      },
    },
  },
  {
    name: 'vibe_git_create_branch',
    description: 'Create a new git branch. Useful for feature branch workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
        name: {
          type: 'string',
          description: 'Branch name',
        },
        checkout: {
          type: 'boolean',
          description: 'Checkout branch after creation (default: true)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'vibe_git_switch_branch',
    description: 'Switch to an existing branch or create and switch to new branch.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
        name: {
          type: 'string',
          description: 'Branch name',
        },
        create: {
          type: 'boolean',
          description: 'Create branch if it does not exist (default: false)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'vibe_git_log',
    description: 'Get commit history. Useful for reviewing recent changes and understanding repository history.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
        limit: {
          type: 'number',
          description: 'Number of commits to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'vibe_git_info',
    description: 'Get repository information including current branch, remote URL, latest commit, and total commits.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository path (default: current)',
        },
      },
    },
  },
  // ==================== Code Quality Tools ====================
  {
    name: 'vibe_lint_code',
    description: 'Run linters on code. Auto-detects ESLint (JavaScript/TypeScript), Pylint (Python), or Flake8 (Python). Optionally auto-fix issues.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        linter: {
          type: 'string',
          description: 'Specific linter to use (default: auto-detect)',
        },
        fix: {
          type: 'boolean',
          description: 'Auto-fix issues when possible (default: false)',
        },
        severity: {
          type: 'string',
          enum: ['error', 'warning', 'all'],
          description: 'Filter by severity (default: all)',
        },
      },
    },
  },
  {
    name: 'vibe_format_code',
    description: 'Format code using formatters. Auto-detects Prettier (JavaScript/TypeScript) or Black (Python). Can check or write formatting.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        formatter: {
          type: 'string',
          description: 'Specific formatter to use (default: auto-detect)',
        },
        check: {
          type: 'boolean',
          description: 'Only check formatting without writing (default: false)',
        },
        write: {
          type: 'boolean',
          description: 'Write formatting changes (default: true)',
        },
      },
    },
  },
  {
    name: 'vibe_analyze_complexity',
    description: 'Analyze code complexity using ESLint complexity plugin. Identifies complex functions that may need refactoring.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        threshold: {
          type: 'number',
          description: 'Complexity threshold (default: 10)',
        },
      },
    },
  },
  {
    name: 'vibe_security_scan',
    description: 'Run security audit on dependencies. Supports npm audit (JavaScript) and safety check (Python). Filters vulnerabilities by severity.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Project directory (default: current)',
        },
        severity: {
          type: 'string',
          enum: ['low', 'moderate', 'high', 'critical'],
          description: 'Filter by severity level',
        },
        auditLevel: {
          type: 'string',
          enum: ['info', 'low', 'moderate', 'high', 'critical'],
          description: 'Fail threshold for audit (default: moderate)',
        },
      },
    },
  },
  // ==================== API Testing Tools ====================
  {
    name: 'vibe_test_endpoint',
    description: 'Test an HTTP endpoint and validate response. Supports any HTTP method, custom headers, and request body. Validates against expected status code.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Endpoint URL to test',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
          description: 'HTTP method (default: GET)',
        },
        headers: {
          type: 'object',
          description: 'Request headers as key-value pairs',
        },
        body: {
          type: 'string',
          description: 'Request body (for POST, PUT, PATCH)',
        },
        expectedStatus: {
          type: 'number',
          description: 'Expected HTTP status code (default: 200)',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds (default: 30000)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'vibe_http_request',
    description: 'Make an HTTP request and return detailed response. Useful for API debugging and testing.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Request URL',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
          description: 'HTTP method (default: GET)',
        },
        headers: {
          type: 'object',
          description: 'Request headers',
        },
        body: {
          type: 'string',
          description: 'Request body',
        },
        verbose: {
          type: 'boolean',
          description: 'Include verbose output (default: true)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'vibe_validate_api',
    description: 'Validate OpenAPI/Swagger specification. Ensures API spec is valid and follows best practices.',
    inputSchema: {
      type: 'object',
      properties: {
        specFile: {
          type: 'string',
          description: 'Path to OpenAPI spec file (e.g., openapi.yaml, swagger.json)',
        },
        directory: {
          type: 'string',
          description: 'Directory containing spec file (default: current)',
        },
      },
    },
  },
  // ==================== Environment Tools ====================
  {
    name: 'vibe_env_list',
    description: 'List all environment variables from .env file. Sensitive values (passwords, tokens, keys) are automatically masked.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory containing .env file (default: current)',
        },
        includeSystem: {
          type: 'boolean',
          description: 'Include system environment variables (default: false)',
        },
      },
    },
  },
  {
    name: 'vibe_env_get',
    description: 'Get a specific environment variable value. Falls back to system environment if not in .env. Sensitive values are masked.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Environment variable key',
        },
        directory: {
          type: 'string',
          description: 'Directory containing .env file (default: current)',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'vibe_env_set',
    description: 'Set an environment variable in .env file. Creates .env file if it does not exist.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Environment variable key',
        },
        value: {
          type: 'string',
          description: 'Environment variable value',
        },
        directory: {
          type: 'string',
          description: 'Directory for .env file (default: current)',
        },
        createFile: {
          type: 'boolean',
          description: 'Create .env file if it does not exist (default: true)',
        },
      },
      required: ['key', 'value'],
    },
  },
  // ==================== Docker Tools ====================
  {
    name: 'vibe_docker_ps',
    description: 'List Docker containers. Shows running containers by default, optionally all containers.',
    inputSchema: {
      type: 'object',
      properties: {
        all: {
          type: 'boolean',
          description: 'List all containers including stopped (default: false)',
        },
      },
    },
  },
  {
    name: 'vibe_docker_logs',
    description: 'Get logs from a Docker container. Supports tail and follow modes for log monitoring.',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
        tail: {
          type: 'number',
          description: 'Number of lines from end (default: 100)',
        },
        follow: {
          type: 'boolean',
          description: 'Follow log output (default: false)',
        },
      },
      required: ['container'],
    },
  },
  {
    name: 'vibe_docker_exec',
    description: 'Execute a command inside a running Docker container. Useful for debugging and container management.',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
        command: {
          type: 'string',
          description: 'Command to execute',
        },
        interactive: {
          type: 'boolean',
          description: 'Interactive mode with TTY (default: false)',
        },
      },
      required: ['container', 'command'],
    },
  },
  {
    name: 'vibe_docker_restart',
    description: 'Restart a Docker container. Useful for applying configuration changes or troubleshooting.',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
      },
      required: ['container'],
    },
  },
  {
    name: 'vibe_docker_stop',
    description: 'Stop a running Docker container.',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
      },
      required: ['container'],
    },
  },
  {
    name: 'vibe_docker_start',
    description: 'Start a stopped Docker container.',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
      },
      required: ['container'],
    },
  },
  {
    name: 'vibe_docker_stats',
    description: 'Get Docker container statistics including CPU, memory, network, and disk I/O.',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID (optional, defaults to all containers)',
        },
      },
    },
  },
  {
    name: 'vibe_docker_compose',
    description: 'Run Docker Compose commands. Supports up, down, restart, logs, and other compose actions.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Compose action (default: up)',
        },
        directory: {
          type: 'string',
          description: 'Directory containing docker-compose.yml',
        },
        services: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific services to target',
        },
        detached: {
          type: 'boolean',
          description: 'Run in detached mode (default: true for up)',
        },
      },
    },
  },
  // ==================== Documentation Tools ====================
  {
    name: 'vibe_generate_readme',
    description: 'Auto-generate README.md from repository analysis. Detects language, dependencies, scripts, and test setup. Creates comprehensive documentation automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository name or path (default: current)',
        },
        force: {
          type: 'boolean',
          description: 'Overwrite existing README.md (default: false)',
        },
      },
    },
  },
  {
    name: 'vibe_generate_api_docs',
    description: 'Generate API documentation by scanning code for endpoint definitions. Detects Express, Flask, and FastAPI routes. Creates markdown documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository name or path (default: current)',
        },
        format: {
          type: 'string',
          enum: ['markdown'],
          description: 'Documentation format (default: markdown)',
        },
        outputFile: {
          type: 'string',
          description: 'Output file name (default: API.md)',
        },
      },
    },
  },
  // ==================== Credential Management Tools (Multi-Platform) ====================
  {
    name: 'vibe_set_credential',
    description: 'Securely store a credential for any provider. Supports GitHub, GitLab, OpenAI, Anthropic, Bitbucket, and more. Usage: "Set my GitHub token to ghp_xxxxx" or "Store my OpenAI API key as sk-xxxxx". Credentials are encrypted with AES-256-GCM.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Provider ID (github, gitlab, openai, anthropic, bitbucket)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
        credential: {
          type: 'string',
          description: 'Credential value (token, API key, etc.)',
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
        scope: {
          type: 'string',
          description: 'Optional scope for multiple credentials (e.g., work, personal, repo:owner/repo)',
        },
      },
      required: ['provider', 'credential'],
    },
  },
  {
    name: 'vibe_get_credential',
    description: 'Retrieve a stored credential for a provider. Usage: "Get my GitHub token" or "Retrieve my OpenAI API key". Returns the decrypted credential value.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Provider ID (github, gitlab, openai, anthropic, bitbucket)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
        scope: {
          type: 'string',
          description: 'Optional scope if credential has one',
        },
      },
      required: ['provider'],
    },
  },
  {
    name: 'vibe_delete_credential',
    description: 'Permanently remove a stored credential. Usage: "Delete my GitHub token" or "Remove my OpenAI API key". Requires confirmation.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Provider ID (github, gitlab, openai, anthropic, bitbucket)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
        scope: {
          type: 'string',
          description: 'Optional scope if credential has one',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation to proceed with removal (default: false)',
        },
      },
      required: ['provider'],
    },
  },
  {
    name: 'vibe_list_credentials',
    description: 'List all stored credentials for a user. Shows providers and scopes without exposing sensitive values. Usage: "List my credentials" or "Show all my stored tokens".',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_credential_status',
    description: 'Get detailed status of stored credentials. Shows which providers are configured, count of credentials, and masked prefixes. Usage: "Check my credential status" or "Show all my configured providers".',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_credential_help',
    description: 'Get help and instructions for managing credentials. Shows supported providers, how to generate tokens, and usage examples.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Optional: Get help for specific provider (github, gitlab, openai, etc.)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
      },
    },
  },
  // ==================== Legacy GitHub Credential Tools (for backward compatibility) ====================
  {
    name: 'vibe_set_github_token',
    description: 'Securely store your GitHub personal access token. Alias for vibe_set_credential with provider=github.',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'GitHub personal access token (starts with ghp_, gho_, or ghu_)',
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
      required: ['token'],
    },
  },
  {
    name: 'vibe_get_github_token_status',
    description: 'Check if your GitHub token is configured. Alias for vibe_credential_status filtered for GitHub.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_remove_github_token',
    description: 'Permanently remove your stored GitHub token. Alias for vibe_delete_credential with provider=github.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation to proceed with removal (default: false)',
        },
      },
    },
  },
  {
    name: 'vibe_clone_authenticated',
    description: 'Clone a repository using stored credentials. Automatically uses your stored GitHub token for authentication.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Repository URL (e.g., https://github.com/user/repo.git)',
        },
        name: {
          type: 'string',
          description: 'Custom repository name (optional, defaults to repo name from URL)',
        },
        branch: {
          type: 'string',
          description: 'Specific branch to clone (optional, defaults to default branch)',
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
      required: ['url'],
    },
  },
  // ==================== Advanced Credential UX Tools ====================
  {
    name: 'vibe_validate_credential',
    description: 'Validate a credential format without storing it. Check if your token is valid before saving. Usage: "Validate my GitHub token ghp_xxxxx" or "Check if this OpenAI key is valid: sk-xxxxx"',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Provider ID (github, gitlab, openai, anthropic, bitbucket)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
        credential: {
          type: 'string',
          description: 'Credential value to validate (token, API key, etc.)',
        },
      },
      required: ['provider', 'credential'],
    },
  },
  {
    name: 'vibe_credential_health',
    description: 'Get health report for all stored credentials. Shows token age, rotation recommendations, and security warnings. Usage: "Check my credential health" or "Show my credential status report"',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_suggest_actions',
    description: 'Get personalized suggestions based on your current setup. Recommends next actions, missing providers, and usage tips. Usage: "What should I do next?" or "Give me suggestions"',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_get_started',
    description: 'Interactive onboarding guide for new users. Shows step-by-step setup instructions. Usage: "Get started" or "Help me set up" or "What do I need to configure?"',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Optional: Get started with specific provider (github, openai, etc.)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
      },
    },
  },
  // ==================== Project & Workspace Management ====================
  {
    name: 'vibe_set_project_credential',
    description: 'Set a credential for a specific project/workspace. Keeps credentials organized by project. Usage: "Set project my-app credential for github to ghp_xxx" or "Set project work GitHub credential to ghp_xxx (environment: staging)"',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project/workspace name (e.g., my-app, work, personal)',
        },
        provider: {
          type: 'string',
          description: 'Provider ID (github, gitlab, openai, anthropic, bitbucket)',
          enum: ['github', 'gitlab', 'openai', 'anthropic', 'bitbucket'],
        },
        credential: {
          type: 'string',
          description: 'Credential value (token, API key, etc.)',
        },
        environment: {
          type: 'string',
          description: 'Environment name (dev, staging, prod, etc.). Default: default',
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
      required: ['project', 'provider', 'credential'],
    },
  },
  {
    name: 'vibe_list_projects',
    description: 'List all projects with their credentials. Shows which providers and environments are configured for each project. Usage: "List my projects" or "Show all workspaces"',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_clone_project',
    description: 'Clone all credentials from one project to another. Useful for setting up staging from production or creating a new project from a template. Usage: "Clone project prod to staging" or "Copy credentials from my-app to my-app-v2"',
    inputSchema: {
      type: 'object',
      properties: {
        sourceProject: {
          type: 'string',
          description: 'Source project name to clone from',
        },
        targetProject: {
          type: 'string',
          description: 'Target project name to clone to',
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
      required: ['sourceProject', 'targetProject'],
    },
  },
  // ==================== Workflow & Context-Aware Features ====================
  {
    name: 'vibe_get_recommendations',
    description: 'Get personalized recommendations based on your current setup and context. Usage: "What do you recommend?" or "Get recommendations for clone_repo" or "What should I add for AI features?"',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Optional context: clone_repo, ai_features, or leave empty for general',
          enum: ['clone_repo', 'ai_features'],
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
    },
  },
  {
    name: 'vibe_quick_setup',
    description: 'Quick setup for common developer scenarios. Pre-configured templates for different workflows. Usage: "Quick setup for fullstack" or "Quick setup for ml_engineer" or "Quick setup for devops"',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          description: 'Pre-configured scenario template',
          enum: ['fullstack', 'ml_engineer', 'devops'],
        },
        userId: {
          type: 'string',
          description: 'User identifier (optional, defaults to current user)',
        },
      },
      required: ['scenario'],
    },
  },
];
