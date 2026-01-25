# 🚀 Vibe Stack

> Production-ready Docker orchestration for AI-powered development environments

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Make](https://img.shields.io/badge/Build-Makefile-blue?logo=gnu-make)](Makefile)

Vibe Stack combines **Vibe-Kanban** (AI agent orchestration), **Claude Code** (AI coding assistant), and **code-server** (browser-based VS Code) into a unified, containerized development environment.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0+ (or docker-compose v1.29+)
- [Git](https://git-scm.com/)
- [Anthropic/Claude Account](https://console.anthropic.com/) for API access

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/halilbarim/vibe-stack.git
cd vibe-stack

# 2. Run the initialization script
./init.sh

# 3. Edit configuration files
#    - Set your password in .env
#    - Add your API key in agents/claude/settings.json

# 4. Start all services
make up
```

### First-Time Claude Authentication

```bash
make claude
```

Follow the prompts to authenticate with your Anthropic account.

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Vibe-Kanban | http://localhost:4000 | - |
| VS Code | http://localhost:8443 | Password from `.env` |

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vibe Stack                              │
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  Vibe-Kanban     │◄──────►│  Claude Code     │              │
│  │  (Port 4000)     │        │  AI Agent        │              │
│  │                  │        │                  │              │
│  │  • Orchestration │        │  • Code Editing  │              │
│  │  • Task Mgmt     │        │  • Refactoring   │              │
│  │  • AI Workflows  │        │  • Debugging     │              │
│  └────────┬─────────┘        └──────────────────┘              │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                              │
│  │   code-server    │                                              │
│  │   (Port 8443)    │                                              │
│  │                  │                                              │
│  │  • Browser IDE   │                                              │
│  │  • Git Access    │                                              │
│  │  • Extensions    │                                              │
│  └──────────────────┘                                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐        │
│  │                   Shared Workspace                    │        │
│  │                  /repos (bind mount)                  │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Project Repository** → Mounted at `/repos` in both containers
2. **Vibe-Kanban** orchestrates AI agents and manages tasks
3. **Claude Code** executes code changes via AI commands
4. **code-server** provides browser-based IDE access
5. **Secrets** isolated in `/root/secrets` (inaccessible to AI agent)

### Security Isolation

| Component | Access Level | Purpose |
|-----------|--------------|---------|
| `/root/secrets/` | Root only | Project secrets (API keys, DB creds) |
| `/home/node/.claude` | Node user | Claude configuration (requires API access) |
| `~/.ssh` | Read-only | Git SSH authentication |
| `/repos` | Both | Shared workspace |

### Container Specifications

| Service | Image | CPU Limit | Memory | Health Check |
|---------|-------|-----------|--------|--------------|
| vibe-kanban | `node:20.18.0-slim` | 2.0 cores | 2GB | HTTP /api/health |
| code-server | `codercom/code-server:4.23.0` | 1.0 core | 1GB | HTTP /health |

---

## Features

### 🤖 AI Agent Orchestration
- **Vibe-Kanban**: Task management and AI workflow coordination
- **Claude Code Integration**: Advanced AI-powered code editing
- **Multi-Model Support**: Anthropic Claude, GLM-4 via z.ai proxy

### 💻 Browser-Based Development
- **VS Code in Browser**: Full IDE experience via code-server
- **Hot Reload**: Automatic dev server restarts
- **Extension Support**: Install your favorite VS Code extensions

### 🔒 Security Best Practices
- **Secret Isolation**: Project secrets inaccessible to AI agents
- **Read-Only SSH**: Secure Git operations without key exposure
- **Resource Limits**: CPU/memory constraints prevent runaway processes

### 📦 Persistent Data
- **Volume Management**: Data survives container restarts
- **Configuration Persistence**: Settings preserved across updates
- **Project Snapshots**: Easy backup and restore

### 🛠️ Developer Experience
- **One-Command Setup**: `./init.sh` handles all configuration
- **Makefile Commands**: Simple CLI for common operations
- **Health Monitoring**: Built-in service health checks

---

## Configuration

### Environment Variables (.env)

```bash
# Required: code-server password
CODE_SERVER_PASSWORD=your-secure-password

# Optional: Port configuration
VIBE_PORT=4000
CODE_SERVER_PORT=8443

# Optional: Resource overrides
VIBE_CPU_LIMIT=2.0
VIBE_MEMORY_LIMIT=2G
```

### Claude Configuration (agents/claude/settings.json)

**Standard Anthropic API:**
```json
{
  "hasAcknowledgedDangerousSkipPermissions": true,
  "hasCompletedOnboarding": true,
  "theme": "dark",
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-your-key-here",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "API_TIMEOUT_MS": "3000000"
  }
}
```

**GLM-4 via z.ai Proxy:**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-z-ai-api-key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

### Project Secrets

Create project-specific environment files:

```bash
# 1. Create secrets directory
mkdir -p secrets/my-project

# 2. Add environment files
cp secrets/your-project/example.env secrets/my-project/.env.development
cp secrets/your-project/example.env secrets/my-project/.env.production

# 3. Edit with your values
nano secrets/my-project/.env.development
```

Files are automatically copied to:
- `/repos/my-project/.env.development.local`
- `/repos/my-project/.env.production.local`

---

## Usage

### Makefile Commands

```bash
# Quick start
make setup          # First-time setup
make up             # Start all services
make down           # Stop all services

# Monitoring
make logs           # Follow all logs
make logs-vibe      # Follow Vibe-Kanban logs
make logs-code      # Follow code-server logs
make health         # Check service health
make stats          # Resource usage

# Container access
make shell-vibe     # Enter Vibe-Kanban container
make shell-code     # Enter code-server container
make claude         # Quick Claude Code CLI access

# Maintenance
make restart        # Restart services
make update         # Pull latest images
make clean          # Remove stopped containers
make doctor         # Diagnostics check

# Development
make dev            # Start with visible logs
make build          # Rebuild containers
```

### Common Workflows

**Starting Development:**
```bash
cd ~/vibe-stack
make up
make health         # Verify services are running
make open           # Open in browser
```

**Adding a New Project:**
```bash
# Clone project into repos
git clone https://github.com/user/repo.git repos/my-project

# Add secrets
mkdir -p secrets/my-project
nano secrets/my-project/.env.development

# Restart to apply secrets
make restart vibe-kanban
```

**Viewing Logs:**
```bash
make logs           # All services
make logs-vibe      # Vibe-Kanban only
make logs-tail      # Last 50 lines
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Problem:** Services fail to start with "port already in use" error

**Solution:**
```bash
# Check what's using the port
lsof -i :4000      # Vibe-Kanban
lsof -i :8443      # code-server

# Stop conflicting service or change ports in .env
```

#### Container Health Check Failing

**Problem:** Services show as "unhealthy"

**Solution:**
```bash
# Check container logs
make logs-vibe

# Restart services
make restart

# If persistent, rebuild
make down
make build
make up
```

#### Claude Code Authentication Lost

**Problem:** Claude CLI asks for re-authentication after `docker-compose down -v`

**Solution:**
```bash
# Re-authenticate
make claude

# Or use persistent settings
cp agents/claude/settings.json.example agents/claude/settings.json
# Edit with your API key
```

#### Out of Memory Errors

**Problem:** Containers crash with OOM errors

**Solution:**
```bash
# Check current limits
docker stats

# Adjust in .env
VIBE_MEMORY_LIMIT=4G
CODE_MEMORY_LIMIT=2G

# Or adjust in docker-compose.yml directly
```

#### File Permission Issues

**Problem:** "Permission denied" errors in repos/

**Solution:**
```bash
# Fix permissions from host
sudo chown -R $USER:$USER repos/

# Or from container
make shell-vibe
chown -R node:node /repos
```

### Getting Help

```bash
make doctor         # Run diagnostics
make help           # Show all commands

# Check logs
make logs-vibe | grep -i error
make logs-code | grep -i error

# Verify configuration
docker-compose config
```

---

## Documentation

- **[HELPER.md](HELPER.md)** - Docker command reference
- **[Makefile](Makefile)** - All available commands (`make help`)
- **[agents/claude/settings.json.example](agents/claude/settings.json.example)** - Claude configuration template

---

## Advanced Usage

### AI Model Provider Selection

Vibe Stack supports multiple AI providers. Choose between **Anthropic Claude** or **GLM-4 (Zhipu AI)** based on your needs.

#### Option 1: Anthropic Claude (Default)

**Best for:** English-language development, complex reasoning, production applications

```bash
# Use the default Claude configuration
cp agents/claude/settings.json.example agents/claude/settings.json

# Edit with your Anthropic API key
nano agents/claude/settings.json
```

**Configuration:**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-your-key-here",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  }
}
```

**Get your API key:** https://console.anthropic.com/

---

#### Option 2: GLM-4 / Zhipu AI (BigModel)

**Best for:** Cost-effective development, Chinese-language support, fast inference

```bash
# Use the GLM-4 configuration template
cp agents/claude/settings.glm4.json.example agents/claude/settings.json

# Edit with your Zhipu AI API key
nano agents/claude/settings.json
```

**Configuration:**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-zhipu-ai-api-key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4-plus"
  }
}
```

**Get your API key:** https://open.bigmodel.cn/usercenter/apikeys

---

#### Model Comparison

| Use Case | Claude (Default) | GLM-4 (Zhipu AI) |
|----------|------------------|-------------------|
| **Quick Tasks** | Haiku | GLM-4-Air |
| **General Coding** | Sonnet 3.5 | GLM-4-Flash |
| **Complex Tasks** | Opus / Sonnet 3.5 | GLM-4-Plus |
| **Cost** | Higher | Lower |
| **Language** | English | Chinese/English |
| **Speed** | Fast | Very Fast |

---

#### Quick Switch Between Providers

```bash
# Switch to Claude
cp agents/claude/settings.json.example agents/claude/settings.json
# Edit with Claude API key
make restart

# Switch to GLM-4
cp agents/claude/settings.glm4.json.example agents/claude/settings.json
# Edit with Zhipu AI API key
make restart
```

---

### Custom Proxy Configuration

To use a different proxy or self-hosted endpoint:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-api-key",
    "ANTHROPIC_BASE_URL": "https://your-proxy.example.com/api/anthropic",
    "API_TIMEOUT_MS": "3000000"
  }
}
```

---

### Environment Variable Override

You can override model selection via environment variables in `agents/claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4-plus"
  }
}
```

---

### Backup and Restore

**Backup:**
```bash
# Export volumes
docker run --rm -v vibe-stack_vibe_config:/data -v $(pwd):/backup alpine tar czf /backup/vibe-config.tar.gz -C /data .
docker run --rm -v vibe-stack_vibe_data:/data -v $(pwd):/backup alpine tar czf /backup/vibe-data.tar.gz -C /data .
docker run --rm -v vibe-stack_code_server_data:/data -v $(pwd):/backup alpine tar czf /backup/code-server.tar.gz -C /data .
```

**Restore:**
```bash
# Import volumes
docker run --rm -v vibe-stack_vibe_config:/data -v $(pwd):/backup alpine tar xzf /backup/vibe-config.tar.gz -C /data
docker run --rm -v vibe-stack_vibe_data:/data -v $(pwd):/backup alpine tar xzf /backup/vibe-data.tar.gz -C /data
docker run --rm -v vibe-stack_code_server_data:/data -v $(pwd):/backup alpine tar xzf /backup/code-server.tar.gz -C /data
```

### Development Mode

For active development on Vibe Stack itself:

```bash
# Start with logs visible
make dev

# Rebuild after changes
make build
make up
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/vibe-stack.git
cd vibe-stack

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
make up
make health

# Submit PR
```

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Support

- 📖 **Documentation**: [README.md](README.md), [HELPER.md](HELPER.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/halilbarim/vibe-stack/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/halilbarim/vibe-stack/discussions)

---

**Made with ❤️ for AI-powered development**
