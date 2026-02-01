/**
 * ============================================================================
 * VIBE STACK - Controller Tests
 * ============================================================================
 * Tests for controller layer
 * @version 1.0.0 - Updated for modular architecture
 * ============================================================================
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TaskController } from '../src/modules/kanban/controllers/taskController.js';
import { BoardController } from '../src/modules/kanban/controllers/boardController.js';
import { PlanningController } from '../src/modules/kanban/controllers/planningController.js';
import { BoardService } from '../src/services/boardService.js';
import { TaskPlanningService } from '../src/modules/kanban/services/taskPlanningService.js';
import { Task } from '../src/core/models.js';
import { MockPostgresStorage } from './helpers/mockStorage.js';

describe('TaskController', () => {
  let controller, boardService, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    controller = new TaskController(boardService);
  });

  it('should create task', async () => {
    const result = await controller.createTask({
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Task created'));
  });

  it('should reject invalid task', async () => {
    const result = await controller.createTask({});

    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes('Validation Error'));
  });

  it('should move task', async () => {
    const task = new Task({
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    });
    const createdTask = await boardService.addTask(task);

    const result = await controller.moveTask({ taskId: createdTask.id, targetLane: 'todo' });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('moved to todo'));
  });

  it('should handle move task not found', async () => {
    const result = await controller.moveTask({ taskId: 'invalid', targetLane: 'todo' });

    assert.ok(result.isError);
  });

  it('should update task', async () => {
    const task = new Task({
      title: 'Test Task',
      lane: 'backlog',
      priority: 'medium'
    });
    const createdTask = await boardService.addTask(task);

    const result = await controller.updateTask({ taskId: createdTask.id, priority: 'high' });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('updated'));
  });

  it('should search tasks', async () => {
    const task = new Task({
      title: 'UniqueTask',
      lane: 'backlog',
      priority: 'medium'
    });
    await boardService.addTask(task);

    const result = await controller.searchTasks({ query: 'UniqueTask' });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Found'));
  });

  it('should batch create tasks', async () => {
    const result = await controller.batchCreate({
      tasks: [
        { title: 'Task 1' },
        { title: 'Task 2' }
      ]
    });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Batch created 2'));
  });
});

describe('BoardController', () => {
  let controller, boardService, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    controller = new BoardController(boardService);
  });

  it('should get board', async () => {
    const result = await controller.getBoard({});

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('{'));
  });

  it('should get stats', async () => {
    const result = await controller.getStats({});

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Board Statistics'));
  });

  it('should get context', async () => {
    const result = await controller.getContext({});

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Vibe Kanban Context'));
  });
});

describe('PlanningController', () => {
  let controller, boardService, planningService, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();

    planningService = new TaskPlanningService();
    controller = new PlanningController(boardService, planningService);
  });

  it('should generate plan', async () => {
    const result = await controller.generatePlan({
      goal: 'Add authentication',
      targetLane: 'backlog'
    });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Generated'));
  });

  it('should validate goal', async () => {
    const result = await controller.generatePlan({ goal: '' });

    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes('Validation Error'));
  });

  it('should analyze goal', () => {
    const result = controller.analyzeGoal({ goal: 'Add API' });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Goal Analysis'));
  });
});
