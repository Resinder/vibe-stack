# Open WebUI + Vibe Kanban Integration Guide

## Overview

This integration enables **Open WebUI** to manage **Vibe Kanban** tasks through a **Model Context Protocol (MCP)** server. You can chat with AI to generate task plans, create tasks, and manage your Kanban board in real-time.

## Architecture

```
┌─────────────────┐      MCP      ┌──────────────────┐
│  Open WebUI     │◄────────────►│  Vibe MCP Server  │
│  (Port 8081)    │   stdio/HTTP  │  (Port 4001)      │
└─────────────────┘               └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  Bridge File     │
                                  │  (local state)   │
                                  └──────────────────┘
```

## Quick Start

### 1. Start All Services

```bash
docker compose up -d
```

This starts:
- **Open WebUI** on http://localhost:8081
- **Vibe MCP Server** on http://localhost:4001
- **Vibe Kanban** on http://localhost:4000

### 2. Verify MCP Server

```bash
curl http://localhost:4001/health
# Response: {"status":"healthy","server":"vibe-stack-mcp"}

curl http://localhost:4001/.well-known/mcp
# Shows available MCP tools
```

### 3. Configure Open WebUI

#### Option A: Via Web UI

1. Open **Open WebUI** at http://localhost:8081
2. Go to **Settings** → **MCP Servers**
3. Add new MCP server:
   - **Name**: `Vibe Stack`
   - **Type**: `STDIO`
   - **Command**: `docker exec -i vibe-mcp-server node /app/index.js`

#### Option B: Via Configuration File

Edit `open-webui/data/config.json`:

```json
{
  "mcp_servers": {
    "vibe-stack": {
      "command": "docker",
      "args": ["exec", "-i", "vibe-mcp-server", "node", "/app/index.js"],
      "env": {}
    }
  }
}
```

Then restart Open WebUI:
```bash
docker compose restart open-webui
```

## Available MCP Tools

Once connected, Open WebUI can use these tools:

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `vibe_get_board` | Get current board state | "Show me all tasks" |
| `vibe_create_task` | Create a new task | "Add task: Fix login bug" |
| `vibe_move_task` | Move task to different lane | "Move task #123 to done" |
| `vibe_update_task` | Update task properties | "Mark task #456 as high priority" |
| `vibe_generate_plan` | Generate task plan from goal | "Create plan for: Add OAuth authentication" |
| `vibe_search_tasks` | Search tasks | "Find all tasks related to API" |
| `vibe_get_stats` | Get board statistics | "Show board metrics" |

## Usage Examples

### Example 1: Generate Task Plan

In Open WebUI chat:

```
You: Create a task plan for implementing user authentication with OAuth

AI: I'll generate a task plan for that...

[Uses vibe_generate_plan tool]

✓ Generated 5 tasks for "Add user authentication with OAuth"

1. Design authentication flow (backlog)
2. Set up authentication backend (backlog)
3. Create login UI components (backlog)
4. Add session persistence (backlog)
5. Write auth tests (backlog)

Review and adjust tasks in Vibe Kanban: http://localhost:4000
```

### Example 2: Create Task from Chat

```
You: Add a task to fix the memory leak in the API service

AI: I'll create that task for you...

[Uses vibe_create_task tool]

✓ Task created: "Fix memory leak in API service" in todo
```

### Example 3: Get Board Status

```
You: What's on our board?

AI: Let me check the Vibe Kanban board...

[Uses vibe_get_board tool]

Current Board State:
- Backlog: 1 task
- Todo: 2 tasks
- In Progress: 0 tasks
- Done: 3 tasks
```

## MCP Server API (Direct HTTP Access)

For direct API access without Open WebUI:

### Get Board State
```bash
curl http://localhost:4001/.vibe-kanban-bridge.json
```

### Get MCP Info
```bash
curl http://localhost:4001/.well-known/mcp
```

### Health Check
```bash
curl http://localhost:4001/health
```

## Troubleshooting

### MCP Server Not Starting

```bash
# Check logs
docker logs vibe-mcp-server

# Check container status
docker ps | grep mcp
```

### Bridge File Not Found

The MCP server reads from `.vibe-kanban-bridge.json`. Ensure it exists:

```bash
ls -la .vibe-kanban-bridge.json

# Regenerate if needed
./kanban-sync.sh
```

### Open WebUI Can't Connect to MCP

1. Verify MCP server is running: `docker ps | grep vibe-mcp-server`
2. Check Open WebUI MCP configuration in Settings
3. Restart Open WebUI: `docker compose restart open-webui`

## Architecture Details

### Clean Code Principles

1. **Separation of Concerns**:
   - MCP Server handles protocol translation
   - Business logic in `VibeKanbanClient` class
   - HTTP proxy for direct access

2. **No Spaghetti**:
   - Single file for MCP server (`mcp-server/index.js`)
   - Clear function boundaries
   - No circular dependencies

3. **State Management**:
   - Bridge file as single source of truth
   - File-based (no database needed)
   - Synced via `kanban-sync.sh`

### Data Flow

```
Open WebUI Chat
    │
    ├─→ User: "Create task plan for OAuth"
    │
    ├─→ AI: Understands request
    │
    ├─→ MCP Tool: vibe_generate_plan
    │       │
    │       └─→ VibeKanbanClient.generateTaskPlan()
    │               │
    │               ├─→ Analyzes goal
    │               ├─→ Creates tasks
    │               └─→ Writes to bridge file
    │
    └─→ Response: "✓ Generated 5 tasks"
```

## Future Enhancements

- [ ] Add webhook support for real-time updates
- [ ] Integrate with Vibe Kanban's internal API (when available)
- [ ] Support for task dependencies
- [ ] Time tracking and estimates
- [ ] Multi-project support

## Resources

- **Open WebUI**: https://github.com/open-webui/open-webui
- **MCP Protocol**: https://modelcontextprotocol.io
- **Vibe Kanban**: http://localhost:4000
- **Observer Dashboard**: http://localhost:4000/observer (run `make observer`)
