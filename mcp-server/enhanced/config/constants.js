/**
 * ============================================================================
 * VIBE STACK - Configuration Constants
 * ============================================================================
 * Centralized configuration management
 * @version 2.0.0
 * ============================================================================

/**
 * Application configuration
 * @constant {Object}
 */
export const CONFIG = {
  // Server
  name: 'vibe-stack-mcp',
  version: '2.0.0',

  // Paths
  bridgeFilePath: process.env.BRIDGE_FILE || '/data/.vibe-kanban-bridge.json',
  customPanelPath: '/custom/kanban-panel.html',

  // HTTP Server
  httpPort: parseInt(process.env.HTTP_PORT || '4001', 10),

  // MCP Tools
  tools: TOOLS
};

/**
 * MCP Tool definitions
 * @constant {Array}
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
          enum: ['backlog', 'todo', 'in_progress', 'done', 'recovery'],
          default: 'backlog'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium'
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
          enum: ['backlog', 'todo', 'in_progress', 'done', 'recovery'],
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
          enum: ['low', 'medium', 'high', 'critical'],
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
          enum: ['backlog', 'todo', 'in_progress', 'done', 'recovery'],
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
];

/**
 * Lane constants
 * @constant {Object}
 */
export const LANES = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  RECOVERY: 'recovery',
  ALL: ['backlog', 'todo', 'in_progress', 'done', 'recovery']
};

/**
 * Priority constants
 * @constant {Object}
 */
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  ALL: ['low', 'medium', 'high', 'critical']
};

/**
 * Error messages
 * @constant {Object}
 */
export const ERRORS = {
  TASK_NOT_FOUND: (id) => `Task not found: ${id}`,
  INVALID_LANE: (lane) => `Invalid lane: ${lane}. Must be one of: ${LANES.ALL.join(', ')}`,
  INVALID_PRIORITY: (priority) => `Invalid priority: ${priority}. Must be one of: ${PRIORITY.ALL.join(', ')}`,
  MISSING_REQUIRED: (field) => `Missing required field: ${field}`,
  BOARD_LOAD_FAILED: 'Failed to load board state',
  BOARD_SAVE_FAILED: 'Failed to save board state'
};
