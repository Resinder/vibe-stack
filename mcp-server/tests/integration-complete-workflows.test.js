/**
 * ============================================================================
 * VIBE STACK - Complete Workflow Integration Tests
 * ============================================================================
 * End-to-end tests for complete user workflows
 * @version 1.0.0 - Updated for modular architecture
 * ============================================================================
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BoardService } from '../src/services/boardService.js';
import { TaskPlanningService } from '../src/modules/kanban/services/taskPlanningService.js';
import { TaskController } from '../src/modules/kanban/controllers/taskController.js';
import { BoardController } from '../src/modules/kanban/controllers/boardController.js';
import { PlanningController } from '../src/modules/kanban/controllers/planningController.js';
import { Task } from '../src/core/models.js';
import { MockPostgresStorage } from './helpers/mockStorage.js';

describe('Integration - Complete Task Lifecycle Workflow', () => {
  let boardService, taskController, boardController, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
    boardController = new BoardController(boardService);
  });

  it('should complete full task lifecycle: create → move through lanes → update → search', async () => {
    // Step 1: Create task in backlog
    const createResult = await taskController.createTask({
      title: 'Complete Lifecycle Task',
      description: 'Testing full workflow',
      lane: 'backlog',
      priority: 'medium',
      estimatedHours: 8
    });

    assert.ok(!createResult.isError);
    assert.ok(createResult.content[0].text.includes('Task created'));

    // Extract task ID
    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch ? idMatch[1] : null;
    assert.ok(taskId);

    // Step 2: Move to todo
    const moveToTodoResult = await taskController.moveTask({ taskId, targetLane: 'todo' });
    assert.ok(!moveToTodoResult.isError);

    const board = await boardService.getBoard();
    const task = Object.values(board.lanes).flat().find(t => t.id === taskId);
    assert.strictEqual(task.lane, 'todo');

    // Step 3: Update priority to high
    const updateResult = await taskController.updateTask({
      taskId,
      priority: 'high'
    });
    assert.ok(!updateResult.isError);

    const updatedTask = Object.values(board.lanes).flat().find(t => t.id === taskId);
    assert.strictEqual(updatedTask.priority, 'high');

    // Step 4: Move to in_progress
    const moveInProgressResult = await taskController.moveTask({ taskId, targetLane: 'in_progress' });
    assert.ok(!moveInProgressResult.isError);

    const inProgressTask = Object.values(board.lanes).flat().find(t => t.id === taskId);
    assert.strictEqual(inProgressTask.lane, 'in_progress');

    // Step 5: Add description with implementation details
    const updateDescResult = await taskController.updateTask({
      taskId,
      description: 'Implementation details: Using Node.js and PostgreSQL'
    });
    assert.ok(!updateDescResult.isError);

    // Step 6: Move to done
    const moveDoneResult = await taskController.moveTask({ taskId, targetLane: 'done' });
    assert.ok(!moveDoneResult.isError);

    const doneTask = Object.values(board.lanes).flat().find(t => t.id === taskId);
    assert.strictEqual(doneTask.lane, 'done');

    // Step 7: Search by title
    const searchResult = await taskController.searchTasks({ query: 'Lifecycle' });
    assert.ok(!searchResult.isError);
    assert.ok(searchResult.content[0].text.includes('Lifecycle'));

    // Step 8: Verify stats reflect changes
    const statsResult = await boardController.getStats({});
    assert.ok(!statsResult.isError);
    const stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 1);
    assert.strictEqual(stats.byLane.done, 1);
  });

  it('should handle multiple tasks through complete lifecycle', async () => {
    // Create multiple tasks
    const taskIds = [];
    for (let i = 0; i < 5; i++) {
      const result = await taskController.createTask({
        title: `Workflow Task ${i}`,
        lane: 'backlog'
      });
      const idMatch = result.content[0].text.match(/ID: ([^\n]+)/);
      taskIds.push(idMatch[1]);
    }

    // Move all tasks through lanes sequentially
    const lanes = ['todo', 'in_progress', 'done'];
    for (const lane of lanes) {
      for (const taskId of taskIds) {
        await taskController.moveTask({ taskId, targetLane: lane });
      }
    }

    // Verify all tasks in done lane
    const stats = await boardService.getStats();
    assert.strictEqual(stats.byLane.done, 5);
    assert.strictEqual(stats.totalTasks, 5);
  });
});

describe('Integration - Planning to Execution Workflow', () => {
  let boardService, planningService, taskController, planningController, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    planningService = new TaskPlanningService();
    taskController = new TaskController(boardService);
    planningController = new PlanningController(boardService, planningService);
  });

  it('should complete planning workflow: generate → review → execute → complete', async () => {
    // Step 1: Generate plan for authentication system
    const planResult = await planningController.generatePlan({
      goal: 'Build authentication system with OAuth support'
    });

    assert.ok(!planResult.isError);
    assert.ok(planResult.content[0].text.includes('Generated') || planResult.content[0].text.includes('tasks'));

    // Step 2: Verify tasks were created with AI-generated tag
    const board = await boardService.getBoard();
    const tasks = Object.values(board.lanes).flat();
    assert.ok(tasks.length > 0);

    const aiTasks = tasks.filter(t => t.tags && t.tags.includes('ai-generated'));
    assert.ok(aiTasks.length > 0);

    // Step 3: Move first task to todo to start execution
    const firstTask = aiTasks[0];
    const moveResult = await taskController.moveTask({
      taskId: firstTask.id,
      targetLane: 'todo'
    });
    assert.ok(!moveResult.isError);

    // Step 4: Update task with implementation details
    const updateResult = await taskController.updateTask({
      taskId: firstTask.id,
      description: 'Using Passport.js with OAuth 2.0',
      estimatedHours: 12
    });
    assert.ok(!updateResult.isError);

    // Step 5: Move tasks through execution lanes
    await taskController.moveTask({ taskId: firstTask.id, targetLane: 'in_progress' });
    await taskController.moveTask({ taskId: firstTask.id, targetLane: 'done' });

    // Step 6: Verify all generated tasks maintain correct tags
    const finalBoard = await boardService.getBoard();
    const finalTasks = Object.values(finalBoard.lanes).flat();
    const finalAiTasks = finalTasks.filter(t => t.tags && t.tags.includes('ai-generated'));
    assert.strictEqual(finalAiTasks.length, aiTasks.length);
  });

  it('should generate plan with appropriate priorities', async () => {
    const planResult = await planningController.generatePlan({
      goal: 'Database setup with replication and backup'
    });

    const board = await boardService.getBoard();
    const tasks = Object.values(board.lanes).flat();
    assert.ok(tasks.length > 0);

    // Verify tasks have priorities assigned
    const tasksWithPriority = tasks.filter(t => t.priority);
    assert.ok(tasksWithPriority.length > 0);

    // Verify priorities are valid
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    tasks.forEach(task => {
      if (task.priority) {
        assert.ok(validPriorities.includes(task.priority));
      }
    });
  });
});

describe('Integration - Batch Operations Workflow', () => {
  let boardService, taskController, boardController, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
    boardController = new BoardController(boardService);
  });

  it('should complete batch workflow: create → move → update → verify stats', async () => {
    // Step 1: Batch create 50 tasks
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      title: `Batch Task ${i}`,
      description: `Description ${i}`,
      lane: 'backlog',
      priority: i % 2 === 0 ? 'high' : 'medium'
    }));

    const batchResult = await taskController.batchCreate({ tasks });
    assert.ok(!batchResult.isError);
    assert.ok(batchResult.content[0].text.includes('50 tasks'));

    // Step 2: Verify stats after batch creation
    let stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 50);
    assert.strictEqual(stats.byLane.backlog, 50);

    // Step 3: Move all backlog tasks to todo
    const board = await boardService.getBoard();
    const backlogTasks = [...board.lanes.backlog];
    for (const task of backlogTasks) {
      await taskController.moveTask({ taskId: task.id, targetLane: 'todo' });
    }

    stats = await boardService.getStats();
    assert.strictEqual(stats.byLane.todo, 50);
    assert.strictEqual(stats.byLane.backlog, 0);

    // Step 4: Batch update priorities
    for (const task of backlogTasks) {
      await taskController.updateTask({
        taskId: task.id,
        priority: 'low'
      });
    }

    // Step 5: Verify final stats accuracy
    stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 50);
    assert.strictEqual(stats.byPriority.low, 50);
  });

  it('should handle batch operations with mixed valid/invalid data', async () => {
    const tasks = [
      { title: 'Valid Task 1', lane: 'backlog' },
      { title: 'Valid Task 2', lane: 'backlog' },
      { title: '', lane: 'backlog' },  // Invalid
      { title: 'Valid Task 3', lane: 'backlog' }
    ];

    const batchResult = await taskController.batchCreate({ tasks });
    assert.ok(batchResult.isError);  // Should fail due to invalid task

    // Verify no tasks were created (atomic operation)
    const stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 0);
  });
});

describe('Integration - Error Recovery Workflow', () => {
  let boardService, taskController, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
  });

  it('should handle operation failure → recovery → continue', async () => {
    // Step 1: Create valid task
    const validResult = await taskController.createTask({
      title: 'Valid Task',
      lane: 'backlog'
    });
    assert.ok(!validResult.isError);

    const idMatch = validResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1];

    // Step 2: Attempt invalid operation (invalid lane)
    const invalidResult = await taskController.moveTask({
      taskId,
      targetLane: 'invalid-lane'
    });
    assert.ok(invalidResult.isError);

    // Step 3: Verify service still works
    const stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 1);

    // Step 4: Retry with valid data
    const validMoveResult = await taskController.moveTask({
      taskId,
      targetLane: 'todo'
    });
    assert.ok(!validMoveResult.isError);

    // Step 5: Verify task moved successfully
    const board = await boardService.getBoard();
    const task = Object.values(board.lanes).flat().find(t => t.id === taskId);
    assert.strictEqual(task.lane, 'todo');
  });

  it('should recover from batch operation failure', async () => {
    // Step 1: Create valid tasks
    const validTasks = Array.from({ length: 5 }, (_, i) => ({
      title: `Valid Task ${i}`,
      lane: 'backlog'
    }));

    const batchResult = await taskController.batchCreate({ tasks: validTasks });
    assert.ok(!batchResult.isError);

    // Step 2: Attempt invalid batch (exceeds limit)
    const tooManyTasks = Array.from({ length: 101 }, (_, i) => ({
      title: `Task ${i}`,
      lane: 'backlog'
    }));

    const invalidBatchResult = await taskController.batchCreate({ tasks: tooManyTasks });
    assert.ok(invalidBatchResult.isError);

    // Step 3: Verify first batch still exists
    const stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 5);

    // Step 4: Continue with normal operations
    await taskController.createTask({ title: 'New Task', lane: 'backlog' });
    assert.strictEqual((await boardService.getStats()).totalTasks, 6);
  });
});

describe('Integration - Search and Filter Workflow', () => {
  let boardService, taskController, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);

    // Create test data
    const testTasks = [
      { title: 'Authentication Service', description: 'OAuth implementation', lane: 'backlog', priority: 'high', tags: ['backend', 'security'] },
      { title: 'User Interface', description: 'React components', lane: 'todo', priority: 'medium', tags: ['frontend'] },
      { title: 'Database Schema', description: 'PostgreSQL design', lane: 'in_progress', priority: 'high', tags: ['backend', 'database'] },
      { title: 'API Documentation', description: 'Swagger docs', lane: 'done', priority: 'low', tags: ['docs'] },
      { title: 'Auth Tests', description: 'Unit tests for auth', lane: 'backlog', priority: 'medium', tags: ['backend', 'security', 'testing'] }
    ];

    for (const task of testTasks) {
      const taskObj = new Task(task);
      await boardService.addTask(taskObj);
    }
  });

  it('should complete search workflow: search → filter → verify results', async () => {
    // Step 1: Search by title
    const titleSearch = await taskController.searchTasks({ query: 'Auth' });
    assert.ok(!titleSearch.isError);
    assert.ok(titleSearch.content[0].text.includes('Auth'));

    // Step 2: Search in specific lane
    const laneSearch = await taskController.searchTasks({ query: 'Task', lane: 'backlog' });
    assert.ok(!laneSearch.isError);

    // Step 3: Search across all lanes (use 'Task' as query to find all tasks)
    const allSearch = await taskController.searchTasks({ query: 'Task' });
    assert.ok(!allSearch.isError);

    // Step 4: Verify search results are accurate
    const board = await boardService.getBoard();
    const allTasks = Object.values(board.lanes).flat();
    assert.strictEqual(allTasks.length, 5);
  });

  it('should handle complex search scenarios', async () => {
    const board = await boardService.getBoard();
    const tasks = Object.values(board.lanes).flat();

    // Search for specific tag combinations
    const securityTasks = tasks.filter(t => t.tags && t.tags.includes('security'));
    assert.ok(securityTasks.length >= 2);

    // Search by priority
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    assert.ok(highPriorityTasks.length >= 2);

    // Combine filters
    const backendHighPriority = tasks.filter(t =>
      t.tags && t.tags.includes('backend') && t.priority === 'high'
    );
    assert.ok(backendHighPriority.length >= 1);
  });
});

describe('Integration - Stats and Reporting Workflow', () => {
  let boardService, boardController, taskController, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    boardController = new BoardController(boardService);
    taskController = new TaskController(boardService);
  });

  it('should provide accurate stats throughout workflow', async () => {
    // Initial stats
    let stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 0);

    // Create tasks in different lanes
    await taskController.createTask({ title: 'Task 1', lane: 'backlog', priority: 'high' });
    await taskController.createTask({ title: 'Task 2', lane: 'todo', priority: 'medium' });
    await taskController.createTask({ title: 'Task 3', lane: 'in_progress', priority: 'low' });

    // Check stats after creation
    stats = await boardService.getStats();
    assert.strictEqual(stats.totalTasks, 3);
    assert.strictEqual(stats.byLane.backlog, 1);
    assert.strictEqual(stats.byLane.todo, 1);
    assert.strictEqual(stats.byLane.in_progress, 1);
    assert.strictEqual(stats.byPriority.high, 1);
    assert.strictEqual(stats.byPriority.medium, 1);
    assert.strictEqual(stats.byPriority.low, 1);

    // Move task and verify stats update
    const board = await boardService.getBoard();
    const tasks = board.lanes.backlog;
    if (tasks.length > 0) {
      await taskController.moveTask({ taskId: tasks[0].id, targetLane: 'done' });

      stats = await boardService.getStats();
      assert.strictEqual(stats.byLane.backlog, 0);
      assert.strictEqual(stats.byLane.done, 1);
    }
  });

  it('should provide board context for AI decision-making', async () => {
    // Create diverse tasks
    await taskController.createTask({ title: 'Backend API', lane: 'backlog', priority: 'high', tags: ['backend'] });
    await taskController.createTask({ title: 'Frontend UI', lane: 'todo', priority: 'medium', tags: ['frontend'] });
    await taskController.createTask({ title: 'Database', lane: 'in_progress', priority: 'high', tags: ['backend', 'database'] });

    // Get board context
    const contextResult = await boardController.getContext({});
    assert.ok(!contextResult.isError);

    const board = await boardService.getBoard();
    const tasks = Object.values(board.lanes).flat();
    assert.strictEqual(tasks.length, 3);
  });
});
