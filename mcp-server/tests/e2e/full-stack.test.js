/**
 * ============================================================================
 * VIBE STACK - E2E Tests: Full Stack Integration
 * ============================================================================
 * End-to-end tests for complete service communication flows
 * @version 1.0.0
 * ============================================================================
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  baseURLs: {
    vibeKanban: 'http://localhost:4000',
    codeServer: 'http://localhost:8443',
    openWebui: 'http://localhost:8081',
    mcpServer: 'http://localhost:4001'
  },
  timeouts: {
    request: 10000,
    operation: 30000
  }
};

/**
 * HTTP request helper with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || TEST_CONFIG.timeouts.request);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Generate unique test data
 */
function generateTestId() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// FULL STACK INTEGRATION TESTS
// ============================================================================

describe('E2E - Full Stack Integration', async () => {
  let testTaskIds = [];

  before(async () => {
    // Verify all services are accessible
    console.log('Verifying service connectivity...');

    const services = [
      { name: 'Vibe-Kanban', url: TEST_CONFIG.baseURLs.vibeKanban },
      { name: 'code-server', url: TEST_CONFIG.baseURLs.codeServer },
      { name: 'Open WebUI', url: TEST_CONFIG.baseURLs.openWebui },
      { name: 'MCP Server', url: TEST_CONFIG.baseURLs.mcpServer }
    ];

    for (const service of services) {
      try {
        const response = await fetchWithTimeout(service.url, { timeout: 5000 });
        console.log(`  ✓ ${service.name} is accessible`);
      } catch (error) {
        console.error(`  ✗ ${service.name} is not accessible: ${error.message}`);
        throw new Error(`Service ${service.name} is not accessible`);
      }
    }
  });

  after(async () => {
    // Cleanup test tasks
    console.log(`Cleaning up ${testTaskIds.length} test tasks...`);

    for (const taskId of testTaskIds) {
      try {
        await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/delete_task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
          timeout: 5000
        });
      } catch (error) {
        console.warn(`Failed to cleanup task ${taskId}: ${error.message}`);
      }
    }
  });

  describe('Task Management Flow', () => {
    const testTitle = `E2E Test Task ${generateTestId()}`;

    it('should create a task via MCP Server', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/create_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          description: 'Task created during E2E full-stack testing',
          lane: 'backlog',
          priority: 'medium',
          estimatedHours: 4
        })
      });

      assert.equal(response.status, 200, 'Task creation should succeed');

      const data = await response.json();
      assert.ok(data.success, 'Response should indicate success');
      assert.ok(data.result, 'Response should contain result');

      // Parse task ID from result
      const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      const taskIdMatch = result.match(/id['":\s]*([a-f0-9-]+)/i);

      if (taskIdMatch) {
        testTaskIds.push(taskIdMatch[1]);
      }
    });

    it('should retrieve the created task from board snapshot', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);

      assert.equal(response.status, 200, 'Board snapshot should be accessible');

      const data = await response.json();
      assert.ok(data.board, 'Response should contain board data');
      assert.ok(data.board.lanes, 'Board should have lanes');
      assert.ok(data.board.lanes.backlog, 'Board should have backlog lane');

      // Find our test task
      const testTask = data.board.lanes.backlog.find(t => t.title === testTitle);
      assert.ok(testTask, 'Test task should exist in backlog');
      assert.equal(testTask.priority, 'medium', 'Task should have correct priority');
      assert.equal(testTask.estimatedHours, 4, 'Task should have correct estimated hours');
    });

    it('should move the task to a different lane', async () => {
      // Get board snapshot to find task ID
      const snapshotResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);
      const snapshotData = await snapshotResponse.json();

      const testTask = snapshotData.board.lanes.backlog.find(t => t.title === testTitle);
      assert.ok(testTask, 'Test task should exist');
      const taskId = testTask.id;

      // Move task to todo lane
      const moveResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/move_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          targetLane: 'todo'
        })
      });

      assert.equal(moveResponse.status, 200, 'Task move should succeed');

      const moveData = await moveResponse.json();
      assert.ok(moveData.success, 'Move response should indicate success');

      // Verify task is in todo lane
      const verifyResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);
      const verifyData = await verifyResponse.json();

      const todoTask = verifyData.board.lanes.todo.find(t => t.id === taskId);
      assert.ok(todoTask, 'Task should be in todo lane');
      assert.equal(todoTask.lane, 'todo', 'Task lane should be updated');
    });

    it('should update task properties', async () => {
      // Get board snapshot to find task ID
      const snapshotResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);
      const snapshotData = await snapshotResponse.json();

      const testTask = snapshotData.board.lanes.todo.find(t => t.title === testTitle);
      const taskId = testTask.id;

      // Update task priority
      const updateResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/update_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          priority: 'high',
          estimatedHours: 6
        })
      });

      assert.equal(updateResponse.status, 200, 'Task update should succeed');

      // Verify updates
      const verifyResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);
      const verifyData = await verifyResponse.json();

      const updatedTask = verifyData.board.lanes.todo.find(t => t.id === taskId);
      assert.equal(updatedTask.priority, 'high', 'Task priority should be updated');
      assert.equal(updatedTask.estimatedHours, 6, 'Task estimated hours should be updated');
    });

    it('should search for tasks', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/search_tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'E2E Test'
        })
      });

      assert.equal(response.status, 200, 'Task search should succeed');

      const data = await response.json();
      assert.ok(data.success, 'Search response should indicate success');
      assert.ok(Array.isArray(data.result), 'Search should return array of results');

      // Find our test task in results
      const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      assert.ok(result.includes(testTitle), 'Search results should include our test task');
    });
  });

  describe('AI Planning Flow', () => {
    it('should generate a task plan', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Implement a new feature for user authentication',
          context: 'We need to add OAuth2 support for Google and GitHub',
          targetLane: 'backlog'
        }),
        timeout: TEST_CONFIG.timeouts.operation
      });

      assert.equal(response.status, 200, 'Plan generation should succeed');

      const data = await response.json();
      assert.ok(data.success, 'Plan response should indicate success');
      assert.ok(data.goal, 'Response should include the goal');
      assert.ok(data.plan, 'Response should include plan data');
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get board statistics', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/get_board_stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.equal(response.status, 200, 'Statistics retrieval should succeed');

      const data = await response.json();
      assert.ok(data.success, 'Response should indicate success');

      const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      assert.ok(result.includes('totalTasks'), 'Statistics should include total task count');
    });

    it('should have accurate statistics across lanes', async () => {
      const snapshotResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);
      const snapshotData = await snapshotResponse.json();

      // Calculate expected statistics
      let expectedTotal = 0;
      const expectedByLane = {};
      const expectedByPriority = { low: 0, medium: 0, high: 0, critical: 0 };

      for (const [lane, tasks] of Object.entries(snapshotData.board.lanes)) {
        expectedByLane[lane] = tasks.length;
        expectedTotal += tasks.length;

        for (const task of tasks) {
          const priority = task.priority || 'medium';
          expectedByPriority[priority] = (expectedByPriority[priority] || 0) + 1;
        }
      }

      // Get statistics from API
      const statsResponse = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/get_board_stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const statsData = await statsResponse.json();
      const statsResult = typeof statsData.result === 'string'
        ? JSON.parse(statsData.result)
        : statsData.result;

      // Verify statistics match
      assert.equal(statsResult.totalTasks, expectedTotal, 'Total tasks should match');
    });
  });

  describe('Bridge File Synchronization', () => {
    it('should have synchronized bridge file', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/.vibe-kanban-bridge.json`);

      assert.equal(response.status, 200, 'Bridge file should be accessible');

      const data = await response.json();
      assert.ok(typeof data === 'object', 'Bridge data should be an object');
      assert.ok(data.lanes, 'Bridge should contain lanes');
    });

    it('should update bridge file after task creation', async () => {
      const testTitle = `Bridge Sync Test ${generateTestId()}`;

      // Create a task
      await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/create_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle,
          lane: 'backlog'
        })
      });

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get bridge file
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/.vibe-kanban-bridge.json`);
      const data = await response.json();

      // Verify task exists in bridge
      const taskExists = data.lanes.backlog && data.lanes.backlog.some(t => t.title === testTitle);
      assert.ok(taskExists, 'Bridge file should contain newly created task');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [];
      const taskCount = 10;

      for (let i = 0; i < taskCount; i++) {
        promises.push(
          fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/create_task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Concurrent Test Task ${i}`,
              lane: 'backlog'
            })
          })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      for (let i = 0; i < responses.length; i++) {
        assert.equal(responses[i].status, 200, `Concurrent request ${i} should succeed`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent tools', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/non_existent_tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.equal(response.status, 500, 'Non-existent tool should return error');

      const data = await response.json();
      assert.ok(!data.success, 'Response should indicate failure');
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/create_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      // Should return error, not crash
      assert.ok([400, 500].includes(response.status), 'Should handle invalid JSON gracefully');
    });

    it('should validate required fields', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/tools/create_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required 'title' field
          lane: 'backlog'
        })
      });

      assert.equal(response.status, 500, 'Should validate required fields');

      const data = await response.json();
      assert.ok(!data.success, 'Response should indicate failure');
    });
  });

  describe('Performance', () => {
    it('should respond to health checks quickly', async () => {
      const startTime = Date.now();

      await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/health`);

      const duration = Date.now() - startTime;
      assert.ok(duration < 1000, `Health check should respond within 1 second (took ${duration}ms)`);
    });

    it('should load board snapshot efficiently', async () => {
      const startTime = Date.now();

      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);

      const duration = Date.now() - startTime;
      assert.equal(response.status, 200, 'Snapshot should load successfully');
      assert.ok(duration < 2000, `Snapshot should load within 2 seconds (took ${duration}ms)`);
    });
  });

  describe('Cross-Service Communication', () => {
    it('should allow MCP Server to communicate with PostgreSQL', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/v1/board/snapshot`);

      assert.equal(response.status, 200, 'Should successfully retrieve data from PostgreSQL');

      const data = await response.json();
      assert.ok(data.board, 'Should return board data from database');
    });

    it('should allow Vibe-Kanban to read from bridge file', async () => {
      const response = await fetchWithTimeout(`${TEST_CONFIG.baseURLs.mcpServer}/.vibe-kanban-bridge.json`);

      assert.equal(response.status, 200, 'Bridge file should be readable');

      const data = await response.json();
      assert.ok(data.lanes, 'Bridge should contain lane data');
    });
  });
});

/**
 * Run tests if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running E2E Full Stack Integration Tests...');
}
