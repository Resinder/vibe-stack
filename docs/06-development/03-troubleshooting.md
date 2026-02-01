# Vibe Stack - Troubleshooting Guide

> **User-Facing Troubleshooting** | Common issues and solutions for users

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Service Issues](#service-issues)
- [Docker Issues](#docker-issues)
- [MCP Server Issues](#mcp-server-issues)
- [Open WebUI Issues](#open-webui-issues)
- [code-server Issues](#code-server-issues)
- [Network Issues](#network-issues)
- [Performance Issues](#performance-issues)
- [Data Issues](#data-issues)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

### Run Diagnostics Tool

```bash
make doctor
```

This checks:
- Docker installation and version
- Docker Compose installation
- Port availability (4000, 4001, 8081, 8443)
- Service health status
- Configuration files
- Volume status

### Check Service Status

```bash
# All services
docker-compose ps

# Detailed status
make status

# Health checks
make health
```

### View Logs

```bash
# All services
make logs

# Specific service
make logs-vibe      # Vibe-Kanban
make logs-mcp       # MCP Server
make logs-code      # code-server
make logs-webui     # Open WebUI
```

---

## Service Issues

### Services Won't Start

#### Symptoms

```bash
docker-compose up -d
# ERROR: for vibe-kanban  Cannot start service vibe-kanban
```

#### Solutions

**1. Check Port Availability**

```bash
# Check if ports are in use
lsof -i :4000
lsof -i :4001
lsof -i :8081
lsof -i :8443

# Kill process using port (replace PID)
kill -9 <PID>

# Or change ports in .env
VIBE_PORT=5000
CODE_SERVER_PORT=9443
```

**2. Check Docker Resources**

```bash
# Check Docker is running
docker info

# Check available disk space
docker system df

# Clean up if needed
docker system prune -a --volumes
```

**3. Rebuild Containers**

```bash
# Stop services
make down

# Rebuild MCP server
docker-compose build mcp-server

# Start services
make up
```

### Services Keep Restarting

#### Symptoms

```bash
docker-compose ps
# vibe-mcp-server   Restarting (1)   10 seconds ago
```

#### Solutions

**1. Check Logs**

```bash
# View logs to find error
docker logs vibe-mcp-server --tail 50

# Check for common errors:
# - Port conflicts
# - Missing dependencies
# - File permission issues
```

**2. Check Resource Limits**

```bash
# View container resource usage
docker stats vibe-mcp-server

# Increase limits in docker-compose.yml if needed
# deploy:
#   resources:
#     limits:
#       memory: 512M  # Increase if hitting limits
```

**3. File Permissions**

```bash
# Fix volume permissions
docker-compose down
sudo chown -R $USER:$USER .
make up
```

### Service Starts But Not Responding

#### Symptoms

Service shows as "Up" but HTTP requests timeout.

#### Solutions

**1. Check Health Endpoints**

```bash
curl http://localhost:4000/api/health     # Vibe-Kanban
curl http://localhost:4001/health          # MCP Server
curl http://localhost:8081/health          # Open WebUI
curl http://localhost:8443/                # code-server
```

**2. Check Container Internals**

```bash
# Enter container
docker exec -it vibe-kanban bash

# Check if process is running
ps aux

# Check logs
tail -f /var/log/*.log
```

**3. Restart Service**

```bash
docker-compose restart vibe-kanban
# or
make restart
```

---

## Docker Issues

### Docker Command Not Found

#### Solutions

**1. Verify Docker Installation**

```bash
docker --version
docker-compose --version
```

**2. Install Docker**

- **macOS**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Ubuntu**: `sudo apt-get install docker.io docker-compose`
- **Windows**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

**3. Start Docker Service**

```bash
# Linux
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Docker Out of Space

#### Symptoms

```
ERROR: no space left on device
```

#### Solutions

**1. Check Disk Usage**

```bash
docker system df
```

**2. Clean Up**

```bash
# Remove unused images
docker image prune -a

# Remove unused containers
docker container prune -f

# Remove unused volumes
docker volume prune

# Full cleanup (WARNING: removes everything)
docker system prune -a --volumes
```

**3. Increase Docker Storage**

- **Docker Desktop**: Settings > Resources > Disk Image Size
- **Linux**: Edit `/etc/docker/daemon.json`:
  ```json
  {
    "data-root": "/path/to/larger/disk"
  }
  ```

### Permission Denied (Unix)

#### Symptoms

```
ERROR: permission denied while trying to connect to the Docker daemon
```

#### Solutions

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Verify
docker ps
```

---

## MCP Server Issues

### MCP Server Not Connecting in Open WebUI

#### Symptoms

MCP tools don't appear in Open WebUI chat.

#### Solutions

**1. Verify MCP Server is Running**

```bash
curl http://localhost:4001/health
# Should return: {"status":"healthy","server":"vibe-stack-mcp","version":"1.0.0"}
```

**2. Check MCP Configuration in Open WebUI**

- Go to Settings → MCP Servers
- Verify configuration:
  - **Name**: Vibe Stack
  - **Command**: `docker exec -i vibe-mcp-server node /app/index.js`

**3. Restart MCP Server**

```bash
docker-compose restart mcp-server
```

**4. Check Logs**

```bash
docker logs vibe-mcp-server --tail 50
```

### "Module Not Found" Error

#### Symptoms

```
Error: Cannot find module './config/constants.js'
```

#### Solutions

**1. Rebuild Container**

```bash
docker-compose down
docker-compose build mcp-server
docker-compose up -d
```

**2. Check Volume Mounts**

```bash
# Verify source files are mounted
docker exec vibe-mcp-server ls -la /app/config/
```

### MCP Server Returns 500 Errors

#### Symptoms

```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

#### Solutions

**1. Check Logs for Stack Trace**

```bash
docker logs vibe-mcp-server --tail 100 | grep -A 10 ERROR
```

**2. Common Issues**

- **Invalid Input**: Check request payload
- **Missing Environment**: Check `.env` file
- **Bridge File Issues**: Check `.vibe-kanban-bridge.json`

**3. Run Tests**

```bash
cd mcp-server
npm test
```

---

## Open WebUI Issues

### Open WebUI Not Loading

#### Symptoms

Browser shows "Connection Refused" or timeout.

#### Solutions

**1. Check Open WebUI is Running**

```bash
curl http://localhost:8081/health
# Should return: {"status":true}
```

**2. Restart Open WebUI**

```bash
docker-compose restart open-webui
```

**3. Clear Browser Cache**

- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

### Open WebUI Can't Connect to AI Provider

#### Symptoms

Chat interface shows "Connection Error" or "API Key Invalid".

#### Solutions

**1. Check API Key Configuration**

Open WebUI Settings → Providers:
- Verify API key is entered
- Check API key is valid
- Test API key with curl:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01"
```

**2. Check Network Access**

```bash
# From Open WebUI container
docker exec -it open-webui curl https://api.anthropic.com

# Should return: 401 Unauthorized (key missing) or 200 OK
```

**3. Check Proxy Settings**

If behind proxy, configure in Open WebUI Settings.

---

## code-server Issues

### code-server Not Accessible

#### Symptoms

```
ERR_CONNECTION_REFUSED at https://localhost:8443
```

#### Solutions

**1. Check Password**

Default password is in `.env`:
```bash
CODE_SERVER_PASSWORD=your-password
```

**2. Restart code-server**

```bash
docker-compose restart code-server
```

**3. Check Logs**

```bash
docker logs code-server --tail 50
```

### code-server Shows "Unauthorized"

#### Symptoms

Login prompt loops back to login page.

#### Solutions

**1. Reset Password**

```bash
# Update .env
CODE_SERVER_PASSWORD=new-password

# Restart
docker-compose restart code-server
```

**2. Clear Browser Cookies**

- Open DevTools (F12)
- Application → Cookies → Clear All

### Extensions Won't Install

#### Symptoms

Extension installation fails with network error.

#### Solutions

**1. Check Network Access**

```bash
docker exec code-server curl https://marketplace.visualstudio.com
```

**2. Manual Installation**

```bash
# Download extension vsix file
# Then install from command line
docker exec code-server code-server --install-extension /path/to/extension.vsix
```

---

## Network Issues

### Services Can't Communicate

#### Symptoms

MCP Server can't reach Vibe-Kanban, etc.

#### Solutions

**1. Check Docker Network**

```bash
docker network ls
docker network inspect vibe-stack_default
```

**2. Verify Services on Same Network**

```bash
docker-compose ps
# All services should be in "vibe-stack_default" network
```

**3. Recreate Network**

```bash
docker-compose down
docker network prune
docker-compose up -d
```

### Port Conflicts

#### Symptoms

```
ERROR: for vibe-kanban  Bind for 0.0.0.0:4000 failed: port is already allocated
```

#### Solutions

**1. Find Process Using Port**

```bash
lsof -i :4000
# or on Windows
netstat -ano | findstr :4000
```

**2. Kill Process**

```bash
kill -9 <PID>
# or on Windows
taskkill /PID <PID> /F
```

**3. Change Port in .env**

```bash
VIBE_PORT=5000
OPEN_WEBUI_PORT=8082
CODE_SERVER_PORT=9443
```

---

## Performance Issues

### Slow Response Times

#### Symptoms

MCP Server takes >1 second to respond.

#### Solutions

**1. Check Resource Usage**

```bash
docker stats
```

**2. Increase Resources**

Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'      # Increase
      memory: 512M      # Increase
```

**3. Check for Large Board Files**

```bash
# Check board size
ls -lh .vibe-kanban-bridge.json

# Archive old tasks if needed
```

### High Memory Usage

#### Solutions

**1. Check Memory Usage**

```bash
docker stats --no-stream
```

**2. Set Memory Limits**

```yaml
# In docker-compose.yml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 64M
```

**3. Restart Services**

```bash
docker-compose restart
```

---

## Data Issues

### Bridge File Corruption

#### Symptoms

Tasks won't save or load.

#### Solutions

**1. Backup Current File**

```bash
cp .vibe-kanban-bridge.json .vibe-kanban-bridge.json.backup
```

**2. Validate JSON**

```bash
cat .vibe-kanban-bridge.json | jq .
```

**3. Restore from Backup**

```bash
# If Docker volumes
docker run --rm -v vibe-stack_vibe_data:/data -v $(pwd):/backup alpine \
  cp /backup/.vibe-kanban-bridge.json.backup /data/.vibe-kanban-bridge.json
```

### Lost Data After Restart

#### Solutions

**1. Check Volumes**

```bash
docker volume ls
docker volume inspect vibe-stack_vibe_data
```

**2. Don't Use `docker-compose down -v`**

This removes volumes! Use `docker-compose down` instead.

**3. Regular Backups**

```bash
# Backup script
./scripts/backup.sh
```

---

## Getting Help

### Before Asking for Help

1. **Run Diagnostics**: `make doctor`
2. **Check Logs**: `make logs`
3. **Search Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)
4. **Read Documentation**: [docs/](docs/)

### Creating an Issue

Include:

- **OS and Version**
- **Docker Version**
- **Vibe Stack Version**
- **Steps to Reproduce**
- **Expected vs Actual Behavior**
- **Relevant Logs**
- **What You've Tried**

### Useful Commands

```bash
# Full diagnostics
make doctor

# Export diagnostics to file
make doctor > diagnostics.txt

# View all service info
make status > status.txt

# Export logs
make logs > logs.txt
```

---

## Emergency Reset

**WARNING: This deletes all data and configuration**

```bash
# Complete reset
docker-compose down -v
docker system prune -a --volumes
rm -rf .vibe-kanban-bridge.json
rm -rf .vibe-dashboard.json

# Reinitialize
./scripts/setup/init.sh
make up
```

---

**Still stuck?** [Open an issue](https://github.com/Resinder/vibe-stack/issues/new)
