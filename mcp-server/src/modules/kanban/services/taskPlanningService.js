/**
 * ============================================================================
 * VIBE STACK - Task Planning Service
 * ============================================================================
 * Intelligent task breakdown with pattern detection
 * @version 1.0.0
 * ============================================================================
 */

import { Task } from '../../../core/models.js';

/**
 * Task Planning Service - Intelligent task breakdown with pattern detection
 * @class TaskPlanningService
 * @description Analyzes goals and generates task plans based on detected patterns
 */
export class TaskPlanningService {
  /** @type {Object} Pattern definitions for task generation */
  #patterns;

  /**
   * Create a new TaskPlanningService
   */
  constructor() {
    this.#patterns = this.#loadPatterns();
  }

  /**
   * Load predefined patterns for task generation
   * @private
   * @returns {Object} Pattern definitions
   */
  #loadPatterns() {
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

  /**
   * Analyze a goal to detect matching patterns
   * @param {string} goal - The goal to analyze
   * @returns {Array} Array of detected patterns with names and task templates
   */
  analyzeGoal(goal) {
    if (typeof goal !== 'string') {
      throw new Error('Goal must be a string');
    }

    const goalLower = goal.toLowerCase();
    const detectedPatterns = [];

    for (const [name, pattern] of Object.entries(this.#patterns)) {
      for (const keyword of pattern.keywords) {
        if (goalLower.includes(keyword)) {
          detectedPatterns.push({ name, pattern });
          break;
        }
      }
    }

    return detectedPatterns;
  }

  /**
   * Generate a task plan from a goal
   * @param {string} goal - The goal to plan for
   * @param {string} [context=''] - Additional context
   * @returns {Array<Task>} Array of Task objects
   */
  generatePlan(goal, context = '') {
    if (!goal || typeof goal !== 'string') {
      throw new Error('Goal is required and must be a string');
    }

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
            description: this.#enrichDescription(taskTemplate.title, goal, context),
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
      tasks.push(...this.#createGenericPlan(goal, context));
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

  /**
   * Enrich task description with context
   * @private
   * @param {string} title - Task title
   * @param {string} goal - Original goal
   * @param {string} context - Additional context
   * @returns {string} Enriched description
   */
  #enrichDescription(title, goal, context) {
    return `${title}\n\nPart of: ${goal}${context ? '\nContext: ' + context : ''}`;
  }

  /**
   * Create a generic plan when no patterns match
   * @private
   * @param {string} goal - The goal
   * @param {string} context - Additional context
   * @returns {Array<Task>} Generic task list
   */
  #createGenericPlan(goal, context) {
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
