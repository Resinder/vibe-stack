/**
 * ============================================================================
 * VIBE STACK - Task Factory
 * ============================================================================
 * Centralized task creation with defaults and validation
 * @version 1.0.0
 * ============================================================================
 */

import { Task } from '../core/models.js';
import { TaskValidator } from '../middleware/taskValidation.js';
import { ValidationError } from '../core/models.js';

/**
 * Task Factory - Centralized task creation
 * @class TaskFactory
 * @description Provides consistent task creation with defaults and validation
 */
export class TaskFactory {
  /**
   * Default task configuration
   * @constant {Object}
   */
  static DEFAULTS = {
    lane: 'backlog',
    priority: 'medium',
    status: 'pending',
    estimatedHours: 1,
    tags: []
  };

  /**
   * Priority-specific defaults for estimated hours
   * @constant {Object}
   */
  static PRIORITY_HOURS = {
    critical: 8,
    high: 4,
    medium: 2,
    low: 1
  };

  /**
   * Create a task with validation
   * @param {Object} data - Task data
   * @param {string} data.title - Task title (required)
   * @param {string} [data.description] - Task description
   * @param {string} [data.lane] - Task lane (default: 'backlog')
   * @param {string} [data.priority] - Task priority (default: 'medium')
   * @param {number} [data.estimatedHours] - Estimated hours (default: based on priority)
   * @param {Array<string>} [data.tags] - Task tags (default: [])
   * @returns {Task} Created task
   * @throws {ValidationError} If validation fails
   *
   * @example
   * const task = TaskFactory.create({ title: 'Fix bug' });
   * const task2 = TaskFactory.create({
   *   title: 'Add feature',
   *   priority: 'high',
   *   lane: 'todo',
   *   tags: ['frontend', 'api']
   * });
   */
  static create(data) {
    // Merge with defaults
    const merged = this.#mergeDefaults(data);

    // Validate before creating
    const validated = TaskValidator.validateTaskData(merged);

    return new Task(validated);
  }

  /**
   * Create multiple tasks
   * @param {Array<Object>} tasksData - Array of task data objects
   * @returns {Array<Task>} Created tasks
   * @throws {ValidationError} If validation fails
   *
   * @example
   * const tasks = TaskFactory.createMany([
   *   { title: 'Task 1', priority: 'high' },
   *   { title: 'Task 2', lane: 'todo' }
   * ]);
   */
  static createMany(tasksData) {
    // Validate batch
    TaskValidator.validateBatchTasks(tasksData);

    // Create each task
    return tasksData.map(data => this.create(data));
  }

  /**
   * Create a task from a pattern template
   * @param {string} pattern - Pattern name (e.g., 'authentication', 'database', 'api')
   * @param {Object} overrides - Property overrides
   * @returns {Task} Created task
   *
   * @example
   * const task = TaskFactory.createFromPattern('authentication', {
   *   title: 'OAuth Implementation'
   * });
   */
  static createFromPattern(pattern, overrides = {}) {
    const template = this.#getPatternTemplate(pattern);
    return this.create({ ...template, ...overrides });
  }

  /**
   * Create a batch of tasks from a pattern
   * @param {string} pattern - Pattern name
   * @param {number} count - Number of tasks to create
   * @param {Object} overrides - Property overrides for all tasks
   * @returns {Array<Task>} Created tasks
   *
   * @example
   * const tasks = TaskFactory.createBatchFromPattern('authentication', 8);
   */
  static createBatchFromPattern(pattern, count, overrides = {}) {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      const task = this.createFromPattern(pattern, {
        ...overrides,
        title: `${overrides.title || pattern} ${i + 1}`
      });
      tasks.push(task);
    }
    return tasks;
  }

  /**
   * Merge data with defaults
   * @private
   * @param {Object} data - Input data
   * @returns {Object} Merged data
   */
  static #mergeDefaults(data) {
    const merged = { ...this.DEFAULTS };

    // Set priority-based hours if not provided
    if (!data.estimatedHours && data.priority) {
      merged.estimatedHours = this.PRIORITY_HOURS[data.priority] || this.DEFAULTS.estimatedHours;
    }

    return { ...merged, ...data };
  }

  /**
   * Get pattern template
   * @private
   * @param {string} pattern - Pattern name
   * @returns {Object} Pattern template
   */
  static #getPatternTemplate(pattern) {
    const templates = {
      authentication: {
        priority: 'high',
        estimatedHours: 4,
        tags: ['backend', 'security']
      },
      database: {
        priority: 'high',
        estimatedHours: 3,
        tags: ['backend', 'database']
      },
      api: {
        priority: 'medium',
        estimatedHours: 3,
        tags: ['backend', 'api']
      },
      frontend: {
        priority: 'medium',
        estimatedHours: 2,
        tags: ['frontend', 'ui']
      },
      testing: {
        priority: 'medium',
        estimatedHours: 2,
        tags: ['testing']
      },
      deployment: {
        priority: 'low',
        estimatedHours: 2,
        tags: ['devops']
      }
    };

    return templates[pattern] || { ...this.DEFAULTS };
  }
}
