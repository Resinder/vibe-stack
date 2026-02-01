/**
 * ============================================================================
 * VIBE STACK - Integration Tests
 * ============================================================================
 * End-to-end integration tests for complete workflows
 * @version 1.0.0 - Updated for PostgreSQL storage
 * ============================================================================
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BoardService } from '../src/services/boardService.js';
import { TaskPlanningService } from '../src/modules/kanban/services/taskPlanningService.js';
import { TaskController } from '../src/modules/kanban/controllers/taskController.js';
import { BoardController } from '../src/modules/kanban/controllers/boardController.js';
import { PlanningController } from '../src/modules/kanban/controllers/planningController.js';
import { MockPostgresStorage } from './helpers/mockStorage.js';

describe('Integration - Complete Task Workflow', () => {
  let boardService, planningService, taskController, boardController, planningController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();

    planningService = new TaskPlanningService();
    taskController = new TaskController(boardService);
    boardController = new BoardController(boardService);
    planningController = new PlanningController(boardService, planningService);
  });

  it('should create task through controller and verify in board', async () => {
    // Create task via controller
    const result = await taskController.createTask({
      title: 'Integration Test Task',
      description: 'Testing full workflow',
      lane: 'backlog',
      priority: 'high',
      estimatedHours: 4,
      tags: ['integration', 'test']
    });

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Task created'));

    // Verify task is in board
    const board = await boardController.getBoard({});
    assert.ok(!board.isError);
    const boardData = await boardService.getBoard();
    assert.strictEqual(boardData.lanes.backlog.length, 1);
    assert.strictEqual(boardData.lanes.backlog[0].title, 'Integration Test Task');
  });

  it('should move task through lanes via controller', async () => {
    // Create task
    const createResult = await taskController.createTask({
      title: 'Move Test Task',
      lane: 'backlog'
    });

    // Extract task ID from response
    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    assert.ok(idMatch);
    const taskId = idMatch[1].trim();

    // Move to todo
    const moveResult = await taskController.moveTask({
      taskId: taskId,
      targetLane: 'todo'
    });

    assert.ok(!moveResult.isError);
    assert.ok(moveResult.content[0].text.includes('moved to todo'));

    // Verify in correct lane
    const boardData = await boardService.getBoard();
    assert.strictEqual(boardData.lanes.backlog.length, 0);
    assert.strictEqual(boardData.lanes.todo.length, 1);
  });

  it('should update task and persist changes', async () => {
    // Create task
    const createResult = await taskController.createTask({
      title: 'Update Test Task',
      priority: 'low'
    });

    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    // Update task
    const updateResult = await taskController.updateTask({
      taskId: taskId,
      priority: 'high',
      estimatedHours: 8
    });

    assert.ok(!updateResult.isError);

    // Verify changes persisted
    const boardData = await boardService.getBoard();
    const allTasks = Object.values(boardData.lanes).flat();
    const task = allTasks.find(t => t.id === taskId);
    assert.ok(task);
    assert.strictEqual(task.priority, 'high');
    assert.strictEqual(task.estimatedHours, 8);
  });

  it('should search tasks across all lanes', async () => {
    // Create multiple tasks
    await taskController.createTask({ title: 'Backend API Development' });
    await taskController.createTask({ title: 'Frontend UI Design' });
    await taskController.createTask({ title: 'Backend Database Setup' });

    // Search for "Backend"
    const searchResult = await taskController.searchTasks({ query: 'Backend' });

    assert.ok(!searchResult.isError);
    assert.ok(searchResult.content[0].text.includes('Found 2'));
  });

  it('should batch create tasks and verify all created', async () => {
    const batchResult = await taskController.batchCreate({
      tasks: [
        { title: 'Task 1' },
        { title: 'Task 2' },
        { title: 'Task 3' }
      ]
    });

    assert.ok(!batchResult.isError);
    assert.ok(batchResult.content[0].text.includes('Batch created 3'));

    const boardData = await boardService.getBoard();
    assert.strictEqual(boardData.lanes.backlog.length, 3);
  });

  it('should get accurate board stats', async () => {
    // Create tasks in different lanes
    await taskController.createTask({ title: 'Task 1', lane: 'backlog', priority: 'high' });
    await taskController.createTask({ title: 'Task 2', lane: 'backlog', priority: 'low' });
    await taskController.createTask({ title: 'Task 3', lane: 'todo', priority: 'medium' });

    const statsResult = await boardController.getStats({});
    assert.ok(!statsResult.isError);

    const stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 3);
    assert.strictEqual(stats.byLane.backlog, 2);
    assert.strictEqual(stats.byLane.todo, 1);
    assert.strictEqual(stats.byPriority.high, 1);
  });
});

describe('Integration - Planning Workflow', () => {
  let boardService, planningService, planningController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();

    planningService = new TaskPlanningService();
    planningController = new PlanningController(boardService, planningService);
  });

  it('should generate plan and add tasks to board', async () => {
    const planResult = await planningController.generatePlan({
      goal: 'Build REST API',
      targetLane: 'backlog'
    });

    assert.ok(!planResult.isError);
    assert.ok(planResult.content[0].text.includes('Generated'));

    // Verify tasks were added to board
    const boardData = await boardService.getBoard();
    assert.ok(boardData.lanes.backlog.length > 0);

    // Verify all tasks have valid properties
    const allTasks = Object.values(boardData.lanes).flat();
    for (const task of allTasks) {
      assert.ok(task.title);
      assert.ok(task.id);
      assert.ok(['low', 'medium', 'high'].includes(task.priority));
    }
  });

  it('should analyze goal and return patterns', async () => {
    const analysisResult = await planningController.analyzeGoal({
      goal: 'Add user authentication system'
    });

    assert.ok(!analysisResult.isError);
    assert.ok(analysisResult.content[0].text.includes('Goal Analysis'));
  });

  it('should validate goal input properly', async () => {
    const invalidResult = await planningController.generatePlan({ goal: '' });

    assert.ok(invalidResult.isError);
    assert.ok(invalidResult.content[0].text.includes('Validation Error'));
  });
});

describe('Integration - Error Handling', () => {
  let boardService, taskController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();

    taskController = new TaskController(boardService);
  });

  it('should handle invalid task ID gracefully', async () => {
    const result = await taskController.moveTask({
      taskId: 'non-existent-id',
      targetLane: 'todo'
    });

    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes('not found'));
  });

  it('should handle invalid lane gracefully', async () => {
    const createResult = await taskController.createTask({ title: 'Test Task' });
    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    const result = await taskController.moveTask({
      taskId: taskId,
      targetLane: 'invalid-lane'
    });

    assert.ok(result.isError);
  });

  it('should handle invalid input data', async () => {
    const result = await taskController.createTask({});

    assert.ok(result.isError);
    assert.ok(result.content[0].text.includes('Validation Error'));
  });
});

describe('Integration - Data Persistence', () => {
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
  });

  it('should persist tasks across service instances', async () => {
    // Create first service instance and add task
    let boardService = new BoardService(mockStorage);
    await boardService.initialize();
    const taskController = new TaskController(boardService);

    await taskController.createTask({ title: 'Persistent Task' });

    const boardData1 = await boardService.getBoard();
    const allTasks1 = Object.values(boardData1.lanes).flat();
    const taskId1 = allTasks1[0].id;

    // Create new service instance with same storage and verify task exists
    boardService = new BoardService(mockStorage);
    const boardData2 = await boardService.getBoard();
    const tasks = Object.values(boardData2.lanes).flat();

    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].title, 'Persistent Task');
    assert.strictEqual(tasks[0].id, taskId1);
  });

  it('should maintain data consistency after updates', async () => {
    let boardService = new BoardService(mockStorage);
    await boardService.initialize();
    const taskController = new TaskController(boardService);

    const createResult = await taskController.createTask({
      title: 'Update Test',
      priority: 'low'
    });

    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    await taskController.updateTask({
      taskId: taskId,
      priority: 'high'
    });

    // Reload and verify
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    const boardData = await boardService.getBoard();
    const allTasks = Object.values(boardData.lanes).flat();
    const task = allTasks[0];

    assert.strictEqual(task.priority, 'high');
  });
});
