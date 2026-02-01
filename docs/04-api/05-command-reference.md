# 🐚 Vibe Stack - Command Reference

> Quick reference guide for daily operations with Vibe Stack

**Quick Navigation:**
- [Daily Operations](#daily-operations) - Most common commands
- [Service Management](#service-management) - Start/stop/restart
- [Monitoring & Logs](#monitoring--logs) - View logs and health
- [Container Access](#container-access) - Enter containers
- [Configuration](#configuration) - Manage settings
- [Project Management](#project-management) - Add/manage projects
- [Claude Code](#claude-code) - AI assistant commands
- [Maintenance](#maintenance) - Cleanup and updates
- [Troubleshooting](#troubleshooting) - Common issues

---

## Daily Operations

### Starting Your Work Day

```bash
# Quick start (recommended)
make up

# Or using Docker Compose directly
docker-compose up -d

# Verify services are healthy
make health

# Open services in browser
make open
```

### Ending Your Work Day

```bash
# Stop services (keeps data)
make down

# Or pause services
docker-compose stop
```

### Quick Command Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make up` | Start all services |
| `make down` | Stop all services |
| `make health` | Check service health |
| `make logs` | View all logs |
| `make open` | Open services in browser |

---

## Service Management

### Starting Services

```bash
# Start all services in background
make up
# or
docker-compose up -d

# Start with logs visible (foreground)
make dev
# or
docker-compose up

# Start specific service
docker-compose up -d vibe-kanban
docker-compose up -d code-server
```

### Stopping Services

```bash
# Stop all services
make down
# or
docker-compose down

# Stop without removing containers
docker-compose stop

# Stop specific service
docker-compose stop vibe-kanban
```

### Restarting Services

```bash
# Restart all services
make restart
# or
docker-compose restart

# Restart specific service
docker-compose restart vibe-kanban

# Hard restart (stop, remove, start)
docker-compose down && docker-compose up -d
```

### Viewing Service Status

```bash
# Show running containers
make ps
# or
docker-compose ps

# Detailed status with health checks
make status

# Resource usage (CPU/Memory)
make stats
# or
docker stats
```

---

## Monitoring & Logs

### Viewing Logs

```bash
# Follow all logs (live)
make logs

# Follow specific service logs
make logs-vibe      # Vibe-Kanban logs
make logs-code      # code-server logs

# Show last N lines
make logs-tail      # Last 50 lines
docker-compose logs --tail 100 vibe-kanban

# Show logs since specific time
docker-compose logs --since 1h vibe-kanban
docker-compose logs --since 10m code-server
```

### Health Checks

```bash
# Quick health check
make health

# Manual health check
curl http://localhost:4000/api/health     # Vibe-Kanban
curl http://localhost:8443/health          # code-server

# Container health status
docker inspect --format='{{.State.Health.Status}}' vibe-kanban
docker inspect --format='{{.State.Health.Status}}' code-server
```

### Port Usage

```bash
# Show port bindings
make ports

# Check if port is in use
lsof -i :4000      # Vibe-Kanban
lsof -i :8443      # code-server

# Alternative on Linux
netstat -tulpn | grep 4000
ss -tulpn | grep 8443
```

---

## Container Access

### Entering Containers

```bash
# Enter Vibe-Kanban container as node user
make shell-vibe
# or
docker exec -it vibe-kanban bash

# Enter code-server container
make shell-code
# or
docker exec -it code-server bash

# Enter as root user
make shell-root
# or
docker exec -it -u root vibe-kanban bash
```

### Running Commands in Containers

```bash
# Run single command
docker exec vibe-kanban ls -la /repos
docker exec code-server pwd

# Run as specific user
docker exec -u node vibe-kanban whoami
docker exec -u root vibe-kanban cat /etc/os-release

# Execute with environment variables
docker exec -e DEBUG=1 vibe-kanban npm test
```

---

## Configuration

### Viewing Configuration

```bash
# View Docker Compose configuration
docker-compose config

# View environment variables
cat .env

# View Claude settings
cat agents/claude/settings.json
```

### Editing Configuration

```bash
# Quick config edit (opens in default editor)
make config

# Manual edit
nano .env
nano agents/claude/settings.json

# After editing, restart to apply changes
make restart
```

### Configuration Files Reference

| File | Purpose | Edit After |
|------|---------|------------|
| `.env` | Environment variables (passwords, ports) | Edit manually |
| `agents/claude/settings.json` | Claude API configuration | Edit manually |
| `docker-compose.yml` | Service definitions | Rarely needed |
| `.env.example` | Template for new setups | Reference only |

---

## Project Management

### Adding a New Project

```bash
# 1. Clone or create project in repos/
git clone https://github.com/user/repo.git repos/my-project
cd repos/my-project

# 2. Create secrets directory
mkdir -p ../secrets/my-project

# 3. Add environment files
nano ../secrets/my-project/.env.development
nano ../secrets/my-project/.env.production

# Example secrets file:
# DATABASE_URL=postgresql://user:pass@localhost/db
# API_KEY=your-api-key

# 4. Restart to apply secrets
make restart vibe-kanban
```

### Secrets Directory Structure

```
secrets/
├── your-project/
│   ├── .env.development     → copied to /repos/your-project/.env.development.local
│   └── .env.production      → copied to /repos/your-project/.env.production.local
├── another-project/
│   └── .env.development
└── .gitkeep
```

### Listing Projects

```bash
# From host
ls repos/

# From container
docker exec vibe-kanban ls -la /repos

# Show secrets directories
make secrets
```

### Removing a Project

```bash
# Remove from host
rm -rf repos/my-project
rm -rf secrets/my-project

# Restart services
make restart
```

---

## Claude Code

### First-Time Setup

```bash
# Quick access to Claude CLI
make claude

# Manual access
docker exec -it vibe-kanban su - node -c "claude --dangerously-skip-permissions"
```

### Authentication Workflow

1. Run `make claude`
2. Select theme (use arrow keys or type `1`)
3. Copy the login URL from terminal
4. Open URL in browser and login to Anthropic
5. Click "Authorize" and copy the token
6. Paste token in terminal and press Enter
7. Type `exit` twice to leave container

### Re-authenticating

```bash
# After docker-compose down -v
make claude

# Skip permission checks (if configured)
docker exec vibe-kanban su - node -c "claude"
```

### Claude Configuration

**Standard Anthropic API:**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-xxxxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  }
}
```

**GLM-4 via z.ai:**
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-z-ai-key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

### Adding a New AI Agent/Provider

```bash
# 1. Create new agent directory
mkdir -p agents/my-agent

# 2. Create settings file
nano agents/my-agent/settings.json

# 3. Update docker-compose.yml to mount new agent
# volumes:
#   - ./agents/my-agent:/home/node/.my-agent

# 4. Restart to apply
make restart
```

---

## Maintenance

### Cleaning Up

```bash
# Remove stopped containers
make clean
# or
docker container prune -f

# Remove unused images
docker image prune -a

# Remove unused volumes (WARNING: data loss)
docker volume prune

# Full cleanup (WARNING: removes everything)
docker system prune -a --volumes
```

### Updating Images

```bash
# Pull latest images
make update
# or
docker-compose pull

# Rebuild and restart
docker-compose down
docker-compose pull
docker-compose up -d
```

### Backup and Restore

**Backup Volumes:**
```bash
# Create backup directory
mkdir -p backups

# Export each volume
docker run --rm -v vibe-stack_vibe_config:/data -v $(pwd)/backups:/backup alpine tar czf /backup/vibe-config-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v vibe-stack_vibe_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/vibe-data-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v vibe-stack_code_server_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/code-server-$(date +%Y%m%d).tar.gz -C /data .
```

**Restore Volumes:**
```bash
# Stop services
make down

# Restore from backup
docker run --rm -v vibe-stack_vibe_config:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/vibe-config-YYYYMMDD.tar.gz -C /data
docker run --rm -v vibe-stack_vibe_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/vibe-data-YYYYMMDD.tar.gz -C /data
docker run --rm -v vibe-stack_code_server_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/code-server-YYYYMMDD.tar.gz -C /data

# Start services
make up
```

### Diagnostics

```bash
# Run full diagnostics
make doctor

# Check Docker version
docker --version
docker-compose --version

# Check container resources
docker stats vibe-kanban code-server

# View container details
docker inspect vibe-kanban
docker inspect code-server

# Check volume usage
docker system df -v
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check port availability
lsof -i :4000
lsof -i :8443

# Check Docker logs
docker logs vibe-kanban --tail 50
docker logs code-server --tail 50

# Verify configuration
docker-compose config

# Try clean restart
make down
make up
```

### Containers Keep Restarting

```bash
# Check logs for errors
make logs-vibe | grep -i error
make logs-code | grep -i error

# Check resource limits
docker stats

# Increase limits in docker-compose.yml if needed
# Then rebuild:
make build
make up
```

### Permission Denied Errors

```bash
# Fix from host
sudo chown -R $USER:$USER repos/
sudo chmod +x dev-server.sh

# Fix from container
make shell-vibe
chown -R node:node /repos
```

### Out of Memory

```bash
# Check current usage
docker stats

# Adjust limits in .env
VIBE_MEMORY_LIMIT=4G
CODE_MEMORY_LIMIT=2G

# Or edit docker-compose.yml directly
```

### Network Issues

```bash
# Check Docker networks
docker network ls
docker network inspect vibe-stack_default

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

### Health Check Failing

```bash
# Check if service is actually running
curl http://localhost:4000/api/health
curl http://localhost:8443/health

# Check health check configuration
docker inspect --format='{{json .State.Health}}' vibe-kanban | jq

# Restart service
docker-compose restart vibe-kanban
```

### Complete Reset

**WARNING: This deletes all data**

```bash
# Full reset
make reset
# or
docker-compose down -v

# Reinitialize
./scripts/setup/init.sh
make up
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│  VIBE STACK - QUICK REFERENCE                                   │
├─────────────────────────────────────────────────────────────────┤
│  make help         Show all commands                            │
│  make setup        First-time setup                             │
│  make up           Start services                               │
│  make down         Stop services                                │
│  make restart      Restart services                             │
│  make logs         View all logs                                │
│  make health       Check service health                         │
│  make shell-vibe   Enter Vibe-Kanban container                  │
│  make claude       Claude Code CLI access                       │
│  make doctor       Run diagnostics                              │
│  make reset        Full reset (deletes data)                    │
├─────────────────────────────────────────────────────────────────┤
│  URLs:                                                           │
│    Vibe-Kanban  → http://localhost:4000                         │
│    VS Code      → http://localhost:8443                         │
├─────────────────────────────────────────────────────────────────┤
│  Files:                                                         │
│    .env                              → Environment variables       │
│    docs/04-api/05-command-reference.md                    → This reference             │
│    docs/02-user-guide/01-user-guide.md                     → User guide                 │
│    agents/claude/settings.json       → Claude configuration      │
│    secrets/<project>/                → Project secrets            │
│    repos/<project>/                  → Project workspace          │
│    scripts/setup/init.sh             → Setup script              │
│    scripts/ops/kanban-sync.sh        → Board sync               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Additional Resources

- **[README.md](../README.md)** - Main documentation
- **[Makefile](../Makefile)** - All available commands
- **[User Guide](../02-user-guide/01-user-guide.md)** - Complete user guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture
- **[GitHub Issues](https://github.com/Resinder/vibe-stack/issues)** - Report bugs
- **[Docker Docs](https://docs.docker.com/)** - Docker documentation

---

*Last Updated: 2025-01-26*
