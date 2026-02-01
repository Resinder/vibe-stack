# WebSocket Real-Time Synchronization

> **Version:** 1.0.0 | **Last Updated:** 2026-01-31

Complete guide to Vibe Stack's WebSocket real-time task synchronization system.

---

## Overview

Vibe Stack includes a WebSocket server that provides real-time synchronization across all connected clients. When tasks are created, updated, or moved, all connected clients receive instant updates.

### Key Features

- **Real-time Updates**: Instant task synchronization across all clients
- **Broadcasting**: Efficient broadcast to all connected WebSocket clients
- **Connection Management**: Automatic connection tracking and cleanup
- **Error Handling**: Graceful handling of connection failures
- **Logging**: Comprehensive WebSocket activity logging

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Server (Port 4002)              │
│                                                              │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │   Clients    │◄──►│    Router     │◄──►│  Board Sync │  │
│  │              │    │               │    │             │  │
│  └──────────────┘    └───────────────┘    └─────────────┘  │
│         ▲                    │                    ▲          │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                         │                                    │
│                    ┌─────▼─────┐                              │
│                    │ Broadcast │                              │
│                    │   Queue   │                              │
│                    └───────────┘                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                    (Task State Store)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## WebSocket Server

### Configuration

The WebSocket server is configured in `mcp-server/src/websocket/server.js`:

```javascript
// Default configuration
const WS_PORT = 4002;
const WS_HOST = '0.0.0.0';  // All interfaces

// WebSocket server options
const WS_OPTIONS = {
  perMessageDeflate: false,  // Disable compression for speed
  maxPayload: 1024 * 1024    // 1MB max message size
};
```

### Starting the Server

The WebSocket server starts automatically when the MCP server starts:

```bash
# Start MCP Server (includes WebSocket)
npm run mcp:start

# Or in development mode
npm run mcp:dev
```

### Connection URL

```
ws://localhost:4002
```

---

## Message Protocol

### Client → Server Messages

Clients can send commands to the WebSocket server:

```javascript
// Subscribe to board updates
{
  "type": "subscribe",
  "boardId": "default"
}

// Unsubscribe from updates
{
  "type": "unsubscribe",
  "boardId": "default"
}

// Ping to keep connection alive
{
  "type": "ping"
}
```

### Server → Client Messages

The server broadcasts updates to all connected clients:

```javascript
// Task created
{
  "type": "task.created",
  "data": {
    "id": "task-123",
    "title": "New Task",
    "lane": "backlog",
    "priority": "medium",
    "estimatedHours": 4
  }
}

// Task updated
{
  "type": "task.updated",
  "data": {
    "id": "task-123",
    "changes": {
      "lane": "in_progress",
      "status": "working"
    }
  }
}

// Task moved
{
  "type": "task.moved",
  "data": {
    "id": "task-123",
    "fromLane": "backlog",
    "toLane": "in_progress"
  }
}

// Task deleted
{
  "type": "task.deleted",
  "data": {
    "id": "task-123"
  }
}

// Board state (full sync)
{
  "type": "board.sync",
  "data": {
    "lanes": {
      "backlog": [...],
      "todo": [...],
      "in_progress": [...],
      "done": [...],
      "recovery": [...]
    }
  }
}
```

---

## Integration with Components

### Board Service Integration

The WebSocket server integrates with the BoardService:

```javascript
// mcp-server/src/websocket/boardSync.js

import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';

export class BoardSync {
  constructor(wss, boardService) {
    this.wss = wss;
    this.boardService = boardService;
  }

  // Broadcast task creation
  async broadcastTaskCreated(task) {
    const message = JSON.stringify({
      type: 'task.created',
      data: task
    });

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    logger.info(`Broadcast task created: ${task.id}`);
  }

  // Broadcast task update
  async broadcastTaskUpdated(taskId, updates) {
    const message = JSON.stringify({
      type: 'task.updated',
      data: { id: taskId, changes: updates }
    });

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    logger.info(`Broadcast task updated: ${taskId}`);
  }

  // Broadcast task move
  async broadcastTaskMoved(taskId, fromLane, toLane) {
    const message = JSON.stringify({
      type: 'task.moved',
      data: { id: taskId, fromLane, toLane }
    });

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    logger.info(`Broadcast task moved: ${taskId} from ${fromLane} to ${toLane}`);
  }
}
```

---

## Client Implementation

### Browser JavaScript Client

```javascript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:4002');

// Connection opened
ws.addEventListener('open', () => {
  console.log('Connected to Vibe Stack WebSocket');

  // Subscribe to board updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    boardId: 'default'
  }));
});

// Listen for messages
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'task.created':
      console.log('New task:', message.data);
      addTaskToUI(message.data);
      break;

    case 'task.updated':
      console.log('Task updated:', message.data);
      updateTaskInUI(message.data.id, message.data.changes);
      break;

    case 'task.moved':
      console.log('Task moved:', message.data);
      moveTaskInUI(message.data.id, message.data.toLane);
      break;

    case 'task.deleted':
      console.log('Task deleted:', message.data);
      removeTaskFromUI(message.data.id);
      break;

    case 'board.sync':
      console.log('Full board sync:', message.data);
      refreshBoardUI(message.data.lanes);
      break;
  }
});

// Connection closed
ws.addEventListener('close', () => {
  console.log('Disconnected from WebSocket');
});

// Connection error
ws.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});

// Keep connection alive with ping
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000); // Every 30 seconds
```

### Node.js Client

```javascript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:4002');

ws.on('open', () => {
  console.log('Connected to Vibe Stack WebSocket');

  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    boardId: 'default'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
  // Handle message...
});

ws.on('close', () => {
  console.log('Disconnected');
});

ws.on('error', (error) => {
  console.error('Error:', error);
});
```

---

## Testing WebSocket

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket server
wscat -c ws://localhost:4002

# Subscribe to updates
> {"type":"subscribe","boardId":"default"}

# Listen for messages
< {"type":"board.sync","data":{...}}
```

### Using Python

```python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:4002"
    async with websockets.connect(uri) as websocket:
        # Subscribe
        await websocket.send(json.dumps({
            "type": "subscribe",
            "boardId": "default"
        }))

        # Listen for messages
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(test_websocket())
```

---

## WebSocket Events

### Connection Events

| Event | Description |
|-------|-------------|
| `connection` | New client connected |
| `message` | Message received from client |
| `close` | Client disconnected |
| `error` | Connection error |

### Board Events

| Event | Description | Payload |
|-------|-------------|---------|
| `task.created` | New task created | Task object |
| `task.updated` | Task modified | `{id, changes}` |
| `task.moved` | Task moved between lanes | `{id, fromLane, toLane}` |
| `task.deleted` | Task removed | `{id}` |
| `board.sync` | Full board state | `{lanes}` |

---

## Configuration Options

### Environment Variables

```bash
# .env
# WebSocket Port (default: 4002)
WS_PORT=4002

# WebSocket Host (default: 0.0.0.0)
WS_HOST=0.0.0.0

# Enable/disable WebSocket (default: true)
WS_ENABLED=true

# Heartbeat interval in milliseconds (default: 30000)
WS_HEARTBEAT=30000
```

### Docker Compose

```yaml
services:
  mcp-server:
    # ... other config
    ports:
      - "4002:4002"  # WebSocket port
    environment:
      - WS_ENABLED=true
      - WS_PORT=4002
      - WS_HEARTBEAT=30000
```

---

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to WebSocket server

**Solutions:**
1. Check if MCP server is running:
   ```bash
   docker ps | grep vibe-mcp-server
   ```

2. Check WebSocket port:
   ```bash
   netstat -an | grep 4002
   ```

3. Verify WebSocket is enabled:
   ```bash
   docker logs vibe-mcp-server | grep -i websocket
   ```

### Connection Drops

**Problem:** WebSocket connection disconnects frequently

**Solutions:**
1. Increase heartbeat interval:
   ```bash
   WS_HEARTBEAT=60000  # 60 seconds
   ```

2. Check network stability

3. Implement auto-reconnect in client

### No Messages Received

**Problem:** Connected but not receiving updates

**Solutions:**
1. Verify subscription:
   ```javascript
   ws.send(JSON.stringify({
     type: 'subscribe',
     boardId: 'default'
   }));
   ```

2. Check WebSocket logs:
   ```bash
   docker logs vibe-mcp-server -f | grep WebSocket
   ```

3. Test with wscat to verify server is broadcasting

---

## Performance Considerations

### Broadcasting Optimization

- **Selective Broadcasting**: Only broadcast to subscribed clients
- **Message Batching**: Group multiple updates into single message
- **Compression**: Enable for large payloads (if needed)

### Connection Limits

```javascript
// Maximum concurrent connections
const MAX_CONNECTIONS = 100;

// Connection rate limiting
const RATE_LIMIT = {
  windowMs: 60000,  // 1 minute
  max: 10           // 10 connections per minute
};
```

### Memory Management

- Automatic cleanup of closed connections
- Message size limits (1MB default)
- Connection timeout handling

---

## Security

### Authentication

WebSocket connections should be authenticated:

```javascript
// Add authentication token
const ws = new WebSocket('ws://localhost:4002?token=your-token');
```

### Origin Validation

Server validates request origin:

```javascript
const wss = new WebSocketServer({
  port: WS_PORT,
  verifyClient: (info, cb) => {
    const origin = info.origin;
    // Validate origin
    if (origin === 'http://localhost:4000') {
      cb(true);
    } else {
      cb(false, 401, 'Unauthorized');
    }
  }
});
```

### Rate Limiting

Implement rate limiting for WebSocket connections:

```javascript
import rateLimit from 'express-rate-limit';

const wsRateLimit = rateLimit({
  windowMs: 60000,
  max: 100,
  message: 'Too many WebSocket connections'
});
```

---

## Monitoring

### WebSocket Metrics

The WebSocket server logs:

```javascript
logger.info({
  event: 'websocket.connection',
  clientId: client.id,
  connections: wss.clients.size
});

logger.info({
  event: 'websocket.broadcast',
  type: messageType,
  recipients: wss.clients.size
});
```

### Health Check

```bash
# Check WebSocket server health
curl http://localhost:4001/health

# Response includes WebSocket status
{
  "status": "healthy",
  "websocket": {
    "running": true,
    "connections": 3,
    "port": 4002
  }
}
```

---

## Best Practices

1. **Always Reconnect**: Implement auto-reconnect in clients
2. **Handle Errors**: Gracefully handle connection failures
3. **Subscribe**: Always subscribe after connecting
4. **Heartbeat**: Send periodic pings to keep connection alive
5. **Cleanup**: Unsubscribe before closing connection
6. **Validate**: Always validate incoming message structure

---

**Related Documentation:**
- [Architecture Overview](01-architecture.md)
- [MCP Server Guide](02-mcp-server.md)
- [API Reference](../04-api/01-api-overview.md)

**Version:** 1.0.0 | **Last Updated:** 2026-01-31
