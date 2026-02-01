/**
 * ============================================================================
 * VIBE STACK - Error Handling Tests
 * ============================================================================
 * Tests for centralized error handling
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ErrorHandler,
  AppError,
  TaskNotFoundError,
  InvalidLaneError,
  BoardError,
  PlanningError
} from '../src/middleware/errorHandler.js';
import { ValidationError } from '../src/core/models.js';

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError('Test error', 'TEST_CODE', 400, { key: 'value' });

    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.strictEqual(error.statusCode, 400);
    assert.deepStrictEqual(error.details, { key: 'value' });
  });

  it('should convert to MCP response', () => {
    const error = new AppError('Test error', 'TEST_CODE', 400);
    const response = error.toMCPResponse();

    assert.ok(response.isError);
    assert.ok(response.content[0].text.includes('[TEST_CODE]'));
  });

  it('should convert to JSON', () => {
    const error = new AppError('Test error', 'TEST_CODE', 400);
    const json = error.toJSON();

    assert.strictEqual(json.message, 'Test error');
    assert.strictEqual(json.code, 'TEST_CODE');
    assert.strictEqual(json.statusCode, 400);
  });
});

describe('TaskNotFoundError', () => {
  it('should create with task ID', () => {
    const error = new TaskNotFoundError('task-123');

    assert.strictEqual(error.code, 'TASK_NOT_FOUND');
    assert.strictEqual(error.statusCode, 404);
    assert.strictEqual(error.details.taskId, 'task-123');
    assert.strictEqual(error.details.hint, null);
  });

  it('should include task ID in message', () => {
    const error = new TaskNotFoundError('task-123');

    assert.ok(error.message.includes('task-123'));
  });

  it('should include hint in message when provided', () => {
    const error = new TaskNotFoundError('task-123', 'Check the todo lane');

    assert.ok(error.message.includes('Check the todo lane'));
  });
});

describe('InvalidLaneError', () => {
  it('should create with lane and valid lanes', () => {
    const error = new InvalidLaneError('bad-lane', ['backlog', 'todo']);

    assert.strictEqual(error.code, 'INVALID_LANE');
    assert.strictEqual(error.statusCode, 400);
    assert.deepStrictEqual(error.details.lane, 'bad-lane');
    assert.deepStrictEqual(error.details.validLanes, ['backlog', 'todo']);
  });
});

describe('BoardError', () => {
  it('should create with message and operation', () => {
    const error = new BoardError('Failed to load', 'loadBoard');

    assert.strictEqual(error.code, 'BOARD_ERROR');
    assert.strictEqual(error.statusCode, 500);
    assert.strictEqual(error.details.operation, 'loadBoard');
  });
});

describe('PlanningError', () => {
  it('should create with message', () => {
    const error = new PlanningError('Invalid goal');

    assert.strictEqual(error.code, 'PLANNING_ERROR');
    assert.strictEqual(error.statusCode, 400);
  });
});

describe('ErrorHandler', () => {
  it('should handle AppError', () => {
    const error = new TaskNotFoundError('task-123');
    const response = ErrorHandler.handle(error);

    assert.ok(response.isError);
    assert.ok(response.content[0].text.includes('TASK_NOT_FOUND'));
  });

  it('should handle ValidationError', () => {
    const error = new ValidationError('Invalid input');
    const response = ErrorHandler.handle(error);

    assert.ok(response.isError);
    assert.ok(response.content[0].text.includes('Validation Error'));
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');
    const response = ErrorHandler.handle(error);

    assert.ok(response.isError);
    assert.ok(response.content[0].text.includes('Error:'));
  });

  it('should return safe error in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Sensitive info');
    const response = ErrorHandler.handle(error);

    assert.ok(response.content[0].text.includes('An unexpected error occurred'));

    process.env.NODE_ENV = originalEnv;
  });

  it('should return detailed error in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Debug info');
    const response = ErrorHandler.handle(error);

    assert.ok(response.content[0].text.includes('Debug info'));

    process.env.NODE_ENV = originalEnv;
  });

  it('should create safe response', () => {
    const error = new TaskNotFoundError('task-123');
    const safe = ErrorHandler.toSafeResponse(error);

    assert.ok(safe.error);
    assert.strictEqual(safe.error.code, 'TASK_NOT_FOUND');
  });

  it('should hide internal errors in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Internal error');
    const safe = ErrorHandler.toSafeResponse(error);

    assert.strictEqual(safe.error.message, 'An internal error occurred');

    process.env.NODE_ENV = originalEnv;
  });
});
