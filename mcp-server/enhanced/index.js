#!/usr/bin/env node
/**
 * ============================================================================
 * VIBE STACK - ENHANCED MCP SERVER
 * ============================================================================
 * Advanced integration between Open WebUI and Vibe Kanban with:
 * - Real-time bidirectional sync
 * - Intelligent task planning with project context awareness
 * - Webhook support for live updates
 * - Full workflow management
 * - Clean architecture (no spaghetti)
 *
 * Architecture:
 *   Core → Services → Adapters → Controllers
 *   Each layer has single responsibility
 *
 * @version 2.0.0
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
import { readFileSync, writeFileSync, watchFile, existsSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// LAYER 1: CORE (Domain Models & Interfaces)
// ============================================================================

/**
 * Task domain model
 */
class Task {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.lane = data.lane || 'backlog';
    this.priority = data.priority || 'medium';
    this.status = data.status || 'pending';
    this.tags = data.tags || [];
    this.assignee = data.assignee || null;
    this.estimatedHours = data.estimatedHours || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  generateId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return { ...this };
  }

  static fromJSON(data) {
    return new Task(data);
  }
}

/**
 * Board domain model
 */
class Board {
  constructor(data = {}) {
    this.lanes = data.lanes || {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
      recovery: []
    };
    this.metadata = data.metadata || {
      lastSync: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  addTask(task) {
    if (!this.lanes[task.lane]) {
      throw new Error(`Invalid lane: ${task.lane}`);
    }
    this.lanes[task.lane].push(task.toJSON());
    this.metadata.lastSync = new Date().toISOString();
  }

  getTasksByLane(lane) {
    return this.lanes[lane] || [];
  }

  getAllTasks() {
    return Object.values(this.lanes).flat();
  }

  toJSON() {
    return {
      lanes: this.lanes,
      ...this.metadata
    };
  }

  static fromJSON(data) {
    return new Board(data);
  }
}

// ============================================================================
// LAYER 2: SERVICES (Business Logic)
// ============================================================================

/**
 * Task Planning Service - Intelligent task breakdown
 */
class TaskPlanningService {
  constructor() {
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    return {
      authentication: {
        keywords: ['auth', 'login', 'oauth', 'jwt', 'session', 'password', 'token'],
        tasks: [
          { title: 'Design authentication architecture', priority: 'high', estimatedHours: 4 },
          { title: 'Set up authentication backend API', priority: 'high', estimatedHours: 8 },
          { title: 'Implement token management', priority: 'high', estimatedHours: 6 },
          { title: 'Create login/register UI components', priority: 'medium', estimatedHours: 6 },
          { title: 'Add session persistence', priority: 'medium', estimatedHours: 4 },
          { title: 'Implement password reset flow', priority: 'medium', estimatedHours: 4 },
          { title: 'Write authentication tests', priority: 'medium', estimatedHours: 6 },
          { title: 'Add rate limiting for auth endpoints', priority: 'low', estimatedHours: 2 }
        ]
      },
      database: {
        keywords: ['database', 'db', 'sql', 'nosql', 'postgres', 'mongo', 'migration', 'schema'],
        tasks: [
          { title: 'Design database schema', priority: 'high', estimatedHours: 4 },
          { title: 'Create migration scripts', priority: 'high', estimatedHours: 4 },
          { title: 'Set up database connection pool', priority: 'high', estimatedHours: 3 },
          { title: 'Implement data access layer', priority: 'high', estimatedHours: 8 },
          { title: 'Add database indexing', priority: 'medium', estimatedHours: 2 },
          { title: 'Create seed data scripts', priority: 'low', estimatedHours: 2 },
          { title: 'Set up backup strategy', priority: 'medium', estimatedHours: 3 }
        ]
      },
      api: {
        keywords: ['api', 'rest', 'graphql', 'endpoint', 'backend', 'service'],
        tasks: [
          { title: 'Design API specification', priority: 'high', estimatedHours: 4 },
          { title: 'Set up API framework', priority: 'high', estimatedHours: 3 },
          { title: 'Implement core endpoints', priority: 'high', estimatedHours: 12 },
          { title: 'Add request validation', priority: 'high', estimatedHours: 4 },
          { title: 'Implement error handling', priority: 'high', estimatedHours: 3 },
          { title: 'Add API authentication/authorization', priority: 'high', estimatedHours: 4 },
          { title: 'Create API documentation', priority: 'medium', estimatedHours: 4 },
          { title: 'Set up API versioning', priority: 'low', estimatedHours: 2 },
          { title: 'Add rate limiting', priority: 'medium', estimatedHours: 3 },
          { title: 'Write API tests', priority: 'medium', estimatedHours: 8 }
        ]
      },
      frontend: {
        keywords: ['ui', 'frontend', 'component', 'react', 'vue', 'angular', 'interface', 'design'],
        tasks: [
          { title: 'Create UI mockups/wireframes', priority: 'high', estimatedHours: 4 },
          { title: 'Set up component library', priority: 'high', estimatedHours: 3 },
          { title: 'Build core components', priority: 'high', estimatedHours: 12 },
          { title: 'Implement state management', priority: 'high', estimatedHours: 6 },
          { title: 'Add routing', priority: 'medium', estimatedHours: 3 },
          { title: 'Implement responsive design', priority: 'medium', estimatedHours: 6 },
          { title: 'Add loading states/error handling', priority: 'medium', estimatedHours: 4 },
          { title: 'Write component tests', priority: 'medium', estimatedHours: 6 },
          { title: 'Performance optimization', priority: 'low', estimatedHours: 4 }
        ]
      },
      testing: {
        keywords: ['test', 'testing', 'tdd', 'spec', 'coverage'],
        tasks: [
          { title: 'Set up testing framework', priority: 'high', estimatedHours: 2 },
          { title: 'Write unit tests', priority: 'high', estimatedHours: 12 },
          { title: 'Write integration tests', priority: 'high', estimatedHours: 8 },
          { title: 'Set up test coverage reporting', priority: 'medium', estimatedHours: 2 },
          { title: 'Configure CI/CD testing pipeline', priority: 'medium', estimatedHours: 4 },
          { title: 'Add end-to-end tests', priority: 'medium', estimatedHours: 8 },
          { title: 'Set up performance testing', priority: 'low', estimatedHours: 4 }
        ]
      },
      deployment: {
        keywords: ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'production'],
        tasks: [
          { title: 'Set up CI/CD pipeline', priority: 'high', estimatedHours: 6 },
          { title: 'Create Docker containers', priority: 'high', estimatedHours: 4 },
          { title: 'Set up environment configuration', priority: 'high', estimatedHours: 3 },
          { title: 'Configure deployment automation', priority: 'high', estimatedHours: 4 },
          { title: 'Set up monitoring and alerting', priority: 'high', estimatedHours: 4 },
          { title: 'Create backup/restore procedures', priority: 'medium', estimatedHours: 3 },
          { title: 'Set up log aggregation', priority: 'medium', estimatedHours: 3 },
          { title: 'Configure SSL/TLS certificates', priority: 'medium', estimatedHours: 2 },
          { title: 'Create runbooks for incidents', priority: 'low', estimatedHours: 4 }
        ]
      }
    };
  }

  analyzeGoal(goal) {
    const goalLower = goal.toLowerCase();
    const detectedPatterns = [];

    for (const [name, pattern] of Object.entries(this.patterns)) {
      for (const keyword of pattern.keywords) {
        if (goalLower.includes(keyword)) {
          detectedPatterns.push({ name, pattern });
          break;
        }
      }
    }

    return detectedPatterns;
  }

  generatePlan(goal, context = '') {
    const patterns = this.analyzeGoal(goal);
    const tasks = [];
    const usedTitles = new Set();

    // Add pattern-specific tasks
    for (const { name, pattern } of patterns) {
      for (const taskTemplate of pattern.tasks) {
        const title = taskTemplate.title;
        if (!usedTitles.has(title)) {
          tasks.push(new Task({
            title,
            description: this.enrichDescription(taskTemplate.title, goal, context),
            lane: 'backlog',
            priority: taskTemplate.priority,
            estimatedHours: taskTemplate.estimatedHours,
            tags: ['ai-generated', name]
          }));
          usedTitles.add(title);
        }
      }
    }

    // If no patterns matched, create generic tasks
    if (tasks.length === 0) {
      tasks.push(...this.createGenericPlan(goal, context));
    }

    // Always add final tasks
    tasks.push(
      new Task({
        title: `Document: ${goal}`,
        description: `Create documentation for: ${goal}`,
        lane: 'backlog',
        priority: 'low',
        estimatedHours: 3,
        tags: ['ai-generated', 'documentation']
      }),
      new Task({
        title: `Review and test: ${goal}`,
        description: 'Final review, testing, and validation',
        lane: 'backlog',
        priority: 'medium',
        estimatedHours: 4,
        tags: ['ai-generated', 'review']
      })
    );

    return tasks;
  }

  enrichDescription(title, goal, context) {
    return `${title}\n\nPart of: ${goal}${context ? '\nContext: ' + context : ''}`;
  }

  createGenericPlan(goal, context) {
    return [
      new Task({
        title: `Research: ${goal}`,
        description: `Investigate requirements and approach for: ${goal}`,
        lane: 'backlog',
        priority: 'high',
        estimatedHours: 4,
        tags: ['ai-generated', 'research']
      }),
      new Task({
        title: `Design: ${goal}`,
        description: 'Create design document and approach',
        lane: 'backlog',
        priority: 'high',
        estimatedHours: 4,
        tags: ['ai-generated', 'design']
      }),
      new Task({
        title: `Implement: ${goal}`,
        description: 'Core implementation',
        lane: 'backlog',
        priority: 'high',
        estimatedHours: 12,
        tags: ['ai-generated', 'implementation']
      }),
      new Task({
        title: `Test: ${goal}`,
        description: 'Testing and validation',
        lane: 'backlog',
        priority: 'medium',
        estimatedHours: 6,
        tags: ['ai-generated', 'testing']
      })
    ];
  }
}

/**
 * Board Service - Manages board state
 */
class BoardService {
  constructor(bridgeFilePath) {
    this.bridgeFilePath = bridgeFilePath;
    this.board = this.loadBoard();
    this.watchers = [];
    this.setupWatcher();
  }

  loadBoard() {
    try {
      if (existsSync(this.bridgeFilePath)) {
        const data = readFileSync(this.bridgeFilePath, 'utf-8');
        return Board.fromJSON(JSON.parse(data));
      }
    } catch (e) {
      console.error(`Failed to load board: ${e.message}`);
    }
    return new Board();
  }

  saveBoard() {
    try {
      writeFileSync(this.bridgeFilePath, JSON.stringify(this.board.toJSON(), null, 2), 'utf-8');
      this.notifyWatchers();
    } catch (e) {
      console.error(`Failed to save board: ${e.message}`);
      throw e;
    }
  }

  setupWatcher() {
    watchFile(this.bridgeFilePath, { interval: 1000 }, () => {
      this.board = this.loadBoard();
      this.notifyWatchers();
    });
  }

  onChange(callback) {
    this.watchers.push(callback);
  }

  notifyWatchers() {
    for (const callback of this.watchers) {
      try {
        callback(this.board);
      } catch (e) {
        console.error(`Watcher error: ${e.message}`);
      }
    }
  }

  addTask(task) {
    this.board.addTask(task);
    this.saveBoard();
    return task;
  }

  moveTask(taskId, targetLane) {
    for (const [lane, tasks] of Object.entries(this.board.lanes)) {
      const index = tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        const [task] = tasks.splice(index, 1);
        task.lane = targetLane;
        task.updatedAt = new Date().toISOString();
        this.board.lanes[targetLane].push(task);
        this.saveBoard();
        return task;
      }
    }
    throw new Error(`Task not found: ${taskId}`);
  }

  updateTask(taskId, updates) {
    for (const tasks of Object.values(this.board.lanes)) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        this.saveBoard();
        return task;
      }
    }
    throw new Error(`Task not found: ${taskId}`);
  }

  getStats() {
    const stats = {
      totalTasks: 0,
      byLane: {},
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      totalEstimatedHours: 0
    };

    for (const [lane, tasks] of Object.entries(this.board.lanes)) {
      stats.byLane[lane] = tasks.length;
      stats.totalTasks += tasks.length;

      for (const task of tasks) {
        const priority = task.priority || 'medium';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        stats.totalEstimatedHours += task.estimatedHours || 0;
      }
    }

    return stats;
  }
}

/**
 * Webhook Service - Real-time notifications
 */
class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.queue = [];
    this.processing = false;
  }

  register(url, events = ['*']) {
    const id = `webhook-${Date.now()}`;
    this.webhooks.set(id, { url, events, active: true });
    return id;
  }

  unregister(id) {
    return this.webhooks.delete(id);
  }

  async trigger(event, data) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    for (const [id, webhook] of this.webhooks) {
      if (!webhook.active) continue;
      if (!webhook.events.includes('*') && !webhook.events.includes(event)) continue;

      this.queue.push({ webhook, payload });
    }

    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const { webhook, payload } = this.queue.shift();

      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeout: 5000
        });
      } catch (e) {
        console.error(`Webhook failed: ${e.message}`);
      }
    }

    this.processing = false;
  }
}

// ============================================================================
// LAYER 3: ADAPTERS (External Integration)
// ============================================================================

/**
 * Open WebUI Adapter
 */
class OpenWebUIAdapter {
  constructor(boardService, webhookService) {
    this.boardService = boardService;
    this.webhookService = webhookService;
    this.setupRealtimeSync();
  }

  setupRealtimeSync() {
    this.boardService.onChange((board) => {
      this.webhookService.trigger('board.changed', board.toJSON());
    });
  }
}

// ============================================================================
// LAYER 4: CONTROLLERS (MCP Tool Handlers)
// ============================================================================

/**
 * MCP Tool Controller
 */
class MCPController {
  constructor(boardService, planningService) {
    this.boardService = boardService;
    this.planningService = planningService;
  }

  async handleToolCall(name, args) {
    switch (name) {
      case 'vibe_get_board':
        return this.getBoard(args);

      case 'vibe_create_task':
        return this.createTask(args);

      case 'vibe_move_task':
        return this.moveTask(args);

      case 'vibe_update_task':
        return this.updateTask(args);

      case 'vibe_generate_plan':
        return this.generatePlan(args);

      case 'vibe_search_tasks':
        return this.searchTasks(args);

      case 'vibe_get_stats':
        return this.getStats(args);

      case 'vibe_analyze_goal':
        return this.analyzeGoal(args);

      case 'vibe_batch_create':
        return this.batchCreate(args);

      case 'vibe_get_context':
        return this.getContext(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  getBoard(args) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(this.boardService.board.toJSON(), null, 2)
      }]
    };
  }

  createTask(args) {
    const task = new Task(args);
    this.boardService.addTask(task);

    return {
      content: [{
        type: 'text',
        text: `✓ Task created: "${task.title}"\n` +
              `  Lane: ${task.lane}\n` +
              `  Priority: ${task.priority}\n` +
              `  ID: ${task.id}\n` +
              `  View at: http://localhost:4000`
      }]
    };
  }

  moveTask(args) {
    const { taskId, targetLane } = args;
    const task = this.boardService.moveTask(taskId, targetLane);

    return {
      content: [{
        type: 'text',
        text: `✓ Task moved to ${targetLane}\n` +
              `  Task: ${task.title}\n` +
              `  ID: ${task.id}`
      }]
    };
  }

  updateTask(args) {
    const { taskId, ...updates } = args;
    const task = this.boardService.updateTask(taskId, updates);

    return {
      content: [{
        type: 'text',
        text: `✓ Task updated: ${task.title}\n` +
              `  Changes: ${Object.keys(updates).join(', ')}`
      }]
    };
  }

  generatePlan(args) {
    const { goal, context, targetLane = 'backlog' } = args;
    const tasks = this.planningService.generatePlan(goal, context);

    const created = [];
    for (const task of tasks) {
      task.lane = targetLane;
      this.boardService.addTask(task);
      created.push(task);
    }

    const totalHours = created.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return {
      content: [{
        type: 'text',
        text: `🎯 Generated ${created.length} tasks for: "${goal}"\n\n` +
              `📊 Summary:\n` +
              `  • Total tasks: ${created.length}\n` +
              `  • Estimated hours: ${totalHours}\n` +
              `  • High priority: ${created.filter(t => t.priority === 'high').length}\n` +
              `  • Medium priority: ${created.filter(t => t.priority === 'medium').length}\n` +
              `  • Low priority: ${created.filter(t => t.priority === 'low').length}\n\n` +
              `📋 Tasks:\n` +
              created.map((t, i) =>
                `  ${i + 1}. ${t.title} (${t.estimatedHours}h, ${t.priority})`
              ).join('\n') +
              `\n\n✨ View in Vibe Kanban: http://localhost:4000`
      }]
    };
  }

  searchTasks(args) {
    const { query, lane } = args;
    const results = [];

    for (const [laneName, tasks] of Object.entries(this.boardService.board.lanes)) {
      if (lane && laneName !== lane) continue;

      for (const task of tasks) {
        const searchContent = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')}`.toLowerCase();
        if (searchContent.includes(query.toLowerCase())) {
          results.push({ ...task, lane: laneName });
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: `Found ${results.length} task(s):\n\n${JSON.stringify(results, null, 2)}`
      }]
    };
  }

  getStats(args) {
    const stats = this.boardService.getStats();

    return {
      content: [{
        type: 'text',
        text: `📊 Board Statistics:\n\n` +
              `Tasks by Lane:\n` +
              `  • Backlog: ${stats.byLane.backlog || 0}\n` +
              `  • Todo: ${stats.byLane.todo || 0}\n` +
              `  • In Progress: ${stats.byLane.in_progress || 0}\n` +
              `  • Done: ${stats.byLane.done || 0}\n` +
              `  • Recovery: ${stats.byLane.recovery || 0}\n\n` +
              `Tasks by Priority:\n` +
              `  • Critical: ${stats.byPriority.critical}\n` +
              `  • High: ${stats.byPriority.high}\n` +
              `  • Medium: ${stats.byPriority.medium}\n` +
              `  • Low: ${stats.byPriority.low}\n\n` +
              `Total: ${stats.totalTasks} tasks (~${stats.totalEstimatedHours}h estimated)`
      }]
    };
  }

  analyzeGoal(args) {
    const { goal } = args;
    const patterns = this.planningService.analyzeGoal(goal);

    const detected = patterns.map(p => p.name).join(', ') || 'generic';

    return {
      content: [{
        type: 'text',
        text: `🔍 Goal Analysis: "${goal}"\n\n` +
              `Detected Patterns: ${detected}\n` +
              `Suggested Tasks: ${patterns.reduce((sum, p) => sum + p.pattern.tasks.length, 0) || 5}\n\n` +
              `Use 'vibe_generate_plan' to create the tasks.`
      }]
    };
  }

  batchCreate(args) {
    const { tasks } = args;
    const created = [];

    for (const taskData of tasks) {
      const task = new Task(taskData);
      this.boardService.addTask(task);
      created.push(task);
    }

    return {
      content: [{
        type: 'text',
        text: `✓ Batch created ${created.length} tasks\n\n` +
              `IDs: ${created.map(t => t.id).join(', ')}`
      }]
    };
  }

  getContext(args) {
    const board = this.boardService.board.toJSON();
    const stats = this.boardService.getStats();

    return {
      content: [{
        type: 'text',
        text: `📋 Vibe Kanban Context\n\n` +
              `Current Board State:\n` +
              `  • Total Tasks: ${stats.totalTasks}\n` +
              `  • In Progress: ${stats.byLane.in_progress || 0}\n` +
              `  • Completed: ${stats.byLane.done || 0}\n\n` +
              `Work Distribution:\n` +
              `  • High Priority: ${stats.byPriority.high}\n` +
              `  • Medium Priority: ${stats.byPriority.medium}\n` +
              `  • Low Priority: ${stats.byPriority.low}\n\n` +
              `Estimated Remaining: ${stats.totalEstimatedHours}h\n\n` +
              `Active Work:\n` +
              this.formatActiveWork(board.lanes.in_progress)
      }]
    };
  }

  formatActiveWork(tasks) {
    if (!tasks || tasks.length === 0) return '  • No active tasks';
    return tasks.map(t =>
      `  • ${t.title} (${t.estimatedHours || 0}h)`
    ).join('\n');
  }
}

// ============================================================================
// LAYER 5: CONFIGURATION & INITIALIZATION
// ============================================================================

const CONFIG = {
  bridgeFilePath: process.env.BRIDGE_FILE || '/data/.vibe-kanban-bridge.json',
  httpPort: parseInt(process.env.HTTP_PORT || '4001'),
  name: 'vibe-stack-mcp',
  version: '2.0.0',
};

// ============================================================================
// MCP TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
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

// ============================================================================
// HTTP SERVER (for direct access and webhooks)
// ============================================================================

function startHttpServer(controller) {
  const app = express();
  app.use(express.json());

  // Bridge file endpoint
  app.get('/.vibe-kanban-bridge.json', (req, res) => {
    res.json(controller.boardService.board.toJSON());
  });

  // MCP info
  app.get('/.well-known/mcp', (req, res) => {
    res.json({
      name: CONFIG.name,
      version: CONFIG.version,
      capabilities: ['tools'],
      tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    });
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: CONFIG.name, version: CONFIG.version });
  });

  // Webhook receiver
  app.post('/webhook', (req, res) => {
    const { event, data } = req.body;
    // Handle incoming webhooks
    res.json({ received: true });
  });

  // ============================================================================
  // OPENAI-COMPATIBLE API ENDPOINTS
  // ============================================================================
  // These endpoints allow Open WebUI to call Vibe tools directly via HTTP

  // OpenAI-compatible chat completions endpoint
  // Allows Open WebUI to use Vibe tools as function calling
  app.post('/v1/chat/completions', async (req, res) => {
    const { messages, functions, function_call } = req.body;

    // Check if there's a function call request
    if (function_call && functions) {
      const fn = functions.find(f => f.name === function_call.name);
      if (fn) {
        try {
          const args = JSON.parse(function_call.arguments || '{}');
          const result = await controller.handleToolCall(fn.name, args);

          // Return OpenAI-compatible response
          res.json({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'vibe-stack',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: null,
                function_call: {
                  name: fn.name,
                  arguments: JSON.stringify(result)
                }
              },
              finish_reason: 'function_call'
            }]
          });
          return;
        } catch (error) {
          res.status(500).json({ error: error.message });
          return;
        }
      }
    }

    // Regular chat (echo for now)
    const lastMessage = messages?.[messages.length - 1];
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'vibe-stack',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Vibe Stack MCP server running. Use function calling to interact with tools.'
        },
        finish_reason: 'stop'
      }]
    });
  });

  // List available functions/tools
  app.get('/v1/functions', (req, res) => {
    res.json({
      object: 'list',
      data: TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }))
    });
  });

  // Direct tool execution endpoint (simpler than full OpenAI format)
  app.post('/v1/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const args = req.body || {};

    try {
      const result = await controller.handleToolCall(toolName, args);
      res.json({
        success: true,
        tool: toolName,
        result: result.content[0]?.text || result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        tool: toolName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Quick plan generation endpoint (for easy access)
  app.post('/v1/plan', async (req, res) => {
    const { goal, context, targetLane = 'backlog' } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Missing required field: goal' });
    }

    try {
      const result = await controller.handleToolCall('vibe_generate_plan', { goal, context, targetLane });
      const tasks = controller.boardService.board.getAllTasks();

      res.json({
        success: true,
        goal,
        plan: {
          totalTasks: tasks.length,
          totalHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
          tasks: tasks.slice(-10).map(t => ({
            title: t.title,
            priority: t.priority,
            hours: t.estimatedHours
          }))
        },
        boardUrl: 'http://localhost:4000',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Board snapshot endpoint
  app.get('/v1/board/snapshot', (req, res) => {
    const board = controller.boardService.board.toJSON();
    const stats = controller.boardService.getStats();

    res.json({
      board,
      stats,
      timestamp: new Date().toISOString(),
      url: 'http://localhost:4000'
    });
  });

  // API proxy for Vibe Kanban (when native API is available)
  app.all('/api/*', async (req, res) => {
    // Placeholder for future Vibe Kanban API proxy
    res.status(501).json({ error: 'Vibe Kanban API not yet available' });
  });

  app.listen(CONFIG.httpPort, () => {
    console.error(`HTTP server listening on port ${CONFIG.httpPort}`);
  });
}

// ============================================================================
// MAIN MCP SERVER
// ============================================================================

async function main() {
  // Initialize services (Layer 2)
  const boardService = new BoardService(CONFIG.bridgeFilePath);
  const planningService = new TaskPlanningService();
  const webhookService = new WebhookService();

  // Initialize adapters (Layer 3)
  const openWebUIAdapter = new OpenWebUIAdapter(boardService, webhookService);

  // Initialize controller (Layer 4)
  const controller = new MCPController(boardService, planningService);
  controller.boardService = boardService; // Expose for HTTP server

  // Start HTTP server
  startHttpServer(controller);

  // Create MCP server
  const server = new Server(
    { name: CONFIG.name, version: CONFIG.version },
    { capabilities: { tools: {} } }
  );

  // Register handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await controller.handleToolCall(name, args || {});
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  // Connect
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${CONFIG.name} v${CONFIG.version} running`);
  console.error(`Enhanced features: pattern-based planning, real-time sync, webhooks`);
}

main().catch(console.error);
