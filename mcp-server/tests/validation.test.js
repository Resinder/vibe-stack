/**
 * ============================================================================
 * VIBE STACK - Validation Tests
 * ============================================================================
 * Tests for input validation and sanitization
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Validator, PlanningValidator, InputValidator } from '../src/middleware/validation.js';
import { ValidationError } from '../src/core/models.js';

describe('Validator - String Sanitization', () => {
  it('should trim whitespace', () => {
    assert.strictEqual(Validator.sanitizeString('  test  '), 'test');
  });

  it('should remove control characters', () => {
    assert.strictEqual(Validator.sanitizeString('test\x00\x01\x02string'), 'teststring');
  });

  it('should enforce max length', () => {
    const longString = 'a'.repeat(200);
    const sanitized = Validator.sanitizeString(longString, 50);
    assert.strictEqual(sanitized.length, 50);
  });

  it('should reject non-string input', () => {
    assert.throws(() => Validator.sanitizeString(123), ValidationError);
  });
});

describe('Validator - Task ID Validation', () => {
  it('should validate valid task ID', () => {
    const result = Validator.validateTaskId('task-123-abc');
    assert.strictEqual(result, 'task-123-abc');
  });

  it('should reject invalid task ID', () => {
    assert.throws(() => Validator.validateTaskId('../etc/passwd'), ValidationError);
  });

  it('should require task ID', () => {
    assert.throws(() => Validator.validateTaskId(''), ValidationError);
  });
});

describe('Validator - Lane Validation', () => {
  it('should normalize lane to lowercase', () => {
    assert.strictEqual(Validator.validateLane('BACKLOG'), 'backlog');
    assert.strictEqual(Validator.validateLane('ToDo'), 'todo');
  });

  it('should validate correct lanes', () => {
    assert.strictEqual(Validator.validateLane('backlog'), 'backlog');
    assert.strictEqual(Validator.validateLane('done'), 'done');
  });

  it('should reject invalid lane', () => {
    assert.throws(() => Validator.validateLane('invalid'), ValidationError);
  });
});

describe('Validator - Priority Validation', () => {
  it('should normalize priority to lowercase', () => {
    assert.strictEqual(Validator.validatePriority('HIGH'), 'high');
  });

  it('should validate correct priorities', () => {
    assert.strictEqual(Validator.validatePriority('low'), 'low');
    assert.strictEqual(Validator.validatePriority('critical'), 'critical');
  });

  it('should reject invalid priority', () => {
    assert.throws(() => Validator.validatePriority('invalid'), ValidationError);
  });
});

describe('Validator - Task Data Validation', () => {
  it('should validate complete task data', () => {
    const data = {
      title: 'Test Task',
      description: 'Test description',
      lane: 'backlog',
      priority: 'high',
      estimatedHours: 8,
      tags: ['test', 'feature']
    };

    const result = Validator.validateTaskData(data);
    assert.strictEqual(result.title, 'Test Task');
    assert.strictEqual(result.estimatedHours, 8);
    assert.deepStrictEqual(result.tags, ['test', 'feature']);
  });

  it('should require title', () => {
    assert.throws(() => Validator.validateTaskData({}), ValidationError);
  });

  it('should reject empty title', () => {
    assert.throws(() => Validator.validateTaskData({ title: '' }), ValidationError);
  });

  it('should validate estimated hours range', () => {
    assert.throws(() => Validator.validateTaskData({ title: 'Test', estimatedHours: -1 }), ValidationError);
    assert.throws(() => Validator.validateTaskData({ title: 'Test', estimatedHours: 2000 }), ValidationError);
  });

  it('should validate tags array', () => {
    assert.throws(() => Validator.validateTaskData({ title: 'Test', tags: 'not-array' }), ValidationError);
  });
});

describe('Validator - Batch Task Validation', () => {
  it('should validate batch tasks', () => {
    const tasks = [
      { title: 'Task 1' },
      { title: 'Task 2' },
      { title: 'Task 3' }
    ];

    const result = Validator.validateBatchTasks(tasks);
    assert.strictEqual(result.length, 3);
  });

  it('should reject empty array', () => {
    assert.throws(() => Validator.validateBatchTasks([]), ValidationError);
  });

  it('should reject non-array', () => {
    assert.throws(() => Validator.validateBatchTasks('not-array'), ValidationError);
  });

  it('should limit batch size', () => {
    const tooMany = Array(101).fill(null).map((_, i) => ({ title: `Task ${i}` }));
    assert.throws(() => Validator.validateBatchTasks(tooMany), ValidationError);
  });

  it('should validate each task in batch', () => {
    const tasks = [
      { title: 'Valid' },
      { title: '' }  // Invalid
    ];

    assert.throws(() => Validator.validateBatchTasks(tasks), ValidationError);
  });
});

describe('PlanningValidator - Goal Validation', () => {
  it('should validate goal', () => {
    const result = PlanningValidator.validateGoal('Add authentication');
    assert.strictEqual(result, 'Add authentication');
  });

  it('should sanitize goal', () => {
    const result = PlanningValidator.validateGoal('  Test\x00 ');
    assert.strictEqual(result, 'Test');
  });

  it('should require goal', () => {
    assert.throws(() => PlanningValidator.validateGoal(''), ValidationError);
    assert.throws(() => PlanningValidator.validateGoal(null), ValidationError);
  });
});

describe('PlanningValidator - Query Validation', () => {
  it('should validate query', () => {
    const result = PlanningValidator.validateQuery('search term');
    assert.strictEqual(result, 'search term');
  });

  it('should reject empty query', () => {
    assert.throws(() => PlanningValidator.validateQuery(''), ValidationError);
  });

  it('should limit query length', () => {
    const longQuery = 'a'.repeat(600);
    const result = PlanningValidator.validateQuery(longQuery);
    assert.strictEqual(result.length, 500);
  });
});

describe('InputValidator - File Path Validation', () => {
  it('should block path traversal', () => {
    assert.throws(() => InputValidator.validateFilePath('../../../etc/passwd'), ValidationError);
    assert.throws(() => InputValidator.validateFilePath('~/.ssh'), ValidationError);
  });

  it('should remove null bytes from file paths', () => {
    const result = InputValidator.validateFilePath('test\x00file');
    assert.strictEqual(result, 'testfile');
  });

  it('should validate clean path', () => {
    const result = InputValidator.validateFilePath('/data/test.json');
    assert.strictEqual(result, '/data/test.json');
  });
});
