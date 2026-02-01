# Vibe Stack - Frequently Asked Questions

Common questions about Vibe Stack, answered.

---

## Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Security](#security)

---

## General Questions

### What is Vibe Stack?

Vibe Stack is a production-ready Docker environment that combines:
- **Vibe-Kanban**: AI agent orchestration and task management
- **Open WebUI**: AI chat interface for task planning
- **code-server**: Browser-based VS Code
- **MCP Server**: API bridge with 90+ tools and 319 comprehensive tests

### What makes Vibe Stack different from other solutions?

- **AI-Powered Planning**: Automatic task generation with pattern detection
- **Modular Architecture**: Clean 5-layer design, zero spaghetti code
- **Production Ready**: Comprehensive testing, security, and monitoring
- **Developer Friendly**: Extensive tooling and detailed documentation
- **All-in-One**: Everything needed for AI-powered development

### What are the system requirements?

- **Docker** 20.10+
- **Docker Compose** v2.0+
- **Git**
- **8GB RAM** minimum
- **10GB disk space**
- **64-bit** operating system

### Does Vibe Stack work on Windows/Mac/Linux?

Yes! Vibe Stack works on:
- ✅ Windows 10/11 with WSL2 or Docker Desktop
- ✅ macOS 11+ with Docker Desktop
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)

### Is Vibe Stack free?

Yes! Vibe Stack is open-source under the **MIT License**. You can use it for personal and commercial projects.

### Can I use Vibe Stack for commercial projects?

Absolutely! The MIT license allows commercial use without restrictions.

---

## Installation & Setup

### How do I install Vibe Stack?

For detailed installation instructions, see the **[Installation Guide](02-installation.md)**.

Quick start:
```bash
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack
make setup    # Initialize configuration
make up       # Start all services
```

### Do I need to install Node.js?

No! All services run in Docker containers. Node.js is only needed if you want to modify the MCP Server code.

### Why do I need Docker?

Docker provides:
- Isolated environments for each service
- Consistent behavior across platforms
- Easy deployment and scaling
- Resource management and security

### Can I use Vibe Stack without Docker?

Not recommended. The architecture is designed for Docker. Removing Docker would require significant rewrites.

### How much disk space does Vibe Stack need?

- **Initial**: ~2GB for Docker images
- **Runtime**: ~500MB for volumes and data
- **Total**: ~10GB recommended for development

### How do I uninstall Vibe Stack?

```bash
# Stop and remove containers
docker-compose down -v

# Remove images
docker rmi vibe-stack-mcp-server

# Remove project directory
rm -rf vibe-stack
```

---

## Usage

### How do I create tasks via chat?

1. Open http://localhost:8081 (Open WebUI)
2. Configure your AI provider
3. Add MCP Server (Settings → MCP Servers)
4. Chat: "Create a task plan for OAuth authentication"

### Can I use Vibe Stack without AI?

Yes! You can:
- Use Vibe-Kanban directly at http://localhost:4000
- Manually create/move tasks
- Use code-server for development

### What AI providers are supported?

- OpenAI (GPT-3.5, GPT-4)
- Anthropic (Claude)
- Ollama (local LLMs)
- OpenAI-compatible APIs
- Custom endpoints

### How do I add a custom AI provider?

In Open WebUI Settings → Providers → Add Custom:

```
Base URL: https://your-api.com/v1
API Key: your-api-key
Model: your-model-name
```

### Can I use Vibe Stack offline?

Partially:
- **Open WebUI**: Needs AI provider (unless using local Ollama)
- **Vibe-Kanban**: Works offline
- **code-server**: Works offline
- **MCP Server**: Works offline

### How do I access Vibe-Kanban from outside my machine?

Edit `.env`:
```bash
# Bind to all interfaces (not just localhost)
VIBE_PORT_BIND=0.0.0.0
```

Then access via your IP address: `http://YOUR-IP:4000`

---

## Configuration

### Where do I set passwords?

Edit `.env`:
```bash
CODE_SERVER_PASSWORD=your-secure-password
```

### How do I change ports?

Edit `.env`:
```bash
VIBE_PORT=5000
OPEN_WEBUI_PORT=8082
CODE_SERVER_PORT=9443
```

Then restart: `make restart`

### How do I configure OpenAI API key?

In Open WebUI:
1. Go to Settings → Providers → OpenAI
2. Enter your API key
3. Save

### Where are project files stored?

All projects go in `repos/` directory:
```
repos/
├── my-project-1/
├── my-project-2/
└── .gitkeep
```

### How do I add environment variables for my project?

Create `secrets/my-project/.env`:
```bash
DATABASE_URL=postgresql://...
API_KEY=secret-key
```

These are mounted into `/repos/my-project/` in containers.

---

## Troubleshooting

### Services won't start

```bash
# Check port availability
lsof -i :4000
lsof -i :8443

# Kill conflicting processes
kill -9 <PID>

# Try clean restart
make down
make up
```

### MCP Server keeps restarting

```bash
# Check logs
docker logs vibe-mcp-server --tail 50

# Common issues:
# 1. Port 4001 conflict
# 2. Missing .vibe-kanban-bridge.json
# 3. File permission issues
```

### code-server shows "Unauthorized"

```bash
# Reset password in .env
CODE_SERVER_PASSWORD=new-password

# Restart
docker-compose restart code-server
```

### Can't connect to Open WebUI

```bash
# Verify it's running
curl http://localhost:8081/health

# Check logs
docker logs open-webui --tail 50

# Restart
docker-compose restart open-webui
```

### Tests are failing

```bash
# Clear test data
rm -rf mcp-server/enhanced/tests/.test-data

# Reinstall dependencies
cd mcp-server/enhanced
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test
```

### Out of memory errors

```bash
# Check Docker memory
docker stats

# Increase in docker-compose.yml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          memory: 512M
```

### How do I reset everything?

**WARNING: Deletes all data**

```bash
docker-compose down -v
docker system prune -a --volumes
./scripts/setup/init.sh
make up
```

---

## Development

### How do I contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### How do I run tests?

```bash
cd mcp-server/enhanced
npm test
```

### How do I add a new MCP tool?

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed instructions.

### How do I debug the MCP Server?

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Or run with inspector
node --inspect index.js
```

### How do I rebuild the MCP Server?

```bash
docker-compose build mcp-server --no-cache
docker-compose up -d
```

### Where are the logs stored?

Logs are output to stdout/stderr. View with:
```bash
make logs                    # All services
make logs-mcp             # MCP Server only
docker logs vibe-mcp-server
```

---

## Security

### Is Vibe Stack secure?

Yes! Security features include:
- Input sanitization
- Path traversal prevention
- Injection protection
- Container isolation
- Non-root users
- Resource limits
- Secrets management

See [SECURITY.md](../SECURITY.md) for details.

### Are my API keys safe?

Yes! API keys are:
- Never logged
- Stored in environment files
- Properly gitignored
- Isolated from AI agent access

### Can the AI access my files?

No! The AI agent can only:
- Read/write tasks in Vibe-Kanban
- Execute defined MCP tools
- Access files you explicitly expose

The AI **cannot**:
- Access `/root/secrets/`
- Execute arbitrary commands
- Access other projects without permission

### How do I secure Vibe Stack for production?

1. **Use strong passwords**:
```bash
openssl rand -base64 32
```

2. **Don't expose ports publicly**:
```yaml
ports:
  - "127.0.0.1:4000:4000"  # Localhost only
```

3. **Enable HTTPS**:
```yaml
# Use reverse proxy (nginx/traefik)
# with SSL certificates
```

4. **Keep updated**:
```bash
make update  # Pulls latest security patches
```

### Does Vibe Scan work with Vibe Stack?

Yes! See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for details.

---

## Performance

### What are the resource requirements?

| Service | CPU | Memory | Disk |
|---------|-----|--------|------|
| Vibe-Kanban | 0.5-2 CPUs | 512MB-2GB | ~500MB |
| MCP Server | 0.1-0.5 CPUs | 64MB-256MB | ~100MB |
| Open WebUI | 0.25-1 CPU | 256MB-1GB | ~200MB |
| code-server | 0.25-1 CPU | 256MB-1GB | ~500MB |
| **Total** | ~2-4 CPUs | ~1-4GB | ~2GB |

### Can I run Vibe Stack on low-spec hardware?

Minimum requirements:
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 10GB

For better performance, 4GB+ RAM recommended.

### How do I improve performance?

1. **Increase resources** in `docker-compose.yml`
2. **Use SSD** for better disk I/O
3. **Limit history** in Vibe-Kanban
4. **Disable unnecessary services**

### How many concurrent users can Vibe Stack support?

Depends on hardware:
- **4GB RAM**: ~5-10 concurrent users
- **8GB RAM**: ~10-20 concurrent users
- **16GB+ RAM**: 20+ concurrent users

---

## Integration

### Can I use Vibe Stack with my existing project?

Yes! Place your project in `repos/`:
```bash
cp -r /path/to/my-project repos/
```

It will be accessible in all containers.

### Can I use Vibe Stack with GitHub/GitLab?

Yes! code-server has Git integration:
```bash
# From code-server terminal
cd /repos/my-project
git clone https://github.com/user/repo.git
```

### Can I use Vibe Stack with CI/CD?

Yes! Example GitHub Actions:
```yaml
name: Test Vibe Stack
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: cd mcp-server/enhanced && npm test
```

---

## Support

### Where can I get help?

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Resinder/vibe-stack/discussions)

### How do I report bugs?

Use the issue template in [CONTRIBUTING.md](CONTRIBUTING.md).

### Is there a community forum?

Not yet, but you can:
- Open a GitHub Discussion
- Join our Discord (coming soon)
- Ask questions in Issues

### Can I hire the maintainers?

Contact through GitHub for consulting services.

---

## Licensing

### Can I use Vibe Stack in my company?

Yes! MIT license allows:
- Commercial use
- Modification
- Distribution
- Private use

### Do I need to attribute Vibe Stack?

No, but attribution is appreciated!

### Can I remove the license file?

No! The LICENSE file must remain with the software.

---

**Still have questions?** [Open an issue](https://github.com/Resinder/vibe-stack/issues/new)
