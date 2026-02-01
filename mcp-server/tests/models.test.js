/**
 * ============================================================================
 * VIBE STACK - Model Tests
 * ============================================================================
 * Tests for core domain models
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Task, Board, ValidationError } from '../src/core/models.js';

/**
 * Test utilities
 */
class TestUtils {
  static createMockTask(overrides = {}) {
    return {
      title: 'Test Task',
      description: 'A test task description',
      lane: 'backlog',
      priority: 'medium',
      estimatedHours: 4,
      tags: ['test'],
      ...overrides
    };
  }
}

/**
 * Test Task model
 */
describe('Task Model', () => {
  it('should create a valid task', () => {
    const task = new Task(TestUtils.createMockTask());

    assert.ok(task.id, 'should generate ID');
    assert.strictEqual(task.title, 'Test Task');
    assert.strictEqual(task.lane, 'backlog');
    assert.strictEqual(task.priority, 'medium');
    assert.ok(task.createdAt, 'should set createdAt');
    assert.ok(task.updatedAt, 'should set updatedAt');
  });

  it('should reject invalid lane', () => {
    assert.throws(
      () => new Task({ lane: 'invalid-lane' }),
      Error,
      'should reject invalid lane'
    );
  });

  it('should reject invalid priority', () => {
    assert.throws(
      () => new Task({ priority: 'invalid' }),
      Error,
      'should reject invalid priority'
    );
  });

  it('should reject negative hours', () => {
    assert.throws(
      () => new Task({ estimatedHours: -1 }),
      Error,
      'should reject negative hours'
    );
  });

  it('should convert to JSON', () => {
    const task = new Task(TestUtils.createMockTask());
    const json = task.toJSON();

    assert.strictEqual(json.title, 'Test Task');
    assert.ok(json.id);
  });

  it('should create from JSON', () => {
    const data = TestUtils.createMockTask();
    const task = Task.fromJSON(data);

    assert.strictEqual(task.title, 'Test Task');
    assert.ok(task.id);
  });
});

/**
 * Test Board model
 */
describe('Board Model', () => {
  it('should create empty board', () => {
    const board = new Board();

    assert.ok(board.lanes.backlog, 'should have backlog lane');
    assert.ok(board.lanes.todo, 'should have todo lane');
    assert.strictEqual(board.lanes.backlog.length, 0, 'backlog should be empty');
  });

  it('should add task to lane', () => {
    const board = new Board();
    const task = new Task(TestUtils.createMockTask());

    board.addTask(task);

    assert.strictEqual(board.lanes.backlog.length, 1);
    assert.strictEqual(board.lanes.backlog[0].title, 'Test Task');
  });

  it('should get all tasks', () => {
    const board = new Board();
    const task1 = new Task(TestUtils.createMockTask({ title: 'Task 1' }));
    const task2 = new Task(TestUtils.createMockTask({ title: 'Task 2', lane: 'todo' }));

    board.addTask(task1);
    board.addTask(task2);

    const allTasks = board.getAllTasks();
    assert.strictEqual(allTasks.length, 2);
  });

  it('should convert to JSON', () => {
    const board = new Board();
    const json = board.toJSON();

    assert.ok(json.lanes);
    assert.ok(json.lastSync);
  });

  it('should create from JSON', () => {
    const data = {
      lanes: {
        backlog: [{ id: 'test-1', title: 'Test', lane: 'backlog', priority: 'medium' }],
        todo: [],
        in_progress: [],
        done: [],
        recovery: []
      }
    };

    const board = Board.fromJSON(data);
    assert.strictEqual(board.lanes.backlog.length, 1);
  });
});
