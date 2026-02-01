/**
 * ============================================================================
 * VIBE STACK - Board Service WebSocket Integration
 * ============================================================================
 * Integrates BoardService with WebSocket for real-time updates
 * @version 1.0.0
 * ============================================================================
 */

import { WebSocketSyncServer, EventType } from './server.js';
import { Logger } from './logger.js';

/**
 * Board Service WebSocket Integration
 */
export class BoardWebSocketIntegration {
  /** @type {WebSocketSyncServer} WebSocket server instance */
  #wsServer;

  /**
   * Create a new Board WebSocket Integration
   * @param {WebSocketSyncServer} wsServer - WebSocket server instance
   */
  constructor(wsServer) {
    this.#wsServer = wsServer;
    this.#setupEventHandlers();
  }

  /**
   * Setup event handlers for board events
   * @private
   */
  #setupEventHandlers() {
    // Task created
    this.#wsServer.on(EventType.TASK_CREATED, (data) => {
      Logger.info('[WS Integration] Broadcasting task created:', data.task?.id);
    });

    // Task updated
    this.#wsServer.on(EventType.TASK_UPDATED, (data) => {
      Logger.info('[WS Integration] Broadcasting task updated:', data.task?.id);
    });

    // Task moved
    this.#wsServer.on(EventType.TASK_MOVED, (data) => {
      Logger.info('[WS Integration] Broadcasting task moved:', data.task?.id, '→', data.toLane);
    });

    // Task deleted
    this.#wsServer.on(EventType.TASK_DELETED, (data) => {
      Logger.info('[WS Integration] Broadcasting task deleted:', data.taskId);
    });

    // Board loaded
    this.#wsServer.on(EventType.BOARD_LOADED, (data) => {
      Logger.debug('[WS Integration] Broadcasting board loaded');
    });

    // Lane changed
    this.#wsServer.on(EventType.LANE_CHANGED, (data) => {
      Logger.info('[WS Integration] Broadcasting lane changed:', data.lane);
    });

    // Stats updated
    this.#wsServer.on(EventType.STATS_UPDATED, (data) => {
      Logger.debug('[WS Integration] Broadcasting stats updated');
    });
  }

  /**
   * Notify task created
   * @param {Object} task - Created task
   * @param {string} boardId - Board ID
   */
  notifyTaskCreated(task, boardId) {
    this.#wsServer.emit(EventType.TASK_CREATED, {
      task: this.#sanitizeTask(task),
      boardId
    });
  }

  /**
   * Notify task updated
   * @param {Object} task - Updated task
   * @param {Object} changes - Changes made
   * @param {string} boardId - Board ID
   */
  notifyTaskUpdated(task, changes, boardId) {
    this.#wsServer.emit(EventType.TASK_UPDATED, {
      task: this.#sanitizeTask(task),
      changes,
      boardId
    });
  }

  /**
   * Notify task moved
   * @param {Object} task - Moved task
   * @param {string} fromLane - Source lane
   * @param {string} toLane - Target lane
   * @param {string} boardId - Board ID
   */
  notifyTaskMoved(task, fromLane, toLane, boardId) {
    this.#wsServer.emit(EventType.TASK_MOVED, {
      task: this.#sanitizeTask(task),
      fromLane,
      toLane,
      boardId
    });
  }

  /**
   * Notify task deleted
   * @param {string} taskId - Deleted task ID
   * @param {string} boardId - Board ID
   */
  notifyTaskDeleted(taskId, boardId) {
    this.#wsServer.emit(EventType.TASK_DELETED, {
      taskId,
      boardId
    });
  }

  /**
   * Notify board loaded
   * @param {Object} board - Board data
   * @param {string} boardId - Board ID
   */
  notifyBoardLoaded(board, boardId) {
    this.#wsServer.emit(EventType.BOARD_LOADED, {
      lanes: board.lanes,
      boardId
    });
  }

  /**
   * Notify lane changed
   * @param {string} lane - Lane name
   * @param {Array} tasks - Tasks in lane
   * @param {string} boardId - Board ID
   */
  notifyLaneChanged(lane, tasks, boardId) {
    this.#wsServer.emit(EventType.LANE_CHANGED, {
      lane,
      taskCount: tasks.length,
      tasks: tasks.map(t => this.#sanitizeTask(t)),
      boardId
    });
  }

  /**
   * Notify stats updated
   * @param {Object} stats - Board statistics
   * @param {string} boardId - Board ID
   */
  notifyStatsUpdated(stats, boardId) {
    this.#wsServer.emit(EventType.STATS_UPDATED, {
      stats,
      boardId
    });
  }

  /**
   * Sanitize task for client transmission
   * @private
   * @param {Object} task - Task to sanitize
   * @returns {Object} Sanitized task
   */
  #sanitizeTask(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      lane: task.lane,
      priority: task.priority,
      status: task.status,
      estimatedHours: task.estimatedHours,
      tags: task.tags || [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
      // Exclude sensitive metadata
    };
  }
}

export default BoardWebSocketIntegration;
