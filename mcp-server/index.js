#!/usr/bin/env node
/**
 * ============================================================================
 * VIBE STACK - MCP SERVER
 * ============================================================================
 * Model Context Protocol server that exposes Vibe Kanban functionality
 * to Open WebUI for real-time task planning and management.
 *
 * Architecture:
 *   - MCP Server runs on stdio (for Open WebUI integration)
 *   - HTTP Proxy server provides REST API for Vibe Kanban
 *   - Clean separation: MCP tools → Business Logic → Vibe Kanban API
 *
 * Usage:
 *   - Direct: node index.js
 *   - Docker: see docker-compose.yml (mcp-server service)
 *   - Open WebUI: Configure as MCP server
 * ============================================================================
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Vibe Kanban API endpoint
  vibeKanbanUrl: process.env.VIBE_KANBAN_URL || 'http://vibe-server:4000',

  // Bridge file path
  bridgeFilePath: process.env.BRIDGE_FILE || '/data/.vibe-kanban-bridge.json',

  // HTTP Proxy server (for direct REST access)
  httpPort: parseInt(process.env.HTTP_PORT || '4001'),

  // Server metadata
  name: 'vibe-stack-mcp',
  version: '1.0.0',
};

// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: 'vibe_get_board',
    description: 'Get the current Vibe Kanban board state with all lanes and tasks',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID (optional, uses default if not specified)',
        },
      },
    },
  },

  {
    name: 'vibe_create_task',
    description: 'Create a new task in Vibe Kanban with automatic lane placement',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title',
        },
        description: {
          type: 'string',
          description: 'Detailed task description',
        },
        lane: {
          type: 'string',
          enum: ['backlog', 'todo', 'in_progress', 'done', 'recovery'],
          description: 'Target lane (default: todo)',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Task priority (default: medium)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task tags',
        },
      },
      required: ['title'],
    },
  },

  {
    name: 'vibe_move_task',
    description: 'Move a task to a different lane',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID to move',
        },
        targetLane: {
          type: 'string',
          enum: ['backlog', 'todo', 'in_progress', 'done', 'recovery'],
          description: 'Target lane',
        },
      },
      required: ['taskId', 'targetLane'],
    },
  },

  {
    name: 'vibe_update_task',
    description: 'Update task properties (title, description, status, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID to update',
        },
        title: {
          type: 'string',
          description: 'New title',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'blocked'],
          description: 'New status',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'New priority',
        },
      },
      required: ['taskId'],
    },
  },

  {
    name: 'vibe_generate_plan',
    description: 'Generate a task plan from natural language description. Creates multiple tasks automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'High-level goal or feature description (e.g., "Add user authentication with OAuth")',
        },
        context: {
          type: 'string',
          description: 'Additional context about the project, constraints, or requirements',
        },
        targetLane: {
          type: 'string',
          enum: ['backlog', 'todo'],
          description: 'Where to place generated tasks (default: backlog)',
        },
      },
      required: ['goal'],
    },
  },

  {
    name: 'vibe_search_tasks',
    description: 'Search tasks by title, description, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        lane: {
          type: 'string',
          enum: ['backlog', 'todo', 'in_progress', 'done', 'recovery'],
          description: 'Filter by lane (optional)',
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
];

// ============================================================================
// BUSINESS LOGIC LAYER
// ============================================================================

class VibeKanbanClient {
  constructor(baseUrl, bridgeFilePath) {
    this.baseUrl = baseUrl;
    this.bridgeFilePath = bridgeFilePath;
  }

  /**
   * Get board state from bridge file (local, fast)
   */
  async getBoard() {
    try {
      // Read from mounted file system (fast, reliable)
      const data = readFileSync(this.bridgeFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      // Return empty board if file not found
      console.error(`Failed to read bridge file: ${e.message}`);
      return {
        lanes: {
          backlog: [],
          todo: [],
          in_progress: [],
          done: [],
          recovery: [],
        },
        last_sync: new Date().toISOString(),
      };
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData) {
    const response = await fetch(`${this.baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Move task to different lane
   */
  async moveTask(taskId, targetLane) {
    const response = await fetch(`${this.baseUrl}/api/tasks/${taskId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane: targetLane }),
    });
    if (!response.ok) {
      throw new Error(`Failed to move task: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Update task properties
   */
  async updateTask(taskId, updates) {
    const response = await fetch(`${this.baseUrl}/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Search tasks
   */
  async searchTasks(query, lane = null) {
    const board = await this.getBoard();
    const results = [];

    for (const [laneName, tasks] of Object.entries(board.lanes || {})) {
      if (lane && laneName !== lane) continue;

      for (const task of tasks) {
        const searchContent = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')}`.toLowerCase();
        if (searchContent.includes(query.toLowerCase())) {
          results.push({ ...task, lane: laneName });
        }
      }
    }

    return results;
  }

  /**
   * Get board statistics
   */
  async getStats() {
    const board = await this.getBoard();
    const stats = {
      totalTasks: 0,
      byLane: {},
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    };

    for (const [laneName, tasks] of Object.entries(board.lanes || {})) {
      stats.byLane[laneName] = tasks.length;
      stats.totalTasks += tasks.length;

      for (const task of tasks) {
        const priority = task.priority || 'medium';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      }
    }

    return stats;
  }
}

const vibeClient = new VibeKanbanClient(CONFIG.vibeKanbanUrl, CONFIG.bridgeFilePath);

// ============================================================================
// MCP SERVER HANDLERS
// ============================================================================

/**
 * Handle tool execution requests
 */
async function handleCallTool(name, args) {
  switch (name) {
    case 'vibe_get_board':
      const board = await vibeClient.getBoard();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(board, null, 2),
        }],
      };

    case 'vibe_create_task':
      const createdTask = await vibeClient.createTask({
        title: args.title,
        description: args.description,
        lane: args.lane || 'todo',
        priority: args.priority || 'medium',
        tags: args.tags || [],
      });
      return {
        content: [{
          type: 'text',
          text: `✓ Task created: "${createdTask.title}" in ${createdTask.lane}\n\n${JSON.stringify(createdTask, null, 2)}`,
        }],
      };

    case 'vibe_move_task':
      await vibeClient.moveTask(args.taskId, args.targetLane);
      return {
        content: [{
          type: 'text',
          text: `✓ Task ${args.taskId} moved to ${args.targetLane}`,
        }],
      };

    case 'vibe_update_task':
      const updated = await vibeClient.updateTask(args.taskId, args);
      return {
        content: [{
          type: 'text',
          text: `✓ Task updated:\n\n${JSON.stringify(updated, null, 2)}`,
        }],
      };

    case 'vibe_generate_plan':
      const planResult = await generateTaskPlan(args.goal, args.context, args.targetLane);
      return {
        content: [{
          type: 'text',
          text: planResult,
        }],
      };

    case 'vibe_search_tasks':
      const searchResults = await vibeClient.searchTasks(args.query, args.lane);
      return {
        content: [{
          type: 'text',
          text: `Found ${searchResults.length} task(s):\n\n${JSON.stringify(searchResults, null, 2)}`,
        }],
      };

    case 'vibe_get_stats':
      const stats = await vibeClient.getStats();
      return {
        content: [{
          type: 'text',
          text: `📊 Board Statistics:\n\n${JSON.stringify(stats, null, 2)}`,
        }],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Generate task plan from natural language
 * This is a placeholder - in production, this would use LLM
 */
async function generateTaskPlan(goal, context = '', targetLane = 'backlog') {
  // Simple heuristic-based task breakdown
  const tasks = [];
  const goalLower = goal.toLowerCase();

  // Detect patterns and create appropriate tasks
  if (goalLower.includes('auth') || goalLower.includes('login')) {
    tasks.push(
      { title: 'Design authentication flow', description: `Define user journey for: ${goal}`, priority: 'high' },
      { title: 'Set up authentication backend', description: 'Implement login/logout endpoints', priority: 'high' },
      { title: 'Create login UI components', description: 'Build login form and session management', priority: 'medium' },
      { title: 'Add session persistence', description: 'Store tokens securely', priority: 'medium' },
      { title: 'Write auth tests', description: 'Test login, logout, and session handling', priority: 'medium' }
    );
  } else if (goalLower.includes('api') || goalLower.includes('endpoint')) {
    tasks.push(
      { title: 'Design API schema', description: `Define endpoints for: ${goal}`, priority: 'high' },
      { title: 'Implement API endpoints', description: 'Create backend handlers', priority: 'high' },
      { title: 'Add API documentation', description: 'Document endpoints with examples', priority: 'medium' },
      { title: 'Write API tests', description: 'Unit and integration tests', priority: 'medium' }
    );
  } else if (goalLower.includes('ui') || goalLower.includes('frontend') || goalLower.includes('component')) {
    tasks.push(
      { title: 'Create UI mockups', description: `Design UI for: ${goal}`, priority: 'high' },
      { title: 'Build component structure', description: 'Create React/Vue components', priority: 'high' },
      { title: 'Implement state management', description: 'Add state logic for the UI', priority: 'medium' },
      { title: 'Add styling', description: 'Apply styles and responsive design', priority: 'medium' },
      { title: 'Write component tests', description: 'Unit tests for components', priority: 'low' }
    );
  } else {
    // Generic task breakdown
    tasks.push(
      { title: `Research: ${goal}`, description: context || 'Investigate requirements and approach', priority: 'high' },
      { title: `Design: ${goal}`, description: 'Create design document', priority: 'high' },
      { title: `Implement: ${goal}`, description: 'Core implementation', priority: 'high' },
      { title: `Test: ${goal}`, description: 'Testing and validation', priority: 'medium' },
      { title: `Document: ${goal}`, description: 'Documentation and deployment', priority: 'low' }
    );
  }

  // Create tasks in Vibe Kanban
  const created = [];
  for (const task of tasks) {
    try {
      const createdTask = await vibeClient.createTask({
        ...task,
        lane: targetLane,
        tags: ['ai-generated'],
      });
      created.push(createdTask);
    } catch (e) {
      // Continue even if one fails
    }
  }

  return `🎯 Generated ${created.length} task(s) for: "${goal}"\n\n` +
    created.map((t, i) => `${i + 1}. ${t.title} (${t.lane})`).join('\n') +
    '\n\nReview and adjust tasks in Vibe Kanban: http://localhost:4000';
}

// ============================================================================
// HTTP PROXY SERVER (for direct REST access)
// ============================================================================

function startHttpProxy() {
  const app = express();
  app.use(express.json());

  // Serve bridge file
  app.get('/.vibe-kanban-bridge.json', async (req, res) => {
    try {
      const board = await vibeClient.getBoard();
      res.json(board);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy to Vibe Kanban
  app.all('/api/*', async (req, res) => {
    try {
      const url = `${CONFIG.vibeKanbanUrl}${req.originalUrl}`;
      const response = await fetch(url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(req.body),
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: CONFIG.name });
  });

  // MCP server info
  app.get('/.well-known/mcp', (req, res) => {
    res.json({
      name: CONFIG.name,
      version: CONFIG.version,
      capabilities: ['tools'],
      tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    });
  });

  app.listen(CONFIG.httpPort, () => {
    console.error(`HTTP Proxy server listening on port ${CONFIG.httpPort}`);
  });
}

// ============================================================================
// MCP SERVER INITIALIZATION
// ============================================================================

async function main() {
  // Start HTTP proxy in background
  startHttpProxy();

  // Create MCP server
  const server = new Server(
    {
      name: CONFIG.name,
      version: CONFIG.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listings
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await handleCallTool(name, args || {});
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`,
        }],
        isError: true,
      };
    }
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${CONFIG.name} v${CONFIG.version} running on stdio`);
  console.error(`HTTP proxy: http://localhost:${CONFIG.httpPort}`);
}

// Run
main().catch(console.error);
