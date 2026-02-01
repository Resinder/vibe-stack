# Vibe Stack - API Reference

Complete API reference for the Vibe Stack MCP Server and all service endpoints.

> **Related:** For MCP Server-specific quick reference, see **[API Overview](../04-api/01-api-overview.md)**.

---

## Table of Contents

- [MCP Server API](#mcp-server-api)
- [Vibe-Kanban API](#vibe-kanban-api)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)

---

## MCP Server API

### Base URL

```
Development: http://localhost:4001
Production: https://api.your-domain.com
```

### Overview

The MCP Server provides both HTTP and STDIO interfaces for task management.

---

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:00Z",
  "services": {
    "mcp": "ok",
    "bridge": "ok",
    "kanban": "ok"
  }
}
```

---

### MCP Tools (90+ Available)

#### 1. vbm_create_task

Create a new task in Vibe-Kanban.

**Parameters:**
```json
{
  "title": "string (required, max 100 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "string (optional, default: 'backlog')",
  "priority": "string (optional, default: 'medium')",
  "lane": "string (optional, default: 'backlog')",
  "estimatedHours": "number (optional, min: 0.5, max: 40)",
  "tags": "array (optional, max 10 tags)"
}
```

**Valid Statuses:** backlog, todo, in_progress, done, recovery

**Valid Priorities:** low, medium, high, critical

**Valid Lanes:** backlog, todo, in_progress, done, recovery, code_review

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task-abc123",
    "title": "Implement OAuth login",
    "description": "Add Google OAuth authentication",
    "status": "backlog",
    "priority": "high",
    "lane": "backlog",
    "estimatedHours": 8,
    "tags": ["auth", "backend"],
    "createdAt": "2026-01-28T10:30:00Z",
    "updatedAt": "2026-01-28T10:30:00Z"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required and must be 100 characters or less"
    }
  ]
}
```

---

#### 2. vbm_update_task

Update an existing task.

**Parameters:**
```json
{
  "id": "string (required)",
  "title": "string (optional, max 100 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "string (optional)",
  "priority": "string (optional)",
  "lane": "string (optional)",
  "estimatedHours": "number (optional)",
  "tags": "array (optional)"
}
```

---

#### 3. vbm_delete_task

Delete a task by ID.

**Parameters:**
```json
{
  "id": "string (required)"
}
```

---

#### 4. vbm_get_task

Retrieve a single task by ID.

**Parameters:**
```json
{
  "id": "string (required)"
}
```

---

#### 5. vbm_list_tasks

List all tasks with optional filtering.

**Parameters:**
```json
{
  "lane": "string (optional)",
  "priority": "string (optional)",
  "status": "string (optional)",
  "tag": "string (optional)",
  "limit": "number (optional, default: 50, max: 200)"
}
```

---

#### 6. vbm_move_task

Move a task to a different lane.

**Parameters:**
```json
{
  "id": "string (required)",
  "lane": "string (required)",
  "comment": "string (optional)"
}
```

---

#### 7. vbm_create_board

Create a new Kanban board.

**Parameters:**
```json
{
  "name": "string (required, max 50 chars)",
  "description": "string (optional, max 500 chars)",
  "lanes": "array (optional, default: standard lanes)"
}
```

---

#### 8. vbm_get_board

Retrieve board information and tasks.

**Parameters:**
```json
{
  "id": "string (required, optional: defaults to current board)"
}
```

---

#### 9. vbm_generate_plan

Generate a task plan using AI.

**Parameters:**
```json
{
  "prompt": "string (required)",
  "context": "string (optional, max 1000 chars)",
  "constraints": "object (optional)",
  "pattern": "string (optional)"
}
```

**Valid Patterns:** authentication, database, api, frontend, testing, deployment

---

#### 10. vbm_sync_board

Force synchronization with Vibe-Kanban.

**Parameters:**
```json
{
  "force": "boolean (optional, default: false)"
}
```

---

## Vibe-Kanban API

### Base URL

```
Development: http://localhost:4000
Production: https://kanban.your-domain.com
```

### Endpoints

#### Get Board State

```http
GET /api/board
```

#### Update Board State

```http
POST /api/board
Content-Type: application/json

{
  "lane": "todo",
  "task": {
    "id": "task-abc123",
    "title": "New task"
  }
}
```

---

## Authentication

### API Key Authentication (Recommended)

```http
GET /api/tasks
Authorization: Bearer YOUR_API_KEY
```

### JWT Authentication (Enterprise)

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "hint": "Suggestion for fixing the error",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-28T12:00:00Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

### Default Limits

| Plan | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| Free | 60 | 1000 |
| Pro | 600 | 10000 |
| Enterprise | Unlimited | Unlimited |

### Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706462400
```

---

## Webhooks

### Configure Webhook

```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": ["task.created", "task.updated", "task.moved"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| task.created | New task created |
| task.updated | Task modified |
| task.moved | Task moved to new lane |
| task.deleted | Task removed |
| board.synced | Board synchronized |

### Webhook Payload Example

```json
{
  "event": "task.moved",
  "timestamp": "2026-01-28T12:00:00Z",
  "data": {
    "task": {
      "id": "task-abc123",
      "title": "Implement OAuth"
    },
    "fromLane": "in_progress",
    "toLane": "done"
  }
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:4001',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Create a task
const task = await client.post('/tools', {
  name: 'vbm_create_task',
  arguments: {
    title: 'Implement OAuth',
    priority: 'high',
    estimatedHours: 8
  }
});
```

### Python

```python
import requests

client = requests.Session()
client.headers.update({
    'Authorization': f'Bearer {API_KEY}'
})

# Create a task
response = client.post('http://localhost:4001/tools', json={
    'name': 'vbm_create_task',
    'arguments': {
        'title': 'Implement OAuth',
        'priority': 'high',
        'estimatedHours': 8
    }
})
```

### cURL

```bash
curl -X POST http://localhost:4001/tools \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vbm_create_task",
    "arguments": {
      "title": "Implement OAuth",
      "priority": "high",
      "estimatedHours": 8
    }
  }'
```

---

## Related Documentation

- **[INTEGRATION.md](INTEGRATION.md)** - Complete integration guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[Security](../05-operations/05-security.md)** - Security implementation

---

**Need help?** See [FAQ.md](FAQ.md) or [CONTRIBUTING.md](CONTRIBUTING.md)
