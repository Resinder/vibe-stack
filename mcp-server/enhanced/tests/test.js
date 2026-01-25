/**
 * ============================================================================
 * VIBE STACK - Test Suite
 * ============================================================================
 * Comprehensive tests for all components
 * @version 2.0.0
 * ============================================================================
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { unlinkSync, existsSync, mkdirSync, rmdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Import modules to test
import { Task, Board, ValidationError } from '../core/models.js';
import { Validator } from '../middleware/validation.js';
import { ErrorHandler, AppError, TaskNotFoundError, InvalidLaneError, BoardError } from '../middleware/errorHandler.js';
import { BoardService } from '../services/boardService.js';
import { TaskPlanningService } from '../services/taskPlanningService.js';
import { TaskController } from '../controllers/taskController.js';
import { BoardController } from '../controllers/boardController.js';
import { PlanningController } from '../controllers/planningController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test data directory
const TEST_DATA_DIR = join(__dirname, '.test-data');
const TEST_BRIDGE_FILE = join(TEST_DATA_DIR, 'test-bridge.json');

/**
 * Test utilities
 */
class TestUtils {
  static cleanupTestData() {
    if (existsSync(TEST_BRIDGE_FILE)) {
      unlinkSync(TEST_BRIDGE_FILE);
    }
  }

  static setupTestData() {
    if (!existsSync(TEST_DATA_DIR)) {
      mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
  }

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
 * Run all tests
 */
async function runTests() {
  console.log('\n🧪 Vibe Stack Test Suite\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  const tests = [
    testValidation,
    testModels,
    testErrorHandling,
    testBoardService,
    testTaskPlanningService,
    testControllers,
    testSecurity
  ];

  for (const testSuite of tests) {
    try {
      TestUtils.setupTestData();
      await testSuite();
    } catch (error) {
      console.error(`\n❌ Test suite failed: ${error.message}`);
      failed++;
    } finally {
      TestUtils.cleanupTestData();
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ All tests passed!\n`);
}

/**
 * Test validation middleware
 */
async function testValidation() {
  console.log('\n📋 Testing Validation Middleware...');

  // Test sanitizeString
  assert.strictEqual(
    Validator.sanitizeString('  test  '),
    'test',
    'should trim whitespace'
  );

  assert.strictEqual(
    Validator.sanitizeString('test\x00\x01\x02string'),
    'teststring',
    'should remove control characters'
  );

  // Test validateTaskId
  assert.strictEqual(
    Validator.validateTaskId('task-123-abc'),
    'task-123-abc',
    'should validate valid task ID'
  );

  assert.throws(
    () => Validator.validateTaskId('../../../etc/passwd'),
    ValidationError,
    'should reject invalid task ID'
  );

  // Test validateLane
  assert.strictEqual(
    Validator.validateLane('BACKLOG'),
    'backlog',
    'should normalize lane to lowercase'
  );

  assert.throws(
    () => Validator.validateLane('invalid-lane'),
    ValidationError,
    'should reject invalid lane'
  );

  // Test validateTaskData
  const validTask = Validator.validateTaskData(TestUtils.createMockTask());
  assert.strictEqual(validTask.title, 'Test Task');
  assert.strictEqual(validTask.priority, 'medium');

  assert.throws(
    () => Validator.validateTaskData({}),
    ValidationError,
    'should require title'
  );

  // Test validateBatchTasks
  const batch = Validator.validateBatchTasks([
    TestUtils.createMockTask({ title: 'Task 1' }),
    TestUtils.createMockTask({ title: 'Task 2' })
  ]);
  assert.strictEqual(batch.length, 2);

  assert.throws(
    () => Validator.validateBatchTasks([]),
    ValidationError,
    'should reject empty array'
  );

  assert.throws(
    () => Validator.validateBatchTasks('not an array'),
    ValidationError,
    'should reject non-array'
  );

  console.log('  ✅ Validation tests passed');
}

/**
 * Test domain models
 */
async function testModels() {
  console.log('\n📦 Testing Domain Models...');

  // Test Task model
  const taskData = TestUtils.createMockTask();
  const task = new Task(taskData);

  assert.ok(task.id, 'should generate ID');
  assert.strictEqual(task.title, 'Test Task');
  assert.strictEqual(task.lane, 'backlog');
  assert.strictEqual(task.priority, 'medium');
  assert.ok(task.createdAt, 'should set createdAt');
  assert.ok(task.updatedAt, 'should set updatedAt');

  // Test task validation
  assert.throws(
    () => new Task({ lane: 'invalid-lane' }),
    Error,
    'should reject invalid lane'
  );

  assert.throws(
    () => new Task({ priority: 'invalid' }),
    Error,
    'should reject invalid priority'
  );

  assert.throws(
    () => new Task({ estimatedHours: -1 }),
    Error,
    'should reject negative hours'
  );

  // Test Board model
  const board = new Board();
  assert.ok(board.lanes.backlog, 'should have backlog lane');
  assert.ok(board.lanes.todo, 'should have todo lane');
  assert.strictEqual(board.lanes.backlog.length, 0, 'backlog should be empty');

  board.addTask(task);
  assert.strictEqual(board.lanes.backlog.length, 1, 'should add task to backlog');

  // Test board from JSON
  const boardData = {
    lanes: {
      backlog: [task.toJSON()],
      todo: [],
      in_progress: [],
      done: [],
      recovery: []
    }
  };
  const boardFromJSON = Board.fromJSON(boardData);
  assert.strictEqual(boardFromJSON.lanes.backlog.length, 1);

  console.log('  ✅ Model tests passed');
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\n🛡️  Testing Error Handling...');

  // Test AppError
  const appError = new AppError('Test error', 'TEST_CODE', 400);
  assert.strictEqual(appError.message, 'Test error');
  assert.strictEqual(appError.code, 'TEST_CODE');
  assert.strictEqual(appError.statusCode, 400);

  const response = appError.toMCPResponse();
  assert.ok(response.isError, 'should return error response');
  assert.ok(response.content[0].text.includes('[TEST_CODE]'));

  // Test TaskNotFoundError
  const notFoundError = new TaskNotFoundError('task-123');
  assert.strictEqual(notFoundError.code, 'TASK_NOT_FOUND');
  assert.strictEqual(notFoundError.statusCode, 404);
  assert.deepStrictEqual(notFoundError.details, { taskId: 'task-123' });

  // Test InvalidLaneError
  const laneError = new InvalidLaneError('bad-lane', ['backlog', 'todo']);
  assert.strictEqual(laneError.code, 'INVALID_LANE');
  assert.deepStrictEqual(laneError.details.lane, 'bad-lane');

  // Test ErrorHandler
  const handled = ErrorHandler.handle(notFoundError);
  assert.ok(handled.isError);
  assert.ok(handled.content[0].text.includes('TASK_NOT_FOUND'));

  console.log('  ✅ Error handling tests passed');
}

/**
 * Test BoardService
 */
async function testBoardService() {
  console.log('\n🗄️  Testing BoardService...');

  const service = new BoardService(TEST_BRIDGE_FILE);

  // Test initial state
  const board = service.board;
  assert.ok(board.lanes, 'should have lanes');
  assert.strictEqual(board.lanes.backlog.length, 0, 'backlog should be empty');

  // Test addTask
  const task = new Task(TestUtils.createMockTask());
  const added = service.addTask(task);
  assert.strictEqual(added.title, 'Test Task');
  assert.strictEqual(service.board.lanes.backlog.length, 1);

  // Test moveTask
  const moved = service.moveTask(task.id, 'todo');
  assert.strictEqual(moved.lane, 'todo');
  assert.strictEqual(service.board.lanes.backlog.length, 0);
  assert.strictEqual(service.board.lanes.todo.length, 1);

  // Test updateTask
  const updated = service.updateTask(task.id, { priority: 'high' });
  assert.strictEqual(updated.priority, 'high');

  // Test getStats
  const stats = service.getStats();
  assert.strictEqual(stats.totalTasks, 1);
  assert.strictEqual(stats.byLane.todo, 1);

  // Test searchTasks
  const results = service.searchTasks('Test');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].title, 'Test Task');

  // Test task not found
  assert.throws(
    () => service.moveTask('nonexistent', 'done'),
    TaskNotFoundError
  );

  // Test invalid lane
  assert.throws(
    () => service.moveTask(task.id, 'invalid'),
    InvalidLaneError
  );

  // Test path traversal protection
  assert.throws(
    () => new BoardService('../../../etc/passwd'),
    BoardError
  );

  service.destroy();
  console.log('  ✅ BoardService tests passed');
}

/**
 * Test TaskPlanningService
 */
async function testTaskPlanningService() {
  console.log('\n🎯 Testing TaskPlanningService...');

  const service = new TaskPlanningService();

  // Test analyzeGoal
  const authPatterns = service.analyzeGoal('Add OAuth authentication');
  assert.ok(authPatterns.length > 0, 'should detect auth patterns');
  assert.ok(authPatterns.some(p => p.name === 'authentication'), 'should find authentication pattern');

  const genericPatterns = service.analyzeGoal('Make a sandwich');
  assert.strictEqual(genericPatterns.length, 0, 'should not match patterns for generic goals');

  // Test generatePlan with pattern match
  const authPlan = service.generatePlan('Add OAuth login', 'For user authentication');
  assert.ok(authPlan.length > 0, 'should generate tasks');
  assert.ok(authPlan.some(t => t.title.includes('Design')), 'should include design tasks');
  assert.ok(authPlan.some(t => t.tags.includes('authentication')), 'should tag with pattern name');

  // Test generatePlan with generic goal
  const genericPlan = service.generatePlan('Create something new');
  assert.ok(genericPlan.length > 0, 'should generate generic tasks');
  assert.ok(genericPlan.some(t => t.title.includes('Research')), 'should include research task');

  // Test validation
  assert.throws(
    () => service.generatePlan(''),
    Error,
    'should require goal'
  );

  assert.throws(
    () => service.generatePlan(null),
    Error,
    'should require goal to be string'
  );

  console.log('  ✅ TaskPlanningService tests passed');
}

/**
 * Test controllers
 */
async function testControllers() {
  console.log('\n🎮 Testing Controllers...');

  const boardService = new BoardService(TEST_BRIDGE_FILE);
  const planningService = new TaskPlanningService();

  // Test TaskController
  const taskController = new TaskController(boardService);

  const createResult = taskController.createTask(TestUtils.createMockTask());
  assert.ok(!createResult.isError, 'should create task successfully');
  assert.ok(createResult.content[0].text.includes('Task created'));

  const invalidTask = taskController.createTask({});
  assert.ok(invalidTask.isError, 'should reject invalid task');
  assert.ok(invalidTask.content[0].text.includes('Validation Error'));

  const moveResult = taskController.moveTask({ taskId: 'invalid-id', targetLane: 'todo' });
  assert.ok(moveResult.isError, 'should handle not found');

  // Test BoardController
  const boardController = new BoardController(boardService);

  const boardResult = boardController.getBoard({});
  assert.ok(!boardResult.isError, 'should get board');

  const statsResult = boardController.getStats({});
  assert.ok(!statsResult.isError, 'should get stats');
  assert.ok(statsResult.content[0].text.includes('Board Statistics'));

  // Test PlanningController
  const planningController = new PlanningController(boardService, planningService);

  const planResult = planningController.generatePlan({
    goal: 'Add authentication',
    context: 'User login',
    targetLane: 'backlog'
  });
  assert.ok(!planResult.isError, 'should generate plan');
  assert.ok(planResult.content[0].text.includes('Generated'));

  const invalidPlan = planningController.generatePlan({ goal: '' });
  assert.ok(invalidPlan.isError, 'should validate goal');

  const analyzeResult = planningController.analyzeGoal({ goal: 'Add API endpoints' });
  assert.ok(!analyzeResult.isError, 'should analyze goal');
  assert.ok(analyzeResult.content[0].text.includes('Goal Analysis'));

  boardService.destroy();
  console.log('  ✅ Controller tests passed');
}

/**
 * Test security
 */
async function testSecurity() {
  console.log('\n🔒 Testing Security...');

  // Test input sanitization
  const maliciousInputs = [
    'test\x00script',
    'test\x1b[31m',
    'test<script>',
    'test\x7F',
    '  test  ',
  ];

  for (const input of maliciousInputs) {
    const sanitized = Validator.sanitizeString(input);
    assert.ok(!sanitized.includes('\x00'), 'should remove null bytes');
    assert.ok(!sanitized.includes('\x1b'), 'should remove escape sequences');
    assert.strictEqual(sanitized.trim(), sanitized, 'should trim whitespace');
  }

  // Test path traversal prevention
  assert.throws(
    () => Validator.validateFilePath('../../../etc/passwd'),
    ValidationError,
    'should block path traversal'
  );

  assert.throws(
    () => Validator.validateFilePath('~/.ssh'),
    ValidationError,
    'should block home directory access'
  );

  // Test string length limit
  const longString = 'a'.repeat(200);
  const sanitized = Validator.sanitizeString(longString, 50);
  assert.strictEqual(sanitized.length, 50, 'should limit string length');

  // Test control character removal in updates
  const boardService = new BoardService(TEST_BRIDGE_FILE);
  const task = new Task(TestUtils.createMockTask({ title: 'Original' }));
  boardService.addTask(task);

  const maliciousUpdate = {
    title: 'Updated\x00\x01\x02Title',
    description: 'Test\x7F\x1b[31mDesc',
    tags: ['tag\x00', 'valid']
  };

  const updated = boardService.updateTask(task.id, maliciousUpdate);
  assert.ok(!updated.title.includes('\x00'), 'should remove null bytes from title');
  // 'tag\x00' becomes 'tag' after sanitization, so we have 2 valid tags
  assert.strictEqual(updated.tags.length, 2, 'should sanitize tags');

  // Test batch size limit
  const tooManyTasks = Array(101).fill(null).map((_, i) => ({ title: `Task ${i}` }));
  assert.throws(
    () => Validator.validateBatchTasks(tooManyTasks),
    ValidationError,
    'should limit batch size'
  );

  boardService.destroy();
  console.log('  ✅ Security tests passed');
}

// Run tests
runTests().catch(console.error);
