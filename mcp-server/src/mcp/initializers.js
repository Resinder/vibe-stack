/**
 * ============================================================================
 * VIBE STACK - Service & Controller Initializers
 * ============================================================================
 * Centralized initialization for services and controllers
 * Enhanced with modular architecture
 * @version 1.0.0
 * ============================================================================
 */

// Core services
import { BoardService } from '../services/boardService.js';
import { PostgresStorage } from '../shared/storage/index.js';

// Kanban module
import { TaskController, BoardController, PlanningController, TaskPlanningService } from '../modules/kanban/index.js';

// Repository module
import { RepoController, GitController } from '../modules/repository/index.js';

// GitHub module
import { GitHubController } from '../modules/github/index.js';

// DevTools module
import { FileController, CommandController, CodeQualityController, ApiTestingController } from '../modules/devtools/index.js';

// Environment module
import { EnvironmentController, DockerController } from '../modules/environment/index.js';

// Documentation module
import { DocumentationController } from '../modules/documentation/index.js';

// Credential management
import { CredentialStorage } from '../shared/credentials/index.js';
import { CredentialController } from '../controllers/credentialController.js';

// Utilities
import { Logger } from '../utils/logger.js';
import { mcpClientManager } from './clientManager.js';

/**
 * Initialize all services with PostgreSQL storage
 * @param {Object} config - Configuration object
 * @param {Object} config.postgres - PostgreSQL configuration
 * @param {Object} config.cache - Cache configuration
 * @returns {Promise<Object>} Initialized services
 * @throws {Error} If service initialization fails
 */
export async function initializeServices(config = {}) {
  try {
    // Initialize PostgreSQL storage
    const storage = new PostgresStorage(
      config.postgres || {},
      config.cache || {}
    );
    await storage.initialize();

    // Initialize board service with PostgreSQL storage
    const boardService = new BoardService(storage);
    await boardService.initialize();

    // Initialize credential storage for secure token management
    const credentialStorage = new CredentialStorage(storage);

    const planningService = new TaskPlanningService();
    Logger.info('Board service initialized with PostgreSQL storage');
    Logger.info('Planning service initialized');
    Logger.info('Credential storage initialized');
    return { boardService, planningService, storage, credentialStorage };
  } catch (error) {
    throw new Error(`Failed to initialize services: ${error.message}`);
  }
}

/**
 * Initialize all controllers
 * @param {BoardService} boardService - Board service instance
 * @param {TaskPlanningService} planningService - Planning service instance
 * @param {CredentialStorage} credentialStorage - Credential storage instance
 * @returns {Object} Initialized controllers
 */
export function initializeControllers(boardService, planningService, credentialStorage) {
  const taskController = new TaskController(boardService);
  const boardController = new BoardController(boardService);
  const planningController = new PlanningController(boardService, planningService);

  // Initialize repo and git controllers with credential storage support
  const repoController = new RepoController(credentialStorage);
  const gitController = new GitController(credentialStorage);
  const githubController = new GitHubController();

  // Initialize credential controller with repoController reference
  const credentialController = new CredentialController(credentialStorage, githubController, repoController);

  const fileController = new FileController();
  const commandController = new CommandController();
  const codeQualityController = new CodeQualityController();
  const apiTestingController = new ApiTestingController();
  const environmentController = new EnvironmentController();
  const dockerController = new DockerController();
  const documentationController = new DocumentationController();

  Logger.info('Controllers initialized with credential integration');
  return {
    taskController,
    boardController,
    planningController,
    repoController,
    githubController,
    credentialController,
    fileController,
    commandController,
    gitController,
    codeQualityController,
    apiTestingController,
    environmentController,
    dockerController,
    documentationController
  };
}

/**
 * Initialize external MCP servers
 * @returns {Promise<void>}
 * @throws {Error} If external MCP initialization fails
 */
export async function initializeExternalMCP() {
  try {
    await mcpClientManager.initialize();
    Logger.info('External MCP servers initialized');
  } catch (error) {
    Logger.warn('Failed to initialize external MCP servers (continuing without them)', error);
    // Don't throw - allow server to start without external MCP
  }
}
