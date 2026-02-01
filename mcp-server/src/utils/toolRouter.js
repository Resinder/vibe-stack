/**
 * ============================================================================
 * VIBE STACK - Tool Router Utility
 * ============================================================================
 * Shared routing logic for MCP tool calls
 * Enhanced with external MCP server support
 * @version 1.0.0
 * ============================================================================
 */

import { mcpClientManager } from '../mcp/clientManager.js';
import { Logger } from './logger.js';

/**
 * Route MCP tool call to appropriate controller
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @param {Object} controllers - Controller instances
 * @returns {Promise<Object>} Tool result
 * @throws {Error} If tool is unknown
 */
export async function handleToolCall(name, args, {
  taskController,
  boardController,
  planningController,
  repoController,
  githubController,
  fileController,
  commandController,
  gitController,
  codeQualityController,
  apiTestingController,
  environmentController,
  dockerController,
  documentationController,
  credentialController
}) {
  switch (name) {
    // ==================== Task Management Tools ====================
    case 'vibe_get_board':
      return boardController.getBoard(args);
    case 'vibe_create_task':
      return taskController.createTask(args);
    case 'vibe_move_task':
      return taskController.moveTask(args);
    case 'vibe_update_task':
      return taskController.updateTask(args);
    case 'vibe_generate_plan':
      return planningController.generatePlan(args);
    case 'vibe_search_tasks':
      return taskController.searchTasks(args);
    case 'vibe_get_stats':
      return boardController.getStats(args);
    case 'vibe_analyze_goal':
      return planningController.analyzeGoal(args);
    case 'vibe_batch_create':
      return taskController.batchCreate(args);
    case 'vibe_get_context':
      return boardController.getContext(args);

    // ==================== Repository Tools ====================
    case 'vibe_clone_repo':
      return repoController.cloneRepo(args);
    case 'vibe_list_repos':
      return repoController.listRepos();
    case 'vibe_analyze_repo':
      return repoController.analyzeRepo(args);
    case 'vibe_read_file':
      return repoController.readFile(args);
    case 'vibe_search_code':
      return repoController.searchCode(args);
    case 'vibe_delete_repo':
      return repoController.deleteRepo(args);

    // ==================== GitHub Tools ====================
    case 'vibe_github_auth_status':
      return githubController.getAuthStatus();
    case 'vibe_github_create_repo':
      return githubController.createRepository(args);
    case 'vibe_github_create_issue':
      return githubController.createIssue(args);
    case 'vibe_github_create_pr':
      return githubController.createPullRequest(args);
    case 'vibe_github_list_issues':
      return githubController.listIssues(args);
    case 'vibe_github_update_issue':
      return githubController.updateIssue(args);

    // ==================== File Tools ====================
    case 'vibe_write_file':
      return fileController.writeFile(args);
    case 'vibe_list_files':
      return fileController.listFiles(args);
    case 'vibe_delete_file':
      return fileController.deleteFile(args);
    case 'vibe_move_file':
      return fileController.moveFile(args);
    case 'vibe_create_directory':
      return fileController.createDirectory(args);
    case 'vibe_get_file_info':
      return fileController.getFileInfo(args);

    // ==================== Command Tools ====================
    case 'vibe_run_command':
      return commandController.runCommand(args);
    case 'vibe_run_tests':
      return commandController.runTests(args);
    case 'vibe_run_script':
      return commandController.runScript(args);
    case 'vibe_install_deps':
      return commandController.installDependencies(args);

    // ==================== Git Tools ====================
    case 'vibe_git_status':
      return gitController.getStatus(args);
    case 'vibe_git_commit':
      return gitController.commit(args);
    case 'vibe_git_push':
      return gitController.push(args);
    case 'vibe_git_pull':
      return gitController.pull(args);
    case 'vibe_git_create_branch':
      return gitController.createBranch(args);
    case 'vibe_git_switch_branch':
      return gitController.switchBranch(args);
    case 'vibe_git_log':
      return gitController.getLog(args);
    case 'vibe_git_info':
      return gitController.getInfo(args);

    // ==================== Code Quality Tools ====================
    case 'vibe_lint_code':
      return codeQualityController.lintCode(args);
    case 'vibe_format_code':
      return codeQualityController.formatCode(args);
    case 'vibe_analyze_complexity':
      return codeQualityController.analyzeComplexity(args);
    case 'vibe_security_scan':
      return codeQualityController.securityScan(args);

    // ==================== API Testing Tools ====================
    case 'vibe_test_endpoint':
      return apiTestingController.testEndpoint(args);
    case 'vibe_http_request':
      return apiTestingController.httpRequest(args);
    case 'vibe_validate_api':
      return apiTestingController.validateApi(args);

    // ==================== Environment Tools ====================
    case 'vibe_env_list':
      return environmentController.listEnv(args);
    case 'vibe_env_get':
      return environmentController.getEnv(args);
    case 'vibe_env_set':
      return environmentController.setEnv(args);

    // ==================== Docker Tools ====================
    case 'vibe_docker_ps':
      return dockerController.listContainers(args);
    case 'vibe_docker_logs':
      return dockerController.getLogs(args);
    case 'vibe_docker_exec':
      return dockerController.execCommand(args);
    case 'vibe_docker_restart':
      return dockerController.restartContainer(args);
    case 'vibe_docker_stop':
      return dockerController.stopContainer(args);
    case 'vibe_docker_start':
      return dockerController.startContainer(args);
    case 'vibe_docker_stats':
      return dockerController.getStats(args);
    case 'vibe_docker_compose':
      return dockerController.compose(args);

    // ==================== Documentation Tools ====================
    case 'vibe_generate_readme':
      return documentationController.generateReadme(args);
    case 'vibe_generate_api_docs':
      return documentationController.generateApiDocs(args);

    // ==================== Credential Management Tools (Multi-Platform) ====================
    case 'vibe_set_credential':
      return credentialController.setCredential(args);
    case 'vibe_get_credential':
      return credentialController.getCredential(args);
    case 'vibe_delete_credential':
      return credentialController.deleteCredential(args);
    case 'vibe_list_credentials':
      return credentialController.listCredentials(args);
    case 'vibe_credential_status':
      return credentialController.getCredentialStatus(args);
    case 'vibe_credential_help':
      return { success: true, ...credentialController.getCredentialHelp(args) };

    // ==================== Advanced Credential UX Tools ====================
    case 'vibe_validate_credential':
      return credentialController.validateCredential(args);
    case 'vibe_credential_health':
      return credentialController.getCredentialHealth(args);
    case 'vibe_suggest_actions':
      return credentialController.suggestNextActions(args);
    case 'vibe_get_started':
      return { success: true, ...credentialController.getCredentialHelp(args) };

    // ==================== Project & Workspace Management ====================
    case 'vibe_set_project_credential':
      return credentialController.setProjectCredential(args);
    case 'vibe_list_projects':
      return credentialController.listProjects(args);
    case 'vibe_clone_project':
      return credentialController.cloneProject(args);

    // ==================== Workflow & Context-Aware Features ====================
    case 'vibe_get_recommendations':
      return credentialController.getRecommendations(args);
    case 'vibe_quick_setup':
      return credentialController.quickSetup(args);

    // ==================== Legacy GitHub Credential Tools (Backward Compatibility) ====================
    case 'vibe_set_github_token':
      return credentialController.setCredential({ provider: 'github', credential: args.token, userId: args.userId });
    case 'vibe_get_github_token_status':
      return credentialController.getCredentialStatus({ ...args, provider: 'github' });
    case 'vibe_remove_github_token':
      return credentialController.deleteCredential({ provider: 'github', ...args, confirm: args.confirm });
    case 'vibe_clone_authenticated':
      return credentialController.authenticatedClone(args);

    // ==================== External MCP Server Tools ====================
    default:
      // Check if this is an external MCP tool
      if (await mcpClientManager.hasTool(name)) {
        Logger.debug(`Routing to external MCP server: ${name}`);
        try {
          return await mcpClientManager.callTool(name, args);
        } catch (error) {
          Logger.error(`External MCP tool call failed: ${name}`, error);
          throw new Error(`External tool call failed: ${error.message}`);
        }
      }

      // Tool not found in native or external servers
      throw new Error(`Unknown tool: ${name}`);
  }
}
