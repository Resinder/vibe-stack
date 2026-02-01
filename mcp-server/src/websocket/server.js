/**
 * ============================================================================
 * VIBE STACK - WebSocket Server
 * ============================================================================
 * Real-time task synchronization between MCP Server and clients
 * @version 1.0.0
 * ============================================================================
 */

import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { Logger } from './logger.js';

/**
 * WebSocket Server Configuration
 */
const WS_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  maxClients: 100,
  messageQueueSize: 100,
  reconnectTimeout: 5000
};

/**
 * Event types for real-time updates
 */
export const EventType = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_MOVED: 'task:moved',
  TASK_DELETED: 'task:deleted',
  BOARD_LOADED: 'board:loaded',
  LANE_CHANGED: 'lane:changed',
  STATS_UPDATED: 'stats:updated',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong'
};

/**
 * WebSocket Client Manager
 */
class WSClient {
  constructor(ws, clientId, boardId = null) {
    this.ws = ws;
    this.clientId = clientId;
    this.boardId = boardId;
    this.isAlive = true;
    this.subscriptions = new Set();
    this.messageQueue = [];
    this.lastPing = Date.now();
  }

  subscribe(eventType) {
    this.subscriptions.add(eventType);
  }

  unsubscribe(eventType) {
    this.subscriptions.delete(eventType);
  }

  isSubscribed(eventType) {
    return this.subscriptions.has(eventType) || this.subscriptions.has('*');
  }

  send(data) {
    if (this.isAlive && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        Logger.error(`[WS] Error sending to client ${this.clientId}:`, error);
        return false;
      }
    }
    return false;
  }

  ping() {
    this.lastPing = Date.now();
    this.send({ type: EventType.PING, timestamp: this.lastPing });
  }

  terminate() {
    this.isAlive = false;
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

/**
 * WebSocket Server for Real-time Sync
 */
export class WebSocketSyncServer {
  /** @type {Map} Connected clients */
  #clients;

  /** @type {WebSocketServer} WebSocket server instance */
  #wss;

  /** @type {NodeJS.Timeout} Heartbeat interval */
  #heartbeatInterval;

  /** @type {Object} Event handlers */
  #eventHandlers;

  /** @type {number} Next client ID */
  #nextClientId;

  constructor(httpServer, options = {}) {
    this.#clients = new Map();
    this.#eventHandlers = new Map();
    this.#nextClientId = 1;

    this.#wss = new WebSocketServer({
      server: httpServer,
      path: options.path || '/ws',
      maxPayload: options.maxPayload || 1024 * 1024, // 1MB
      clientTracking: true
    });

    this.#setupWebSocketServer();
    this.#startHeartbeat();

    Logger.info('[WS] WebSocket server initialized');
  }

  /**
   * Setup WebSocket server event handlers
   * @private
   */
  #setupWebSocketServer() {
    this.#wss.on('connection', (ws, request) => {
      this.#handleConnection(ws, request);
    });

    this.#wss.on('error', (error) => {
      Logger.error('[WS] WebSocket server error:', error);
    });

    this.#wss.on('close', () => {
      Logger.info('[WS] WebSocket server closed');
    });
  }

  /**
   * Handle new WebSocket connection
   * @private
   */
  #handleConnection(ws, request) {
    const clientId = `client_${this.#nextClientId++}`;

    // Parse query parameters for board subscription
    let boardId = null;
    try {
      const url = new URL(request.url, `ws://${request.headers.host}`);
      boardId = url.searchParams.get('board');
    } catch (error) {
      Logger.warn('[WS] Failed to parse connection URL:', error.message);
    }

    const client = new WSClient(ws, clientId, boardId);
    this.#clients.set(clientId, client);

    Logger.info(`[WS] Client connected: ${clientId} (board: ${boardId || 'all'})`);

    // Send welcome message
    client.send({
      type: 'connection:established',
      clientId,
      boardId,
      timestamp: Date.now()
    });

    // Setup message handler
    ws.on('message', (data) => {
      this.#handleMessage(client, data);
    });

    // Setup close handler
    ws.on('close', () => {
      this.#handleDisconnection(client);
    });

    // Setup error handler
    ws.on('error', (error) => {
      Logger.error(`[WS] Client ${clientId} error:`, error);
      this.#handleDisconnection(client);
    });

    // Setup pong handler
    ws.on('pong', () => {
      client.isAlive = true;
    });
  }

  /**
   * Handle incoming message from client
   * @private
   */
  #handleMessage(client, data) {
    try {
      const message = JSON.parse(data.toString());
      Logger.debug(`[WS] Message from ${client.clientId}:`, message.type);

      switch (message.type) {
        case EventType.PONG:
          client.isAlive = true;
          break;

        case 'subscribe':
          if (message.event) {
            client.subscribe(message.event);
            client.send({
              type: 'subscribed',
              event: message.event,
              timestamp: Date.now()
            });
          }
          break;

        case 'unsubscribe':
          if (message.event) {
            client.unsubscribe(message.event);
            client.send({
              type: 'unsubscribed',
              event: message.event,
              timestamp: Date.now()
            });
          }
          break;

        case 'board:subscribe':
          client.boardId = message.boardId;
          Logger.info(`[WS] Client ${client.clientId} subscribed to board: ${message.boardId}`);
          client.send({
            type: 'board:subscribed',
            boardId: message.boardId,
            timestamp: Date.now()
          });
          break;

        default:
          Logger.warn(`[WS] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      Logger.error('[WS] Error handling message:', error);
      client.send({
        type: EventType.ERROR,
        error: 'Invalid message format',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle client disconnection
   * @private
   */
  #handleDisconnection(client) {
    Logger.info(`[WS] Client disconnected: ${client.clientId}`);
    client.terminate();
    this.#clients.delete(client.clientId);
  }

  /**
   * Start heartbeat to detect stale connections
   * @private
   */
  #startHeartbeat() {
    this.#heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleClients = [];

      for (const [clientId, client] of this.#clients) {
        if (!client.isAlive) {
          staleClients.push(clientId);
          continue;
        }

        // Check if client is stale (no pong for 2 heartbeat intervals)
        if (now - client.lastPing > WS_CONFIG.heartbeatInterval * 2) {
          Logger.warn(`[WS] Stale client detected: ${clientId}`);
          staleClients.push(clientId);
          continue;
        }

        client.isAlive = false;
        client.ping();
      }

      // Remove stale clients
      for (const clientId of staleClients) {
        const client = this.#clients.get(clientId);
        if (client) {
          client.terminate();
          this.#clients.delete(clientId);
        }
      }

      Logger.debug(`[WS] Heartbeat: ${this.#clients.size} active clients`);
    }, WS_CONFIG.heartbeatInterval);
  }

  /**
   * Broadcast event to all subscribed clients
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Object} options - Options
   */
  broadcast(eventType, data, options = {}) {
    const { boardId = null, excludeClientId = null } = options;

    let sentCount = 0;
    const message = {
      type: eventType,
      data,
      timestamp: Date.now()
    };

    for (const [clientId, client] of this.#clients) {
      // Skip excluded client
      if (excludeClientId && clientId === excludeClientId) {
        continue;
      }

      // Skip if not subscribed to this event
      if (!client.isSubscribed(eventType)) {
        continue;
      }

      // Skip if board ID doesn't match (unless subscribed to all boards)
      if (boardId && client.boardId && client.boardId !== boardId) {
        continue;
      }

      if (client.send(message)) {
        sentCount++;
      }
    }

    if (sentCount > 0) {
      Logger.debug(`[WS] Broadcast ${eventType} to ${sentCount} client(s)`);
    }

    return sentCount;
  }

  /**
   * Register event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   */
  on(eventType, handler) {
    if (!this.#eventHandlers.has(eventType)) {
      this.#eventHandlers.set(eventType, []);
    }
    this.#eventHandlers.get(eventType).push(handler);
  }

  /**
   * Emit event to registered handlers
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  emit(eventType, data) {
    const handlers = this.#eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          Logger.error(`[WS] Error in event handler for ${eventType}:`, error);
        }
      }
    }

    // Also broadcast to WebSocket clients
    this.broadcast(eventType, data);
  }

  /**
   * Get connected clients count
   * @returns {number} Number of connected clients
   */
  getClientCount() {
    return this.#clients.size;
  }

  /**
   * Get clients subscribed to a specific board
   * @param {string} boardId - Board ID
   * @returns {Array} Array of client IDs
   */
  getBoardClients(boardId) {
    const clients = [];
    for (const [clientId, client] of this.#clients) {
      if (client.boardId === boardId) {
        clients.push(clientId);
      }
    }
    return clients;
  }

  /**
   * Close all connections and shutdown
   */
  shutdown() {
    Logger.info('[WS] Shutting down WebSocket server...');

    // Clear heartbeat interval
    if (this.#heartbeatInterval) {
      clearInterval(this.#heartbeatInterval);
    }

    // Close all client connections
    for (const [clientId, client] of this.#clients) {
      client.send({
        type: 'server:shutdown',
        message: 'Server is shutting down',
        timestamp: Date.now()
      });
      client.terminate();
    }

    // Close WebSocket server
    this.#wss.close();

    Logger.info('[WS] WebSocket server shutdown complete');
  }
}

export default WebSocketSyncServer;
