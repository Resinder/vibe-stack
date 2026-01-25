# Vibe Stack - Open WebUI Integration Guide

Complete guide to using Open WebUI for AI-powered task planning in Vibe-Kanban.

---

## Quick Setup (2 minutes)

### 1. Start Services

```bash
make up
```

### 2. Verify MCP Server

```bash
curl http://localhost:4001/health
# Response: {"status":"healthy",...}
```

### 3. Configure Open WebUI

Open http://localhost:8081 and:

1. Click **Settings** (gear icon)
2. Scroll to **MCP Servers**
3. Click **Add MCP Server**
4. Enter:
   - **Name**: `Vibe Stack`
   - **Type**: `STDIO`
   - **Command**: `docker exec -i vibe-mcp-server node /app/index.js`
5. Click **Save**

### 4. Start Chatting!

Create a new chat and type:
```
Create a task plan for implementing OAuth authentication
```

---

## Available Tools

### Planning Tools

| Tool | Description | Example |
|------|-------------|---------|
| `vibe_generate_plan` | Generate task plan from goal | "Create plan for REST API" |
| `vibe_analyze_goal` | Analyze before planning | "Analyze: Add notifications" |
| `vibe_get_context` | Get board status | "What's our context?" |

### Task Management

| Tool | Description | Example |
|------|-------------|---------|
| `vibe_create_task` | Create single task | "Add task: Fix login bug" |
| `vibe_move_task` | Move between lanes | "Move task #123 to done" |
| `vibe_update_task` | Update properties | "Mark #456 as high priority" |
| `vibe_search_tasks` | Search tasks | "Find API tasks" |

### Information

| Tool | Description | Example |
|------|-------------|---------|
| `vibe_get_board` | Get board state | "Show me the board" |
| `vibe_get_stats` | Get statistics | "Show metrics" |

---

## Chat Examples

### Example 1: Generate Plan

```
You: Create a comprehensive task plan for implementing OAuth authentication with Google and GitHub

AI: [Uses vibe_analyze_goal]
    Detected: authentication pattern
    Estimated: 10 tasks

    [Uses vibe_generate_plan]
    🎯 Generated 10 tasks for "OAuth authentication"

    📊 Summary:
      • Total: 10 tasks (~62 hours)
      • High priority: 6
      • Medium priority: 3
      • Low priority: 1

    📋 Tasks:
      1. Design authentication architecture (4h, high)
      2. Set up authentication backend (8h, high)
      3. Implement token management (6h, high)
      4. Implement OAuth for Google (6h, high)
      5. Implement OAuth for GitHub (6h, high)
      6. Create login/register UI (6h, medium)
      7. Add session persistence (4h, medium)
      8. Implement password reset (4h, medium)
      9. Write authentication tests (6h, medium)
      10. Add rate limiting (2h, low)

    ✨ View in Vibe-Kanban: http://localhost:4000
```

### Example 2: Check Context

```
You: What should I work on next?

AI: [Uses vibe_get_context]

    📋 Vibe Kanban Context

    Current Board State:
      • Total Tasks: 15
      • In Progress: 2 (12h remaining)
      • Completed: 3
      • Backlog: 8 (68h estimated)

    Work Distribution:
      • High Priority: 4
      • Medium Priority: 8
      • Low Priority: 3

    Recommendation:
      You have 2 high-priority tasks in backlog:
      1. "Implement OAuth for Google" (6h)
      2. "Fix login bug" (4h)

      Consider finishing current work first, then tackle these.
```

### Example 3: Quick Task

```
You: Add a critical task: Investigate the production downtime from last night

AI: [Uses vibe_create_task]

    ✓ Task created: "Investigate production downtime"
      Lane: todo
      Priority: critical
      ID: task-1234567890-abc123
      View at: http://localhost:4000
```

### Example 4: Search

```
You: Find all tasks related to authentication

AI: [Uses vibe_search_tasks]

    Found 8 task(s):
    • Design authentication architecture (high)
    • Set up authentication backend (high)
    • Implement token management (high)
    • Implement OAuth for Google (high)
    • Implement OAuth for GitHub (high)
    • Create login/register UI (medium)
    • Add session persistence (medium)
    • Write authentication tests (medium)
```

---

## Pattern Detection

The AI detects these patterns automatically:

### Authentication

**Keywords:** `auth`, `login`, `oauth`, `jwt`, `session`, `password`, `token`

**Generates:** 8 tasks (~54h)

```
• Design authentication architecture
• Set up authentication backend
• Implement token management
• Create login/register UI
• Add session persistence
• Implement password reset
• Write authentication tests
• Add rate limiting
```

### Database

**Keywords:** `database`, `db`, `sql`, `nosql`, `postgres`, `mongo`, `migration`, `schema`

**Generates:** 7 tasks (~32h)

```
• Design database schema
• Create migration scripts
• Set up connection pool
• Implement data access layer
• Add indexing
• Create seed data scripts
• Set up backup strategy
```

### API

**Keywords:** `api`, `rest`, `graphql`, `endpoint`, `backend`, `service`

**Generates:** 10 tasks (~51h)

```
• Design API specification
• Set up API framework
• Implement core endpoints
• Add request validation
• Implement error handling
• Add authentication/authorization
• Create API documentation
• Set up API versioning
• Add rate limiting
• Write API tests
```

### Frontend

**Keywords:** `ui`, `frontend`, `component`, `react`, `vue`, `interface`, `design`

**Generates:** 9 tasks (~49h)

```
• Create UI mockups/wireframes
• Set up component library
• Build core components
• Implement state management
• Add routing
• Implement responsive design
• Add loading states/error handling
• Write component tests
• Performance optimization
```

### Testing

**Keywords:** `test`, `testing`, `tdd`, `spec`, `coverage`

**Generates:** 7 tasks (~34h)

```
• Set up testing framework
• Write unit tests
• Write integration tests
• Set up test coverage reporting
• Configure CI/CD testing pipeline
• Add end-to-end tests
• Set up performance testing
```

### Deployment

**Keywords:** `deploy`, `docker`, `kubernetes`, `ci/cd`, `pipeline`, `production`

**Generates:** 9 tasks (~35h)

```
• Set up CI/CD pipeline
• Create Docker containers
• Set up environment configuration
• Configure deployment automation
• Set up monitoring and alerting
• Create backup/restore procedures
• Set up log aggregation
• Configure SSL/TLS certificates
• Create runbooks for incidents
```

---

## Custom Kanban Panel

View your board in a beautiful interface:

**URL:** http://localhost:4001/custom/kanban-panel.html

**Features:**
- Real-time board view
- Auto-refresh every 10 seconds
- Task counts by lane
- Priority indicators
- AI-generated badges
- Click to open in Vibe-Kanban

### Add to Open WebUI

1. Open http://localhost:8081
2. Settings → Custom Panels
3. Add Panel:
   - **Name**: Vibe Kanban
   - **URL**: `http://localhost:4001/custom/kanban-panel.html`

---

## HTTP API (Direct Access)

You can also call tools directly via HTTP:

### Quick Plan

```bash
curl -X POST http://localhost:4001/v1/plan \
  -H "Content-Type: application/json" \
  -d '{"goal": "Add OAuth authentication"}'
```

### List Tools

```bash
curl http://localhost:4001/v1/functions
```

### Execute Tool

```bash
curl -X POST http://localhost:4001/v1/tools/vibe_get_stats \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Board Snapshot

```bash
curl http://localhost:4001/v1/board/snapshot
```

---

## Troubleshooting

### MCP Server Not Connecting

```bash
# Check if running
curl http://localhost:4001/health

# Check logs
docker logs vibe-mcp-server

# Restart
docker compose restart mcp-server
```

### Tools Not Appearing

1. Verify MCP configuration in Open WebUI Settings
2. Check command is exact: `docker exec -i vibe-mcp-server node /app/index.js`
3. Restart Open WebUI: `docker compose restart open-webui`

### Tasks Not Syncing

```bash
# Check bridge file
cat .vibe-kanban-bridge.json

# Manual sync
./kanban-sync.sh
```

---

## Best Practices

1. **Be Specific**
   - Good: "Create plan for OAuth with Google and GitHub"
   - Bad: "Create plan"

2. **Use Technical Terms**
   - "PostgreSQL", "REST API", "React", "Docker" trigger patterns

3. **Check Context First**
   - "What's our status?" before planning

4. **Review Generated Tasks**
   - Adjust estimates as needed

5. **Use the Panel**
   - http://localhost:4001/custom/kanban-panel.html

---

## Advanced Usage

### Multiple Plans

```
You: Create plan for the backend API first, then add frontend separately

AI: [Generates backend plan]

You: Now create plan for the React frontend

AI: [Generates frontend plan]
```

### Custom Task Properties

```
You: Add a task with high priority and 8 hour estimate: Implement user profile

AI: ✓ Task created with specified properties
```

### Batch Operations

```
You: Create these tasks:
- Task 1: Setup project structure
- Task 2: Configure ESLint
- Task 3: Add Prettier

AI: ✓ Batch created 3 tasks
```

---

**Ready to supercharge your workflow? Start chatting: http://localhost:8081** 🚀
