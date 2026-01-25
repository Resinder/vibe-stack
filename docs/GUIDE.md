# Vibe Stack - Complete User Guide

Complete guide to using Vibe Stack for AI-powered development.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Open WebUI Chat](#open-webui-chat)
3. [Vibe-Kanban Board](#vibe-kanban-board)
4. [code-server IDE](#code-server-ide)
5. [AI Task Planning](#ai-task-planning)
6. [Common Workflows](#common-workflows)
7. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### First Time Setup

```bash
# Clone the repository
git clone https://github.com/halilbarim/vibe-stack.git
cd vibe-stack

# Run setup (creates .env, installs dependencies)
./init.sh

# Start all services
make up

# Verify services are running
make health
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Vibe-Kanban | http://localhost:4000 | Task board & AI agents |
| Open WebUI | http://localhost:8081 | AI chat interface |
| code-server | http://localhost:8443 | Browser IDE |
| Observer Dashboard | http://localhost:4000/observer | System monitoring |

---

## Open WebUI Chat

### Setup for Task Planning

1. Open http://localhost:8081
2. Configure your AI model (OpenAI, Anthropic, Ollama, etc.)
3. Go to **Settings → MCP Servers**
4. Add MCP Server:
   - **Name**: Vibe Stack
   - **Command**: `docker exec -i vibe-mcp-server node /app/index.js`
5. Save and start chatting!

### Basic Commands

| Command | Description | Example |
|---------|-------------|---------|
| Get context | Show board status | "What's our current status?" |
| Create task | Add single task | "Add task: Fix login bug" |
| Generate plan | Create multiple tasks | "Create plan for OAuth auth" |
| Search tasks | Find tasks | "Find all API tasks" |
| Get stats | View metrics | "Show board statistics" |

---

## Vibe-Kanban Board

### Board Layout

```
┌──────────┬──────────┬─────────────┬──────┬──────────┐
│ Backlog  │   Todo   │ In Progress │ Done │ Recovery │
├──────────┼──────────┼─────────────┼──────┼──────────┤
│          │          │             │      │          │
│  Tasks   │  Tasks   │   Working   │ Done │ Blocked  │
│          │          │             │      │          │
└──────────┴──────────┴─────────────┴──────┴──────────┘
```

### Task Management

**Create Task:**
- Click "Add Task" button
- Or use Open WebUI: "Add task: Fix the login bug"

**Move Task:**
- Drag and drop between lanes
- Or chat: "Move task #123 to done"

**Edit Task:**
- Click task to edit
- Or chat: "Update task #123: Increase priority to high"

---

## code-server IDE

### Opening in Browser

```bash
make shell-code      # Or open http://localhost:8443
```

Default password is in `.env` file.

### Features

- **Full VS Code**: Extensions, themes, keybindings
- **Git Integration**: Commit, push, pull from terminal
- **File Access**: Edit files in `/repos` directory
- **Port Forwarding**: Access dev servers (3000-3100)

### Recommended Extensions

```bash
# In code-server terminal
code-server --install-extension dbaeumer.vscode-eslint
code-server --install-extension esbenp.prettier-vscode
code-server --install-extension ms-python.python
code-server --install-extension bradlc.vscode-tailwindcss
```

---

## AI Task Planning

### Pattern Detection

The AI automatically detects project types and generates appropriate tasks:

| Pattern | Keywords | Tasks | Hours |
|---------|----------|-------|-------|
| Authentication | auth, login, oauth, jwt | 8 | ~54 |
| Database | database, sql, postgres | 7 | ~32 |
| API | api, rest, graphql | 10 | ~51 |
| Frontend | ui, react, component | 9 | ~49 |
| Testing | test, tdd, coverage | 7 | ~34 |
| Deployment | deploy, docker, k8s | 9 | ~35 |

### Example Conversations

**Example 1: OAuth Authentication**

```
You: Create a comprehensive plan for OAuth authentication with Google

AI: 🎯 Generated 10 tasks

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
  5. Create login/register UI (6h, medium)
  6. Add session persistence (4h, medium)
  7. Implement password reset (4h, medium)
  8. Write authentication tests (6h, medium)
  9. Add rate limiting (2h, low)
  10. Document setup (3h, low)

✨ View in Vibe-Kanban: http://localhost:4000
```

**Example 2: Database Migration**

```
You: I need to add PostgreSQL with migrations for user management

AI: 🎯 Generated 9 tasks

Detected pattern: database + authentication

Tasks created include:
  • Design database schema
  • Create migration scripts
  • Set up connection pool
  • Implement user repository
  • Add seed data scripts
  • Write database tests
  • Set up backup strategy
  • Configure environment variables
  • Document database setup

✨ All tasks added to backlog lane
```

**Example 3: Context Check**

```
You: What should I work on next?

AI: 📋 Current Board Context

  • Total Tasks: 15
  • In Progress: 2 (12h remaining)
  • Backlog: 8 (68h estimated)
  • High Priority: 4

Recommendation:
  You have 2 high-priority tasks in backlog:
  1. "Implement OAuth for Google" (6h)
  2. "Fix login bug" (4h)

  Consider finishing current work first, then tackle these.
```

---

## Common Workflows

### Workflow 1: Start New Feature

```bash
# 1. Plan the feature
open http://localhost:8081
# Chat: "Create plan for user profile management"

# 2. Review tasks in Vibe-Kanban
open http://localhost:4000
# Move tasks from backlog to todo

# 3. Start coding
open http://localhost:8443
# Work on the tasks
```

### Workflow 2: Daily Standup

```bash
# Check status in Open WebUI
# Chat: "What's our status?"

# Move completed tasks
# Chat: "Move task #123 to done"

# Plan next work
# Chat: "What should I work on next?"
```

### Workflow 3: Bug Fix

```bash
# Create bug report as task
# Chat: "Add critical task: Fix memory leak in API"

# Move to in-progress
# Chat: "Move task [task-id] to in_progress"

# When done
# Chat: "Move task [task-id] to done"
```

---

## Tips & Tricks

### 1. Be Specific

Better: "Create plan for OAuth authentication with Google and GitHub providers, using Passport.js"

Good: "Create plan for OAuth"

### 2. Use Technical Terms

Keywords that trigger patterns:
- "OAuth", "JWT", "PostgreSQL", "REST API", "React", "Docker", "Kubernetes"

### 3. Ask for Context First

Before planning, check status:
```
"What's on our board?"
"How many tasks in backlog?"
"What's in progress?"
```

### 4. Iterate on Plans

Generate a plan, then refine:
```
"Add a task for load testing the API"
"Increase priority of the database task"
"Split the frontend task into smaller chunks"
```

### 5. Use Kanban Panel

View your board in real-time:
```
http://localhost:4001/custom/kanban-panel.html
```

### 6. Quick Stats

Get board metrics anytime:
```
"Show statistics"
"Get board metrics"
```

### 7. Search Efficiently

```
"Find all high priority tasks"
"Search for tasks with 'api' in title"
"Show me all testing tasks"
```

---

## Keyboard Shortcuts

### Vibe-Kanban

| Shortcut | Action |
|----------|--------|
| `N` | New task |
| `S` | Save |
| `/` | Search |
| `?` | Help |

### code-server

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Command palette |
| `Ctrl+` ` | Terminal |
| `Ctrl+B` | Toggle sidebar |

---

## System Monitoring

### Observer Dashboard

```bash
make observer
# or open http://localhost:4000/observer
```

Shows:
- Evolution score
- Resource usage (CPU/Memory)
- Service health
- Recent immune responses

### Check Logs

```bash
make logs           # All services
make logs-vibe     # Vibe-Kanban only
make logs-mcp      # MCP server only
```

### Health Check

```bash
make health
# or
curl http://localhost:4001/health
curl http://localhost:4000/api/health
```

---

## Updates & Maintenance

### Update Images

```bash
make update
# Pulls latest images and restarts gracefully
```

### Rollback

If something breaks:
```bash
make rollback
# Reverts to previous working version
```

### Full Diagnostics

```bash
make doctor
# Checks everything: Docker, images, configs, services
```

---

## Getting Help

1. **Documentation**: Check [docs/](docs/)
2. **MCP Tools**: Run `make mcp-tools`
3. **Diagnostics**: Run `make doctor`
4. **Logs**: Run `make logs`
5. **Issues**: [GitHub Issues](https://github.com/halilbarim/vibe-stack/issues)

---

**Happy coding! 🚀**
