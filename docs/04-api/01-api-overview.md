# Vibe Stack - MCP Server API Reference

Complete API reference for the Vibe Stack MCP Server (Port 4001).

> **Note:** For comprehensive API documentation including Vibe-Kanban endpoints, authentication, and webhooks, see **[API_REFERENCE.md](API_REFERENCE.md)**.

---

## Base URL

```
http://localhost:4001
```

---

## Endpoints

### Health & Info

#### GET /health

Check server health status.

**Response:**
```json
{
  "status": "healthy",
  "server": "vibe-stack-mcp",
  "version": "1.0.0"
}
```

#### GET /.well-known/mcp

Get MCP server information and available tools.

**Response:**
```json
{
  "name": "vibe-stack-mcp",
  "version": "1.0.0",
  "capabilities": ["tools"],
  "tools": [
    {
      "name": "vibe_get_board",
      "description": "Get the complete Vibe Kanban board state"
    },
    ...
  ]
}
```

---

## OpenAI-Compatible API

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Get board context"
    }
  ],
  "functions": [
    {
      "name": "vibe_get_context",
      "description": "Get current board context",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    }
  ],
  "function_call": {
    "name": "vibe_get_context",
    "arguments": "{}"
  }
}
```

**Response:**
```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "vibe-stack",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "function_call": {
          "name": "vibe_get_context",
          "arguments": "{...result...}"
        }
      },
      "finish_reason": "function_call"
    }
  ]
}
```

### GET /v1/functions

List all available tools/functions.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "name": "vibe_get_board",
      "description": "Get the complete Vibe Kanban board state",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "vibe_create_task",
      "description": "Create a new task in Vibe Kanban",
      "parameters": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Task title"
          },
          "description": {
            "type": "string",
            "description": "Task description"
          },
          "lane": {
            "type": "string",
            "enum": ["backlog", "todo", "in_progress", "done", "recovery"],
            "default": "backlog"
          },
          "priority": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"],
            "default": "medium"
          },
          "estimatedHours": {
            "type": "number",
            "description": "Time estimate in hours"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": ["title"]
      }
    },
    {
      "name": "vibe_generate_plan",
      "description": "Generate an intelligent task plan from a goal. Automatically detects patterns (auth, API, database, frontend, etc.) and creates appropriate tasks with time estimates.",
      "parameters": {
        "type": "object",
        "properties": {
          "goal": {
            "type": "string",
            "description": "High-level goal (e.g., 'Add OAuth authentication with Google and GitHub')"
          },
          "context": {
            "type": "string",
            "description": "Additional context or constraints"
          },
          "targetLane": {
            "type": "string",
            "enum": ["backlog", "todo"],
            "default": "backlog"
          }
        },
        "required": ["goal"]
      }
    },
    {
      "name": "vibe_analyze_goal",
      "description": "Analyze a goal to detect patterns and estimate task count before generating",
      "parameters": {
        "type": "object",
        "properties": {
          "goal": {
            "type": "string"
          }
        },
        "required": ["goal"]
      }
    },
    {
      "name": "vibe_get_context",
      "description": "Get current board context for AI decision-making",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "vibe_move_task",
      "description": "Move a task to a different lane",
      "parameters": {
        "type": "object",
        "properties": {
          "taskId": {
            "type": "string"
          },
          "targetLane": {
            "type": "string",
            "enum": ["backlog", "todo", "in_progress", "done", "recovery"]
          }
        },
        "required": ["taskId", "targetLane"]
      }
    },
    {
      "name": "vibe_update_task",
      "description": "Update task properties",
      "parameters": {
        "type": "object",
        "properties": {
          "taskId": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "priority": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"]
          },
          "status": {
            "type": "string"
          },
          "estimatedHours": {
            "type": "number"
          }
        },
        "required": ["taskId"]
      }
    },
    {
      "name": "vibe_search_tasks",
      "description": "Search tasks by title, description, or tags",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string"
          },
          "lane": {
            "type": "string",
            "enum": ["backlog", "todo", "in_progress", "done", "recovery"]
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "vibe_get_stats",
      "description": "Get board statistics and metrics",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "vibe_batch_create",
      "description": "Create multiple tasks at once",
      "parameters": {
        "type": "object",
        "properties": {
          "tasks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "lane": {
                  "type": "string"
                },
                "priority": {
                  "type": "string"
                },
                "estimatedHours": {
                  "type": "number"
                }
              },
              "required": ["title"]
            }
          }
        },
        "required": ["tasks"]
      }
    }
  ]
}
```

---

## Tool Execution API

### POST /v1/tools/{toolName}

Execute a specific tool directly.

**Parameters:**
- `toolName` (path): Name of the tool to execute
- Body (json): Tool parameters

**Example:**

```bash
curl -X POST http://localhost:4001/v1/tools/vibe_create_task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "description": "Users cannot log in with special characters",
    "lane": "todo",
    "priority": "high",
    "estimatedHours": 4
  }'
```

**Response:**
```json
{
  "success": true,
  "tool": "vibe_create_task",
  "result": "✓ Task created: \"Fix login bug\"\n  Lane: todo\n  Priority: high\n  ID: task-1234567890-abc123\n  View at: http://localhost:4000",
  "timestamp": "2025-01-25T14:30:00.000Z"
}
```

---

## Quick Plan API

### POST /v1/plan

Generate a task plan from a goal (simplified endpoint).

**Request:**
```json
{
  "goal": "Implement OAuth authentication with Google",
  "context": "Use Passport.js with session management",
  "targetLane": "backlog"
}
```

**Response:**
```json
{
  "success": true,
  "goal": "Implement OAuth authentication with Google",
  "plan": {
    "totalTasks": 10,
    "totalHours": 54,
    "tasks": [
      {
        "title": "Design authentication architecture",
        "priority": "high",
        "hours": 4
      },
      {
        "title": "Set up authentication backend API",
        "priority": "high",
        "hours": 8
      }
    ]
  },
  "boardUrl": "http://localhost:4000",
  "timestamp": "2025-01-25T14:30:00.000Z"
}
```

---

## Board Data API

### GET /.vibe-kanban-bridge.json

Get current board state (bridge file).

**Response:**
```json
{
  "lanes": {
    "backlog": [
      {
        "id": "task-123",
        "title": "Add OAuth authentication",
        "lane": "backlog",
        "priority": "high",
        "status": "pending",
        "estimatedHours": 54,
        "tags": ["ai-generated"],
        "createdAt": "2025-01-25T14:00:00.000Z"
      }
    ],
    "todo": [],
    "in_progress": [],
    "done": [],
    "recovery": []
  },
  "lastSync": "2025-01-25T14:30:00.000Z",
  "version": "1.0.0"
}
```

### GET /v1/board/snapshot

Get board state with statistics.

**Response:**
```json
{
  "board": {
    "lanes": { ... }
  },
  "stats": {
    "totalTasks": 15,
    "byLane": {
      "backlog": 8,
      "todo": 2,
      "in_progress": 2,
      "done": 3,
      "recovery": 0
    },
    "byPriority": {
      "low": 3,
      "medium": 8,
      "high": 4,
      "critical": 0
    },
    "totalEstimatedHours": 120
  },
  "timestamp": "2025-01-25T14:30:00.000Z",
  "url": "http://localhost:4000"
}
```

---

## Custom Panel

### GET /custom/kanban-panel.html

Custom Kanban board UI panel.

**Features:**
- Real-time board view
- Auto-refresh every 10 seconds
- Task counts by lane
- Priority indicators
- AI-generated badges
- Click tasks to open in Vibe-Kanban

**Usage:**
```
http://localhost:4001/custom/kanban-panel.html
```

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-25T14:30:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing required parameters)
- `500` - Internal Server Error
- `501` - Not Implemented (feature not yet available)

---

## Rate Limiting

Currently no rate limiting is enforced. Use responsibly.

---

## WebSocket (Future)

WebSocket support for real-time updates is planned for future versions.

---

## SDK Examples

### cURL

```bash
# Generate plan
curl -X POST http://localhost:4001/v1/plan \
  -H "Content-Type: application/json" \
  -d '{"goal": "Add OAuth"}'

# Get stats
curl http://localhost:4001/v1/board/snapshot

# Create task
curl -X POST http://localhost:4001/v1/tools/vibe_create_task \
  -H "Content-Type: application/json" \
  -d '{"title": "Fix bug"}'
```

### JavaScript/Fetch

```javascript
// Generate plan
const response = await fetch('http://localhost:4001/v1/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    goal: 'Implement OAuth authentication'
  })
});
const data = await response.json();
console.log(data.plan);
```

### Python

```python
import requests

# Generate plan
response = requests.post('http://localhost:4001/v1/plan', json={
    'goal': 'Implement OAuth authentication'
})
data = response.json()
print(data['plan'])
```

---

**For usage examples, see [OPENWEBUI.md](OPENWEBUI.md)**
