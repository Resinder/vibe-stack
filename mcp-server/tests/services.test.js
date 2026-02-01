/**
 * ============================================================================
 * VIBE STACK - Service Tests
 * ============================================================================
 * Tests for business logic services
 * @version 1.0.0 - Updated for modular architecture
 * ============================================================================
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BoardService } from '../src/services/boardService.js';
import { TaskPlanningService } from '../src/modules/kanban/services/taskPlanningService.js';
import { Task } from '../src/core/models.js';
import { TaskNotFoundError, InvalidLaneError, BoardError } from '../src/middleware/errorHandler.js';
import { MockPostgresStorage } from './helpers/mockStorage.js';

describe('BoardService', () => {
  let service;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    service = new BoardService(mockStorage);
    await service.initialize();
  });

  after(async () => {
    if (service) {
      // BoardService doesn't have destroy() in v3.0
    }
  });

  it('should create board service', async () => {
    const board = await service.getBoard();
    assert.ok(board);
    assert.ok(board.lanes);
    assert.strictEqual(board.lanes.backlog.length, 0);
  });

  it('should reject invalid storage', () => {
    assert.throws(
      () => new BoardService(null),
      BoardError
    );
    assert.throws(
      () => new BoardService({}),
      BoardError
    );
  });

  it('should add task', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test description',
      lane: 'backlog',
      priority: 'medium'
    };

    const added = await service.addTask(taskData);

    assert.strictEqual(added.title, 'Test Task');
    const board = await service.getBoard();
    assert.strictEqual(board.lanes.backlog.length, 1);
  });

  it('should move task', async () => {
    const taskData = {
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    };

    const added = await service.addTask(taskData);
    const moved = await service.moveTask(added.id, 'todo');

    assert.strictEqual(moved.lane, 'todo');
    const board = await service.getBoard();
    assert.strictEqual(board.lanes.backlog.length, 0);
    assert.strictEqual(board.lanes.todo.length, 1);
  });

  it('should reject invalid lane when moving', async () => {
    const taskData = {
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    };

    const added = await service.addTask(taskData);

    await assert.rejects(
      async () => await service.moveTask(added.id, 'invalid'),
      InvalidLaneError
    );
  });

  it('should throw on task not found', async () => {
    await assert.rejects(
      async () => await service.moveTask('nonexistent', 'todo'),
      TaskNotFoundError
    );
  });

  it('should update task', async () => {
    const taskData = {
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    };

    const added = await service.addTask(taskData);
    const updated = await service.updateTask(added.id, { priority: 'high' });

    assert.strictEqual(updated.priority, 'high');
  });

  it('should get stats', async () => {
    await service.addTask({ title: 'Task 1', lane: 'backlog', priority: 'high', estimatedHours: 4 });
    await service.addTask({ title: 'Task 2', lane: 'todo', priority: 'medium', estimatedHours: 2 });

    const stats = await service.getStats();

    assert.strictEqual(stats.totalTasks, 2);
    assert.strictEqual(stats.byLane.backlog, 1);
    assert.strictEqual(stats.byLane.todo, 1);
  });

  it('should search tasks', async () => {
    await service.addTask({ title: 'Authentication Task', lane: 'backlog', priority: 'medium' });
    await service.addTask({ title: 'Database Task', lane: 'backlog', priority: 'medium' });

    const results = await service.searchTasks('Authentication');

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, 'Authentication Task');
  });

  it('should sanitize task updates', async () => {
    const taskData = {
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    };

    const added = await service.addTask(taskData);

    const malicious = {
      title: 'Updated\x00Title',
      tags: ['tag\x00', 'valid']
    };

    const updated = await service.updateTask(added.id, malicious);

    assert.ok(!updated.title.includes('\x00'));
    assert.strictEqual(updated.tags.length, 2);
  });
});

describe('TaskPlanningService', () => {
  let service;

  before(() => {
    service = new TaskPlanningService();
  });

  it('should analyze goal for authentication patterns', () => {
    const patterns = service.analyzeGoal('Add OAuth authentication');

    assert.ok(patterns.length > 0);
    assert.ok(patterns.some(p => p.name === 'authentication'));
  });

  it('should analyze goal for API patterns', () => {
    const patterns = service.analyzeGoal('Create REST API endpoints');

    assert.ok(patterns.length > 0);
    assert.ok(patterns.some(p => p.name === 'api'));
  });

  it('should not match generic goals', () => {
    const patterns = service.analyzeGoal('Make a sandwich');

    assert.strictEqual(patterns.length, 0);
  });

  it('should generate plan from goal', () => {
    const tasks = service.generatePlan('Add user authentication');

    assert.ok(tasks.length > 0);
    assert.ok(tasks.some(t => t.title.includes('Design')));
    assert.ok(tasks.some(t => t.tags.includes('authentication')));
  });

  it('should generate generic plan for unknown patterns', () => {
    const tasks = service.generatePlan('Create something new');

    assert.ok(tasks.length > 0);
    assert.ok(tasks.some(t => t.title.includes('Research')));
    assert.ok(tasks.some(t => t.title.includes('Design')));
  });

  it('should validate goal input', () => {
    assert.throws(() => service.generatePlan(''), Error);
    assert.throws(() => service.generatePlan(null), Error);
  });
});
