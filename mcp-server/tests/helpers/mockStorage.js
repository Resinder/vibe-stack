/**
 * ============================================================================
 * VIBE STACK - Test Helpers
 * ============================================================================
 * Shared test utilities and mocks
 * @version 1.0.0
 * ============================================================================
 */

import { PostgresStorage } from '../../src/shared/storage/postgresStorage.js';
import { TaskNotFoundError } from '../../src/middleware/errorHandler.js';

/**
 * Mock PostgreSQL Storage for testing
 * Extends PostgresStorage to pass instanceof checks
 * Uses in-memory storage instead of actual database
 */
export class MockPostgresStorage extends PostgresStorage {
  #tasks = [];
  #lanes = {
    backlog: [],
    todo: [],
    in_progress: [],
    done: [],
    recovery: []
  };

  constructor() {
    // Pass minimal config to parent
    super({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test'
    }, { ttl: 0, maxSize: 1 });
  }

  async initialize() {
    // Override parent initialize - don't connect to real DB
  }

  async getOrCreateBoard() {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'default',
      description: 'Test board'
    };
  }

  async loadTasks() {
    return this.#lanes;
  }

  async createTask(task) {
    const newTask = {
      id: crypto.randomUUID(),
      ...task,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.#tasks.push(newTask);
    this.#lanes[task.lane || 'backlog'].push(newTask);
    return newTask;
  }

  async updateTask(taskId, updates) {
    const index = this.#tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      throw new TaskNotFoundError(`Task not found: ${taskId}`, 'updateTask');
    }

    const task = this.#tasks[index];
    const updated = { ...task, ...updates, updatedAt: new Date() };
    this.#tasks[index] = updated;

    // Always update the task in the lane array
    // If lane changed, move to new lane
    if (updates.lane && updates.lane !== task.lane) {
      const oldLane = this.#lanes[task.lane];
      const newLane = this.#lanes[updates.lane];
      const laneIndex = oldLane.findIndex(t => t.id === taskId);
      if (laneIndex !== -1) {
        oldLane.splice(laneIndex, 1);
        newLane.push(updated);
      }
    } else {
      // Same lane, update in place
      const lane = this.#lanes[task.lane];
      const laneIndex = lane.findIndex(t => t.id === taskId);
      if (laneIndex !== -1) {
        // Update the task object in place
        Object.assign(lane[laneIndex], updated);
      }
    }

    return updated;
  }

  async deleteTask(taskId) {
    const index = this.#tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      return false;
    }
    const task = this.#tasks[index];
    const lane = this.#lanes[task.lane];
    const laneIndex = lane.findIndex(t => t.id === taskId);
    if (laneIndex !== -1) {
      lane.splice(laneIndex, 1);
    }
    this.#tasks.splice(index, 1);
    return true;
  }

  async getStats() {
    const stats = {
      totalTasks: this.#tasks.length,
      byLane: {
        backlog: this.#lanes.backlog.length,
        todo: this.#lanes.todo.length,
        in_progress: this.#lanes.in_progress.length,
        done: this.#lanes.done.length,
        recovery: this.#lanes.recovery.length
      },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      totalEstimatedHours: 0
    };

    for (const task of this.#tasks) {
      stats.byPriority[task.priority]++;
      stats.totalEstimatedHours += task.estimatedHours || 0;
    }

    return stats;
  }

  async searchTasks(query, lane) {
    const lowerQuery = query.toLowerCase();
    let results = this.#tasks.filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery))
    );

    if (lane) {
      results = results.filter(t => t.lane === lane);
    }

    return results;
  }

  clear() {
    this.#tasks = [];
    this.#lanes = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
      recovery: []
    };
  }

  healthCheck() {
    return true;
  }

  close() {
    this.clear();
  }
}
