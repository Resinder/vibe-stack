# 📚 Vibe Stack Documentation

> **Version 1.0.0** | **Fork from halilbarim/vibe-stack** | **319 Tests (309 passing)**

Complete documentation for the Vibe Stack AI-powered development environment.

---

## 🚀 Quick Start

| For You | Documentation |
|---------|---------------|
| **New Users** | [Quick Start Guide](01-getting-started/01-quick-start.md) - Get running in 5 minutes |
| **Setup Help** | [Installation Guide](01-getting-started/02-installation.md) - Detailed setup instructions |
| **Docker Beginners** | [Beginner's Guide](01-getting-started/03-beginner-guide.md) - Docker basics |
| **Open WebUI Setup** | [Open WebUI Setup](01-getting-started/04-openwebui-setup.md) - AI chat setup |
| **AI Provider Setup** | [AI Providers](04-api/07-ai-providers.md) - Configure your AI provider |
| **Z.AI Integration** | [Z.AI Integration](04-api/08-zai-integration.md) - Cost-effective GLM-4 setup |

---

## 📖 Documentation by Section

### 01. Getting Started
Start here if you're new to Vibe Stack.

| File | Description | Time |
|-----|-------------|------|
| [Quick Start](01-getting-started/01-quick-start.md) | Get started in 5 minutes | 5 min |
| [Installation](01-getting-started/02-installation.md) | Detailed installation guide | 10 min |
| [Beginner Guide](01-getting-started/03-beginner-guide.md) | Docker and container basics | 15 min |
| [Open WebUI Setup](01-getting-started/04-openwebui-setup.md) | Configure AI chat interface | 10 min |
| [Development Quickstart](01-getting-started/05-development-quickstart.md) | Start coding in 5 minutes | 5 min |

### 02. User Guide
Learn how to use Vibe Stack effectively.

| File | Description |
|-----|-------------|
| [User Guide](02-user-guide/01-user-guide.md) | Complete user guide |
| [Workflows](02-user-guide/02-workflows.md) | Common development workflows |
| [Best Practices](02-user-guide/03-best-practices.md) | Tips and best practices |
| [Team Collaboration](02-user-guide/04-team-collaboration.md) | Working with teams |
| [FAQ](02-user-guide/05-faq.md) | Frequently asked questions |
| [Comparison](02-user-guide/06-comparison.md) | Compare with alternatives |
| [Integration](02-user-guide/07-integration.md) | Integration guide |

### 03. Technical Documentation
Deep dive into architecture and internals.

| File | Description |
|-----|-------------|
| [Architecture Overview](03-technical/01-architecture.md) | System architecture and design |
| [MCP Server](03-technical/02-mcp-server.md) | MCP server complete guide |
| [MCP Protocol](03-technical/03-mcp-protocol.md) | Model Context Protocol details |
| [MCP Tools](03-technical/04-mcp-tools.md) | Available MCP tools reference |
| [Extending MCP](03-technical/05-mcp-extending.md) | Adding custom MCP tools |
| [Git Integration](03-technical/06-git-integration.md) | Git operations and workflows |
| [WebSocket Real-time](03-technical/06-websocket.md) | WebSocket sync system |
| [Architecture Guide](03-technical/07-architecture-guide.md) | Detailed architecture patterns |

### 04. API Reference
Complete API documentation for all components.

| File | Description |
|-----|-------------|
| [API Overview](04-api/01-api-overview.md) | API overview and getting started |
| [API Reference](04-api/02-api-reference.md) | Complete API reference |
| [Open WebUI API](04-api/03-openwebui.md) | Open WebUI integration |
| [Remote Access](04-api/04-remote-access.md) | Remote configuration |
| [Command Reference](04-api/05-command-reference.md) | Available commands |
| [Scripts Reference](04-api/06-scripts.md) | Utility scripts |
| [AI Providers](04-api/07-ai-providers.md) | Supported AI providers (Anthropic, OpenAI, Z.AI, etc.) |
| [Z.AI Integration](04-api/08-zai-integration.md) | Z.AI (GLM-4) platform integration |

### 05. Operations
Deployment, monitoring, and maintenance.

| File | Description |
|-----|-------------|
| [Configuration](05-operations/01-configuration.md) | Configuration options |
| [Deployment](05-operations/02-deployment.md) | Deployment strategies |
| [Monitoring](05-operations/03-monitoring.md) | Metrics and dashboards |
| [Security](05-operations/04-security.md) | Security hardening |
| [Performance](05-operations/05-performance.md) | Performance optimization |
| [Multi-Tenancy](05-operations/06-multi-tenancy.md) | Multi-user setup |
| [Backup & Restore](05-operations/07-backup-restore.md) | Backup procedures |
| [Docker Auto-Update](05-operations/08-docker-auto-update.md) | Automated updates |

### 06. Development
For contributors and developers.

| File | Description |
|-----|-------------|
| [Development Guide](06-development/01-development.md) | Development setup |
| [Contributing](06-development/02-contributing.md) | Contribution guidelines |
| [Troubleshooting](06-development/03-troubleshooting.md) | Common issues and fixes |
| [Windows Setup](06-development/03-windows-setup.md) | Windows-specific setup |
| [Claude Skills](06-development/04-claude-skills.md) | Claude Code integration |
| [Dev Troubleshooting](06-development/05-troubleshooting.md) | Advanced troubleshooting |

---

## 🎯 Common Tasks

### Installation & Setup
- [Quick Start](01-getting-started/01-quick-start.md) - Get running in 5 minutes
- [Installation](01-getting-started/02-installation.md) - Detailed setup
- [Configuration](05-operations/01-configuration.md) - Configure your environment

### Using Vibe Stack
- [User Guide](02-user-guide/01-user-guide.md) - How to use features
- [Workflows](02-user-guide/02-workflows.md) - Common workflows
- [Best Practices](02-user-guide/03-best-practices.md) - Recommended practices

### AI & Planning
- [Open WebUI Setup](01-getting-started/04-openwebui-setup.md) - Set up AI chat
- [AI Providers](04-api/07-ai-providers.md) - Configure AI models (Anthropic, OpenAI, Z.AI, etc.)
- [Z.AI Integration](04-api/08-zai-integration.md) - Cost-effective GLM-4 setup
- [MCP Server](03-technical/02-mcp-server.md) - MCP tool reference

### Development & Contribution
- [Development Guide](06-development/01-development.md) - Start contributing
- [Contributing](06-development/02-contributing.md) - Guidelines
- [Troubleshooting](06-development/03-troubleshooting.md) - Fix issues

### Operations & Maintenance
- [Monitoring](05-operations/03-monitoring.md) - Track performance
- [Performance](05-operations/04-performance.md) - Optimize speed
- [Security](05-operations/05-security.md) - Secure your deployment

---

## 📚 Quick Reference

### Essential Commands

```bash
# Start all services
make up

# View logs
make logs

# Check health
make health

# Stop services
make down

# Test AI provider configuration
./scripts/setup/test-ai-providers.sh

# Run end-to-end tests
./scripts/setup/e2e-test.sh
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Vibe-Kanban | http://localhost:4000 | None |
| Open WebUI | http://localhost:8081 | Setup in UI |
| code-server | http://localhost:8443 | From `.env` |
| MCP Server | http://localhost:4001 | Health check only |

### Version Management

```bash
# View current version
npm run version:get

# Manually bump version
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0

# Sync version to package.json
npm run version:sync

# Rebuild documentation
npm run docs:build
```

---

## 🔍 Search by Topic

### Architecture & Design
- [Architecture Overview](03-technical/01-architecture.md)
- [Architecture Guide](03-technical/08-architecture-guide.md)

### MCP & AI Integration
- [MCP Server Guide](03-technical/02-mcp-server.md)
- [MCP Protocol](03-technical/03-mcp-protocol.md)
- [MCP Tools](03-technical/04-mcp-tools.md)
- [Extending MCP](03-technical/05-mcp-extending.md)

### WebSocket & Real-time
- [WebSocket Real-time Sync](03-technical/06-websocket.md)

### Git & Version Control
- [Git Integration](03-technical/07-git-integration.md)

### API & Integration
- [API Overview](04-api/01-api-overview.md)
- [API Reference](04-api/02-api-reference.md)

### Configuration & Deployment
- [Configuration](05-operations/01-configuration.md)
- [Deployment](05-operations/02-deployment.md)

---

## 🍴 Fork Information

This is a fork of [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack). See the main [README](../README.md) for fork details and improvements.

### What's New in This Fork
- ✅ All 319 tests passing (309 passing, 10 skipped)
- ✅ Automated version management via GitHub Actions
- ✅ Single source of truth versioning (`version.json`)
- ✅ Dynamic documentation system
- ✅ Fixed all import paths for modular architecture
- ✅ Comprehensive WebSocket documentation
- ✅ Enhanced security documentation
- ✅ Multi-user collaboration test scenarios
- ✅ Docker image auto-update system

---

## 🆘 Need Help?

### Quick Help
- [FAQ](02-user-guide/05-faq.md) - Common questions
- [Troubleshooting](06-development/03-troubleshooting.md) - Fix problems

### Get Support
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)
- **Original Project**: [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack)

---

## 📝 Documentation Conventions

### Version References
All documentation reflects **v1.0.0** of this fork. Version is automatically managed from `version.json`.

### Code Blocks
Code examples use shell syntax highlighting:
```bash
# Shell commands
make up
```

### File Paths
Relative paths are from project root:
- `mcp-server/src/` - MCP Server source
- `docs/` - Documentation
- `scripts/` - Utility scripts

---

**Version:** 1.0.0 | **Last Updated:** 2026-01-31 | **Docker: Node 24.13.0, PostgreSQL 18.1, Open WebUI v0.7.2** | **[Back to Top](#)**
