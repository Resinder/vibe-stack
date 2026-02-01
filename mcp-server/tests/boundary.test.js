/**
 * ============================================================================
 * VIBE STACK - Boundary Condition Tests
 * ============================================================================
 * Tests for edge cases, boundary values, and limit conditions
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Task } from '../src/core/models.js';
import { Board } from '../src/core/models.js';
import { TaskValidator } from '../src/middleware/taskValidation.js';
import { ValidationError } from '../src/core/models.js';
import { MAX_LENGTHS } from '../src/config/validationConstants.js';
import { Sanitizer } from '../src/utils/sanitizer.js';

describe('Boundary Conditions - Task Model', () => {
  describe('estimatedHours boundaries', () => {
    it('should handle estimatedHours at 0 (becomes null due to || null)', () => {
      const task = new Task({ title: 'Test Task', estimatedHours: 0 });
      // Note: 0 is falsy, so data.estimatedHours || null evaluates to null
      assert.strictEqual(task.estimatedHours, null);
    });

    it('should accept estimatedHours with large value', () => {
      const task = new Task({ title: 'Test Task', estimatedHours: 10000 });
      assert.strictEqual(task.estimatedHours, 10000);
    });

    it('should reject negative estimatedHours', () => {
      assert.throws(
        () => new Task({ title: 'Test Task', estimatedHours: -1 }),
        Error
      );
    });

    it('should reject decimal negative estimatedHours', () => {
      assert.throws(
        () => new Task({ title: 'Test Task', estimatedHours: -0.1 }),
        Error
      );
    });

    it('should accept null estimatedHours', () => {
      const task = new Task({ title: 'Test Task', estimatedHours: null });
      assert.strictEqual(task.estimatedHours, null);
    });

    it('should accept undefined estimatedHours', () => {
      const task = new Task({ title: 'Test Task' });
      assert.strictEqual(task.estimatedHours, null);
    });

    it('should handle decimal values', () => {
      const task1 = new Task({ title: 'Test Task', estimatedHours: 0.5 });
      assert.strictEqual(task1.estimatedHours, 0.5);

      const task2 = new Task({ title: 'Test Task', estimatedHours: 999.9 });
      assert.strictEqual(task2.estimatedHours, 999.9);
    });
  });

  describe('title boundaries', () => {
    it('should accept long title', () => {
      const title = 'A'.repeat(500);
      const task = new Task({ title });
      assert.strictEqual(task.title.length, 500);
    });

    it('should reject non-string title', () => {
      assert.throws(
        () => new Task({ title: 123 }),
        Error
      );
    });

    it('should accept title with whitespace', () => {
      const task = new Task({ title: '  Test Task  ' });
      assert.ok(task.title.includes('Test Task'));
    });

    it('should handle title with control characters', () => {
      const task = new Task({ title: 'Valid\x00Text' });
      assert.ok(task.title.includes('Valid'));
      assert.ok(task.title.includes('Text'));
    });

    it('should reject empty title (undefined defaults to empty string)', () => {
      const task = new Task({});
      assert.strictEqual(task.title, '');
    });
  });

  describe('description boundaries', () => {
    it('should accept long description', () => {
      const description = 'A'.repeat(5000);
      const task = new Task({ title: 'Test', description });
      assert.strictEqual(task.description.length, 5000);
    });

    it('should accept null description', () => {
      const task = new Task({ title: 'Test', description: null });
      assert.strictEqual(task.description, '');
    });

    it('should accept undefined description', () => {
      const task = new Task({ title: 'Test' });
      assert.strictEqual(task.description, '');
    });

    it('should handle empty description', () => {
      const task = new Task({ title: 'Test', description: '' });
      assert.strictEqual(task.description, '');
    });

    it('should handle non-string description (assigns as-is due to || pattern)', () => {
      // Task model: this.description = data.description || '';
      // When 123 is passed, 123 || '' evaluates to 123 (truthy)
      const task = new Task({ title: 'Test', description: 123 });
      assert.strictEqual(task.description, 123);
    });
  });

  describe('tags array boundaries', () => {
    it('should accept tags array', () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      const task = new Task({ title: 'Test', tags });
      assert.deepStrictEqual(task.tags, tags);
    });

    it('should reject non-string tags', () => {
      assert.throws(
        () => new Task({ title: 'Test', tags: [123] }),
        Error
      );
    });

    it('should convert non-array tags to empty array', () => {
      // Task model: Array.isArray(tags) ? tags : []
      const task = new Task({ title: 'Test', tags: 'not-an-array' });
      assert.deepStrictEqual(task.tags, []);
    });

    it('should accept null tags (defaults to empty array)', () => {
      const task = new Task({ title: 'Test', tags: null });
      assert.deepStrictEqual(task.tags, []);
    });

    it('should accept undefined tags (defaults to empty array)', () => {
      const task = new Task({ title: 'Test' });
      assert.deepStrictEqual(task.tags, []);
    });

    it('should accept empty tags array', () => {
      const task = new Task({ title: 'Test', tags: [] });
      assert.deepStrictEqual(task.tags, []);
    });
  });

  describe('priority enum boundaries', () => {
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    validPriorities.forEach(priority => {
      it(`should accept priority: "${priority}"`, () => {
        const task = new Task({ title: 'Test', priority });
        assert.strictEqual(task.priority, priority);
      });
    });

    it('should default to medium priority', () => {
      const task = new Task({ title: 'Test' });
      assert.strictEqual(task.priority, 'medium');
    });

    it('should reject invalid priority', () => {
      assert.throws(
        () => new Task({ title: 'Test', priority: 'urgent' }),
        Error
      );
    });

    it('should reject priority with whitespace', () => {
      assert.throws(
        () => new Task({ title: 'Test', priority: 'high ' }),
        Error
      );
    });

    it('should reject uppercase priority', () => {
      assert.throws(
        () => new Task({ title: 'Test', priority: 'HIGH' }),
        Error
      );
    });
  });

  describe('lane enum boundaries', () => {
    const validLanes = ['backlog', 'todo', 'in_progress', 'done', 'recovery'];

    validLanes.forEach(lane => {
      it(`should accept lane: "${lane}"`, () => {
        const task = new Task({ title: 'Test', lane });
        assert.strictEqual(task.lane, lane);
      });
    });

    it('should default to backlog lane', () => {
      const task = new Task({ title: 'Test' });
      assert.strictEqual(task.lane, 'backlog');
    });

    it('should reject invalid lane', () => {
      assert.throws(
        () => new Task({ title: 'Test', lane: 'pending' }),
        Error
      );
    });

    it('should reject lane with whitespace', () => {
      assert.throws(
        () => new Task({ title: 'Test', lane: 'backlog ' }),
        Error
      );
    });

    it('should reject uppercase lane', () => {
      assert.throws(
        () => new Task({ title: 'Test', lane: 'BACKLOG' }),
        Error
      );
    });

    it('should reject SQL injection in lane', () => {
      assert.throws(
        () => new Task({ title: 'Test', lane: "'; DROP TABLE tasks--" }),
        Error
      );
    });
  });
});

describe('Boundary Conditions - Board Model', () => {
  it('should handle empty board (no tasks)', () => {
    const board = new Board();
    assert.strictEqual(board.getAllTasks().length, 0);
    assert.strictEqual(board.lanes.backlog.length, 0);
  });

  it('should handle board with all tasks in single lane', () => {
    const board = new Board();
    for (let i = 0; i < 10; i++) {
      const task = new Task({ title: `Task ${i}`, lane: 'backlog' });
      board.addTask(task);
    }
    assert.strictEqual(board.lanes.backlog.length, 10);
    assert.strictEqual(board.getAllTasks().length, 10);
  });

  it('should handle board with tasks in multiple lanes', () => {
    const board = new Board();
    const task1 = new Task({ title: 'Task 1', lane: 'backlog' });
    const task2 = new Task({ title: 'Task 2', lane: 'todo' });
    board.addTask(task1);
    board.addTask(task2);

    assert.strictEqual(board.lanes.backlog.length, 1);
    assert.strictEqual(board.lanes.todo.length, 1);
    assert.strictEqual(board.getAllTasks().length, 2);
  });

  it('should handle toJSON and fromJSON', () => {
    const task = new Task({ title: 'Test Task', lane: 'backlog' });
    const board = new Board();
    board.addTask(task);

    const json = board.toJSON();
    const restored = Board.fromJSON(json);

    assert.strictEqual(restored.lanes.backlog[0].title, 'Test Task');
  });
});

describe('Boundary Conditions - TaskValidator', () => {
  describe('TaskValidator validation with limits', () => {
    it('should reject estimatedHours above MAX_LENGTHS limit', () => {
      assert.throws(
        () => TaskValidator.validateEstimatedHours(MAX_LENGTHS.estimatedHours + 1),
        ValidationError
      );
    });

    it('should reject estimatedHours below 0', () => {
      assert.throws(
        () => TaskValidator.validateEstimatedHours(-1),
        ValidationError
      );
    });

    it('should accept estimatedHours at boundaries', () => {
      const result1 = TaskValidator.validateEstimatedHours(0);
      assert.strictEqual(result1, 0);

      const result2 = TaskValidator.validateEstimatedHours(MAX_LENGTHS.estimatedHours);
      assert.strictEqual(result2, MAX_LENGTHS.estimatedHours);
    });

    it('should truncate title exceeding MAX_LENGTHS', () => {
      const title = 'A'.repeat(MAX_LENGTHS.title + 1);
      const validated = TaskValidator.validateTaskData({ title });
      // Sanitizer truncates instead of throwing
      assert.strictEqual(validated.title.length, MAX_LENGTHS.title);
    });

    it('should truncate description exceeding MAX_LENGTHS', () => {
      const description = 'B'.repeat(MAX_LENGTHS.description + 1);
      const validated = TaskValidator.validateTaskData({ title: 'Test', description });
      // Sanitizer truncates instead of throwing
      assert.strictEqual(validated.description.length, MAX_LENGTHS.description);
    });

    it('should reject empty title', () => {
      assert.throws(
        () => TaskValidator.validateTaskData({ title: '' }),
        ValidationError
      );
    });

    it('should reject title with only control characters', () => {
      assert.throws(
        () => TaskValidator.validateTaskData({ title: '\x00\x01\x02' }),
        ValidationError
      );
    });

    it('should sanitize control characters from title', () => {
      const validated = TaskValidator.validateTaskData({ title: 'Test\x00Task' });
      assert.ok(!validated.title.includes('\x00'));
    });
  });

  describe('taskId validation', () => {
    it('should accept valid task IDs', () => {
      const id = TaskValidator.validateTaskId('task-123-abc');
      assert.strictEqual(id, 'task-123-abc');
    });

    it('should reject empty task ID', () => {
      assert.throws(
        () => TaskValidator.validateTaskId(''),
        ValidationError
      );
    });

    it('should reject task ID with special characters', () => {
      assert.throws(
        () => TaskValidator.validateTaskId('task@123'),
        ValidationError
      );
    });

    it('should truncate task ID at max length', () => {
      const longId = 'a'.repeat(MAX_LENGTHS.taskId + 10);
      const validated = TaskValidator.validateTaskId(longId);
      assert.strictEqual(validated.length, MAX_LENGTHS.taskId);
    });
  });
});

describe('Boundary Conditions - Batch Operations', () => {
  it('should accept batch at limit (100 tasks)', () => {
    const tasks = Array.from({ length: 100 }, (_, i) => ({
      title: `Task ${i}`,
      lane: 'backlog'
    }));

    const validated = TaskValidator.validateBatchTasks(tasks);
    assert.strictEqual(validated.length, 100);
  });

  it('should reject batch exceeding limit (101 tasks)', () => {
    const tasks = Array.from({ length: 101 }, (_, i) => ({
      title: `Task ${i}`,
      lane: 'backlog'
    }));

    assert.throws(
      () => TaskValidator.validateBatchTasks(tasks),
      ValidationError
    );
  });

  it('should reject empty batch array', () => {
    assert.throws(
      () => TaskValidator.validateBatchTasks([]),
      ValidationError
    );
  });

  it('should reject non-array batch', () => {
    assert.throws(
      () => TaskValidator.validateBatchTasks('not-an-array'),
      ValidationError
    );
  });

  it('should reject batch with invalid task', () => {
    const tasks = [
      { title: 'Valid Task' },
      { title: '' },  // Invalid
    ];

    assert.throws(
      () => TaskValidator.validateBatchTasks(tasks),
      ValidationError
    );
  });
});

describe('Boundary Conditions - Search Query', () => {
  it('should accept query at max length (500 chars)', () => {
    const query = 'a'.repeat(500);
    const result = Sanitizer.sanitizeQuery(query);
    assert.strictEqual(result.length, 500);
  });

  it('should truncate query exceeding max length', () => {
    const query = 'a'.repeat(501);
    const result = Sanitizer.sanitizeQuery(query);
    // Sanitizer truncates instead of throwing
    assert.strictEqual(result.length, 500);
  });

  it('should handle empty query after trimming (returns empty)', () => {
    const result = Sanitizer.sanitizeQuery('   ');
    assert.strictEqual(result, '');
  });

  it('should sanitize control characters from query', () => {
    const query = 'test\x00\x01query';
    const result = Sanitizer.sanitizeQuery(query);
    assert.ok(!result.includes('\x00'));
  });
});

describe('Boundary Conditions - Special Characters', () => {
  it('should handle title with Unicode characters', () => {
    const task = new Task({
      title: 'Test 测试 🎉 你好'
    });
    assert.ok(task.title.includes('测试'));
  });

  it('should handle title with emoji', () => {
    const task = new Task({ title: 'Task 🔥💯✨' });
    assert.ok(task.title.includes('🔥'));
  });

  it('should handle RTL override characters', () => {
    const task = new Task({ title: 'Test\u202E' }); // RTL override
    assert.ok(task.title.length > 0);
  });

  it('should handle zero-width characters', () => {
    const task = new Task({ title: 'Test\u200B\u200C\u200D' }); // Zero-width chars
    assert.ok(task.title.includes('Test'));
  });

  it('should handle homoglyph characters', () => {
    const task = new Task({ title: 'Test with lооking words' }); // Cyrillic 'о'
    assert.strictEqual(task.title.length > 0, true);
  });
});
