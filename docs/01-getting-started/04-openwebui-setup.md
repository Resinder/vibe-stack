# Open WebUI First-Time Setup Guide

Complete guide for configuring Open WebUI with Vibe Stack MCP Server.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Step 1: Access Open WebUI](#step-1-access-open-webui)
- [Step 2: Configure AI Provider](#step-2-configure-ai-provider)
- [Step 3: Connect MCP Server](#step-3-connect-mcp-server)
- [Step 4: Verify Connection](#step-4-verify-connection)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

After starting Vibe Stack:
```bash
make up
```

Open WebUI will be available at: **http://localhost:8081**

**Complete setup time:** 3-5 minutes

---

## Step 1: Access Open WebUI

### 1.1 Open Browser

Navigate to: **http://localhost:8081**

### 1.2 Create Admin Account

First time users see the setup screen:

```
┌─────────────────────────────────────┐
│  Welcome to Open WebUI              │
│                                     │
│  Create your admin account:         │
│                                     │
│  Name:     [Your Name]              │
│  Email:    [your@email.com]         │
│  Password: [••••••••••••]            │
│                                     │
│  [Create Account]                   │
└─────────────────────────────────────┘
```

**Important:**
- Save your credentials securely
- This account has full administrative access
- You can create additional user accounts later

---

## Step 2: Configure AI Provider

Open WebUI supports multiple AI providers. Choose one:

### Option A: OpenAI (Recommended)

1. **Click Settings** (gear icon ⚙️ top-right)
2. **Navigate to:** Settings → Providers → OpenAI
3. **Enter your API key:**
   ```
   sk-proj-your-openai-api-key-here
   ```
4. **Select model:**
   - **GPT-4** - Best for complex tasks (Recommended)
   - **GPT-4 Turbo** - Faster, good for most tasks
   - **GPT-3.5 Turbo** - Fastest, cost-effective
5. **Click "Save"**

### Option B: Anthropic Claude

1. **Navigate to:** Settings → Providers → Anthropic
2. **Enter your API key:**
   ```
   sk-ant-your-claude-api-key-here
   ```
3. **Select model:**
   - **Claude Opus** - Best for complex reasoning
   - **Claude Sonnet** - Balanced performance
   - **Claude Haiku** - Fastest, cost-effective
4. **Click "Save"**

### Option C: Ollama (Local/Free)

1. **Install Ollama first:** https://ollama.ai/
2. **Pull a model:**
   ```bash
   ollama pull llama2
   # or
   ollama pull mistral
   ```
3. **In Open WebUI:** Settings → Providers → Ollama
4. **Click "Connect"**
5. **Select model** from dropdown

### Option D: Z.ai (GLM-4 - Chinese)

See: [Z.ai Integration Guide](../04-api/08-zai-integration.md)

---

## Step 3: Connect MCP Server

The MCP Server provides task management tools to Open WebUI.

### 3.1 Access MCP Server Settings

1. **Open Settings** (gear icon ⚙️)
2. **Navigate to:** Settings → MCP Servers
3. **Click "Add MCP Server"**

### 3.2 Configure MCP Connection

**Method 1: STDIO (Recommended for Docker)**

```
┌─────────────────────────────────────┐
│  Add MCP Server                     │
│                                     │
│  Name:        [Vibe Stack]           │
│  Type:        [STDIO ▼]              │
│  Command:     [docker exec -i       │
│               vibe-mcp-server       │
│               node /app/index.js]   │
│                                     │
│  [Test Connection]                  │
│  [Save]                             │
└─────────────────────────────────────┘
```

**Important Notes:**
- Use container name: `vibe-mcp-server`
- Command must use: `docker exec -i`
- Path: `/app/index.js` (inside container)

**Method 2: HTTP (Alternative)**

If STDIO doesn't work, use HTTP:

```
┌─────────────────────────────────────┐
│  Add MCP Server                     │
│                                     │
│  Name:        [Vibe Stack HTTP]     │
│  Type:        [HTTP ▼]              │
│  URL:         [http://localhost:   │
│               4001/mcp]            │
│                                     │
│  [Test Connection]                  │
│  [Save]                             │
└─────────────────────────────────────┘
```

### 3.3 Test Connection

After clicking "Test Connection", you should see:

```
✓ Connection successful!
  Server: Vibe Stack MCP Server
  Version: 1.0.0
  Tools available: 90+
```

If it fails, see: [Troubleshooting](#troubleshooting)

---

## Step 4: Verify Connection

### 4.1 Create Test Chat

1. **Click "+ New Chat"**
2. **Type your first task generation prompt:**
   ```
   Create a task plan for building a simple REST API
   ```

### 4.2 Verify MCP Tools Work

The AI should use MCP tools. You'll see:

```
🎯 Generated 8 tasks for "REST API"

📊 Summary:
  • Total: 8 tasks (~42 hours)
  • High priority: 5 tasks
  • Medium priority: 2 tasks
  • Low priority: 1 task

✨ Tasks added to Vibe-Kanban!
   View at: http://localhost:4000
```

### 4.3 Check Vibe-Kanban

Open: **http://localhost:4000**

You should see the AI-generated tasks in your Kanban board!

---

## Advanced Configuration

### Multiple AI Providers

Open WebUI supports using multiple providers simultaneously:

1. **Configure multiple providers** in Settings
2. **Switch between models** in chat interface
3. **Use model selector** dropdown (top of chat window)

### Custom Model Parameters

For advanced users, configure:

**Settings → Providers → [Your Provider] → Advanced:**

```json
{
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 0.9,
  "frequency_penalty": 0,
  "presence_penalty": 0
}
```

### MCP Server Tools Reference

Connected MCP server provides these tools:

| Tool | Description |
|------|-------------|
| `create_task` | Create a new task |
| `update_task` | Update existing task |
| `move_task` | Move task to different lane |
| `delete_task` | Delete a task |
| `search_tasks` | Search for tasks |
| `get_board_stats` | Get board statistics |
| `get_board_context` | Get board context for AI |
| `generate_plan` | Generate task plan from goal |
| `batch_create` | Create multiple tasks |
| `list_tools` | List available tools |

See: [MCP Tools Reference](../03-technical/04-mcp-tools.md)

---

## Troubleshooting

### MCP Server Connection Fails

**Problem:** "Connection failed" error

**Solutions:**

1. **Check if MCP server is running:**
   ```bash
   curl http://localhost:4001/health
   ```
   Should return:
   ```json
   {"status":"healthy","server":"vibe-stack-mcp","version":"1.0.0"}
   ```

2. **Verify container name:**
   ```bash
   docker ps | grep mcp
   ```
   Should show: `vibe-mcp-server`

3. **Check container logs:**
   ```bash
   docker logs vibe-mcp-server
   ```

4. **Try HTTP method instead of STDIO**

### AI Provider Not Working

**Problem:** API key errors or model not available

**Solutions:**

1. **Verify API key is correct**
2. **Check API key has credits/quota**
3. **Try different model**
4. **Check Open WebUI logs:**
   ```bash
   docker logs vibe-open-webui
   ```

### Tasks Not Appearing in Vibe-Kanban

**Problem:** AI says tasks created but not visible

**Solutions:**

1. **Refresh Vibe-Kanban page** (F5)
2. **Check bridge file:**
   ```bash
   cat .vibe-kanban-bridge.json
   ```
3. **Restart MCP server:**
   ```bash
   docker compose restart mcp-server
   ```
4. **Check Vibe-Kanban logs:**
   ```bash
   docker logs vibe-vibe-kanban
   ```

### Docker Command Not Working

**Problem:** `docker exec` command fails in STDIO mode

**Solutions:**

1. **Verify Docker is running:**
   ```bash
   docker ps
   ```

2. **Use full command path:**
   ```
   /usr/bin/docker exec -i vibe-mcp-server node /app/index.js
   ```

3. **Try HTTP method instead**

---

## Next Steps

After completing setup:

1. **[Generate Your First Tasks](#step-4-verify-connection)** - Create task plans
2. **[Learn Workflows](../02-user-guide/02-workflows.md)** - Common workflows
3. **[Vibe-Kanban Guide](../02-user-guide/01-user-guide.md)** - Using the Kanban board
4. **[Advanced MCP Usage](../03-technical/04-mcp-tools.md)** - Deep dive into MCP tools

---

## Quick Reference

### Essential URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Open WebUI** | http://localhost:8081 | Created during setup |
| **Vibe-Kanban** | http://localhost:4000 | None |
| **MCP Server** | http://localhost:4001 | None (health check) |

### Quick Commands

```bash
# Start all services
make up

# Check service health
make health

# View Open WebUI logs
docker logs vibe-open-webui -f

# Restart MCP server
docker compose restart mcp-server

# Test MCP connection
curl http://localhost:4001/health
```

### MCP Connection Template

**STDIO (Recommended):**
```
Name: Vibe Stack
Type: STDIO
Command: docker exec -i vibe-mcp-server node /app/index.js
```

**HTTP (Alternative):**
```
Name: Vibe Stack HTTP
Type: HTTP
URL: http://host.docker.internal:4001/mcp
```

---

**Need Help?** See:
- [FAQ](../02-user-guide/05-faq.md)
- [Troubleshooting Guide](../06-development/03-troubleshooting.md)
- [Remote Access Setup](../04-api/04-remote-access.md) (for external access)

---

**Last Updated:** 2026-01-29
**Open WebUI Version:** Latest
**MCP Server Version:** 1.0.0
