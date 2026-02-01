# 🚀 Vibe Stack

> AI-powered development environment with Vibe-Kanban, Open WebUI, code-server, and PostgreSQL

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![Tests](https://img.shields.io/badge/Tests-309%20Passing-brightgreen)](https://github.com/Resinder/vibe-stack)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1%2E1%2E8-orange)](https://github.com/Resinder/vibe-stack)

> **🍴 Forked from [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack)** | **319 Tests (309 passing)** | **Production Ready**

---

## 🙏 Acknowledgments

This project is a fork of the original [Vibe Stack](https://github.com/halilbarim/vibe-stack) by [Halil Barım](https://github.com/halilbarim).

Thank you Halil for creating this amazing project and sharing it with the community!

**Please visit the original repository:** [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack) ⭐

---

**Vibe Stack** is a production-ready Docker environment that combines:

- **📋 Vibe-Kanban** - AI agent orchestration and task management
- **🤖 Open WebUI** - Chat interface for AI task planning
- **💻 code-server** - Browser-based VS Code
- **🧠 Claude Code** - AI coding assistant (optional)
- **🗄️ PostgreSQL** - Reliable state management
- **📊 Monitoring** - Prometheus + Grafana dashboards

**✨ v1.0.0 Features (Fork Release):**

- 🏗️ **Clean Architecture** - Modular 5-layer design
- 🗄️ **PostgreSQL Storage** - Async, non-blocking state management with caching
- 🔒 **Credential Management** - AES-256-GCM encrypted GitHub token storage
- 🔒 **Rate Limiting** - Tiered protection for API endpoints
- 📊 **Monitoring** - Prometheus metrics + Grafana dashboards
- 🧪 **E2E Testing** - Comprehensive Docker deployment tests (270+ tests)
- 📐 **Architecture Diagrams** - Mermaid.js documentation
- ⚡ **High Performance** - Connection pooling, caching, async I/O
- 🔐 **Security First** - Input sanitization, path traversal prevention
- 🔄 **WebSocket Support** - Real-time task synchronization
- 📝 **Test Coverage Dashboard** - HTML coverage visualization

---

## ✨ Key Features

### 🤖 AI-Powered Task Planning

- **Pattern Detection**: Automatically recognizes project types
- **Intelligent Estimates**: Realistic time estimates
- **Multi-Model Support**: OpenAI, Anthropic, Ollama, custom LLMs

### 📋 Kanban Task Management

- **5-Lane Board**: Backlog, Todo, In Progress, Done, Recovery
- **Real-time Sync**: Instant updates via PostgreSQL
- **Rich Metadata**: Priority, hours, tags, AI badges

### 💻 Browser-Based Development

- **Full VS Code**: Complete IDE in browser
- **Git Integration**: Commit, push, pull
- **Hot Reload**: Auto dev server management

### 🗄️ PostgreSQL State Management

- **Async Operations**: Non-blocking database I/O
- **Connection Pooling**: Efficient resource usage
- **Data Persistence**: Reliable storage with audit trail
- **Caching**: 5-second TTL for frequently accessed data

### 📊 Monitoring Stack

- **Prometheus**: Metrics collection and storage
- **Grafana**: Real-time dashboards
- **AlertManager**: Alert routing and management
- **Node Exporter**: System metrics
- **cAdvisor**: Container metrics

---

## Quick Start (2 minutes)

```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
./scripts/setup/install.sh    # Linux/Mac
# or: scripts\setup\install.bat    # Windows
```

**That's it!** All services start automatically.

**Access:**

- Vibe-Kanban: <http://localhost:4000>
- Open WebUI: <http://localhost:8081>
- code-server: <http://localhost:8443>

---

## 🤖 Configure AI Provider (2 minutes)

### Interactive Setup (Recommended)

```bash
./scripts/setup/setup-ai.sh      # Linux/Mac
# or: scripts\setup\setup-ai.ps1  # Windows
```

Choose your AI provider:

1. **Ollama** - Free, local AI (no API key)
2. **OpenAI** - GPT-4, GPT-4 Turbo
3. **Anthropic** - Claude 3.5 Sonnet
4. **Z.AI (GLM-4)** - Chinese AI, cost-effective, GLM-4.7
5. **OpenRouter** - Many models
6. **Google** - Gemini
7. **Groq** - Fast LLaMA

The script guides you through setup step by step!

---

## 🔒 Security Setup (Required for Production)

**⚠️ IMPORTANT:** Before deploying to production, you MUST configure secure credentials!

### 1. Generate Secure Encryption Key

```bash
# Generate a 64-byte encryption key for credential storage
openssl rand -base64 48
```

Add to `.env`:

```bash
CREDENTIAL_ENCRYPTION_KEY=<generated-key>
```

### 2. Generate Database Password

```bash
# Generate secure database password
openssl rand -base64 24
```

Add to `.env`:

```bash
POSTGRES_PASSWORD=<generated-password>
```

### 3. Generate code-server Password

```bash
# Generate secure code-server password
openssl rand -base64 16
```

Add to `.env`:

```bash
CODE_SERVER_PASSWORD=<generated-password>
```

### 4. Complete .env Example

```bash
# ============================================================================
# CREDENTIAL SECURITY (CRITICAL - REQUIRED FOR PRODUCTION)
# ============================================================================

# Encryption key for storing user credentials (GitHub tokens, etc.)
CREDENTIAL_ENCRYPTION_KEY=VeynlrVZurJZUNDB/ezFQthnwptFLX5/B3yrlsapvKCIS8VOJOVJZReYYrILdV/i

# Database credentials
POSTGRES_PASSWORD=vibepass
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=vibestack
POSTGRES_USER=vibeuser

# code-server access
CODE_SERVER_PASSWORD=dev123
```

### 5. GitHub Token Setup (Optional)

To use GitHub integration features, set your token through Open WebUI:

```
You: Set my GitHub token to ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Vibe Stack: ✅ GitHub token has been securely stored and configured
```

**Security Features:**

- 🔐 AES-256-GCM encryption for all stored credentials
- 🛡️ Rate limiting (5 operations/minute per user)
- ✅ GitHub API token validation
- 📊 Comprehensive audit logging
- 🚫 No hardcoded credentials in code

**📖 See [SECURITY.md](SECURITY.md) for comprehensive security documentation.**

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Vibe-Kanban** | 4000 | AI agent orchestration, task board |
| **Open WebUI** | 8081 | AI chat interface for task planning |
| **code-server** | 8443 | Browser-based VS Code |
| **MCP Server** | 4001 | API bridge for Open WebUI ↔ Vibe-Kanban |
| **PostgreSQL** | 5432 | State management and persistence |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3000 | Monitoring dashboards |

### Optional Services (with monitoring)

```bash
# Start monitoring stack
make up-monitoring
```

---

## What You Can Do

### 🚀 Use Cases

- **Solo Developers**: Manage projects, plan features, track progress
- **Small Teams**: Collaborative task management with AI assistance
- **Learning**: Experiment with AI-powered development tools
- **Prototyping**: Quick project setup with best practices

### 🛠️ MCP Tools (40+)

**Task Management**

- `create_task` - Create new tasks
- `move_task` - Move tasks between lanes
- `update_task` - Update task properties
- `delete_task` - Remove tasks
- `get_board` - Get board state
- `get_board_stats` - Get statistics

**Planning**

- `generate_plan` - AI-powered task planning
- `analyze_goal` - Detect patterns and estimate tasks

**Repository Operations**

- `clone_repo` - Clone git repositories
- `search_repo` - Search code
- `read_file` - Read file contents

**GitHub Integration**

- `github_create_issue` - Create GitHub issues
- `github_list_issues` - List repository issues
- `github_create_pr` - Create pull requests

**File Operations**

- `list_files` - List directory contents
- `write_file` - Write files
- `edit_file` - Edit files

**Commands**

- `run_command` - Execute shell commands
- `run_tests` - Run test suites

**And 20+ more tools!**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Layer                           │
│  Open WebUI    │    code-server    │   Claude Code CLI      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  MCP Server (STDIO)  │  HTTP API (REST)                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  Controllers │ Services │ Middleware │ Validators           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  PostgreSQL (Primary)  │  Cache (5s TTL)  │  Bridge File    │
└─────────────────────────────────────────────────────────────┘
```

See [docs/diagrams/](docs/diagrams/) for detailed architecture diagrams.

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Key Configuration

```bash
# PostgreSQL
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# code-server
CODE_SERVER_PASSWORD=your_secure_password

# Monitoring (optional)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

---

## Development

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:models
npm run test:services
npm run test:controllers
```

### Lint Code

```bash
npm run lint
npm run lint:fix
```

### Build MCP Server

```bash
cd mcp-server
npm run build
```

---

## Deployment

### Production

```bash
# Use production compose file
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Monitoring

```bash
# Enable monitoring stack
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

---

## 🐳 Docker Quick Reference

### Essential Commands

```bash
# Start all services
docker compose up -d
# or
make up
# or
npm run docker:up

# View logs
docker compose logs -f
# or
make logs

# Stop services
docker compose down
# or
make down
# or
npm run docker:down
```

### Development Mode

```bash
# Start with hot-reload enabled
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
# or
npm run docker:dev

# Access shell in containers
npm run docker:shell:vibe      # Vibe-Kanban shell
npm run docker:shell:postgres  # PostgreSQL psql
npm run docker:shell:mcp       # MCP Server shell
```

### Monitoring & Debugging

```bash
# View container status
docker compose ps
# or
npm run docker:health

# View resource usage
docker compose stats
# or
npm run docker:stats

# Open health dashboard
npm run dashboard

# View specific service logs
npm run docker:logs:vibe
npm run docker:logs:postgres
npm run docker:logs:mcp
```

### Maintenance

```bash
# Rebuild all images
docker compose build --no-cache
# or
npm run docker:rebuild

# Pull latest images
docker compose pull
# or
npm run docker:pull

# Clean up unused resources
docker system prune -f
# or
npm run docker:prune

# Remove everything (including volumes)
docker compose down -v
# or
npm run docker:clean
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Vibe-Kanban | <http://localhost:4000> | None |
| Open WebUI | <http://localhost:8081> | Create account |
| code-server | <http://localhost:8443> | From .env (default: dev123) |
| Grafana | <http://localhost:3000> | admin / From .env |
| Prometheus | <http://localhost:9090> | None |
| MCP Server API | <http://localhost:4001> | None |

### Resource Limits

Default limits defined in `docker-compose.yml`:

```yaml
vibe-kanban:   2 CPU, 2GB RAM
code-server:   1 CPU, 1GB RAM
open-webui:    1 CPU, 1GB RAM
mcp-server:    0.5 CPU, 256MB RAM
postgres:      1 CPU, 512MB RAM
```

Override in `.env`:

```bash
VIBE_CPU_LIMIT=4.0
VIBE_MEMORY_LIMIT=4G
```

### Common Issues

**Port already in use**

```bash
# Find process using port
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Container won't start**

```bash
# Check logs
docker compose logs vibe-kanban

# Check health status
docker compose ps

# Restart specific service
docker compose restart vibe-kanban
```

**Out of disk space**

```bash
# Clean up Docker resources
docker system prune -a --volumes
```

---

## Docker Images (Auto-Updated)

All Docker images are **automatically updated** to their latest stable versions:

| Service | Image | Current Version | Update Source |
|---------|-------|-----------------|---------------|
| PostgreSQL | postgres | 18.1-alpine | Docker Hub |
| code-server | lscr.io/linuxserver/code-server | latest | LinuxServer.io |
| Open WebUI | ghcr.io/open-webui/open-webui | v0.7.2 | GHCR |
| Prometheus | prom/prometheus | v3.1.0 | Docker Hub |
| Grafana | grafana/grafana | 11.3.1 | Docker Hub |
| AlertManager | prom/alertmanager | v0.28.0 | Docker Hub |
| Node Exporter | prom/node-exporter | v1.8.2 | Docker Hub |
| cAdvisor | gcr.io/cadvisor/cadvisor | v0.51.0 | GCR |

### 🤖 Automatic Docker Updates

**The system automatically keeps Docker images up-to-date without any manual intervention!**

When new versions are released:
1. ✅ GitHub Actions automatically checks daily at 00:00 UTC
2. ✅ Updates docker-compose files with new versions
3. ✅ Validates all changes
4. ✅ Commits directly to main branch
5. ✅ Creates a new GitHub release with version bump

**No pull requests, no manual reviews - fully automated!**

See [docs/05-operations/08-docker-auto-update.md](docs/05-operations/08-docker-auto-update.md) for details.

---

## Verify Installation

```bash
# Run end-to-end test
make test-e2e

# Or directly
./scripts/setup/e2e-test.sh
```

---

## Documentation

- **[Quick Start](docs/01-getting-started/01-quick-start.md)** - Get running in 2 minutes
- **[Development Quick Start](docs/01-getting-started/05-development-quickstart.md)** - Start coding in 5 minutes
- **[User Guide](docs/02-user-guide/)** - Features and workflows
- **[Technical Docs](docs/03-technical/)** - Architecture and internals
- **[API Reference](docs/04-api/)** - MCP tools and HTTP API
- **[Operations](docs/05-operations/)** - Deployment and monitoring
- **[Development](docs/06-development/)** - Contributing and troubleshooting

---

## Project Status

### ✅ Completed (v1.1.8)

- [x] **Fork improvements** - All test imports fixed, 319 tests (309 passing, 10 skipped)
- [x] **Auto versioning** - GitHub Actions automated version management
- [x] **Dynamic docs** - Single-source-of-truth documentation system
- [x] PostgreSQL state management
- [x] Rate limiting middleware
- [x] Monitoring stack (Prometheus + Grafana)
- [x] E2E testing suite (319 tests, 309 passing)
- [x] Architecture diagrams
- [x] Enhanced logging with request tracing
- [x] Detailed health checks
- [x] WebSocket real-time synchronization
- [x] Credential management system
- [x] Test coverage dashboard
- [x] Modular architecture with feature-based organization
- [x] Multi-user collaboration test scenarios
- [x] Docker image auto-update system

### 🔄 In Progress

- [ ] Task dependencies
- [ ] Task templates

### 📋 Planned

- [ ] Multi-tenancy support
- [ ] Advanced analytics
- [ ] Custom themes

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

---

## 🍴 Fork Information

This is a fork of the original [Vibe Stack](https://github.com/halilbarim/vibe-stack) by [Halil Barım](https://github.com/halilbarim).

| Repository | URL |
|------------|-----|
| **Original** | [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack) |
| **This Fork** | [Resinder/vibe-stack](https://github.com/Resinder/vibe-stack) |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)

---

**Built with ❤️ by the Vibe Stack community**
