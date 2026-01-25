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
| Open WebUI | http://localhost:8081 | Configure in UI |

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
| vibe-kanban | `node:20-slim` | 2.0 cores | 2GB | HTTP /api/health |
| code-server | `codercom/code-server:latest` | 1.0 core | 1GB | HTTP /health |
| open-webui | `ghcr.io/open-webui/open-webui:main` | 1.0 core | 1GB | HTTP /health |

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
make logs-webui     # Follow open-webui logs
make watch-logs     # Watch for errors/fatal events
make health         # Check service health
make stats          # Resource usage

# Container access
make shell-vibe     # Enter Vibe-Kanban container
make shell-code     # Enter code-server container
make claude         # Quick Claude Code CLI access
make webui          # Open Open WebUI in browser

# Version & evolution
make versions       # Show current image versions
make evolve         # Run self-evolution analysis
make test-harness   # Run immune system validation
make rollback       # Rollback to previous version
make update         # Orchestrated self-update with rolling restart

# Mission state
make state-show     # Show current mission state
make state-clear    # Clear mission state
make state-resume   # Resume interrupted mission

# Maintenance
make restart        # Restart services
make clean          # Remove stopped containers
make prune          # Remove unused Docker resources
make reset          # Full reset (WARNING: deletes data)
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

## System Lifecycle

### The Evolutionary Loop

Vibe Stack implements a **Self-Evolving Architect** pattern—a living, breathing organism that monitors its own state and collaborates with human operators to continuously improve.

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE EVOLUTIONARY LOOP                        │
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  THE STACK      │    │  THE ARCHITECT  │    │  THE LEAD    │ │
│  │  (System)       │    │  (AI Assistant)  │    │  (Human)     │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬───────┘ │
│           │                      │                     │         │
│           │  1. MONITOR          │                     │         │
│           ├──────────────────────┼─────────────────────┤         │
│           │  • Health status     │                     │         │
│           │  • Resource usage    │                     │         │
│           │  • Image versions    │                     │         │
│           │                      │                     │         │
│           │  2. PROPOSE          │                     │         │
│           ├─────────────────────>│                     │         │
│           │  "make evolve"       │                     │         │
│           │  output              │                     │         │
│           │                      │                     │         │
│           │                      │  3. ANALYZE         │         │
│           │                      ├─────────────────────┤         │
│           │                      │  • Review proposals │         │
│           │                      │  • Research options │         │
│           │                      │  • Identify patterns│         │
│           │                      │                     │         │
│           │                      │  4. RECOMMEND       │         │
│           │                      ├────────────────────>│         │
│           │                      │  Evolution options  │         │
│           │                      │  with trade-offs    │         │
│           │                      │                     │         │
│           │                      │                     │  5. VISION│
│           │                      │                     ├─────────┤
│           │                      │                     │ Strategic│
│           │                      │                     │ direction│
│           │                      │                     │         │
│           │                      │  6. APPROVE         │         │
│           │                      │<────────────────────┤         │
│           │                      │  Execute or refine  │         │
│           │                      │                     │         │
│           │                      │  7. IMPLEMENT       │         │
│           │<─────────────────────┤                     │         │
│           │  Apply changes       │                     │         │
│           │  Update configs      │                     │         │
│           │                      │                     │         │
│           │  8. EVOLVE           │                     │         │
│           ├──────────────────────┴─────────────────────┤         │
│           │  System improves, cycle repeats            │         │
│           └─────────────────────────────────────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Shared Responsibilities

**The Stack (System) - Monitors and Proposes:**
- Runs `make evolve` to analyze current state
- Detects resource pressure, image updates, configuration issues
- Generates structured evolution proposals
- Tracks version history for rollback capability

**The Architect (AI Assistant) - Analyzes and Executes:**
- Interprets evolution proposals
- Researches solutions and best practices
- Implements approved changes
- Audits implementation quality

**The Lead (Human) - Provides Vision:**
- Sets strategic direction
- Approves or refines proposals
- Makes final decisions on major changes
- Defines success criteria

Vibe Stack implements a **Self-Evolving Architect** pattern, where the system monitors its own state and collaborates with human operators to continuously improve.

### Human-AI Collaboration

The Vibe Stack lifecycle represents a partnership between:

- **Project Lead (Human)**: Strategic direction, requirements, approval
- **Lead Architect (AI)**: Analysis, recommendations, implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vibe Stack Lifecycle                         │
│                                                                   │
│  1. ANALYZE                                                       │
│     ├─ Human: "I need X feature or I see Y problem"              │
│     └─ AI: Scan codebase, identify patterns, research solutions   │
│                                                                   │
│  2. PROPOSE                                                       │
│     ├─ AI: Generate evolution proposal with options              │
│     └─ Human: Review, ask questions, provide feedback            │
│                                                                   │
│  3. APPROVE                                                       │
│     ├─ Human: Select approach or request modifications            │
│     └─ AI: Adjust proposal based on feedback                     │
│                                                                   │
│  4. EXECUTE                                                       │
│     ├─ AI: Implement approved changes                            │
│     └─ Human: Monitor progress, review results                   │
│                                                                   │
│  5. AUDIT                                                         │
│     ├─ AI: Self-check implementation for quality                 │
│     └─ Human: Final review and testing                           │
│                                                                   │
│  6. EVOLVE                                                        │
│     └─ Cycle repeats with continuous improvement                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Self-Evolution Engine

The `evolve.sh` script provides automated system analysis:

```bash
# Run evolution analysis
make evolve

# Or directly
./evolve.sh

# Auto-apply safe recommendations
./evolve.sh --auto-apply

# Show detailed analysis data
./evolve.sh --verbose
```

### Analysis Categories

**1. System Health**
- Container health status via Docker inspect
- Service availability and response times
- Dependency chain validation

**2. Resource Usage**
- CPU and memory consumption per container
- Comparison against configured limits
- Optimization recommendations

**3. Image Version Tracking**
- Current image digest comparison
- Detection of :latest image updates
- Rollback guidance for breaking changes

**4. Configuration Audit**
- .env file validation
- API key format checking
- docker-compose.yml syntax verification

### Evolution Proposal Output

```
System Evolution Proposal
═══════════════════════════════════════════════════════════════

System Health Assessment:
  ● All systems operational

Resource Optimization:
  ✓ Resource usage within acceptable limits

Image Update Status:
  ⚠ New images detected

  Recommended Actions:
    • Review 'make versions' output for digest changes
    • Test services: 'make up && make health'
    • Monitor logs: 'make watch-logs'
    • Rollback if needed: 'make rollback'

Configuration Status:
  ✓ Configuration valid

Evolution Score:
  🌟 System Optimal - No evolution needed
```

### Continuous Improvement Workflow

**Daily/Weekly Maintenance:**
```bash
# Check system health
make health

# Review resource usage
make stats

# Run evolution analysis
make evolve

# Monitor for errors
make watch-logs
```

**After Image Updates:**
```bash
# Pull latest images
make update

# Review version changes
make versions

# Test services
make health

# Monitor for issues
make watch-logs
```

**When Issues Detected:**
```bash
# Run full diagnostics
make doctor

# Check evolution recommendations
make evolve

# Review logs for errors
make logs-vibe | grep -i error
make logs-webui | grep -i error
```

### Evolution Score Interpretation

| Score | Meaning | Action Required |
|-------|---------|-----------------|
| 🌟 System Optimal | All checks passing | Continue monitoring |
| ⚠ Minor improvements | 1-2 recommendations | Review when convenient |
| 🔴 Attention needed | 3+ issues | Immediate review required |

### Best Practices

1. **Regular Evolution Checks**: Run `make evolve` weekly or after major changes
2. **Version Tracking**: Review `make versions` before pulling updates
3. **Proactive Monitoring**: Use `make watch-logs` during development
4. **Backup Before Updates**: Always backup volumes before `make update`
5. **Rollback Preparation**: Keep `.vibe-versions.log` for quick rollback

---

## Immune System & Self-Correction

Vibe Stack implements an **Immune System** that validates all changes before allowing them to affect the production system, and a **Memory System** that enables resumption of interrupted tasks.

### The Self-Correcting Protocol

**Rule:** From now on, all system changes must follow this protocol:

```
1. BRANCH     - Create temporary evolution/test-check branch
2. VALIDATE   - Run syntax checks and dry-run containers
3. VERIFY     - Perform health checks on all services
4. MERGE      - Only if tests pass, merge to main. Else abort.
```

### Immune System (test-harness.sh)

The test harness validates changes before they affect your system:

```bash
# Run full immune system validation with auto-branch
./test-harness.sh --task "Add Postgres service"

# Skip branch creation (for CI/CD or manual validation)
./test-harness.sh --skip-branch
```

**What the Immune System Checks:**

| Check | Description | Action on Failure |
|-------|-------------|-------------------|
| **Syntax** | docker-compose.yml, shell scripts, Makefile | Abort with "Immune Response" |
| **Dry Run** | Start containers and verify they run | Abort and clean up containers |
| **Health** | All services must pass health checks | Abort with unhealthy service list |

**Immune Response Example:**
```
╔════════════════════════════════════════════════════════════╗
║  IMMUNE RESPONSE TRIGGERED                                 ║
║  Change rejected: docker-compose.yml syntax error          ║
╚════════════════════════════════════════════════════════════╝

Details logged to: immune-response-20250125-101500.log
```

### Memory System (.vibe-state.json)

The stack remembers its mission progress and can resume after interruption:

```bash
# Show current mission state
make state-show

# Clear completed mission
make state-clear

# Resume interrupted mission
make state-resume
```

**State File Structure:**
```json
{
  "mission": {
    "title": "Add Postgres service",
    "status": "active",
    "phase": "Execution"
  },
  "progress": {
    "current_step": 3,
    "step_name": "Update docker-compose.yml",
    "percent_complete": 42
  },
  "steps_pending": [
    { "step": 4, "name": "Run test-harness validation" },
    { "step": 5, "name": "Perform rolling restart" }
  ]
}
```

**Startup Resumption:**
When you run `./init.sh`, it checks for `.vibe-state.json`. If found:
```
╔════════════════════════════════════════════════════════════╗
║  SYSTEM WAS INTERRUPTED DURING MISSION                    ║
╚════════════════════════════════════════════════════════════╝

Mission: Add Postgres service
Progress: Step 3 - Update docker-compose.yml
Complete: 42%

Resumption Options:
  1. Resume      - Continue from step 3
  2. View Details - Show full mission state
  3. Abort        - Clear state and start fresh
```

### Orchestrated Self-Update

The enhanced `make update` command now performs a safe rolling restart:

```bash
make update
```

**What happens:**
1. **Snapshot** - Logs current versions to `.vibe-versions.log`
2. **Pull** - Downloads latest `:latest` images
3. **Rolling Restart** - Restarts services one at a time
4. **Health Verification** - Waits up to 60s for each service to become healthy
5. **Auto-Rollback** - If any service fails health check, triggers emergency rollback

**Rolling Restart Flow:**
```
Restarting vibe-kanban...
Waiting for vibe-kanban health check...
✓ vibe-kanban is healthy

Restarting code-server...
Waiting for code-server health check...
✓ code-server is healthy

Restarting open-webui...
Waiting for open-webui health check...
✓ open-webui is healthy

✓ All services restarted successfully
```

### Emergency Rollback

If an update fails, the system automatically rolls back:

```bash
# Manual rollback trigger
make rollback-emergency
```

**Rollback Process:**
- Stops all services
- Checks `.vibe-versions.log` for previous working digests
- Restarts with current images
- Prompts manual verification with `make health`

### AI-Assisted Complex Tasks

The Immune System and Memory enable the AI assistant to handle complex multi-step operations:

**Example Workflow:**
```
Human: "Update the entire stack and add a Postgres service"

AI: "I am now branching to verify this change.
     I will run the test-harness before suggesting a final merge."

1. Creates .vibe-state.json with mission tracking
2. Creates evolution/test-check branch
3. Updates docker-compose.yml with Postgres
4. Runs test-harness (validate, dry-run, health check)
5. If tests pass: Presents merge request
6. If tests fail: Auto-aborts with "Immune Response"
```

**Resumption After Interruption:**
- If the AI connection is lost during step 3, the state is preserved
- On reconnection, AI reads `.vibe-state.json` and resumes from step 3
- No progress is lost

---

## Troubleshooting & Knowledge Base

This section documents issues encountered during system evolution and their resolutions.

### code-server Health Check Failing (HTTP 401)

**Symptom:**
```
code-server container shows as "unhealthy"
Health check returns: curl: (22) The requested URL returned error: 401
```

**Root Cause:** The code-server `/health` endpoint requires authentication.

**Resolution:** Update `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/"]  # Use root endpoint
```

### Port 3000 Conflict

**Symptom:** `Port 3000 is already allocated`

**Root Cause:** vibe-kanban port range `3000-3100` conflicts with open-webui.

**Resolution:** Open WebUI moved to port **8081**. Access at `http://localhost:8081`

### Immune Response Triggered

**Symptom:** `IMMUNE RESPONSE TRIGGERED - Change rejected`

**Explanation:** The Self-Correcting Protocol detected a problem and protected main.

**Action:** Read the immune response log, fix the issue, and re-run `make test-harness`.

### Missing .env File

**Resolution:**
```bash
cp .env.example .env
nano .env  # Set your CODE_SERVER_PASSWORD
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
