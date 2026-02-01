# Vibe Stack - MCP Protocol Guide

Complete guide to the Model Context Protocol (MCP) as implemented in Vibe Stack.

---

## Table of Contents

- [Protocol Overview](#protocol-overview)
- [STDIO Protocol](#stdio-protocol)
- [HTTP Protocol](#http-protocol)
- [Message Format](#message-format)
- [Tool Execution](#tool-execution)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Client Integration](#client-integration)

---

## Protocol Overview

The Model Context Protocol (MCP) enables AI assistants to interact with external systems through a standardized interface.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Server** | Exposes tools/resources via MCP (Vibe MCP Server) |
| **Client** | Consumes MCP tools (Open WebUI, Claude Desktop, etc.) |
| **Tool** | Callable function with input schema |
| **Resource** | Data exposed to the client |
| **Transport** | Communication method (STDIO or HTTP) |

### Why MCP?

✅ **Standardized** - Consistent interface across different AI systems
✅ **Type-Safe** - Schema validation for all inputs/outputs
✅ **Extensible** - Easy to add new tools and resources
✅ **Bi-directional** - Server can send notifications to client

---

## STDIO Protocol

STDIO is the **default transport** for MCP, designed for local communication between an AI client and MCP server.

### How It Works

```
┌────────────────┐         ┌─────────────────┐
│   AI Client    │         │  MCP Server     │
│  (Open WebUI)  │         │  (mcp-server)   │
├────────────────┤         ├─────────────────┤
│                │         │                 │
│  stdin  ───────┼────────▶│  Process stdin  │
│                │         │                 │
│  stdout ◀──────┼─────────│  Process stdout │
│                │         │                 │
└────────────────┘         └─────────────────┘
```

### STDIO Message Flow

1. **Client sends request via stdout**
2. **Server reads from stdin**
3. **Server processes request**
4. **Server responds via stdout**
5. **Client reads from stdin**

### JSON-RPC over STDIO

All messages are JSON-RPC 2.0 formatted, newline-delimited:

```json
// Request (Client → Server)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "vbm_create_task",
    "arguments": {
      "title": "New Task"
    }
  }
}

// Response (Server → Client)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "task": {
      "id": "task-abc123",
      "title": "New Task"
    }
  }
}
```

### STDIO Configuration

**Open WebUI Configuration:**

```json
{
  "mcpServers": {
    "vibe-stack": {
      "command": "node",
      "args": ["/app/mcp-server/src/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Claude Desktop Configuration:**

```json
{
  "mcpServers": {
    "vibe-stack": {
      "command": "node",
      "args": ["E:\\Projects\\personal\\vibe-stack\\mcp-server\\src\\index.js"],
      "env": {
        "BRIDGE_FILE_PATH": "E:\\Projects\\personal\\vibe-stack\\config\\state\\.vibe-kanban-bridge.json"
      }
    }
  }
}
```

### STDIO Advantages

✅ **Simple** - No HTTP overhead
✅ **Fast** - Direct process communication
✅ **Secure** - Local-only by default
✅ **Reliable** - Automatic reconnection on restart

### STDIO Limitations

❌ **Local only** - Cannot access remotely
❌ **Single client** - One client per server instance
❌ **No native webhooks** - Cannot push notifications

---

## HTTP Protocol

HTTP transport enables remote access and multi-client scenarios.

### How It Works

```
┌────────────────┐         ┌─────────────────┐
│   HTTP Client  │         │  MCP Server     │
│  (cURL, SDK)   │         │  (HTTP Server)  │
├────────────────┤         ├─────────────────┤
│                │         │                 │
│  POST /tools   │────────▶│  Express Server │
│                │         │                 │
│  ◀─ Response   │─────────│  HTTP Response  │
│                │         │                 │
└────────────────┘         └─────────────────┘
```

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/tools` | GET | List available tools |
| `/tools` | POST | Execute tool |
| `/tools/{name}` | POST | Execute specific tool |
| `/sync` | POST | Force bridge sync |

### HTTP Request Format

```http
POST /tools HTTP/1.1
Host: localhost:4001
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "vbm_create_task",
  "arguments": {
    "title": "New Task",
    "priority": "high"
  }
}
```

### HTTP Response Format

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: abc-123

{
  "success": true,
  "task": {
    "id": "task-abc123",
    "title": "New Task",
    "priority": "high",
    "lane": "backlog",
    "createdAt": "2026-01-28T10:30:00Z"
  }
}
```

### HTTP Authentication

**API Key (Recommended):**

```http
GET /tools HTTP/1.1
Host: localhost:4001
X-API-Key: your-api-key-here
```

**JWT Token:**

```http
GET /tools HTTP/1.1
Host: localhost:4001
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### HTTP Configuration

**Server Configuration:**

```javascript
// mcp-server/src/http/server.js
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.get('/health', healthCheck);
app.post('/tools', executeTool);
app.post('/sync', forceSync);

// Start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`MCP HTTP Server listening on port ${PORT}`);
});
```

### HTTP Advantages

✅ **Remote access** - Access from anywhere
✅ **Multi-client** - Multiple concurrent clients
✅ **Load balancing** - Can be load balanced
✅ **Caching** - HTTP caching headers
✅ **Monitoring** - Easy to monitor with APM tools

### HTTP Limitations

❌ **Complex** - More moving parts
❌ **Latency** - HTTP overhead
❌ **Authentication** - Requires auth setup

---

## Message Format

### Standard JSON-RPC 2.0

All MCP messages follow JSON-RPC 2.0 specification:

#### Request

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "method-name",
  "params": {
    // Method parameters
  }
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    // Result data
  }
}
```

#### Error

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "title",
      "issue": "Required field missing"
    }
  }
}
```

### MCP-Specific Methods

| Method | Description |
|--------|-------------|
| `tools/list` | List available tools |
| `tools/call` | Execute a tool |
| `resources/list` | List available resources |
| `resources/read` | Read a resource |
| `prompts/list` | List available prompts |
| `prompts/get` | Get a prompt |

---

## Tool Execution

### Execution Flow

```
1. Client discovers tools
   └─→ tools/list

2. Client calls tool
   └─→ tools/call with name and arguments

3. Server validates input
   └─→ Schema validation

4. Server executes tool
   └─→ Business logic

5. Server returns result
   └─→ Formatted response
```

### Tool Call Example

**Step 1: List Tools**

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "vbm_create_task",
        "description": "Create a new task in Vibe-Kanban",
        "inputSchema": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            }
          },
          "required": ["title"]
        }
      }
    ]
  }
}
```

**Step 2: Call Tool**

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "vbm_create_task",
    "arguments": {
      "title": "Implement OAuth login"
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "success": true,
    "task": {
      "id": "task-abc123",
      "title": "Implement OAuth login",
      "lane": "backlog",
      "priority": "medium",
      "createdAt": "2026-01-28T10:30:00Z"
    }
  }
}
```

---

## Error Handling

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC request |
| -32601 | Method not found | Method doesn't exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal server error |

### Vibe Stack Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1001 | VALIDATION_ERROR | Input validation failed |
| 1002 | TASK_NOT_FOUND | Task doesn't exist |
| 1003 | BRIDGE_ERROR | Bridge file operation failed |
| 1004 | SYNC_ERROR | Synchronization failed |
| 1005 | AUTH_ERROR | Authentication required |

### Error Response Example

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": 1001,
    "message": "Validation failed",
    "data": {
      "field": "title",
      "issue": "Title is required and must be 100 characters or less",
      "constraint": {
        "minLength": 1,
        "maxLength": 100
      }
    },
    "hint": "Provide a title between 1 and 100 characters"
  }
}
```

---

## Configuration

### Enable Both Transports

```javascript
// mcp-server/src/index.js
const { MCPServer } = require('./mcp/mcpServer');
const { HTTPServer } = require('./http/server');

async function start() {
  // Start STDIO server (for Open WebUI)
  if (process.env.ENABLE_STDIO !== 'false') {
    const mcpServer = new MCPServer();
    await mcpServer.start();
    console.log('MCP STDIO Server started');
  }

  // Start HTTP server (for remote access)
  if (process.env.ENABLE_HTTP === 'true') {
    const httpServer = new HTTPServer();
    await httpServer.start();
    console.log('MCP HTTP Server started on port 4001');
  }
}

start();
```

### Environment Variables

```bash
# Enable/disable transports
ENABLE_STDIO=true
ENABLE_HTTP=true

# HTTP-specific
PORT=4001
API_KEYS=your-key-1,your-key-2
JWT_SECRET=your-jwt-secret

# CORS (for HTTP)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## Client Integration

### Open WebUI (STDIO)

**Configuration File:**
```
/data/backend/data/mcp_servers_config.json
```

**Config:**
```json
{
  "mcpServers": {
    "vibe-stack": {
      "command": "node",
      "args": ["/app/mcp-server/src/index.js"],
      "env": {
        "BRIDGE_FILE_PATH": "/app/config/state/.vibe-kanban-bridge.json"
      }
    }
  }
}
```

### Custom Python Client (HTTP)

```python
import requests
import json

class MCPClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def call_tool(self, name, arguments):
        response = requests.post(
            f'{self.base_url}/tools',
            headers=self.headers,
            json={
                'name': name,
                'arguments': arguments
            }
        )
        return response.json()

# Usage
client = MCPClient('http://localhost:4001', 'your-api-key')
result = client.call_tool('vbm_create_task', {
    'title': 'New Task',
    'priority': 'high'
})
print(result)
```

### Custom Node.js Client (STDIO)

```javascript
const { spawn } = require('child_process');

class MCPSTDIOClient {
  constructor(command, args) {
    this.process = spawn(command, args);
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async callTool(name, arguments) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: { name, arguments }
      };

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject });

      // Send request
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  start() {
    // Handle responses
    this.process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => {
        const response = JSON.parse(line);
        const { id, result, error } = response;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          if (error) pending.reject(error);
          else pending.resolve(result);
          this.pendingRequests.delete(id);
        }
      });
    });
  }
}

// Usage
const client = new MCPSTDIOClient('node', ['mcp-server/src/index.js']);
client.start();

const result = await client.callTool('vbm_create_task', {
  title: 'New Task'
});
console.log(result);
```

---

## Protocol Comparison

| Feature | STDIO | HTTP |
|---------|-------|------|
| **Speed** | ⚡ Faster | 🐢 Slower |
| **Remote Access** | ❌ No | ✅ Yes |
| **Multi-Client** | ❌ Single | ✅ Multiple |
| **Authentication** | ⚠️ Process-based | ✅ Built-in |
| **Load Balancing** | ❌ No | ✅ Yes |
| **Webhooks** | ❌ No | ✅ Yes |
| **Complexity** | ✅ Simple | ⚠️ Moderate |
| **Resource Usage** | ✅ Lower | ⚠️ Higher |

### When to Use Which

**Use STDIO when:**
- Open WebUI and MCP Server on same machine
- Single AI client
- Maximum performance needed
- Simple setup preferred

**Use HTTP when:**
- Remote access required
- Multiple clients needed
- Load balancing required
- Webhooks needed
- Advanced authentication required

---

## Related Documentation

- **[MCP_SERVER.md](MCP_SERVER.md)** - MCP Server architecture
- **[MCP_TOOLS.md](MCP_TOOLS.md)** - Tool reference
- **[MCP_EXTENDING.md](MCP_EXTENDING.md)** - Extending MCP Server
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API reference
- **[EXTERNAL_OPENWEBUI.md](EXTERNAL_OPENWEBUI.md)** - Remote access setup

---

**Protocol Version:** MCP 2.0.0
**Last Updated:** 2026-01-28
