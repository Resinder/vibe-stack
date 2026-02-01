/**
 * ============================================================================
 * VIBE STACK - Multi-User Collaboration Tests
 * ============================================================================
 * Tests for multi-user collaboration scenarios and concurrent operations
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BoardService } from '../src/services/boardService.js';
import { TaskController } from '../src/modules/kanban/controllers/taskController.js';
import { BoardController } from '../src/modules/kanban/controllers/boardController.js';
import { MockPostgresStorage } from './helpers/mockStorage.js';

describe('Multi-User Collaboration Scenarios', () => {
  let boardService, taskController, boardController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
    boardController = new BoardController(boardService);
  });

  // Scenario: Two users working on different tasks simultaneously
  it('should handle two users creating tasks simultaneously', async () => {
    const user1Tasks = [
      { title: 'User 1 Task A', lane: 'backlog', priority: 'high' },
      { title: 'User 1 Task B', lane: 'todo', priority: 'medium' }
    ];

    const user2Tasks = [
      { title: 'User 2 Task A', lane: 'backlog', priority: 'low' },
      { title: 'User 2 Task B', lane: 'in_progress', priority: 'critical' }
    ];

    // Simulate concurrent operations
    const [user1Results, user2Results] = await Promise.all([
      Promise.all(user1Tasks.map(t => taskController.createTask(t))),
      Promise.all(user2Tasks.map(t => taskController.createTask(t)))
    ]);

    // All creations should succeed
    for (const result of [...user1Results, ...user2Results]) {
      assert.ok(!result.isError);
    }

    // Verify all tasks exist
    const board = await boardService.getBoard();
    const totalTasks = Object.values(board.lanes).flat();
    assert.strictEqual(totalTasks.length, 4);
  });

  // Scenario: Users moving same task (last write wins)
  it('should handle concurrent moves of the same task', async () => {
    const createResult = await taskController.createTask({
      title: 'Contended Task',
      lane: 'backlog'
    });

    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    // User1 moves to todo
    const user1Move = taskController.moveTask({ taskId, targetLane: 'todo' });

    // User2 moves to in_progress (slightly delayed)
    const user2Move = new Promise(resolve => {
      setTimeout(() => {
        resolve(taskController.moveTask({ taskId, targetLane: 'in_progress' }));
      }, 50);
    });

    await Promise.all([user1Move, user2Move]);

    // Verify final state
    const board = await boardService.getBoard();
    const task = Object.values(board.lanes).flat().find(t => t.id === taskId);

    // Last write wins - task should be in one of the target lanes
    assert.ok(['todo', 'in_progress'].includes(task.lane));
  });

  // Scenario: Users viewing board while others modify it
  it('should maintain board consistency during concurrent modifications', async () => {
    // Create initial tasks
    for (let i = 0; i < 5; i++) {
      await taskController.createTask({
        title: `Initial Task ${i}`,
        lane: 'backlog'
      });
    }

    const operations = [];

    // User1: Moving tasks
    for (let i = 0; i < 3; i++) {
      operations.push(
        boardService.getBoard().then(board => {
          const task = board.lanes.backlog[i];
          if (task) {
            return taskController.moveTask({
              taskId: task.id,
              targetLane: 'todo'
            });
          }
        })
      );
    }

    // User2: Updating tasks
    for (let i = 0; i < 2; i++) {
      operations.push(
        boardService.getBoard().then(board => {
          const task = board.lanes.backlog[i];
          if (task) {
            return taskController.updateTask({
              taskId: task.id,
              priority: 'high'
            });
          }
        })
      );
    }

    // User3: Creating new tasks
    operations.push(
      taskController.createTask({ title: 'New Task A', lane: 'backlog' }),
      taskController.createTask({ title: 'New Task B', lane: 'backlog' })
    );

    await Promise.all(operations);

    // Verify board is consistent
    const finalBoard = await boardService.getBoard();
    const totalTasks = Object.values(finalBoard.lanes).flat();
    assert.strictEqual(totalTasks.length, 7); // 5 initial + 2 new
  });

  // Scenario: Multiple users getting stats simultaneously
  it('should handle concurrent stat requests', async () => {
    // Create various tasks
    await taskController.createTask({ title: 'Task 1', lane: 'backlog', priority: 'high' });
    await taskController.createTask({ title: 'Task 2', lane: 'todo', priority: 'medium' });
    await taskController.createTask({ title: 'Task 3', lane: 'done', priority: 'low' });

    // Simulate 10 users requesting stats simultaneously
    const statsRequests = Array(10).fill(null).map(() =>
      boardController.getStats({})
    );

    const results = await Promise.all(statsRequests);

    // All requests should succeed
    for (const result of results) {
      assert.ok(!result.isError);
    }

    // All should return consistent data
    const firstStats = await boardService.getStats();
    assert.strictEqual(firstStats.totalTasks, 3);
  });

  // Scenario: User searching while others modify board
  it('should handle search during modifications', async () => {
    const tasks = [
      'Implement authentication',
      'Fix database bug',
      'Add user profile',
      'Update API docs',
      'Code review PR'
    ];

    for (const title of tasks) {
      await taskController.createTask({ title, lane: 'backlog' });
    }

    const operations = [];

    // User1: Searching for "API"
    operations.push(
      taskController.searchTasks({ query: 'API' })
    );

    // User2: Modifying tasks
    operations.push(
      boardService.getBoard().then(board => {
        const task = board.lanes.backlog[0];
        return taskController.moveTask({
          taskId: task.id,
          targetLane: 'in_progress'
        });
      })
    );

    // User3: Creating new task
    operations.push(
      taskController.createTask({
        title: 'API Integration Test',
        lane: 'backlog'
      })
    );

    const [searchResult] = await Promise.all(operations);

    // Search should complete successfully
    assert.ok(!searchResult.isError);
    assert.ok(searchResult.content[0].text.includes('Found'));
  });

  // Scenario: Batch operations from multiple users
  it('should handle concurrent batch operations', async () => {
    const user1Batch = [
      { title: 'User 1 Batch A' },
      { title: 'User 1 Batch B' },
      { title: 'User 1 Batch C' }
    ];

    const user2Batch = [
      { title: 'User 2 Batch A' },
      { title: 'User 2 Batch B' }
    ];

    const [user1Result, user2Result] = await Promise.all([
      taskController.batchCreate({ tasks: user1Batch }),
      taskController.batchCreate({ tasks: user2Batch })
    ]);

    // Both batches should succeed
    assert.ok(!user1Result.isError);
    assert.ok(!user2Result.isError);

    // Verify all tasks created
    const board = await boardService.getBoard();
    assert.strictEqual(board.lanes.backlog.length, 5);
  });
});

describe('Concurrent Operations - Stress Tests', () => {
  let boardService, taskController, boardController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
    boardController = new BoardController(boardService);
  });

  // Stress test: 100 concurrent task creations
  it('should handle 100 concurrent task creations', async () => {
    const tasks = Array(100).fill(null).map((_, i) => ({
      title: `Concurrent Task ${i}`,
      lane: 'backlog',
      priority: i % 4 === 0 ? 'high' : 'medium'
    }));

    const startTime = Date.now();
    const results = await Promise.all(tasks.map(t => taskController.createTask(t)));
    const duration = Date.now() - startTime;

    // All should succeed
    for (const result of results) {
      assert.ok(!result.isError);
    }

    // Verify count
    const board = await boardService.getBoard();
    assert.strictEqual(board.lanes.backlog.length, 100);

    // Performance check: should complete in reasonable time
    assert.ok(duration < 5000, `Operation took ${duration}ms, expected < 5000ms`);
  });

  // Stress test: Mixed operations
  it('should handle mixed concurrent operations', async () => {
    // Create initial tasks
    const initialTasks = [];
    for (let i = 0; i < 20; i++) {
      const result = await taskController.createTask({
        title: `Task ${i}`,
        lane: 'backlog'
      });
      initialTasks.push(result);
    }

    const operations = [];

    // Mix of operations
    for (let i = 0; i < 20; i++) {
      // Create
      operations.push(
        taskController.createTask({ title: `New Task ${i}`, lane: 'backlog' })
      );

      // Move (if task exists)
      if (initialTasks[i]) {
        const idMatch = initialTasks[i].content[0].text.match(/ID: ([^\n]+)/);
        if (idMatch) {
          operations.push(
            taskController.moveTask({
              taskId: idMatch[1].trim(),
              targetLane: i % 2 === 0 ? 'todo' : 'in_progress'
            })
          );
        }
      }

      // Update
      if (initialTasks[i]) {
        const idMatch = initialTasks[i].content[0].text.match(/ID: ([^\n]+)/);
        if (idMatch) {
          operations.push(
            taskController.updateTask({
              taskId: idMatch[1].trim(),
              priority: 'high'
            })
          );
        }
      }
    }

    const results = await Promise.all(operations);

    // Most should succeed (some might fail if task was moved/deleted)
    const successCount = results.filter(r => !r.isError).length;
    assert.ok(successCount > operations.length * 0.8); // At least 80% success
  });

  // Stress test: Rapid reads during writes
  it('should handle rapid reads during writes', async () => {
    const operations = [];

    // 50 writes
    for (let i = 0; i < 50; i++) {
      operations.push(
        taskController.createTask({ title: `Write Task ${i}`, lane: 'backlog' })
      );
    }

    // 50 reads interspersed
    for (let i = 0; i < 50; i++) {
      operations.push(boardController.getBoard({}));
    }

    const results = await Promise.all(operations);

    // All should complete without error
    for (const result of results) {
      assert.ok(!result.isError);
    }
  });
});

describe('Error Recovery Scenarios', () => {
  let boardService, taskController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
  });

  // Scenario: Recover from invalid task ID
  it('should gracefully handle invalid task ID in operations', async () => {
    const operations = [
      taskController.moveTask({ taskId: 'invalid-id-123', targetLane: 'todo' }),
      taskController.updateTask({ taskId: 'invalid-id-456', priority: 'high' })
      // Note: deleteTask is not exposed in controller, operations are done via BoardService
    ];

    const results = await Promise.all(operations);

    // All should fail gracefully
    for (const result of results) {
      assert.ok(result.isError);
      assert.ok(result.content[0].text.includes('not found') || result.content[0].text.includes('invalid'));
    }

    // Board should remain consistent
    const board = await boardService.getBoard();
    assert.strictEqual(Object.values(board.lanes).flat().length, 0);
  });

  // Scenario: Recover from invalid lane in move
  it('should handle invalid lane gracefully', async () => {
    const createResult = await taskController.createTask({ title: 'Test Task' });
    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    const moveResult = await taskController.moveTask({
      taskId,
      targetLane: 'invalid-lane-name'
    });

    assert.ok(moveResult.isError);

    // Task should remain in original lane
    const board = await boardService.getBoard();
    assert.strictEqual(board.lanes.backlog.length, 1);
  });

  // Scenario: Partial batch operation failure
  it('should handle partial batch failures', async () => {
    // Create some valid and some invalid tasks
    const tasks = [
      { title: 'Valid Task 1' },
      { title: '' }, // Invalid - empty title
      { title: 'Valid Task 2' },
      { title: 'x'.repeat(300) }, // Invalid - too long
      { title: 'Valid Task 3' }
    ];

    const result = await taskController.batchCreate({ tasks: tasks });

    // Should handle gracefully - either fail all or validate each
    if (result.isError) {
      assert.ok(result.content[0].text.includes('Validation'));
    } else {
      // If partial success, check valid ones created
      const board = await boardService.getBoard();
      assert.ok(board.lanes.backlog.length >= 3);
    }
  });

  // Scenario: Recovery after concurrent modification conflicts
  it('should maintain consistency after conflicts', async () => {
    const createResult = await taskController.createTask({
      title: 'Conflict Test',
      lane: 'backlog',
      priority: 'low'
    });

    const idMatch = createResult.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    // Conflicting operations
    const operations = [
      taskController.updateTask({ taskId, priority: 'high' }),
      taskController.moveTask({ taskId, targetLane: 'todo' }),
      taskController.updateTask({ taskId, priority: 'critical' })
    ];

    await Promise.all(operations);

    // Board should be in a valid state
    const board = await boardService.getBoard();
    const task = Object.values(board.lanes).flat().find(t => t.id === taskId);

    assert.ok(task);
    assert.ok(['backlog', 'todo'].includes(task.lane));
    assert.ok(['low', 'medium', 'high', 'critical'].includes(task.priority));
  });
});

describe('Performance Scenarios', () => {
  let boardService, taskController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
  });

  // Large board performance
  it('should handle large board efficiently', async () => {
    const TASK_COUNT = 500;

    const startTime = Date.now();
    for (let i = 0; i < TASK_COUNT; i++) {
      await taskController.createTask({
        title: `Performance Task ${i}`,
        lane: ['backlog', 'todo', 'in_progress', 'done'][i % 4],
        priority: ['low', 'medium', 'high', 'critical'][i % 4]
      });
    }
    const createTime = Date.now() - startTime;

    // Get board should be fast
    const getStart = Date.now();
    const board = await boardService.getBoard();
    const getTime = Date.now() - getStart;

    assert.strictEqual(Object.values(board.lanes).flat().length, TASK_COUNT);
    assert.ok(getTime < 100, `Get board took ${getTime}ms, expected < 100ms`);

    // Stats should be fast
    const statsStart = Date.now();
    await boardService.getStats();
    const statsTime = Date.now() - statsStart;

    assert.ok(statsTime < 50, `Get stats took ${statsTime}ms, expected < 50ms`);
  });

  // Search performance on large board
  it('should search large board efficiently', async () => {
    // Create 200 tasks with specific patterns
    for (let i = 0; i < 200; i++) {
      await taskController.createTask({
        title: i % 3 === 0 ? `API endpoint ${i}` : `Task ${i}`,
        lane: 'backlog'
      });
    }

    const startTime = Date.now();
    const result = await taskController.searchTasks({ query: 'API' });
    const searchTime = Date.now() - startTime;

    assert.ok(!result.isError);
    assert.ok(result.content[0].text.includes('Found'));
    assert.ok(searchTime < 100, `Search took ${searchTime}ms, expected < 100ms`);
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  let boardService, taskController;
  let mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
    taskController = new TaskController(boardService);
  });

  // Empty operations
  it('should handle empty batch creation', async () => {
    const result = await taskController.batchCreate({ tasks: [] });
    assert.ok(result.isError);
  });

  // Very long task titles
  it('should truncate very long titles', async () => {
    const veryLongTitle = 'A'.repeat(500);
    const result = await taskController.createTask({ title: veryLongTitle });

    assert.ok(!result.isError);

    const board = await boardService.getBoard();
    const task = board.lanes.backlog[0];
    assert.ok(task.title.length < 500);
  });

  // Special characters in titles
  it('should handle special characters in titles', async () => {
    const specialTitles = [
      'Task with <script> tags',
      'Task with "quotes"',
      "Task with 'apostrophes'",
      'Task with emoji 😀',
      'Task with &lt;entity&gt;',
      'Task\nwith\nnewlines',
      'Task\twith\ttabs'
    ];

    for (const title of specialTitles) {
      const result = await taskController.createTask({ title });
      assert.ok(!result.isError, `Failed for title: ${title}`);
    }

    const board = await boardService.getBoard();
    assert.strictEqual(board.lanes.backlog.length, specialTitles.length);
  });

  // Rapid lane changes
  it('should handle rapid lane changes', async () => {
    const result = await taskController.createTask({
      title: 'Moving Task',
      lane: 'backlog'
    });

    const idMatch = result.content[0].text.match(/ID: ([^\n]+)/);
    const taskId = idMatch[1].trim();

    const lanes = ['todo', 'in_progress', 'done', 'recovery', 'backlog'];

    // Move through all lanes rapidly
    for (const lane of lanes) {
      const moveResult = await taskController.moveTask({ taskId, targetLane: lane });
      assert.ok(!moveResult.isError);
    }

    // Verify final position
    const board = await boardService.getBoard();
    const task = Object.values(board.lanes).flat().find(t => t.id === taskId);
    assert.strictEqual(task.lane, 'backlog');
  });

  // Unicode and RTL text
  it('should handle Unicode and RTL text', async () => {
    const unicodeTitles = [
      'משימה בעברית', // Hebrew
      'مهمة بالعربية', // Arabic
      'Задача на русском', // Russian
      '中文任務', // Chinese
      '日本語のタスク', // Japanese
      '한국어 작업', // Korean
      'עברית שמאלית' // RTL Hebrew
    ];

    for (const title of unicodeTitles) {
      const result = await taskController.createTask({ title });
      assert.ok(!result.isError);
    }

    const board = await boardService.getBoard();
    assert.strictEqual(board.lanes.backlog.length, unicodeTitles.length);
  });

  // Concurrent duplicate task creation
  it('should handle concurrent duplicate task creation', async () => {
    const duplicateTitle = 'Duplicate Task';

    const operations = Array(10).fill(null).map(() =>
      taskController.createTask({ title: duplicateTitle, lane: 'backlog' })
    );

    const results = await Promise.all(operations);

    // All should succeed (duplicates allowed)
    for (const result of results) {
      assert.ok(!result.isError);
    }

    const board = await boardService.getBoard();
    assert.strictEqual(board.lanes.backlog.length, 10);
  });
});
