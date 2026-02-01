# Multi-User & Multi-Tenant Architecture

Complete guide for running Vibe Stack with multiple users, Open WebUI instances, and Kanban boards.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Deployment Models](#deployment-models)
- [Setup: Multiple Users](#setup-multiple-users)
- [Setup: Multiple Open WebUI Instances](#setup-multiple-open-webui-instances)
- [Setup: Multiple Kanban Boards](#setup-multiple-kanban-boards)
- [Setup: Complete Multi-Tenant](#setup-complete-multi-tenant)
- [Configuration](#configuration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Overview

Vibe Stack MCP Server supports multiple deployment scenarios:

### Single User, Single Board
- **Use Case:** Solo developer
- **Setup:** Default configuration
- **Cost:** Lowest

### Multiple Users, Single Board
- **Use Case:** Small team (2-5 people)
- **Setup:** Shared Open WebUI + shared Kanban board
- **Cost:** Low

### Multiple Users, Multiple Boards
- **Use Case:** Medium team (5-20 people) with multiple projects
- **Setup:** Multiple Open WebUI instances or multiple boards
- **Cost:** Medium

### Multi-Tenant (Organizations)
- **Use Case:** Multiple teams/projects with complete isolation
- **Setup:** Dedicated MCP servers per tenant
- **Cost:** Higher

---

## Architecture

### Current Architecture (Single MCP Server)

```
┌─────────────────────────────────────────────────────────────┐
│                    Single MCP Server                        │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │  Open WebUI  │────▶│  MCP Server  │◀────│ Vibe-Kanban │  │
│  │  (Port 8081) │     │  (Port 4001) │     │ (Port 4000) │  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
│         │                                         │         │
│         └─────────────────┬─────────────────────┘         │
│                           ▼                               │
│                    ┌──────────────┐                        │
│                    │ Shared Board │                        │
│                    │  (Single .json)│                       │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Multi-Tenant Vibe Stack                       │
│                                                                       │
│  ┌─────────────────┐     ┌─────────────────┐     ┌────────────────┐ │
│  │ Tenant A        │     │ Tenant B        │     │ Tenant C       │ │
│  │                 │     │                 │     │                │ │
│  │ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌────────────┐ │
│  │ │Open WebUI A1│─┼─────┼─▶│Open WebUI B1│─┼─────┼─▶│Open WebUI C1│ │
│  │ │(Port 8081)  │ │     │ │(Port 8082)  │ │     │ │(Port 8083)  │ │
│  │ └─────────────┘ │     │ └─────────────┘ │     │ └────────────┘ │
│  │        │         │     │        │         │     │        │        │
│  │ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌────────────┐ │
│  │ │Open WebUI A2│─┼─────┼─▶│Open WebUI B2│─┼─────┼─▶│Open WebUI C2│ │
│  │ │(Port 8091)  │ │     │ │(Port 8092)  │ │     │ │(Port 8093)  │ │
│  │ └─────────────┘ │     │ └─────────────┘ │     │ └────────────┘ │
│  │        │         │     │        │         │     │        │        │
│  │        ▼         │     │        ▼         │     │        ▼        │
│  │ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌────────────┐ │
│  │ │MCP Server A │ │     │ │MCP Server B │ │     │ │MCP Server C │ │
│  │ │(Port 4001)  │ │     │ │(Port 4011)  │ │     │ │(Port 4021)  │ │
│  │ └─────────────┘ │     │ └─────────────┘ │     │ └────────────┘ │
│  │        │         │     │        │         │     │        │        │
│  │        ▼         │     │        ▼         │     │        ▼        │
│  │ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌────────────┐ │
│  │ │Kanban Board A│ │     │ │Kanban Board B│ │     │ │Kanban Board C│ │
│  │ │(Port 4000)  │ │     │ │(Port 4010)  │ │     │ │(Port 4020)  │ │
│  │ └─────────────┘ │     │ └─────────────┘ │     │ └────────────┘ │
│  └─────────────────┘     └─────────────────┘     └────────────────┘ │
│                                                                       │
│  Complete isolation between tenants                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Models

### Model 1: Single MCP, Shared Board

**Best for:** Small teams (2-5 users)

```
Open WebUI (Port 8081) ← User A
                ↕
Open WebUI (Port 8081) ← User B
                ↕
         MCP Server (Port 4001)
                ↕
      Vibe-Kanban (Port 4000)
         Shared Board
```

**Pros:**
- Simple setup
- Low resource usage
- Shared task view
- Easy collaboration

**Cons:**
- Single shared board
- Users see all tasks
- No task isolation

---

### Model 2: Single MCP, Multiple Boards

**Best for:** Teams with multiple projects (5-15 users)

```
User A → Open WebUI A → MCP Server → Kanban Board A (Project 1)
User B → Open WebUI B ↗                          ↘
User C → Open WebUI C →                          → Kanban Board B (Project 2)
```

**Pros:**
- Multiple projects
- Resource efficient
- Centralized MCP server
- Flexible permissions

**Cons:**
- More complex setup
- Shared MCP resources

---

### Model 3: Multiple MCP Instances (Multi-Tenant)

**Best for:** Multiple teams/organizations (15+ users)

```
Tenant A:
  Open WebUI A1/A2 → MCP Server A → Kanban Board A
  (Isolated environment)

Tenant B:
  Open WebUI B1/B2 → MCP Server B → Kanban Board B
  (Isolated environment)

Tenant C:
  Open WebUI C1/C2 → MCP Server C → Kanban Board C
  (Isolated environment)
```

**Pros:**
- Complete isolation
- Independent resources
- Separate configurations
- Better security

**Cons:**
- Higher resource usage
- More complex setup
- Higher cost

---

## Setup: Multiple Users

### Scenario: Team of 5 people, 1 project

#### Prerequisites

- Docker & Docker Compose installed
- Vibe Stack cloned
- Network connectivity between users

#### Step 1: Default Deployment

```bash
# Start Vibe Stack (default configuration)
make up
```

This starts:
- Open WebUI on port 8081
- MCP Server on port 4001
- Vibe-Kanban on port 4000

#### Step 2: Configure External Access

By default, services are accessible only on localhost.

**Option A: Local Network Access**

Edit `.env`:
```bash
# Allow external connections
VIBE_HOST=0.0.0.0
OPEN_WEBUI_HOST=0.0.0.0
```

Restart:
```bash
make down && make up
```

**Option B: Remote Access with SSL**

See: [Remote Access Guide](../04-api/04-remote-access.md)

#### Step 3: Share Access URLs

Send these URLs to your team:

```
Vibe-Kanban:  http://YOUR_IP:4000
Open WebUI:   http://YOUR_IP:8081
MCP Server:   http://YOUR_IP:4001/health
```

#### Step 4: User Accounts in Open WebUI

Each user creates their own account:

1. Navigate to: `http://YOUR_IP:8081`
2. Click "Sign Up"
3. Create individual account
4. Admin can manage users in Settings

#### Step 5: Configure MCP Connection

Each user connects to MCP server:

1. Open WebUI → Settings → MCP Servers
2. Add MCP Server:
   ```
   Name: Vibe Stack Team
   Type: HTTP
   URL: http://YOUR_IP:4001/mcp
   ```
3. Test Connection
4. Save

#### Step 6: Verify Collaboration

1. User A creates tasks
2. User B opens Vibe-Kanban
3. Both see the same tasks

**Success!** Your team can now collaborate.

---

## Setup: Multiple Open WebUI Instances

### Scenario: 10 users, 2 teams, 1 project

Each team wants their own Open WebUI instance.

#### Step 1: Create Docker Compose Override

Create `docker-compose.multi-webui.yml`:

```yaml
services:
  # Team A Open WebUI
  open-webui-team-a:
    image: ghcr.io/open-webui/open-webui:main
    container_name: vibe-open-webui-team-a
    ports:
      - "8081:8080"
    environment:
      - DATA_DIR=/app/backend/data
    volumes:
      - open-webui-team-a-data:/app/backend/data
    depends_on:
      - mcp-server
    networks:
      - vibe-network

  # Team B Open WebUI
  open-webui-team-b:
    image: ghcr.io/open-webui/open-webui:main
    container_name: vibe-open-webui-team-b
    ports:
      - "8082:8080"
    environment:
      - DATA_DIR=/app/backend/data
    volumes:
      - open-webui-team-b-data:/app/backend/data
    depends_on:
      - mcp-server
    networks:
      - vibe-network

volumes:
  open-webui-team-a-data:
  open-webui-team-b-data:
```

#### Step 2: Start Services

```bash
docker compose -f docker-compose.yml -f docker-compose.multi-webui.yml up -d
```

#### Step 3: Configure Each Instance

**Team A:**
- URL: `http://YOUR_IP:8081`
- Create accounts for Team A users
- Connect to MCP: `http://YOUR_IP:4001/mcp`

**Team B:**
- URL: `http://YOUR_IP:8082`
- Create accounts for Team B users
- Connect to MCP: `http://YOUR_IP:4001/mcp`

#### Step 4: Verify

Both teams can:
- Use their own Open WebUI instance
- Connect to shared MCP server
- Collaborate on shared Kanban board

---

## Setup: Multiple Kanban Boards

### Scenario: 2 projects, separate task boards

#### Step 1: Create Multiple Bridge Files

```bash
# Project A bridge file
export BRIDGE_FILE_A=./project-a-bridge.json

# Project B bridge file
export BRIDGE_FILE_B=./project-b-bridge.json
```

#### Step 2: Create Docker Compose Override

Create `docker-compose.multi-board.yml`:

```yaml
services:
  # Project A Kanban
  vibe-kanban-project-a:
    image: ghcr.io/resinder/vibe-kanban:latest
    container_name: vibe-kanban-project-a
    ports:
      - "4000:3000"
    environment:
      - BRIDGE_FILE=/data/project-a-bridge.json
    volumes:
      - ./project-a-bridge.json:/data/project-a-bridge.json
    networks:
      - vibe-network

  # Project B Kanban
  vibe-kanban-project-b:
    image: ghcr.io/resinder/vibe-kanban:latest
    container_name: vibe-kanban-project-b
    ports:
      - "4010:3000"
    environment:
      - BRIDGE_FILE=/data/project-b-bridge.json
    volumes:
      - ./project-b-bridge.json:/data/project-b-bridge.json
    networks:
      - vibe-network

  # MCP Server (supports multiple boards)
  mcp-server:
    environment:
      - BRIDGE_FILE_PATH=/data/project-a-bridge.json
      # Or configure multiple bridge files in code
```

#### Step 3: Configure MCP Server for Multiple Boards

Edit `mcp-server/src/config/constants.js`:

```javascript
export const CONFIG = {
  name: 'vibe-stack-mcp-mc',
  version: '1.0.0',

  // Support multiple boards
  boards: {
    projectA: {
      bridgeFile: '/data/project-a-bridge.json',
      port: 4000
    },
    projectB: {
      bridgeFile: '/data/project-b-bridge.json',
      port: 4010
    }
  }
};
```

#### Step 4: Use Board Selection in Open WebUI

When creating tasks, specify the board:

```
Create tasks for "Project A":
Implement authentication system
```

AI will create tasks in Project A board.

---

## Setup: Complete Multi-Tenant

### Scenario: 3 organizations, complete isolation

Each organization has:
- Own Open WebUI instance(s)
- Own MCP server
- Own Kanban board
- Complete data isolation

#### Step 1: Directory Structure

```
vibe-stack/
├── tenants/
│   ├── tenant-a/
│   │   ├── docker-compose.yml
│   │   ├── .env
│   │   └── data/
│   ├── tenant-b/
│   │   ├── docker-compose.yml
│   │   ├── .env
│   │   └── data/
│   └── tenant-c/
│       ├── docker-compose.yml
│       ├── .env
│       └── data/
```

#### Step 2: Tenant A Configuration

Create `tenants/tenant-a/docker-compose.yml`:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: tenant-a-open-webui
    ports:
      - "8081:8080"
    volumes:
      - tenant-a-webui-data:/app/backend/data
    networks:
      - tenant-a-network

  mcp-server:
    build: ../../mcp-server
    container_name: tenant-a-mcp-server
    ports:
      - "4001:4001"
    environment:
      - BRIDGE_FILE_PATH=/data/tenant-a-bridge.json
      - PORT=4001
    volumes:
      - ./data/tenant-a-bridge.json:/data/tenant-a-bridge.json
    networks:
      - tenant-a-network

  vibe-kanban:
    image: ghcr.io/resinder/vibe-kanban:latest
    container_name: tenant-a-vibe-kanban
    ports:
      - "4000:3000"
    environment:
      - BRIDGE_FILE=/data/tenant-a-bridge.json
    volumes:
      - ./data/tenant-a-bridge.json:/data/tenant-a-bridge.json
    networks:
      - tenant-a-network

volumes:
  tenant-a-webui-data:

networks:
  tenant-a-network:
    driver: bridge
```

#### Step 3: Tenant B Configuration

Create `tenants/tenant-b/docker-compose.yml`:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: tenant-b-open-webui
    ports:
      - "8082:8080"
    volumes:
      - tenant-b-webui-data:/app/backend/data
    networks:
      - tenant-b-network

  mcp-server:
    build: ../../mcp-server
    container_name: tenant-b-mcp-server
    ports:
      - "4011:4011"
    environment:
      - BRIDGE_FILE_PATH=/data/tenant-b-bridge.json
      - PORT=4011
    volumes:
      - ./data/tenant-b-bridge.json:/data/tenant-b-bridge.json
    networks:
      - tenant-b-network

  vibe-kanban:
    image: ghcr.io/resinder/vibe-kanban:latest
    container_name: tenant-b-vibe-kanban
    ports:
      - "4010:3000"
    environment:
      - BRIDGE_FILE=/data/tenant-b-bridge.json
    volumes:
      - ./data/tenant-b-bridge.json:/data/tenant-b-bridge.json
    networks:
      - tenant-b-network

volumes:
  tenant-b-webui-data:

networks:
  tenant-b-network:
    driver: bridge
```

#### Step 4: Start All Tenants

```bash
# Start Tenant A
cd tenants/tenant-a
docker compose up -d

# Start Tenant B
cd ../tenant-b
docker compose up -d

# Start Tenant C
cd ../tenant-c
docker compose up -d
```

#### Step 5: Verify Isolation

**Tenant A Access:**
- Open WebUI: `http://YOUR_IP:8081`
- MCP Server: `http://YOUR_IP:4001`
- Kanban: `http://YOUR_IP:4000`

**Tenant B Access:**
- Open WebUI: `http://YOUR_IP:8082`
- MCP Server: `http://YOUR_IP:4011`
- Kanban: `http://YOUR_IP:4010`

**Tenant C Access:**
- Open WebUI: `http://YOUR_IP:8083`
- MCP Server: `http://YOUR_IP:4021`
- Kanban: `http://YOUR_IP:4020`

Each tenant is completely isolated!

---

## Configuration

### Environment Variables

**For Multiple MCP Servers:**

```bash
# Tenant A
MCP_SERVER_A_PORT=4001
MCP_SERVER_A_BRIDGE=/data/tenant-a-bridge.json

# Tenant B
MCP_SERVER_B_PORT=4011
MCP_SERVER_B_BRIDGE=/data/tenant-b-bridge.json
```

**For Multiple Open WebUI Instances:**

```bash
# Team A
OPEN_WEBUI_A_PORT=8081
OPEN_WEBUI_A_DATA=/data/team-a

# Team B
OPEN_WEBUI_B_PORT=8082
OPEN_WEBUI_B_DATA=/data/team-b
```

### Port Mapping

| Service | Tenant A | Tenant B | Tenant C |
|---------|----------|----------|----------|
| Open WebUI | 8081 | 8082 | 8083 |
| MCP Server | 4001 | 4011 | 4021 |
| Vibe-Kanban | 4000 | 4010 | 4020 |

### Resource Limits

Configure in `docker-compose.yml`:

```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## Security

### Authentication

**Open WebUI:**
- Built-in user authentication
- Role-based access control
- API key management

**Vibe-Kanban:**
- Optional authentication (configure in `.env`)
- Recommended for external access

**MCP Server:**
- No authentication by default
- Use reverse proxy with auth (nginx, traefik)
- See: [Security Guide](../05-operations/05-security.md)

### Network Isolation

Each tenant uses separate Docker networks:

```yaml
networks:
  tenant-a-network:
    driver: bridge
    internal: false  # Set to true for complete isolation
```

### Data Isolation

Each tenant has separate data volumes:

```yaml
volumes:
  tenant-a-bridge-data:
    driver: local
  tenant-b-bridge-data:
    driver: local
```

---

## Troubleshooting

### Port Conflicts

**Problem:** Multiple tenants trying to use same port

**Solution:** Use unique ports per tenant

```bash
# Check port usage
netstat -tuln | grep LISTEN

# Change ports in docker-compose.yml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### MCP Server Connection Issues

**Problem:** Open WebUI can't connect to MCP server

**Solutions:**

1. **Check if server is running:**
   ```bash
   curl http://localhost:PORT/health
   ```

2. **Use correct URL in Open WebUI:**
   - Local: `http://localhost:PORT/mcp`
   - Remote: `http://YOUR_IP:PORT/mcp`
   - Docker: `http://host.docker.internal:PORT/mcp`

3. **Check firewall rules:**
   ```bash
   sudo ufw allow PORT
   ```

### Data Isolation Issues

**Problem:** Seeing data from other tenants

**Solutions:**

1. **Verify bridge files are separate:**
   ```bash
   ls -la tenants/*/data/*.json
   ```

2. **Check volume mappings:**
   ```bash
   docker inspect CONTAINER_NAME | grep Mounts
   ```

3. **Restart affected services:**
   ```bash
   docker compose restart
   ```

### Performance Issues

**Problem:** Slow response with multiple tenants

**Solutions:**

1. **Add resource limits:**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1G
   ```

2. **Use separate servers for large deployments**

3. **Monitor resource usage:**
   ```bash
   docker stats
   ```

---

## Best Practices

### For Small Teams (2-5 users)

1. Use single MCP server
2. Shared Kanban board
3. Individual Open WebUI accounts
4. Local network access

### For Medium Teams (5-15 users)

1. Multiple Open WebUI instances
2. Single MCP server with resource limits
3. Project-specific Kanban boards
4. Remote access with SSL

### For Large Organizations (15+ users)

1. Complete multi-tenant setup
2. Dedicated MCP servers per team
3. Reverse proxy with authentication
4. Centralized monitoring
5. Backup and disaster recovery

---

## Next Steps

- [Deployment Guide](../05-operations/02-deployment.md) - Production deployment
- [Security Guide](../05-operations/05-security.md) - Securing multi-tenant setup
- [Monitoring Guide](../05-operations/03-monitoring.md) - Monitor multiple instances

---

**Need Help?** See:
- [FAQ](../02-user-guide/05-faq.md)
- [Troubleshooting](../06-development/03-troubleshooting.md)
- [Remote Access Setup](../04-api/04-remote-access.md)

---

**Last Updated:** 2026-01-29
**MCP Server Version:** 1.0.0
