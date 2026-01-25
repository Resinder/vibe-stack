# Open WebUI + Vibe Kanban - Complete Setup Guide

## 🎯 What You Can Do

After setup, you'll be able to:

1. **Chat to create task plans** - Just describe what you want to build
2. **Generate intelligent tasks** - AI detects patterns and creates appropriate tasks
3. **Manage your board** - Create, move, update tasks via chat
4. **Real-time sync** - Changes appear instantly in Vibe Kanban

## 📋 Quick Setup (5 Minutes)

### Step 1: Verify Services Running

```bash
docker ps
```

You should see:
- `vibe-mcp-server` on port 4001
- `vibe-server` on port 4000
- `open-webui` on port 8081

### Step 2: Test MCP Server

```bash
curl http://localhost:4001/health
# Response: {"status":"healthy","server":"vibe-stack-mcp","version":"2.0.0"}
```

### Step 3: Configure Open WebUI

**Option A: Via Web UI (Recommended)**

1. Open **http://localhost:8081**
2. Click **Settings** (gear icon)
3. Find **MCP Servers** section
4. Click **Add MCP Server**
5. Fill in:
   - **Name**: `Vibe Stack`
   - **Type**: `STDIO`
   - **Command**: `docker exec -i vibe-mcp-server node /app/index.js`
6. Click **Save**

**Option B: Via Config File**

```bash
# Enter container
docker exec -it open-webui sh

# Create config
cat > /app/backend/data/mcp_config.json << 'EOF'
{
  "mcp_servers": {
    "vibe-stack": {
      "command": "docker",
      "args": ["exec", "-i", "vibe-mcp-server", "node", "/app/index.js"],
      "env": {}
    }
  }
}
EOF

# Restart container
exit
docker compose restart open-webui
```

### Step 4: Verify Connection

1. Open http://localhost:8081
2. Start a new chat
3. Type: `Get board context`
4. You should see Vibe Kanban statistics!

## 💬 Usage Examples

### Example 1: Generate Task Plan

```
You: Create a task plan for implementing user authentication with OAuth

AI: I'll analyze this and generate appropriate tasks...

[Uses vibe_analyze_goal]
Detected: authentication pattern
Estimated: 8 tasks

[Uses vibe_generate_plan]
🎯 Generated 10 tasks for: "user authentication with OAuth"

📊 Summary:
  • Total tasks: 10
  • Estimated hours: 54
  • High priority: 6
  • Medium priority: 3
  • Low priority: 1

📋 Tasks:
  1. Design authentication architecture (4h, high)
  2. Set up authentication backend API (8h, high)
  3. Implement token management (6h, high)
  4. Create login/register UI components (6h, medium)
  5. Add session persistence (4h, medium)
  6. Implement password reset flow (4h, medium)
  7. Write authentication tests (6h, medium)
  8. Add rate limiting for auth endpoints (2h, low)
  9. Document: user authentication with OAuth (3h, low)
  10. Review and test: user authentication with OAuth (4h, medium)

✨ View in Vibe Kanban: http://localhost:4000
```

### Example 2: Quick Task Creation

```
You: Add a critical task: Fix the memory leak in the API service

AI: [Uses vibe_create_task]

✓ Task created: "Fix the memory leak in the API service"
  Lane: todo
  Priority: critical
  ID: task-1737799234567-abc123
  View at: http://localhost:4000
```

### Example 3: Check Board Status

```
You: What's on our board?

AI: [Uses vibe_get_context]

📋 Vibe Kanban Context

Current Board State:
  • Total Tasks: 15
  • In Progress: 0
  • Completed: 3

Work Distribution:
  • High Priority: 4
  • Medium Priority: 8
  • Low Priority: 3

Estimated Remaining: 67h

Recommendation: You have 4 high-priority tasks in backlog.
Consider starting with those first.
```

### Example 4: Search Tasks

```
You: Find all tasks related to authentication

AI: [Uses vibe_search_tasks]

Found 8 task(s):
• Design authentication architecture (high)
• Set up authentication backend API (high)
• Implement token management (high)
• Create login/register UI components (medium)
• Add session persistence (medium)
• Implement password reset flow (medium)
• Write authentication tests (medium)
• Add rate limiting for auth endpoints (low)
```

## 🔌 API Reference (Direct HTTP Access)

You can also call the MCP server directly via HTTP:

### Quick Plan Generation

```bash
curl -X POST http://localhost:4001/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Add real-time notifications with WebSockets",
    "context": "Use Socket.io, support 1000+ users"
  }'
```

Response:
```json
{
  "success": true,
  "goal": "Add real-time notifications with WebSockets",
  "plan": {
    "totalTasks": 12,
    "totalHours": 68,
    "tasks": [...]
  },
  "boardUrl": "http://localhost:4000"
}
```

### List Available Tools

```bash
curl http://localhost:4001/v1/functions
```

### Execute Tool Directly

```bash
curl -X POST http://localhost:4001/v1/tools/vibe_get_stats \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Get Board Snapshot

```bash
curl http://localhost:4001/v1/board/snapshot
```

## 🎨 Custom Kanban Panel

View your board in a beautiful UI:

**http://localhost:4001/custom/kanban-panel.html**

Features:
- Real-time updates (auto-refresh every 10s)
- Task counts by lane
- Priority indicators
- AI-generated badges
- Click tasks to open in Vibe Kanban

### Add to Open WebUI

1. Open http://localhost:8081
2. Settings → Custom Panels
3. Add Panel:
   - **Name**: Vibe Kanban
   - **URL**: `http://localhost:4001/custom/kanban-panel.html`

## 🧠 Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| `vibe_get_board` | Get complete board state | "Show me the board" |
| `vibe_create_task` | Create new task | "Add task: Fix login bug" |
| `vibe_generate_plan` | **Generate intelligent task plan** | "Create plan for OAuth" |
| `vibe_analyze_goal` | Analyze goal before planning | "Analyze: Add notifications" |
| `vibe_get_context` | Get board context | "What's our status?" |
| `vibe_move_task` | Move task between lanes | "Move task #123 to done" |
| `vibe_update_task` | Update task properties | "Mark #456 as high priority" |
| `vibe_search_tasks` | Search tasks | "Find API tasks" |
| `vibe_get_stats` | Get metrics | "Show statistics" |
| `vibe_batch_create` | Create multiple tasks | "Add these 5 tasks: ..." |

## 🎯 Pattern Detection

The AI automatically detects these patterns:

| Pattern | Keywords | Tasks Generated |
|---------|----------|-----------------|
| **Authentication** | auth, login, oauth, jwt | 8 tasks (~54h) |
| **Database** | database, sql, postgres | 7 tasks (~32h) |
| **API** | api, rest, graphql | 10 tasks (~51h) |
| **Frontend** | ui, react, component | 9 tasks (~49h) |
| **Testing** | test, tdd, coverage | 7 tasks (~34h) |
| **Deployment** | deploy, docker, k8s | 9 tasks (~35h) |

## 🐛 Troubleshooting

### MCP Server Not Connecting

```bash
# Check if MCP server is running
curl http://localhost:4001/health

# Check logs
docker logs vibe-mcp-server

# Restart if needed
docker compose restart mcp-server
```

### Tools Not Appearing in Open WebUI

1. Verify MCP configuration in Settings → MCP Servers
2. Check that the command is correct:
   ```
   docker exec -i vibe-mcp-server node /app/index.js
   ```
3. Restart Open WebUI:
   ```bash
   docker compose restart open-webui
   ```

### Tasks Not Syncing to Vibe Kanban

Check the bridge file:
```bash
cat .vibe-kanban-bridge.json
```

If it's not updating, manually sync:
```bash
./kanban-sync.sh
```

## 📚 Architecture

```
┌─────────────────────────────────────────────┐
│            OPEN WEBUI (Chat)                │
│    "Create plan for OAuth with Google"      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         VIBE MCP SERVER (Port 4001)         │
│  • 10 MCP Tools                              │
│  • Pattern Detection                         │
│  • Real-time Sync                            │
│  • HTTP API                                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         .vibe-kanban-bridge.json           │
│         (Single Source of Truth)            │
└─────────────────────────────────────────────┘
```

## 🚀 Next Steps

1. **Try it out**: Start chatting in Open WebUI
2. **Explore tools**: Try all 10 available tools
3. **Customize patterns**: Edit `mcp-server/enhanced/index.js`
4. **Add webhooks**: Connect to external systems

## 📖 Full Documentation

- **Enhanced Integration**: `docs/ENHANCED_INTEGRATION.md`
- **Original Integration**: `docs/OPEN_WEBUI_INTEGRATION.md`
- **Observer Dashboard**: Run `make observer`

## 💡 Tips

1. **Be specific** - More context = better task breakdown
2. **Use technical terms** - "OAuth", "PostgreSQL", "REST API" trigger patterns
3. **Review generated tasks** - Adjust estimates as needed
4. **Check context first** - Use `vibe_get_context` before planning
5. **Use the custom panel** - http://localhost:4001/custom/kanban-panel.html

---

**Ready to build something amazing! Start chatting in Open WebUI: http://localhost:8081** 🚀
