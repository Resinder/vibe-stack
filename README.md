# 🚀 Vibe Stack

> AI-powered development environment with Vibe-Kanban, Open WebUI, and code-server

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Vibe Stack** is a production-ready Docker environment that combines:

- **📋 Vibe-Kanban** - AI agent orchestration and task management
- **🤖 Open WebUI** - Chat interface for AI task planning
- **💻 code-server** - Browser-based VS Code
- **🧠 Claude Code** - AI coding assistant (optional)

**✨ New:** Chat in Open WebUI to generate intelligent task plans in Vibe-Kanban!

---

## Quick Start (2 minutes)

```bash
# 1. Clone and setup
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
./init.sh

# 2. Start services
make up

# 3. Open your browser
open http://localhost:4000  # Vibe-Kanban
open http://localhost:8081  # Open WebUI (AI Chat)
open http://localhost:8443  # code-server (VS Code)
```

**That's it!** You now have:
- ✅ AI task planning via chat
- ✅ Kanban board for project management
- ✅ Browser-based IDE for coding
- ✅ Real-time synchronization

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Vibe-Kanban** | 4000 | AI agent orchestration, task board |
| **Open WebUI** | 8081 | AI chat interface for task planning |
| **code-server** | 8443 | Browser-based VS Code |
| **MCP Server** | 4001 | API bridge for Open WebUI ↔ Vibe-Kanban |

---

## What You Can Do

### 🤖 AI Task Planning (NEW!)

Open Open WebUI (http://localhost:8081) and chat:

```
You: Create a task plan for implementing OAuth authentication

AI: 🎯 Generated 10 tasks for "OAuth authentication"

📊 Summary:
  • Total: 10 tasks (~54 hours)
  • High priority: 6 tasks
  • Medium priority: 3 tasks
  • Low priority: 1 task

📋 Tasks created in Vibe-Kanban!
```

**Patterns detected automatically:**
- Authentication → 8 tasks
- Database → 7 tasks
- API → 10 tasks
- Frontend → 9 tasks
- Testing → 7 tasks
- Deployment → 9 tasks

### 📋 Kanban Board

- Drag-and-drop task management
- 5 lanes: Backlog, Todo, In Progress, Done, Recovery
- Real-time sync with Open WebUI

### 💻 Browser IDE

- Full VS Code in your browser
- Git integration
- Extension support

---

## Makefile Commands

```bash
# Start/Stop
make up              # Start all services
make down            # Stop all services
make restart         # Restart services

# Monitoring
make logs            # Follow all logs
make health          # Check service health
make stats           # Resource usage

# Open WebUI
make webui           # Open Open WebUI (AI chat)
make observer        # Open Observer Dashboard

# AI Integration
make mcp-test        # Test MCP server
make mcp-tools       # List available AI tools
make mcp-plan        # Test task generation

# Updates
make update          # Update all images with rolling restart
make evolve          # Run evolution analysis
make rollback        # Rollback to previous version

# Diagnostics
make doctor          # Full diagnostics check
make test-harness    # Run immune system validation
```

---

## Configuration

### Environment (.env)

```bash
# code-server password (required)
CODE_SERVER_PASSWORD=your-password

# Optional ports
VIBE_PORT=4000
CODE_SERVER_PORT=8443
OPEN_WEBUI_PORT=8081
```

### Claude Settings (Optional)

For Claude Code integration:

```bash
mkdir -p agents/claude
cat > agents/claude/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-your-key",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  }
}
EOF
```

**Or use GLM-4/Z.ai:**
```bash
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-z-ai-key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_MODEL": "glm-4.7"
  }
}
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [GUIDE.md](docs/GUIDE.md) | Complete user guide |
| [OPENWEBUI.md](docs/OPENWEBUI.md) | Open WebUI setup & examples |
| [API.md](docs/API.md) | MCP server API reference |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vibe Stack                          │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │  Open WebUI  │────▶│  MCP Server  │◀────│ Vibe-Kanban │  │
│  │  AI Chat     │     │  (Tools)     │     │ Task Board  │  │
│  │  Port 8081   │     │  Port 4001   │     │ Port 4000   │  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
│         │                                         │         │
│         └─────────────────┬─────────────────────┘         │
│                           ▼                               │
│                    ┌──────────────┐                        │
│                    │ code-server  │                        │
│                    │  VS Code     │                        │
│                    │  Port 8443   │                        │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User chats in Open WebUI: "Create plan for OAuth"
2. MCP server processes request
3. Tasks generated in Vibe-Kanban (instantly visible)
4. User works on tasks in code-server

---

## Project Structure

```
vibe-stack/
├── docker-compose.yml          # Service orchestration
├── Makefile                    # CLI commands
├── init.sh                     # Setup script
├── .env                        # Environment variables
│
├── mcp-server/                 # Open WebUI integration
│   └── enhanced/
│       ├── index.js           # MCP server (10 tools)
│       ├── package.json
│       └── Dockerfile
│
├── open-webui-custom/          # Custom UI panels
│   └── kanban-panel.html       # Kanban board view
│
├── observer-dashboard/         # System monitoring
│   └── index.html
│
├── agents/claude/              # Claude Code config
│
├── docs/                       # Documentation
│   ├── GUIDE.md
│   ├── OPENWEBUI.md
│   ├── API.md
│   └── ARCHITECTURE.md
│
└── .vibe-kanban-bridge.json   # Board state (synced)
```

---

## Troubleshooting

### Services not starting?

```bash
make doctor              # Run diagnostics
docker compose logs     # Check logs
```

### Open WebUI not connecting to Vibe?

```bash
# Check MCP server
curl http://localhost:4001/health

# Restart MCP server
docker compose restart mcp-server
```

### Port conflicts?

Edit `.env`:
```bash
VIBE_PORT=5000        # Change Vibe-Kanban port
CODE_SERVER_PORT=9443  # Change code-server port
```

---

## Requirements

- Docker 20.10+
- Docker Compose v2.0+
- Git
- 8GB RAM minimum
- 10GB disk space

---

## License

MIT License - see [LICENSE](LICENSE) file

---

## Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)

---

**Made with ❤️ for AI-powered development**
