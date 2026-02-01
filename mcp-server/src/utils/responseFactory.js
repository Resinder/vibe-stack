/**
 * ============================================================================
 * VIBE STACK - MCP Response Factory
 * ============================================================================
 * Factory functions for creating standardized MCP responses
 * @version 1.0.0
 * ============================================================================
 */

/**
 * MCP Response Factory
 * Creates standardized responses for MCP tools
 */
export class ResponseFactory {
  /**
   * Create a successful text response
   * @param {string} text - Response text
   * @returns {Object} MCP response object
   *
   * @example
   * ResponseFactory.success('Task created successfully');
   * // { content: [{ type: 'text', text: 'Task created successfully' }] }
   */
  static success(text) {
    return {
      content: [{ type: 'text', text }]
    };
  }

  /**
   * Create a success response with formatted message
   * @param {string} message - Success message
   * @param {Object} data - Additional data to include
   * @returns {Object} MCP response object
   *
   * @example
   * ResponseFactory.successWithData('Task created', { taskId: 'abc-123' });
   * // { content: [{ type: 'text', text: '✓ Task created\n\nID: abc-123' }] }
   */
  static successWithData(message, data = {}) {
    const text = Object.keys(data).length > 0
      ? `✓ ${message}\n\n${this.formatData(data)}`
      : `✓ ${message}`;

    return {
      content: [{ type: 'text', text }]
    };
  }

  /**
   * Create an error response
   * @param {string} message - Error message
   * @param {string} [code] - Optional error code
   * @returns {Object} MCP error response
   *
   * @example
   * ResponseFactory.error('Task not found', 'NOT_FOUND');
   * // { content: [{ type: 'text', text: '✗ Error: Task not found' }], isError: true }
   */
  static error(message, code = 'ERROR') {
    return {
      content: [{ type: 'text', text: `✗ Error: ${message}` }],
      isError: true
    };
  }

  /**
   * Create a validation error response
   * @param {string} message - Validation error message
   * @returns {Object} MCP error response
   *
   * @example
   * ResponseFactory.validationError('Title is required');
   * // { content: [{ type: 'text', text: '✗ Validation Error: Title is required' }], isError: true }
   */
  static validationError(message) {
    return {
      content: [{ type: 'text', text: `✗ Validation Error: ${message}` }],
      isError: true
    };
  }

  /**
   * Create a not found error response
   * @param {string} resource - Resource type
   * @param {string} id - Resource identifier
   * @returns {Object} MCP error response
   *
   * @example
   * ResponseFactory.notFound('Task', 'abc-123');
   * // { content: [{ type: 'text', text: '✗ Not Found: Task "abc-123"' }], isError: true }
   */
  static notFound(resource, id) {
    return {
      content: [{ type: 'text', text: `✗ Not Found: ${resource} "${id}"` }],
      isError: true
    };
  }

  /**
   * Create a task created response
   * @param {Object} task - Created task object
   * @returns {Object} MCP response object
   *
   * @example
   * ResponseFactory.taskCreated({ id: 'abc-123', title: 'My Task' });
   */
  static taskCreated(task) {
    return this.successWithData('Task created', {
      ID: task.id,
      Title: task.title,
      Lane: task.lane,
      Priority: task.priority
    });
  }

  /**
   * Create a task updated response
   * @param {string} taskId - Task ID
   * @returns {Object} MCP response object
   */
  static taskUpdated(taskId) {
    return this.successWithData('Task updated', { ID: taskId });
  }

  /**
   * Create a task moved response
   * @param {string} taskId - Task ID
   * @param {string} targetLane - Target lane
   * @returns {Object} MCP response object
   */
  static taskMoved(taskId, targetLane) {
    return this.successWithData(`Task moved to ${targetLane}`, { ID: taskId });
  }

  /**
   * Create a batch operation response
   * @param {string} operation - Operation description
   * @param {number} count - Number of items processed
   * @returns {Object} MCP response object
   *
   * @example
   * ResponseFactory.batchResult('created', 5);
   * // { content: [{ type: 'text', text: '✓ Batch created 5 tasks' }] }
   */
  static batchResult(operation, count) {
    return this.success(`Batch ${operation} ${count} ${count === 1 ? 'item' : 'items'}`);
  }

  /**
   * Create a search results response
   * @param {Array} results - Search results
   * @param {string} query - Search query
   * @returns {Object} MCP response object
   */
  static searchResults(results, query) {
    if (results.length === 0) {
      return this.success(`No results found for "${query}"`);
    }

    const summary = `Found ${results.length} ${results.length === 1 ? 'result' : 'results'} for "${query}"`;

    const resultList = results.map((r, i) =>
      `${i + 1}. [${r.lane}] ${r.title} ${r.priority ? `(${r.priority})` : ''}`
    ).join('\n');

    return this.success(`${summary}\n\n${resultList}`);
  }

  /**
   * Create a statistics response
   * @param {Object} stats - Statistics object
   * @returns {Object} MCP response object
   */
  static stats(stats) {
    const formatted = this.formatData(stats);
    return this.success(`Board Statistics:\n\n${formatted}`);
  }

  /**
   * Create a board state response
   * @param {Object} board - Board object
   * @returns {Object} MCP response object
   */
  static boardState(board) {
    const lanes = Object.entries(board.lanes || {})
      .map(([name, tasks]) => `${name}: ${tasks.length}`)
      .join('\n');

    return this.success(`Board State:\n\n${lanes}`);
  }

  /**
   * Create a plan generation response
   * @param {number} taskCount - Number of tasks generated
   * @param {number} totalHours - Total estimated hours
   * @param {Array} patterns - Detected patterns
   * @returns {Object} MCP response object
   */
  static planGenerated(taskCount, totalHours = 0, patterns = []) {
    let message = `Generated ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`;

    if (totalHours > 0) {
      message += ` (~${totalHours} hours)`;
    }

    if (patterns.length > 0) {
      message += `\n\nPatterns detected: ${patterns.join(', ')}`;
    }

    return this.success(message);
  }

  /**
   * Create a goal analysis response
   * @param {Array} patterns - Detected patterns
   * @param {number} estimatedTasks - Estimated number of tasks
   * @returns {Object} MCP response object
   */
  static goalAnalysis(patterns, estimatedTasks = 0) {
    if (patterns.length === 0) {
      return this.success('Goal Analysis:\n\nNo specific patterns detected.\nA generic task plan will be generated.');
    }

    const patternList = patterns.map(p => `• ${p}`).join('\n');
    return this.success(
      `Goal Analysis:\n\nDetected Patterns:\n${patternList}\n\nEstimated tasks: ${estimatedTasks}`
    );
  }

  /**
   * Format data object as readable text
   * @private
   * @param {Object} data - Data object to format
   * @param {number} [indent=0] - Indentation level
   * @returns {string} Formatted string
   */
  static formatData(data, indent = 0) {
    const prefix = '  '.repeat(indent);
    const lines = [];

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${prefix}${key}: []`);
        } else {
          lines.push(`${prefix}${key}:`);
          for (const item of value) {
            if (typeof item === 'object') {
              lines.push(`${prefix}  -`);
              lines.push(this.formatData(item, indent + 2));
            } else {
              lines.push(`${prefix}  - ${item}`);
            }
          }
        }
      } else if (typeof value === 'object') {
        lines.push(`${prefix}${key}:`);
        lines.push(this.formatData(value, indent + 1));
      } else {
        lines.push(`${prefix}${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Create a context response for AI decision-making
   * @param {Object} context - Board context
   * @returns {Object} MCP response object
   */
  static context(context) {
    const { stats, recentTasks, lanes } = context;
    let message = 'Board Context:\n\n';

    if (stats) {
      message += `Statistics:\n${this.formatData(stats, 1)}\n\n`;
    }

    if (lanes) {
      const laneSummary = Object.entries(lanes)
        .map(([name, tasks]) => `${name}: ${tasks.length} tasks`)
        .join('\n');
      message += `Lanes:\n${laneSummary}\n\n`;
    }

    if (recentTasks && recentTasks.length > 0) {
      message += 'Recent Tasks:\n';
      recentTasks.slice(0, 5).forEach((task, i) => {
        message += `${i + 1}. ${task.title} [${task.lane}]\n`;
      });
    }

    return this.success(message);
  }
}
