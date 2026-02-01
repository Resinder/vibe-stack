# Vibe Stack - MCP Server Complete Guide

Comprehensive guide to the Vibe Stack MCP Server v1.1.7 - the bridge between Open WebUI and Vibe-Kanban.

> **Note:** For basic Vibe Stack installation, see the **[Installation Guide](02-installation.md)**. This guide covers MCP Server specifics.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [The 90+ MCP Tools](#the-90-mcp-tools)
- [Bridge File System](#bridge-file-system)
- [Protocol Options](#protocol-options)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

The Vibe Stack MCP Server is a **Model Context Protocol (MCP) server** that enables AI assistants (like Open WebUI) to interact with the Vibe-Kanban task management system.

### What is MCP?

The **Model Context Protocol (MCP)** is an open protocol that enables AI assistants to:
- Call tools/functions
- Access external data sources
- Perform actions on behalf of users
- Maintain context across conversations

### Key Features

| Feature | Description |
|---------|-------------|
| **90+ Built-in Tools** | Complete task, planning, Git, and file operations |
| **Dual Protocol** | Supports both STDIO and HTTP |
| **AI-Native Design** | Built for LLM integration |
| **Type-Safe** | Full input validation and sanitization |
| **Production Ready** | <100ms response time, 64MB footprint |
| **PostgreSQL Storage** | Async, non-blocking with connection pooling |
| **WebSocket Support** | Real-time task synchronization |
| **Credential Management** | AES-256-GCM encrypted token storage |
| **Extensible** | Easy to add custom tools |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌─────────────────┐                │
│  │ Open WebUI   │─────▶│  MCP Server     │                │
│  │ (AI Client)  │ STDIO│  (mcp-server)   │                │
│  └──────────────┘      │  Port 4001      │                │
│                        │                 │                │
│  ┌──────────────┐      │ ┌─────────────┐│                │
│  │ HTTP Client  │─────▶│ │ Tool Router  ││                │
│  │ (cURL/SDK)  │ HTTP │ │             ││                │
│  └──────────────┘      │ └──────┬──────┘│                │
│                        │        │        │                │
│                        │ ┌──────▼───────┐│                │
│                        │ │ 90+ Tools    ││                │
│                        │ │ - vbm_*      ││                │
│                        │ └──────┬───────┘│                │
│                        │        │        │                │
│                        │ ┌──────▼───────┐│                │
│                        │ │ Validators   ││                │
│                        │ │ Services     ││                │
│                        │ │ Controllers  ││                │
│                        │ └──────┬───────┘│                │
│                        │        │        │                │
│                        │ ┌──────▼───────┐│                │
│                        │ │ Bridge File  ││                │
│                        │ │ Sync Layer   ││                │
│                        │ └──────┬───────┘│                │
│                        └────────┼────────┘                │
│                                 │                         │
│                                 ▼                         │
│                        ┌─────────────────┐                │
│                        │  Vibe-Kanban    │                │
│                        │  (Port 4000)    │                │
│                        └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer Architecture (v1.1.7)

```
mcp-server/src/
├── index.js                 # Entry point
├── config/                  # Configuration Layer
│   ├── constants.js         # Main configuration
│   ├── tools.js             # Tool definitions
│   ├── defaults.js          # Default values
│   └── validationConstants.js
├── core/                    # Domain Layer
│   └── models.js            # Task, Board models
├── services/                # Business Logic Layer
│   └── boardService.js      # Board operations, WebSocket
├── middleware/              # Cross-cutting Concerns
│   ├── validation.js        # Input validation
│   ├── taskValidation.js    # Task-specific validation
│   ├── planningValidation.js # Planning validation
│   ├── inputValidation.js   # Input sanitization
│   ├── errorHandler.js      # Error handling
│   └── rateLimit.js         # Rate limiting
├── controllers/             # Credential Controllers
│   └── credentialController.js
├── utils/                   # Utility Layer
│   ├── toolRouter.js        # Route tool calls
│   ├── sanitizer.js         # Input sanitization
│   ├── logger.js            # Structured logging
│   ├── responseFactory.js   # Response formatting
│   ├── shutdown.js          # Graceful shutdown
│   └── metrics.js           # Prometheus metrics
├── factories/               # Object Factory
│   └── taskFactory.js       # Task creation
├── http/                    # HTTP API Layer
│   ├── server.js            # Express server
│   └── routes.js            # HTTP routes
├── mcp/                     # MCP Protocol Layer
│   ├── mcpServer.js         # MCP server implementation
│   ├── initializers.js      # Tool initialization
│   └── clientManager.js     # Client management
├── websocket/               # WebSocket Layer
│   ├── server.js            # WebSocket server
│   ├── boardSync.js         # Board synchronization
│   └── logger.js            # WebSocket logging
├── shared/                  # Shared Components
│   ├── credentials/         # Credential Management
│   │   ├── CredentialStorage.js
│   │   ├── ProjectCredentialManager.js
│   │   ├── CredentialAnalytics.js
│   │   └── providers/       # GitHub, GitLab, Bitbucket, etc.
│   ├── storage/             # Storage Abstractions
│   │   └── postgresStorage.js
│   └── utils/               # Shared utilities
│       └── gitCredentials.js
└── modules/                 # Feature Modules
    ├── kanban/              # Kanban Board Module
    │   ├── controllers/     # task, board, planning
    │   ├── services/        # taskPlanningService
    │   └── index.js
    ├── repository/          # Git Repository Module
    │   ├── controllers/     # git, repo
    │   └── index.js
    ├── github/              # GitHub Integration Module
    │   ├── controllers/     # github
    │   └── index.js
    ├── environment/         # Environment Management
    │   ├── controllers/     # docker, environment
    │   └── index.js
    ├── documentation/       # Documentation Module
    │   ├── controllers/     # documentation
    │   └── index.js
    └── devtools/            # Development Tools
        ├── controllers/     # apiTesting, codeQuality, command, file
        └── index.js
```

---

## Installation

### Via Docker Compose (Recommended)

The MCP Server is included in the main Vibe Stack docker-compose.yml:

```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
make up
```

The MCP Server will be available at `http://localhost:4001`

### Standalone Installation

```bash
# Clone and navigate
cd mcp-server

# Install dependencies
npm install

# Start server
npm start
```

---

## Configuration

### Environment Variables

```bash
# .env configuration for MCP Server

# Server Configuration
PORT=4001
NODE_ENV=production
LOG_LEVEL=info

# API Security
API_KEYS=your-api-key-here,another-key-here
JWT_SECRET=your-jwt-secret-here

# Bridge File Configuration
BRIDGE_FILE_PATH=./config/state/.vibe-kanban-bridge.json
SYNC_INTERVAL=5000  # milliseconds

# Vibe-Kanban Connection
VIBE_KANBAN_URL=http://vibe-kanban:4000
VIBE_KANBAN_API_KEY=optional-api-key

# Open WebUI Integration
OPEN_WEBUI_URL=http://open-webui:8081
ENABLE_STDIO=true
ENABLE_HTTP=true
```

### Tool Configuration

`mcp-server/src/config/tools.js`:

```javascript
module.exports = {
  tools: {
    vbm_create_task: {
      name: 'vbm_create_task',
      description: 'Create a new task in Vibe-Kanban',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Task title'
          },
          // ... more properties
        },
        required: ['title']
      }
    },
    // ... 9 more tools
  }
};
```

---

## How It Works

### Request Flow

```
1. User sends message in Open WebUI
   "Create a task for implementing OAuth login"

2. Open WebUI processes request
   → Detects tool call needed
   → Formats as MCP request

3. MCP Server receives request
   → Validates input
   → Routes to appropriate tool (vbm_create_task)
   → Executes business logic

4. Bridge File Synchronization
   → Reads current state from .vibe-kanban-bridge.json
   → Applies changes
   → Writes updated state

5. Vibe-Kanban Updates
   → Detects bridge file change
   → Reloads board state
   → Task appears instantly

6. Response Back to User
   → Success message returned
   → Task visible in Kanban board
```

### Bridge File System

The bridge file (`.vibe-kanban-bridge.json`) enables real-time synchronization:

```json
{
  "version": "1.0.0",
  "lastModified": "2026-01-28T10:30:00Z",
  "tasks": [
    {
      "id": "task-abc123",
      "title": "Implement OAuth login",
      "lane": "backlog",
      "priority": "high",
      "estimatedHours": 8
    }
  ],
  "metadata": {
    "totalTasks": 15,
    "lastSync": "2026-01-28T10:30:00Z"
  }
}
```

**How it works:**
1. MCP Server writes changes to bridge file
2. Vibe-Kanban watches for file changes
3. On change, Vibe-Kanban reloads and updates UI
4. Open WebUI reads from bridge file for current state

---

## The 90+ MCP Tools

### Quick Reference (Core Tools)

| # | Tool Name | Description | Input Required |
|---|-----------|-------------|---------------|
| 1 | `vbm_create_task` | Create new task | title, optional fields |
| 2 | `vbm_update_task` | Update existing task | id, fields to update |
| 3 | `vbm_delete_task` | Delete a task | id |
| 4 | `vbm_get_task` | Get single task | id |
| 5 | `vbm_list_tasks` | List all tasks | optional filters |
| 6 | `vbm_move_task` | Move task between lanes | id, target lane |
| 7 | `vbm_create_board` | Create new board | name, optional config |
| 8 | `vbm_get_board` | Get board with tasks | optional board id |
| 9 | `vbm_generate_plan` | Generate AI task plan | prompt, context |
| 10 | `vbm_sync_board` | Force sync with Vibe-Kanban | optional force flag |

**Additional 80+ tools** include Git operations, file management, GitHub integration, Docker commands, and more. See [MCP Tools Reference](04-mcp-tools.md) for complete listing.

### Tool Examples

#### 1. Create Task

```json
{
  "name": "vbm_create_task",
  "arguments": {
    "title": "Implement OAuth login",
    "description": "Add Google OAuth authentication",
    "priority": "high",
    "lane": "backlog",
    "estimatedHours": 8,
    "tags": ["auth", "backend"]
  }
}
```

#### 9. Generate Plan (AI-Powered)

```json
{
  "name": "vbm_generate_plan",
  "arguments": {
    "prompt": "Create a task plan for implementing user authentication",
    "context": "We need OAuth with Google and email/password login",
    "constraints": {
      "maxHours": 40,
      "teamSize": 2
    },
    "pattern": "authentication"
  }
}
```

---

## Protocol Options

### STDIO (Default for Open WebUI)

**How it works:**
- Open WebUI communicates via standard input/output
- Used when Open WebUI and MCP Server are on same machine
- Direct communication without HTTP overhead

**Configuration in Open WebUI:**
```json
{
  "mcpServers": {
    "vibe-stack": {
      "command": "node",
      "args": ["/app/mcp-server/src/index.js"],
      "env": {
        "PORT": "4001"
      }
    }
  }
}
```

### HTTP (For Remote Access)

**How it works:**
- RESTful API endpoints
- Accessible from anywhere
- Requires API key authentication

**Base URL:** `http://localhost:4001`

**Health Check:**
```bash
curl http://localhost:4001/health
```

**Tool Execution (HTTP):**
```bash
curl -X POST http://localhost:4001/tools \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "vbm_create_task",
    "arguments": {
      "title": "New Task"
    }
  }'
```

---

## Development

### Project Setup

```bash
cd mcp-server
npm install
```

### Running in Development

```bash
# Start with auto-reload
npm run dev

# Start with debug logging
DEBUG=* npm start

# Start specific tool router
node src/utils/toolRouter.js
```

### Adding a New Tool

1. **Define Tool Schema** (`config/tools.js`):

```javascript
{
  vbm_custom_tool: {
    name: 'vbm_custom_tool',
    description: 'Does something custom',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string' }
      },
      required: ['param1']
    }
  }
}
```

2. **Implement Handler** (`controllers/customController.js`):

```javascript
async function handleCustomTool(args) {
  const { param1 } = args;

  // Validate input
  if (!param1) {
    throw new Error('param1 is required');
  }

  // Execute logic
  const result = await doSomething(param1);

  return {
    success: true,
    result: result
  };
}
```

3. **Register Router** (`utils/toolRouter.js`):

```javascript
const customController = require('../controllers/customController');

router.register('vbm_custom_tool', customController.handleCustomTool);
```

See **[MCP_EXTENDING.md](MCP_EXTENDING.md)** for detailed guide.

---

## Testing

### Run All Tests

```bash
cd mcp-server
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Test Individual Tool

```bash
npm test -- --grep "vbm_create_task"
```

### Manual Testing

```bash
# Test health check
curl http://localhost:4001/health

# Test tool execution
curl -X POST http://localhost:4001/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vbm_list_tasks",
    "arguments": {
      "lane": "backlog"
    }
  }'
```

---

## Deployment

### Docker Deployment

```yaml
# docker-compose.yml
services:
  mcp-server:
    image: vibe-stack/mcp-server:latest
    container_name: mcp-server-prod
    restart: unless-stopped
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
      - API_KEYS=${API_KEYS}
    volumes:
      - ./config/state:/app/config:rw
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:4001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1.1.7
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: vibe-stack/mcp-server:latest
        ports:
        - containerPort: 4001
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Performance

### Current Metrics

| Metric | Value |
|--------|-------|
| **Startup Time** | < 2 seconds |
| **Memory Footprint** | ~64MB |
| **Tool Execution** | < 100ms |
| **Concurrent Requests** | 100+ |
| **HTTP Response Time** | < 50ms (p95) |

### Optimization Tips

1. **Enable Caching**
   ```javascript
   // Cache bridge file reads
   const cachedState = cache.get('bridge-state');
   if (cachedState) return cachedState;
   ```

2. **Use Connection Pooling**
   ```javascript
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000
   });
   ```

3. **Async Operations**
   ```javascript
   // Use async/await for I/O
   const tasks = await Promise.all([
       fetchBoard(),
       fetchTasks()
   ]);
   ```

---

## Troubleshooting

### Common Issues

#### 1. "Bridge file not found"

**Solution:**
```bash
# Create bridge file
touch config/state/.vibe-kanban-bridge.json

# Set proper permissions
chmod 664 config/state/.vibe-kanban-bridge.json
```

#### 2. "Tool not found"

**Solution:**
```bash
# Check tools are registered
curl http://localhost:4001/tools

# Restart MCP Server
docker compose restart mcp-server
```

#### 3. "Vibe-Kanban connection refused"

**Solution:**
```bash
# Check Vibe-Kanban is running
curl http://localhost:4000/health

# Check network connectivity
docker network inspect vibe-network

# Verify environment variables
echo $VIBE_KANBAN_URL
```

---

## Related Documentation

- **[MCP_PROTOCOL.md](MCP_PROTOCOL.md)** - MCP protocol details (STDIO vs HTTP)
- **[MCP_TOOLS.md](MCP_TOOLS.md)** - Detailed tool reference
- **[MCP_EXTENDING.md](MCP_EXTENDING.md)** - Extending with custom tools
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API reference
- **[INTEGRATION.md](INTEGRATION.md)** - Integration guide

---

## Support

- **Issues:** [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Documentation:** [docs/](docs/)
- **Discussions:** [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)

---

**MCP Server Version:** 1.0.0
**Last Updated:** 2026-01-31
