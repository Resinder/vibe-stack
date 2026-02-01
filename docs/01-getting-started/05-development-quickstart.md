# Development Quick Start

Start developing with Vibe Stack in **5 minutes**.

---

## Prerequisites

Completed [Quick Start](01-quick-start.md) + basic Node.js knowledge.

---

## Start Development Mode

```bash
cd vibe-stack
make dev-up
```

This enables:
- ✅ Hot-reload for code changes
- ✅ Debug ports exposed
- ✅ Source code mounted
- ✅ Debug logging enabled

---

## Your First Project

### 1. Create Project Directory

```bash
mkdir -p repos/my-app
cd repos/my-app
npm init -y
```

### 2. Open code-server

http://localhost:8443

Login with password from `.env`.

### 3. Start Coding

In code-server terminal:

```bash
# Install dependencies
npm install express

# Create index.js
cat > index.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Running on http://localhost:3000');
});
EOF

# Start
node index.js
```

Access at: http://localhost:3000

---

## Generate Tasks with AI

### Option A: Local AI (Free, No Setup)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull llama3.2
```

Open http://localhost:8081 and chat:

```
Create tasks for my Express API:
- Add user authentication
- Add CRUD endpoints
- Add error handling
- Add input validation
```

Tasks appear in Vibe-Kanban: http://localhost:4000

### Option B: OpenAI/Anthropic

1. Open http://localhost:8081
2. Settings → Providers → Add API key
3. Chat to generate tasks

---

## Development Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Open WebUI     │────▶│  Vibe-Kanban    │────▶│  code-server    │
│  (AI Chat)      │     │  (Task Board)   │     │  (IDE)          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      Generate Tasks      Track Progress          Write Code
```

### Step 1: Plan

Open WebUI → "Create tasks for building X"

### Step 2: Track

Vibe-Kanban → Drag tasks across lanes

### Step 3: Code

code-server → Write and test code

### Step 4: Repeat

Open WebUI → "Break down task X into subtasks"

---

## Hot-Reload

Changes in `mcp-server/` auto-reload:

```bash
# Edit a file
vim mcp-server/index.js

# Changes auto-applied!
# Check logs: make dev-logs
```

---

## Debug

### MCP Server

```bash
# Chrome DevTools
chrome://inspect
```

Connect to: `ws://localhost:9230`

### View Logs

```bash
make dev-logs          # All services
make dev-logs SERVICE=mcp-server  # One service
```

---

## Test Changes

```bash
# Run tests
npm test

# E2E test
make test-e2e
```

---

## Common Tasks

### Add New API Endpoint

1. Edit `mcp-server/http/routes.js`
2. Add handler
3. Hot-reload applies changes
4. Test at http://localhost:4001

### Modify Task Schema

1. Edit `mcp-server/core/models.js`
2. Update migrations
3. Restart: `docker compose restart mcp-server`

### Add MCP Tool

1. Edit `mcp-server/config/tools.js`
2. Implement handler
3. Hot-reload applies

---

## Commands

```bash
make dev-up      # Start dev mode
make dev-down    # Stop dev mode
make dev-logs    # View logs
make dev         # Start with logs visible
make test        # Run tests
make test-e2e    # E2E tests
```

---

## Troubleshooting

**Port in use?**
```bash
# Change in .env
DEV_PORT_START=3200
DEV_PORT_END=3300
```

**Hot-reload not working?**
```bash
# Check logs
make dev-logs SERVICE=mcp-server

# Restart
make dev-down && make dev-up
```

---

**Need more?** See [Development Guide](../06-development/01-contributing.md)
