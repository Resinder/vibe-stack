# Troubleshooting Guide

> **Developer-Facing Troubleshooting** | Advanced troubleshooting for developers and contributors

This guide covers common issues and their solutions when running Vibe Stack.

## Quick Diagnosis

```bash
# Check all services status
npm run docker:health

# View all container logs
npm run docker:logs

# Validate environment configuration
npm run docker:validate

# Run Docker infrastructure test
npm run docker:test
```

---

## Table of Contents

1. [Docker Issues](#docker-issues)
2. [Port Conflicts](#port-conflicts)
3. [Database Issues](#database-issues)
4. [Network Issues](#network-issues)
5. [Performance Issues](#performance-issues)
6. [Backup/Restore Issues](#backuprestore-issues)
7. [Windows-Specific Issues](#windows-specific-issues)

---

## Docker Issues

### Docker daemon not running

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Linux/Mac
sudo systemctl start docker
# or
sudo service docker start

# macOS: Start Docker Desktop from Applications

# Windows: Start Docker Desktop from Start Menu
```

### Out of disk space

**Error:**
```
no space left on device
```

**Solution:**
```bash
# Clean Docker system
docker system prune -a --volumes

# Check disk usage
docker system df

# Remove specific volumes
docker volume rm $(docker volume ls -qf dangling=true)
```

### Container won't start

**Diagnosis:**
```bash
# Check container status
docker compose ps

# View container logs
docker compose logs <service-name>

# Inspect container
docker inspect <container-name>
```

**Common causes:**

1. **Port already in use** - See [Port Conflicts](#port-conflicts)
2. **Missing .env file** - Copy `.env.example` to `.env`
3. **Volume mount issues** - Check volume paths in `docker-compose.yml`
4. **Resource limits** - Increase CPU/memory in compose file

---

## Port Conflicts

### Port already in use

**Error:**
```
bind: address already in use
```

**Diagnosis:**

**Linux/Mac:**
```bash
# Find process using port 4000
lsof -i :4000

# Output example:
# COMMAND  PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# node    1234 user   22u  IPv4 0x1234      0t0  TCP *:4000 (LISTEN)
```

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :4000

# Output example:
# TCP    0.0.0.0:4000    0.0.0.0    0    LISTENING    1234
```

**Solution 1: Kill the process**
```bash
# Linux/Mac
kill -9 1234

# Windows
taskkill /PID 1234 /F
```

**Solution 2: Change the port**

Edit `.env`:
```bash
# Change Vibe-Kanban port
VIBE_PORT=4001
```

Edit `docker-compose.yml`:
```yaml
services:
  vibe-kanban:
    ports:
      - "4001:4000"  # external:internal
```

### Multiple port conflicts

**Solution: Use alternative port range**

```bash
# Stop all services
docker compose down

# Edit .env to use different ports
VIBE_PORT=5000
CODE_SERVER_PORT=9443
DEV_PORT_START=3200
DEV_PORT_END=3300

# Restart
docker compose up -d
```

---

## Database Issues

### PostgreSQL won't start

**Diagnosis:**
```bash
# Check PostgreSQL logs
docker compose logs postgres

# Check container status
docker compose ps postgres
```

**Common causes:**

1. **Corrupted data** - Remove volume and restart:
   ```bash
   docker compose down -v
   docker compose up -d postgres
   ```

2. **Permission issues** - Fix volume permissions:
   ```bash
   docker volume rm vibe-postgres_postgres_data
   docker compose up -d
   ```

3. **Port conflict** - See [Port Conflicts](#port-conflicts)

### Database connection refused

**Error:**
```
connection refused
postgresql://vibeuser:vibepass@localhost:5432/vibestack
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check environment variables
echo $POSTGRES_HOST
echo $POSTGRES_PORT
echo $POSTGRES_DB

# Test connection
docker compose exec postgres psql -U vibeuser -d vibestack
```

### Database password authentication failed

**Error:**
```
FATAL: password authentication failed for user "vibeuser"
```

**Solution:**
```bash
# Check .env file
cat .env | grep POSTGRES_PASSWORD

# Reset password in .env
POSTGRES_PASSWORD=new-secure-password

# Restart PostgreSQL
docker compose restart postgres
```

---

## Network Issues

### Services can't communicate

**Diagnosis:**
```bash
# Check network
docker network ls
docker network inspect vibe-network

# Check container network settings
docker inspect <container-name> | grep Network
```

**Solution:**
```bash
# Recreate network
docker compose down
docker network rm vibe-network
docker compose up -d
```

### External access blocked

**Diagnosis:**
```bash
# Check if ports are exposed
docker compose ps

# Check firewall
sudo ufw status
```

**Solution:**
```bash
# Allow ports through firewall (Linux)
sudo ufw allow 4000/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 8081/tcp

# Windows Firewall: Add rules in Windows Defender Firewall
```

---

## Performance Issues

### High CPU usage

**Diagnosis:**
```bash
# Check resource usage
docker compose stats

# Check container processes
docker top <container-name>
```

**Solution:**
```bash
# Increase resource limits in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

### High memory usage

**Diagnosis:**
```bash
# Check memory usage
docker compose stats

# Check container memory
docker stats --no-stream
```

**Solution:**
```bash
# Restart container to free memory
docker compose restart <service>

# Increase memory limit
# Edit docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 4G
```

### Slow startup

**Diagnosis:**
```bash
# Check startup logs
docker compose logs -f

# Check health status
docker compose ps
```

**Common causes:**

1. **Large node_modules** - Use `.dockerignore`
2. **Slow pulls** - Pre-pull images
3. **Health check timeout** - Increase in compose file
4. **Resource constraints** - See [High memory usage](#high-memory-usage)

---

## Backup/Restore Issues

### Backup fails with "no space left"

**Solution:**
```bash
# Clean up old backups
npm run backup:prune

# Clean Docker system
docker system prune -a --volumes

# Use alternative backup location
export BACKUP_ROOT=/mnt/backups/vibe-stack
npm run backup:create
```

### Restore fails with "database is being accessed"

**Solution:**
```bash
# Stop all services first
docker compose down

# Restore database
bash scripts/ops/backup-volumes.sh --restore backup.sql.gz

# Start services
docker compose up -d
```

### Encrypted backup won't decrypt

**Error:**
```
gpg: decryption failed: No secret key
```

**Solution:**
```bash
# Import GPG key
gpg --import private-key.asc

# Verify key
gpg --list-keys

# Decrypt
gpg --output backup.sql.gz --decrypt backup.sql.gz.gpg
```

---

## Windows-Specific Issues

### Bash scripts won't run

**Error:**
```
bash: ./script.sh: bad interpreter
```

**Solution:**
```bash
# Use WSL (Windows Subsystem for Linux)
wsl

# Or use Git Bash
# Install: https://git-scm.com/download/win

# Or use PowerShell equivalents
# See Windows documentation for specific commands
```

### Path issues with volumes

**Error:**
```
ERROR: for db  Cannot create container for service db:
Invalid volume spec
```

**Solution:**
```bash
# Use Windows-style paths in docker-compose.yml
volumes:
  - C:\\Users\\YourName\\vibe-stack\\repos:/repos

# Or use relative paths
volumes:
  - ./repos:/repos
```

### Docker Desktop not starting

**Solution:**
```bash
# Check WSL2 installation
wsl --list --verbose

# Update WSL2
wsl --update

# Restart Docker Desktop
# Right-click Docker Desktop icon -> Restart
```

### Hyper-V issues

**Error:**
```
Hyper-V is not available
```

**Solution:**
```bash
# Enable WSL2 instead of Hyper-V
wsl --set-default-version 2

# Update Docker Desktop settings:
# Settings -> General -> Use WSL 2 based engine
```

---

## Service-Specific Issues

### Vibe-Kanban won't start

**Diagnosis:**
```bash
# Check logs
docker compose logs vibe-kanban

# Check health
docker compose ps vibe-kanban
```

**Common causes:**

1. **PostgreSQL not ready** - Wait for PostgreSQL to be healthy
2. **Configuration error** - Check `.env` file
3. **Port conflict** - See [Port Conflicts](#port-conflicts)

### code-server shows 502

**Diagnosis:**
```bash
# Check code-server logs
docker compose logs code-server

# Check if container is running
docker compose ps code-server
```

**Solution:**
```bash
# Reset code-server
docker compose restart code-server

# Or recreate
docker compose up -d --force-recreate code-server
```

### Open WebUI login not working

**Diagnosis:**
```bash
# Check logs
docker compose logs open-webui

# Check environment
docker compose exec open-webui env | grep -i data
```

**Solution:**
```bash
# Reset Open WebUI data
docker compose down
docker volume rm open_webui_data
docker compose up -d open-webui
```

### MCP Server not responding

**Diagnosis:**
```bash
# Check health endpoint
curl http://localhost:4001/health

# Check logs
docker compose logs mcp-server
```

**Common causes:**

1. **PostgreSQL connection** - Verify database is running
2. **Encryption key missing** - Set `CREDENTIAL_ENCRYPTION_KEY`
3. **Port conflict** - Change MCP server port in `.env`

---

## Environment Variables

### Missing .env file

**Error:**
```
.env file not found
```

**Solution:**
```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

### Invalid environment variable

**Error:**
```
invalid character in value
```

**Solution:**
```bash
# Validate environment
npm run docker:validate

# Check .env syntax
cat .env | grep -v '^#' | grep -v '^$'
```

### Special characters in passwords

**Error:**
```
yaml: line XX: could not find expected ':'
```

**Solution:**
```bash
# Quote passwords with special characters
POSTGRES_PASSWORD="p@ssw0rd!#$%"
CODE_SERVER_PASSWORD='c0de$erv!ce'
```

---

## Getting Help

### Collect diagnostic information

```bash
# Create diagnostic bundle
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "=== Vibe Stack Diagnostics ===" > diagnostics.txt
echo "" >> diagnostics.txt
echo "Date: $(date)" >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Docker Version ===" >> diagnostics.txt
docker --version >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Docker Compose Version ===" >> diagnostics.txt
docker compose version >> diagnostics.txt
echo "" >> diagnostics.txt

echo "=== Container Status ===" >> diagnostics.txt
docker compose ps >> diagnostics.txt 2>&1
echo "" >> diagnostics.txt

echo "=== Docker Stats ===" >> diagnostics.txt
docker compose stats --no-stream >> diagnostics.txt 2>&1
echo "" >> diagnostics.txt

echo "=== Recent Logs ===" >> diagnostics.txt
docker compose logs --tail=50 >> diagnostics.txt 2>&1
echo "" >> diagnostics.txt

echo "=== Network Info ===" >> diagnostics.txt
docker network inspect vibe-network >> diagnostics.txt 2>&1
echo "" >> diagnostics.txt

echo "=== Volume Info ===" >> diagnostics.txt
docker volume ls >> diagnostics.txt 2>&1
echo "" >> diagnostics.txt

echo "Diagnostics saved to: diagnostics.txt"
EOF

chmod +x diagnose.sh
./diagnose.sh
```

### Report an issue

When reporting issues, include:

1. **Diagnostic bundle** - See above
2. **Error messages** - Full error output
3. **Steps to reproduce** - What you did
4. **Expected behavior** - What should happen
5. **Actual behavior** - What actually happened
6. **Environment** - OS, Docker version, etc.

**Where to report:**
- GitHub Issues: https://github.com/Resinder/vibe-stack/issues
- Documentation: https://github.com/Resinder/vibe-stack/discussions

---

## Quick Reference

### Essential Commands

```bash
# All services status
npm run docker:health

# View logs
npm run docker:logs

# Restart service
docker compose restart <service>

# Rebuild and restart
docker compose up -d --build <service>

# Clean restart
docker compose down && docker compose up -d

# Shell access
docker compose exec <service> sh
```

### Service URLs

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| Vibe-Kanban | http://localhost:4000 | None |
| code-server | http://localhost:8443 | dev123 |
| Open WebUI | http://localhost:8081 | Create account |
| Grafana | http://localhost:3000 | admin / From .env |
| Prometheus | http://localhost:9090 | None |
| MCP Server | http://localhost:4001 | None |

### Log Locations

```bash
# Service logs
docker compose logs -f <service>

# All logs
docker compose logs -f

# Recent logs
docker compose logs --tail=100

# Log files (if configured)
./logs/
/var/log/docker/  # system logs
```
