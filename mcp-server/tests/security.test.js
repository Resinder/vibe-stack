/**
 * ============================================================================
 * VIBE STACK - Security Tests
 * ============================================================================
 * Tests for security features and input sanitization
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Validator, InputValidator, PlanningValidator } from '../src/middleware/validation.js';
import { ValidationError } from '../src/core/models.js';
import { BoardService } from '../src/services/boardService.js';
import { BoardError } from '../src/middleware/errorHandler.js';
import { Task } from '../src/core/models.js';
import { MockPostgresStorage } from './helpers/mockStorage.js';

function createMockTask(overrides = {}) {
  return {
    title: 'Test Task',
    description: 'Test description',
    lane: 'backlog',
    priority: 'medium',
    estimatedHours: 4,
    tags: ['test'],
    ...overrides
  };
}

describe('Security - Input Sanitization', () => {
  it('should remove null bytes', () => {
    const inputs = [
      'test\x00string',
      '\x00\x00\x00',
      'hello\x00world'
    ];

    for (const input of inputs) {
      const sanitized = Validator.sanitizeString(input);
      assert.ok(!sanitized.includes('\x00'), `Should remove null bytes from: ${JSON.stringify(input)}`);
    }
  });

  it('should remove control characters', () => {
    const malicious = 'test\x01\x02\x03\x1B\x7Fstring';
    const sanitized = Validator.sanitizeString(malicious);

    assert.ok(!sanitized.includes('\x01'));
    assert.ok(!sanitized.includes('\x02'));
    assert.ok(!sanitized.includes('\x1B'));
    assert.ok(!sanitized.includes('\x7F'));
  });

  it('should trim whitespace', () => {
    const inputs = [
      '  test  ',
      '\ntest\n',
      '\ttest\t'
    ];

    for (const input of inputs) {
      const sanitized = Validator.sanitizeString(input);
      assert.strictEqual(sanitized, 'test');
    }
  });

  it('should enforce string length limits', () => {
    const longString = 'a'.repeat(1000);
    const sanitized = Validator.sanitizeString(longString, 100);

    assert.strictEqual(sanitized.length, 100);
  });
});

describe('Security - Path Traversal Prevention', () => {
  it('should block path traversal with ..', () => {
    const maliciousPaths = [
      '../../../etc/passwd',
      '../../sensitive-file',
      './../../etc/shadow',
      '../.env'
    ];

    for (const path of maliciousPaths) {
      assert.throws(
        () => InputValidator.validateFilePath(path),
        ValidationError,
        `Should block: ${path}`
      );
    }
  });

  it('should block home directory access', () => {
    const maliciousPaths = [
      '~/.ssh',
        '~/.config',
      '~/passwords'
    ];

    for (const path of maliciousPaths) {
      assert.throws(
        () => InputValidator.validateFilePath(path),
        ValidationError,
        `Should block: ${path}`
      );
    }
  });

  it('should validate file paths within allowed directory', () => {
    // Use a relative path that stays within the base directory
    const basePath = process.platform === 'win32' ? 'C:\\data' : '/data';
    const safePath = 'subdir' + (process.platform === 'win32' ? '\\' : '/') + 'file.json';

    const result = InputValidator.validateFilePath(safePath, basePath);
    assert.ok(result);
    assert.ok(result.startsWith(basePath));
  });

  it('should reject paths outside allowed directory', () => {
    const basePath = process.platform === 'win32' ? 'C:\\data' : '/data';
    const unsafePath = process.platform === 'win32' ? 'C:\\etc\\passwd' : '/etc/passwd';

    assert.throws(
      () => InputValidator.validateFilePath(unsafePath, basePath),
      ValidationError
    );
  });
});

describe('Security - Injection Prevention', () => {
  it('should sanitize task titles from control characters', () => {
    const maliciousTitles = [
      'Task\x00with\x00null\x00bytes',
      'Task with escape \x1B[31m codes',
      'Test\x01\x02\x03\x04\x05string'
    ];

    for (const title of maliciousTitles) {
      const sanitized = Validator.sanitizeString(title);
      assert.ok(!sanitized.includes('\x00'), `Should remove null bytes from: ${JSON.stringify(title)}`);
      assert.ok(!sanitized.includes('\x1B'), `Should remove escape chars from: ${JSON.stringify(title)}`);
      assert.ok(!sanitized.includes('\x01'), `Should remove control chars from: ${JSON.stringify(title)}`);
    }
  });

  it('should sanitize tags array from control characters', () => {
    const malicious = {
      title: 'Test',
      tags: ['tag\x00', '\x1bmalicious', '\x01\x02\x03bad']
    };

    const validated = Validator.validateTaskData(malicious);

    assert.ok(!validated.tags[0].includes('\x00'));
    assert.ok(!validated.tags[1].includes('\x1b'));
    assert.ok(!validated.tags[2].includes('\x01'));
  });

  it('should limit batch size to prevent DoS', () => {
    const tooMany = Array(101).fill(null).map((_, i) => ({ title: `Task ${i}` }));

    assert.throws(
      () => Validator.validateBatchTasks(tooMany),
      ValidationError
    );
  });
});

describe('Security - Board Service', () => {
  let boardService, mockStorage;

  beforeEach(async () => {
    mockStorage = new MockPostgresStorage();
    boardService = new BoardService(mockStorage);
    await boardService.initialize();
  });

  afterEach(async () => {
    if (boardService) {
      await boardService.destroy();
    }
  });

  it('should sanitize updates from control characters', async () => {
    const task = new Task(createMockTask());
    await boardService.addTask(task);

    const malicious = {
      title: 'Malicious\x00Title\x01\x02',
      description: '\x1B[31mRed\x00Text\x03',
      tags: ['tag\x00', '\x1bmalicious']
    };

    const updated = await boardService.updateTask(task.id, malicious);

    assert.ok(!updated.title.includes('\x00'));
    assert.ok(!updated.title.includes('\x01'));
    assert.ok(!updated.description.includes('\x1B'));
    assert.strictEqual(updated.tags.length, 2);
  });

  it('should validate storage parameter on construction', () => {
    assert.throws(
      () => new BoardService(null),
      BoardError
    );
    assert.throws(
      () => new BoardService('string-path'),
      BoardError
    );
  });
});

describe('Security - ReDoS Prevention', () => {
  it('should limit query length', () => {
    const longQuery = '(.*){100}'.repeat(10);
    const sanitized = PlanningValidator.validateQuery(longQuery);

    assert.ok(sanitized.length <= 500);
  });

  it('should enforce max length on queries', () => {
    const query = '(.*){100}';
    const sanitized = Validator.sanitizeString(query, 50);

    // sanitizeString removes control characters and trims whitespace
    // For a normal string with no control chars, length should be unchanged
    // '(.*){100}' has 9 characters: ( . * ) { 1 0 0 }
    assert.strictEqual(sanitized, '(.*){100}');
    assert.strictEqual(sanitized.length, 9);
  });
});

describe('Security - Task ID Validation', () => {
  it('should enforce alphanumeric format', () => {
    const invalidIds = [
      '../etc/passwd',
      '../../.env',
      'task; DROP TABLE--',
      'task<script>'
    ];

    for (const id of invalidIds) {
      assert.throws(
        () => Validator.validateTaskId(id),
        ValidationError,
        `Should reject: ${id}`
      );
    }
  });

  it('should accept valid IDs', () => {
    const validIds = [
      'task-123-abc',
      'task_456_def',
      'TASK-001',
      '12345-67890'
    ];

    for (const id of validIds) {
      const result = Validator.validateTaskId(id);
      assert.strictEqual(result, id);
    }
  });
});
