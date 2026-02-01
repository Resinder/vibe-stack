# Quick Reference Guide

> **Version:** 1.0.0 | **Essential commands and configurations at a glance**

---

## 🚀 Essential Commands

### Service Management

```bash
# Start all services
make up

# Stop all services
make down

# Restart services
make restart

# View logs
make logs

# View logs for specific service
make logs SERVICE=mcp-server

# Check service health
make health

# Rebuild and restart
make rebuild
```

### Docker Operations

```bash
# Using docker compose (modern)
docker compose up -d
docker compose down
docker compose logs -f
docker compose ps

# Or using docker-compose (legacy)
docker-compose up -d
docker-compose down
docker-compose logs -f
```

### Development

```bash
# Start in development mode (with hot reload)
make dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:security
```

### Version Management

```bash
# View current version
npm run version:get

# Bump version
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0

# Sync version to package.json files
npm run version:sync

# Build documentation
npm run docs:build
```

---

## 🌐 Service URLs

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| **Vibe-Kanban** | http://localhost:4000 | None |
| **Open WebUI** | http://localhost:8081 | Setup in UI |
| **code-server** | http://localhost:8443 | Password from `.env` |
| **MCP Server** | http://localhost:4001 | Health check only |
| **WebSocket** | ws://localhost:4002 | N/A |

---

## 📝 Configuration Files

### .env (Main Configuration)

```bash
# Service Passwords
CODE_SERVER_PASSWORD=your-password

# Database
POSTGRES_PASSWORD=vibe-stack-pass
POSTGRES_USER=vibe-stack
POSTGRES_DB=vibe-stack

# API Keys (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# GitHub Token (for GitHub integration)
GITHUB_TOKEN=ghp_...

# External MCP Servers
EXTERNAL_MCP_SERVERS=[]
```

### version.json (Version Control)

```json
{
  "version": "1.0.0",
  "components": {
    "mcp-server": "1.0.0",
    "docs": "1.0.0"
  }
}
```

---

## 🎯 Common Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack

# 2. Run setup
make setup

# 3. Edit environment
nano .env

# 4. Start services
make up

# 5. Check health
make health
```

### Daily Development

```bash
# Start environment
make up

# Open services
# - Vibe-Kanban: http://localhost:4000
# - code-server: http://localhost:8443
# - Open WebUI: http://localhost:8081

# When done
make down
```

### Testing Changes

```bash
# Make changes to code

# Restart affected service
docker compose restart mcp-server

# Run tests
npm test

# View logs
make logs SERVICE=mcp-server
```

---

## 🔧 Troubleshooting Quick Fixes

### Port Already in Use

```bash
# Find process using port
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>
```

### Services Not Starting

```bash
# Check Docker
docker ps
docker logs vibe-mcp-server

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Reset Everything

```bash
# Stop and remove all containers
make down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Start fresh
make up
```

### Database Issues

```bash
# Reset database
docker compose exec -T postgres psql -U vibe-stack -c "DROP DATABASE vibe-stack;"
docker compose exec -T postgres psql -U vibe-stack -c "CREATE DATABASE vibe-stack;"

# Restart services
make restart
```

---

## 📊 Docker Compose Commands

```bash
# Start with specific profile
docker compose --profile monitoring up -d

# Scale services
docker compose up -d --scale mcp-server=3

# Run one-off command
docker compose run --rm mcp-server npm test

# Execute in running container
docker compose exec mcp-server sh

# Follow logs for multiple services
docker compose logs -f mcp-server postgres
```

---

## 🧪 Testing Commands

```bash
# All tests
npm test

# Specific test files
npm run test:models
npm run test:validation
npm run test:services
npm run test:controllers
npm run test:security

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Verbose output
npm run test:verbose
```

---

## 📁 Project Structure

```
vibe-stack/
├── mcp-server/           # MCP Server (Node.js)
│   ├── src/             # Source code
│   │   ├── modules/     # Feature modules
│   │   ├── shared/      # Shared utilities
│   │   ├── websocket/   # WebSocket server
│   │   └── config/      # Configuration
│   ├── tests/           # Test files
│   └── package.json
├── services/            # Web interfaces
│   ├── observer-dashboard/
│   └── open-webui-custom/
├── scripts/             # Utility scripts
│   ├── setup/          # Setup scripts
│   ├── ops/            # Operations
│   └── utils/          # Version management
├── config/              # Configuration files
│   ├── monitoring/     # Prometheus configs
│   ├── patterns/       # AI patterns
│   └── providers/      # LLM provider configs
├── docs/                # Documentation
├── version.json         # Version (single source of truth)
├── docker-compose.yml   # Main Docker compose
└── .env                 # Environment variables
```

---

## 🔐 Default Credentials

| Service | Username | Default Password |
|---------|----------|------------------|
| PostgreSQL | vibe-stack | vibe-stack-pass |
| code-server | None | From `.env` |
| Grafana | admin | admin (change on first login) |

---

## 🎨 MCP Tool Examples

### Task Management

```javascript
// Create task
mcp__create_task({
  title: "Build API endpoint",
  lane: "backlog",
  priority: "high",
  estimatedHours: 4
})

// Move task
mcp__move_task({
  taskId: "task-123",
  toLane: "in_progress"
})

// Get board status
mcp__get_board()

// Search tasks
mcp__search_tasks({
  query: "API",
  lane: "in_progress"
})
```

### Planning

```javascript
// Generate plan
mcp__generate_plan({
  goal: "Create a REST API with authentication"
})

// Analyze goal
mcp__analyze_goal({
  goal: "Add OAuth login"
})
```

### Git Operations

```javascript
// Initialize repo
mcp__init_repo({
  path: "/workspace/my-project"
})

// Commit changes
mcp__git_commit({
  path: "/workspace/my-project",
  message: "Add new feature"
})

// Create GitHub issue
mcp__create_github_issue({
  title: "Bug in login",
  body: "Steps to reproduce..."
})
```

---

## 📱 Monitoring

```bash
# View metrics
curl http://localhost:4001/metrics

# Health check
curl http://localhost:4001/health

# Prometheus
open http://localhost:9090

# Grafana
open http://localhost:3000
# Default: admin/admin
```

---

## 🔄 Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker compose build

# Restart services
docker compose up -d
```

---

## 🆘 Getting Help

| Resource | Link |
|----------|------|
| Documentation | [docs/](../docs/) |
| FAQ | [FAQ](../02-user-guide/05-faq.md) |
| Troubleshooting | [Troubleshooting](../06-development/03-troubleshooting.md) |
| GitHub Issues | [Submit Issue](https://github.com/Resinder/vibe-stack/issues) |
| Upstream Project | [halilbarim/vibe-stack](https://github.com/halilbarim/vibe-stack) |

---

## 🎯 Keyboard Shortcuts (code-server)

| Action | Shortcut |
|--------|----------|
| Command Palette | `Ctrl+Shift+P` |
| Quick Open | `Ctrl+P` |
| Toggle Terminal | `Ctrl+`` |
| Split Editor | `Ctrl+\` |
| Close Editor | `Ctrl+W` |
| Save | `Ctrl+S` |

---

## 📝 Notes

- All version numbers are managed in `version.json`
- Never manually edit `package.json` version numbers
- WebSocket runs on port 4002
- MCP Server HTTP API on port 4001
- PostgreSQL on port 5432
- Grafana on port 3000 (when monitoring enabled)

---

**Version:** 1.0.0 | **Last Updated:** 2026-01-31 | **[Full Documentation](../README.md)**
