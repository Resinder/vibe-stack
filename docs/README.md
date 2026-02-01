# Vibe Stack Documentation

> **Version 1.0.0** | **319 Tests (309 passing)** | **Fork from halilbarim/vibe-stack**

**This is a fork** of the original [Vibe Stack](https://github.com/halilbarim/vibe-stack) by [Halil Barım](https://github.com/halilbarim).

Thank you Halil for creating this amazing project!

**Original repository:** [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack) ⭐

---

## 📚 Documentation Structure

This documentation is organized into 6 main categories for easy navigation:

```
docs/
├── 01-getting-started/     # Start here - Quick start & installation
├── 02-user-guide/          # User guides, workflows & best practices
├── 03-technical/           # Technical architecture & MCP server
├── 04-api/                 # API references, commands & integrations
├── 05-operations/          # Configuration, deployment & security
└── 06-development/         # Development, contributing & troubleshooting
```

## 🚀 Quick Navigation

### 01. Getting Started (5 files)
| File | Description | Time |
|-----|-------------|------|
| [01-quick-start.md](01-getting-started/01-quick-start.md) | Get running in 2 minutes | 2 min |
| [02-installation.md](01-getting-started/02-installation.md) | Detailed installation | 10 min |
| [03-beginner-guide.md](01-getting-started/03-beginner-guide.md) | Docker basics | 15 min |
| [04-openwebui-setup.md](01-getting-started/04-openwebui-setup.md) | Open WebUI setup | 10 min |
| [05-development-quickstart.md](01-getting-started/05-development-quickstart.md) | Start coding in 5 minutes | 5 min |

### 02. User Guide (7 files)
| File | Description |
|-----|-------------|
| [01-user-guide.md](02-user-guide/01-user-guide.md) | Complete user guide |
| [02-workflows.md](02-user-guide/02-workflows.md) | Common workflows |
| [03-best-practices.md](02-user-guide/03-best-practices.md) | Best practices |
| [04-team-collaboration.md](02-user-guide/04-team-collaboration.md) | Team collaboration |
| [05-faq.md](02-user-guide/05-faq.md) | FAQ |
| [06-comparison.md](02-user-guide/06-comparison.md) | Feature comparison |
| [07-integration.md](02-user-guide/07-integration.md) | Integration guide |

### 03. Technical Docs (8 files)
| File | Description |
|-----|-------------|
| [01-architecture.md](03-technical/01-architecture.md) | Architecture overview |
| [02-mcp-server.md](03-technical/02-mcp-server.md) | MCP Server guide |
| [03-mcp-protocol.md](03-technical/03-mcp-protocol.md) | MCP protocol details |
| [04-mcp-tools.md](03-technical/04-mcp-tools.md) | MCP tools reference |
| [05-mcp-extending.md](03-technical/05-mcp-extending.md) | Extending MCP server |
| [06-git-integration.md](03-technical/06-git-integration.md) | Git integration |
| [06-websocket.md](03-technical/06-websocket.md) | WebSocket real-time sync |
| [07-architecture-guide.md](03-technical/07-architecture-guide.md) | Architecture patterns |

### 04. API Reference (8 files)
| File | Description |
|-----|-------------|
| [01-api-overview.md](04-api/01-api-overview.md) | API overview |
| [02-api-reference.md](04-api/02-api-reference.md) | API reference |
| [03-openwebui.md](04-api/03-openwebui.md) | Open WebUI integration |
| [04-remote-access.md](04-api/04-remote-access.md) | Remote access |
| [05-command-reference.md](04-api/05-command-reference.md) | Command reference |
| [06-scripts.md](04-api/06-scripts.md) | Utility scripts |
| [07-ai-providers.md](04-api/07-ai-providers.md) | AI provider configuration |
| [08-zai-integration.md](04-api/08-zai-integration.md) | Z.AI integration |

### 05. Operations (8 files)
| File | Description |
|-----|-------------|
| [01-configuration.md](05-operations/01-configuration.md) | Configuration guide |
| [02-deployment.md](05-operations/02-deployment.md) | Deployment options |
| [03-monitoring.md](05-operations/03-monitoring.md) | Monitoring & metrics |
| [04-security.md](05-operations/04-security.md) | Security hardening |
| [05-performance.md](05-operations/05-performance.md) | Performance tuning |
| [06-multi-tenancy.md](05-operations/06-multi-tenancy.md) | Multi-tenancy |
| [07-backup-restore.md](05-operations/07-backup-restore.md) | Backup & restore |
| [08-docker-auto-update.md](05-operations/08-docker-auto-update.md) | Docker auto-update system |

### 06. Development (6 files)
| File | Description |
|-----|-------------|
| [01-development.md](06-development/01-development.md) | Development guide |
| [02-contributing.md](06-development/02-contributing.md) | Contributing guide |
| [03-troubleshooting.md](06-development/03-troubleshooting.md) | Troubleshooting |
| [03-windows-setup.md](06-development/03-windows-setup.md) | Windows setup |
| [04-claude-skills.md](06-development/04-claude-skills.md) | Claude Code skills |
| [05-troubleshooting.md](06-development/05-troubleshooting.md) | Dev troubleshooting |

---

## 🍴 Fork Information

This is a fork of the original [Vibe Stack](https://github.com/halilbarim/vibe-stack) by [Halil Barım](https://github.com/halilbarim).

| Repository | URL |
|------------|-----|
| **Original** | [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack) |
| **This Fork** | [Resinder/vibe-stack](https://github.com/Resinder/vibe-stack) |

---

## 📖 How Versioning Works

### Single Source of Truth

All version information is stored in **one file**: `version.json`

```json
{
  "version": "1.0.0",
  "components": {
    "mcp-server": "1.0.0",
    "docs": "1.0.0"
  }
}
```

### Automatic Updates

When you push to `main` branch:
1. GitHub Actions detects the push
2. Analyzes commit messages to determine version bump type
3. Updates `version.json`
4. Syncs to all `package.json` files
5. Rebuilds documentation
6. Creates a Git tag
7. Publishes a GitHub Release

### Manual Control (If Needed)

```bash
# View current version
npm run version:get

# Bump version manually
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0

# Sync to package.json files
npm run version:sync

# Rebuild documentation
npm run docs:build
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Fork-Specific Contributions

When contributing to this fork:
1. Focus on fork-specific improvements
2. Consider if changes should go upstream
3. Document fork-specific features clearly

---

## 📞 Support

### For This Fork
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)
- **Repository**: [Resinder/vibe-stack](https://github.com/Resinder/vibe-stack)

### For Original Project
- **Repository**: [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack)

---

**Version:** 1.0.0 | **Last Updated:** 2026-01-31
