# Vibe Stack - Complete Integration Guide

Complete guide to understanding and using the Vibe Stack AI-powered development environment.

> **Note:** For installation instructions, see the **[Installation Guide](02-installation.md)**.

---

## Table of Contents

- [System Overview](#system-overview)
- [How It Works](#how-it-works)
- [Complete Workflow](#complete-workflow)
- [Service Interactions](#service-interactions)
- [Configuration](#configuration)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

---

## System Overview

Vibe Stack is an **AI-powered development environment** that combines:

```
┌──────────────────────────────────────────────────────────────────┐
│                     VIBE STACK ECOSYSTEM                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │   Open      │  ↔   │    MCP      │  ↔   │   Vibe      │    │
│  │   WebUI     │      │   Server    │      │   Kanban    │    │
│  │  (AI Chat)  │      │  (Bridge)   │      │  (Tasks)    │    │
│  │  Port 8081  │      │  Port 4001  │      │  Port 4000  │    │
│  └─────────────┘      └─────────────┘      └─────────────┘    │
│         │                     │                     │           │
│         └─────────────────────┴─────────────────────┘           │
│                           │                                    │
│                    ┌──────▼────────┐                           │
│                    │  code-server  │                           │
│                    │  (VS Code)    │                           │
│                    │  Port 8443    │                           │
│                    └───────────────┘                           │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Purpose | Port | Technology |
|-----------|---------|------|------------|
| **Open WebUI** | AI chat interface | 8081 | Python/FastAPI |
| **MCP Server** | API bridge | 4001 | Node.js/Express |
| **Vibe-Kanban** | Task management | 4000 | Node.js |
| **code-server** | Browser IDE | 8443 | VS Code |

---

## How It Works

### The AI Task Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: User Request                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: AI Analysis                          │
│  • AI receives user request in Open WebUI                       │
│  • Selects appropriate MCP tool (vibe_generate_plan)            │
│  • Analyzes goal for patterns (auth, database, API, etc.)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 3: MCP Processing                        │
│  • MCP Server receives tool call                                │
│  • Validates request parameters                                 │
│  • Generates intelligent task breakdown                          │
│  • Creates tasks with priorities and estimates                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 4: Task Creation                         │
│  • Tasks written to Vibe-Kanban bridge file                     │
│  • Bridge file synced to board                                  │
│  • Tasks appear in Kanban lanes                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 5: Development                           │
│  • Developer sees tasks in Vibe-Kanban                          │
│  • Opens code-server to implement                               │
│  • Moves tasks through workflow lanes                           │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern Detection

The MCP Server automatically detects common development patterns:

| Pattern | Keywords | Tasks Generated | Time Estimate |
|---------|----------|-----------------|---------------|
| **Authentication** | oauth, auth, login, jwt, sso | 8 tasks | ~54 hours |
| **Database** | database, sql, postgres, mongo | 7 tasks | ~32 hours |
| **API** | api, rest, graphql, endpoints | 10 tasks | ~51 hours |
| **Frontend** | ui, react, vue, component | 9 tasks | ~49 hours |
| **Testing** | test, tdd, coverage, spec | 7 tasks | ~34 hours |
| **Deployment** | deploy, docker, k8s, ci/cd | 9 tasks | ~35 hours |

---

## Complete Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack

# Run setup
make setup

# Start services
make up

# Verify all services are healthy
make health
```

### 2. Configure Open WebUI

1. **Open Open WebUI**: http://localhost:8081

2. **Configure AI Provider** (Settings → Providers):
   - Choose: OpenAI, Anthropic, Ollama, or Custom
   - Enter API key
   - Select default model

3. **Add MCP Server** (Settings → MCP Servers):
   - Name: `Vibe Stack`
   - Type: `STDIO`
   - Command: `docker exec -i vibe-mcp-server node /app/index.js`

4. **Test Connection**: Click "Test Connection" button

### 3. Generate Your First Tasks

**In Open WebUI chat**:

```
You: Create a task plan for building a REST API with Node.js and Express

AI: I'll analyze that and generate a comprehensive task plan.

    [Uses vibe_analyze_goal]
    Detected: API pattern
    Estimated: 10 tasks (~51 hours)

    [Uses vibe_generate_plan]
    🎯 Generated 10 tasks for "REST API with Node.js and Express"

    📊 Summary:
      • Total: 10 tasks (~51 hours)
      • High priority: 6
      • Medium priority: 3
      • Low priority: 1

    📋 Tasks Created:
      1. Design API architecture (6h, high)
      2. Set up Express server (4h, high)
      3. Define data models (4h, high)
      4. Implement authentication (8h, high)
      5. Create CRUD endpoints (8h, high)
      6. Add input validation (4h, medium)
      7. Implement error handling (4h, medium)
      8. Write API documentation (6h, medium)
      9. Add unit tests (6h, low)
      10. Set up deployment (3h, low)

    ✨ Tasks added to Vibe-Kanban backlog
       View at: http://localhost:4000
```

### 4. Develop Your Project

1. **Open code-server**: http://localhost:8443
   - Default workspace: `/repos`
   - Create or open your project

2. **View Tasks**: http://localhost:4000
   - See all AI-generated tasks
   - Drag tasks between lanes
   - Track progress

3. **Iterate**:
   - Work on tasks in code-server
   - Move tasks to "in_progress" when starting
   - Move to "done" when complete
   - Ask AI for more tasks as needed

---

## Service Interactions

### MCP Server ↔ Vibe Kanban

**Bridge File**: `.vibe-kanban-bridge.json`

```json
{
  "lanes": {
    "backlog": [
      {
        "id": "task-1234567890-abc",
        "title": "Design API architecture",
        "lane": "backlog",
        "priority": "high",
        "status": "pending",
        "estimatedHours": 6,
        "tags": ["ai-generated"],
        "createdAt": "2026-01-28T10:00:00.000Z"
      }
    ],
    "todo": [],
    "in_progress": [],
    "done": [],
    "recovery": []
  },
  "lastSync": "2026-01-28T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Sync Process**:
1. MCP Server writes to bridge file
2. Vibe-Kanban watches for file changes
3. Board updates automatically
4. Changes reflected in UI

---

### Open WebUI ↔ MCP Server

**Communication Methods**:

1. **STDIO (Local)**:
   ```
   Open WebUI → docker exec → MCP Server
   ```

2. **HTTP API (Remote)**:
   ```
   Open WebUI → HTTP Request → MCP Server
   ```

**Tool Execution Flow**:

```javascript
// Open WebUI calls MCP tool
{
  "tool": "vibe_create_task",
  "arguments": {
    "title": "Fix login bug",
    "priority": "critical"
  }
}

// MCP Server processes
→ Validates input
→ Creates task
→ Writes to bridge file
→ Returns result

// Open WebUI displays
"✓ Task created: Fix login bug
   ID: task-1234567890-abc
   View at: http://localhost:4000"
```

---

### code-server ↔ Workspace

**Shared Volume**: `./repos`

```
code-server: /home/coder/repos
vibe-kanban: /repos
```

**Benefits**:
- Files created in code-server visible to vibe-kanban
- Git operations available in both
- Shared SSH keys for authentication
- Consistent development environment

---

## Configuration

### Environment Variables (.env)

```bash
# Required
CODE_SERVER_PASSWORD=your-secure-password

# Optional (defaults shown)
VIBE_PORT=4000
CODE_SERVER_PORT=8443
OPEN_WEBUI_PORT=8081
MCP_SERVER_PORT=4001
LOG_LEVEL=info
NODE_ENV=production
```

### MCP Server Configuration

**File**: `mcp-server/src/config/constants.js`

```javascript
export const CONFIG = {
  name: 'vibe-stack-mcp',
  version: '1.0.0',
  vibeKanbanUrl: 'http://localhost:4000',
  bridgeFilePath: '/data/.vibe-kanban-bridge.json'
};

export const VALID_LANES = [
  'backlog',
  'todo',
  'in_progress',
  'done',
  'recovery'
];

export const VALID_PRIORITIES = [
  'low',
  'medium',
  'high',
  'critical'
];
```

### Open WebUI Custom Panel

**File**: `services/open-webui-custom/kanban-panel.html`

**Features**:
- Real-time board view (auto-refreshes every 10s)
- Task statistics
- Priority indicators
- Click tasks to open in Vibe-Kanban
- AI-generated badges

**Access**: http://localhost:4001/custom/kanban-panel.html

---

## Common Use Cases

### Use Case 1: New Feature Development

**Workflow**:

1. **Generate tasks**:
   ```
   Create a task plan for adding user notifications
   ```

2. **Review generated tasks** in Vibe-Kanban

3. **Start development** in code-server

4. **Track progress** by moving tasks through lanes

5. **Ask for clarification**:
   ```
   What's the next task for notifications?
   Should I add email notifications too?
   ```

### Use Case 2: Bug Fixing

**Workflow**:

1. **Create bug task**:
   ```
   Create a high-priority task: Fix login page XSS vulnerability
   Description: User input not sanitized on login form
   ```

2. **Move to in_progress** and start fixing

3. **Generate test tasks**:
   ```
   Generate test tasks for the XSS fix
   ```

4. **Complete and move to done**

### Use Case 3: Code Review

**Workflow**:

1. **Review AI suggestions**:
   ```
   Analyze the current backlog and suggest priorities
   ```

2. **Get context**:
   ```
   What's our current board status?
   ```

3. **Reorganize** based on AI recommendations

### Use Case 4: Sprint Planning

**Workflow**:

1. **Get statistics**:
   ```
   Show me our board metrics
   ```

2. **Generate sprint plan**:
   ```
   Create a plan for our 2-week sprint focusing on API endpoints
   Target 80 hours of work
   ```

3. **Adjust** as needed

---

## Troubleshooting

### MCP Server Not Connecting

**Symptoms**: Open WebUI shows "Connection failed"

**Solutions**:

1. **Check MCP Server is running**:
```bash
docker ps | grep vibe-mcp-server
```

2. **Test health endpoint**:
```bash
curl http://localhost:4001/health
```

3. **Check logs**:
```bash
docker logs vibe-mcp-server --tail 50
```

4. **Restart MCP Server**:
```bash
docker-compose restart mcp-server
```

---

### Tasks Not Appearing

**Symptoms**: AI says tasks created but nothing in Vibe-Kanban

**Solutions**:

1. **Check bridge file**:
```bash
cat .vibe-kanban-bridge.json
```

2. **Manual sync**:
```bash
./scripts/ops/kanban-sync.sh
```

3. **Refresh Vibe-Kanban** in browser

---

### AI Not Using Tools

**Symptoms**: AI doesn't call MCP tools

**Solutions**:

1. **Verify MCP Server added in Open WebUI**:
   - Settings → MCP Servers
   - Check "Vibe Stack" is listed

2. **Test connection**:
   - Click "Test Connection" button
   - Should show "Connected successfully"

3. **Restart Open WebUI**:
```bash
docker-compose restart open-webui
```

---

### Port Conflicts

**Symptoms**: "Port already in use" errors

**Solutions**:

1. **Find process using port**:
```bash
lsof -i :4001
```

2. **Kill conflicting process**:
```bash
kill -9 <PID>
```

3. **Or change ports in .env**

---

## Best Practices

### 1. Task Generation

- **Be specific**: "Create OAuth with Google and GitHub" vs "Create auth"
- **Provide context**: Include tech stack, constraints, requirements
- **Review before starting**: AI generates suggestions, you approve
- **Iterate**: Ask follow-up questions to refine

### 2. Workflow Management

- **Keep lanes clean**: Move completed tasks to done
- **Use priorities**: Mark urgent tasks as high/critical
- **Add estimates**: Helps with sprint planning
- **Tag tasks**: Use tags for organization (bug, feature, refactor)

### 3. Development

- **One task at a time**: Focus on single task for better flow
- **Update task status**: Move to in_progress when starting
- **Add notes**: Update task descriptions as you learn
- **Test after completion**: Verify before moving to done

### 4. AI Interaction

- **Be conversational**: Ask questions naturally
- **Provide feedback**: Tell AI what worked/didn't work
- **Use context**: Reference existing tasks when asking for more
- **Iterate**: Refine tasks through conversation

---

## Related Documentation

- **[Quick Start](../01-getting-started/01-quick-start.md)** - Get started in 5 minutes
- **[OPENWEBUI.md](OPENWEBUI.md)** - Open WebUI configuration
- **[EXTERNAL_OPENWEBUI.md](EXTERNAL_OPENWEBUI.md)** - Remote access setup
- **[API Overview](../04-api/01-api-overview.md)** - Complete API reference
- **[Configuration](../05-operations/01-configuration.md)** - Configuration options
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

---

## Summary

Vibe Stack provides a **complete AI-powered development environment**:

✅ **AI Task Generation**: Open WebUI + MCP Server + Vibe-Kanban
✅ **Professional IDE**: Browser-based VS Code (code-server)
✅ **Real-time Sync**: Bridge file keeps everything in sync
✅ **Pattern Detection**: Automatic recognition of common patterns
✅ **Flexible Deployment**: Local, network, or cloud access

**The complete workflow**:
1. Ask AI to generate tasks
2. AI analyzes and creates intelligent task breakdown
3. Tasks appear in Vibe-Kanban board
4. Develop in code-server
5. Track progress through lanes
6. Ship faster with AI assistance!

---

**Need help?** See [FAQ.md](FAQ.md) or [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
