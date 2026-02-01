# Vibe Stack - External Open WebUI Integration Guide

Complete guide for connecting external Open WebUI instances to Vibe Stack MCP Server.

---

## Table of Contents

- [Overview](#overview)
- [Connection Methods](#connection-methods)
- [Network Configuration](#network-configuration)
- [Security Setup](#security-setup)
- [Configuration Steps](#configuration-steps)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## Overview

Vibe Stack MCP Server supports integration with **both local and external Open WebUI instances**. This enables:

- ✅ **Local Development**: Use the bundled Open WebUI at `http://localhost:8081`
- ✅ **Remote Access**: Connect from external Open WebUI instances
- ✅ **Multiple Instances**: Connect multiple Open WebUI instances to one Vibe Stack
- ✅ **Cloud Deployment**: Use cloud-hosted Open WebUI with on-premise Vibe Stack

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     External Open WebUI                          │
│                  (Any hosting - Cloud/VPS)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP API (port 4001)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Vibe Stack MCP Server                        │
│                   Tools: 90+ MCP tools available               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Bridge file sync
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Vibe-Kanban Board                          │
│                   Tasks: Create, Update, Move                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Connection Methods

### Method 1: Docker STDIO (Same Machine)

**Use case**: Open WebUI and Vibe Stack on the same machine

**Configuration in Open WebUI**:

1. Go to **Settings → MCP Servers**
2. Click **Add MCP Server**
3. Configure:
   ```
   Name: Vibe Stack (Local)
   Type: STDIO
   Command: docker exec -i vibe-mcp-server node /app/index.js
   ```
4. Click **Save** and **Test Connection**

**Verify**:
```bash
# Test MCP Server is running
docker ps | grep vibe-mcp-server

# Test health endpoint
curl http://localhost:4001/health
```

---

### Method 2: HTTP API (Local Network)

**Use case**: Open WebUI and Vibe Stack on different machines in the same network

**Configuration in Open WebUI**:

1. Go to **Settings → MCP Servers**
2. Click **Add MCP Server**
3. Configure:
   ```
   Name: Vibe Stack (Network)
   Type: HTTP
   URL: http://192.168.1.100:4001
   ```
   *(Replace `192.168.1.100` with your Vibe Stack host IP)*
4. Click **Save** and **Test Connection**

**Find your Vibe Stack IP**:
```bash
# Linux/Mac
hostname -I

# Windows
ipconfig

# Or from Vibe Stack machine
curl ifconfig.me
```

---

### Method 3: HTTP API (Internet/Cloud)

**Use case**: Open WebUI hosted in the cloud, Vibe Stack on-premise or vice versa

**Configuration in Open WebUI**:

1. Go to **Settings → MCP Servers**
2. Click **Add MCP Server**
3. Configure:
   ```
   Name: Vibe Stack (Cloud)
   Type: HTTP
   URL: https://vibe-stack.yourdomain.com
   API Key: your-api-key-here  # If authentication enabled
   ```
4. Click **Save** and **Test Connection**

**Requirements**:
- Domain name pointed to Vibe Stack host
- Port forwarding configured (port 4001)
- SSL certificate (recommended)
- Firewall rules allowing traffic

---

## Network Configuration

### Local Network Access

#### 1. Find Vibe Stack IP Address

```bash
# On Vibe Stack host machine
ip addr show

# Or
hostname -I
```

#### 2. Configure Firewall

**Ubuntu/Debian**:
```bash
# Allow port 4001
sudo ufw allow 4001/tcp

# Check status
sudo ufw status
```

**CentOS/RHEL**:
```bash
# Allow port 4001
sudo firewall-cmd --permanent --add-port=4001/tcp
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-ports
```

**Windows**:
```
Windows Defender Firewall → Advanced Settings → Inbound Rules
→ New Rule → Port → TCP → 4001 → Allow → Finish
```

#### 3. Test Access

```bash
# From another machine on the network
curl http://VIBE_STACK_IP:4001/health

# Should return:
# {"status":"healthy","server":"vibe-stack-mcp","version":"1.0.0"}
```

---

### Internet Access (Port Forwarding)

#### 1. Configure Router Port Forwarding

Access your router admin panel (usually `http://192.168.1.1` or `http://192.168.0.1`):

**Port Forwarding Rule**:
```
External Port: 4001
Internal Port: 4001
Internal IP: [Your Vibe Stack machine IP]
Protocol: TCP
```

#### 2. Configure Dynamic DNS (Optional)

If you don't have a static IP, use a service like:

- **No-IP** (https://www.noip.com/)
- **DuckDNS** (https://www.duckdns.org/)
- **Cloudflare** (if using Cloudflare DNS)

**Example with DuckDNS**:
```bash
# Install duckdns client
curl https://www.duckdns.org/update/your-domain/your-token

# Now access via: http://yourdomain.duckdns.org:4001
```

#### 3. Test External Access

```bash
# From external network (e.g., your phone with WiFi off)
curl http://YOUR_PUBLIC_IP:4001/health

# Or with domain
curl http://yourdomain.duckdns.org:4001/health
```

---

## Security Setup

### ⚠️ Important Security Notes

**By default, MCP Server has NO authentication**. For external access, you MUST add security:

### Option 1: Reverse Proxy with Authentication

**Using Nginx**:

1. **Install Nginx**:
```bash
sudo apt-get install nginx
```

2. **Create configuration** (`/etc/nginx/sites-available/vibe-stack`):
```nginx
server {
    listen 4001;
    server_name your-domain.com;

    # Basic authentication
    auth_basic "Vibe Stack MCP";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Create password file**:
```bash
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

4. **Enable and restart**:
```bash
sudo ln -s /etc/nginx/sites-available/vibe-stack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: API Key Authentication

**Add to MCP Server** (requires code modification):

1. **Create middleware** (`mcp-server/src/middleware/auth.js`):
```javascript
export function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.MCP_API_KEY;

    if (!validKey) {
        return next(); // No auth required if not configured
    }

    if (apiKey === validKey) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid API key' });
    }
}
```

2. **Add to .env**:
```bash
MCP_API_KEY=your-secure-random-api-key
```

3. **Configure in Open WebUI**:
```
URL: http://your-domain.com:4001
Headers: X-API-Key: your-secure-random-api-key
```

### Option 3: VPN (Recommended for Production)

**Use WireGuard** or **Tailscale** for secure access:

**Tailscale Setup**:
1. Install Tailscale on Vibe Stack host
2. Install Tailscale on Open WebUI host
3. Connect via Tailscale IP addresses
4. All traffic encrypted, no port forwarding needed

---

## Configuration Steps

### Step 1: Prepare Vibe Stack

```bash
# Start Vibe Stack
cd vibe-stack
make up

# Verify MCP Server is running
docker ps | grep vibe-mcp-server

# Test health endpoint
curl http://localhost:4001/health
```

### Step 2: Configure Network Access

**For local network access**:
```bash
# Find your IP
ip addr show

# Configure firewall
sudo ufw allow 4001/tcp

# Test from another machine
curl http://YOUR_IP:4001/health
```

**For internet access**:
1. Configure port forwarding on router (port 4001)
2. Set up dynamic DNS (optional)
3. Configure authentication (REQUIRED!)
4. Test external access

### Step 3: Configure Open WebUI

**In Open WebUI Settings → MCP Servers**:

**For local access**:
```
Name: Vibe Stack
Type: HTTP
URL: http://192.168.1.XXX:4001
```

**For internet access**:
```
Name: Vibe Stack (Remote)
Type: HTTP
URL: https://your-domain.com
API Key: your-api-key  # If using authentication
```

### Step 4: Test Connection

1. Click **Test Connection** in Open WebUI
2. Should show: **"Connected successfully"**
3. Verify tools appear in the list

### Step 5: Generate Tasks

1. Open a chat in Open WebUI
2. Type: "Create a task plan for building a REST API"
3. AI will use MCP tools to generate tasks
4. Tasks appear in Vibe Kanban board

---

## Troubleshooting

### Connection Refused

**Problem**: `curl: (7) Failed to connect`

**Solutions**:
```bash
# Check if MCP Server is running
docker ps | grep vibe-mcp-server

# Check if port is listening
netstat -tlnp | grep 4001

# Check firewall
sudo ufw status

# Restart MCP Server
docker-compose restart mcp-server
```

---

### Timeout Connecting

**Problem**: Connection times out

**Solutions**:
```bash
# Check network connectivity
ping VIBE_STACK_IP

# Telnet to port
telnet VIBE_STACK_IP 4001

# Check router port forwarding
# Access router admin panel and verify rules
```

---

### Tools Not Showing

**Problem**: Connection successful but no tools appear

**Solutions**:
```bash
# Check MCP Server logs
docker logs vibe-mcp-server --tail 50

# Verify tools endpoint
curl http://VIBE_STACK_IP:4001/v1/functions

# Should return JSON with 90+ tools
```

---

### CORS Errors

**Problem**: Browser shows CORS errors

**Solution**: Configure CORS in MCP Server (if needed):

**Add to `mcp-server/src/http/server.js`**:
```javascript
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-API-Key');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});
```

---

## Production Deployment

### Recommended Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │ Open WebUI   │        │  Reverse     │                  │
│  │  (Cloud)     │◄───────►   Proxy      │                  │
│  │  HTTPS:443   │        │  (Nginx)     │                  │
│  └──────────────┘        └──────┬───────┘                  │
│                                  │                            │
│                                  │ VPN (Tailscale)           │
│                                  │                            │
│  ┌──────────────┐        ┌──────▼───────┐                  │
│  │ Vibe Stack   │◄───────►   Firewall   │                  │
│  │   (On-Prem)  │        │   (Internal) │                  │
│  └──────────────┘        └──────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Security Checklist

- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure authentication (API key or OAuth)
- [ ] Set up VPN for remote access
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Backup strategy in place

### Performance Tuning

**For high-traffic deployments**:

1. **Enable caching** in reverse proxy
2. **Use load balancer** for multiple MCP Server instances
3. **Optimize database** queries
4. **Monitor resources** and scale as needed

---

## Example Configurations

### Cloud Open WebUI + On-Premise Vibe Stack

**Open WebUI** (hosted on Railway/Render/AWS):
```
Settings → MCP Servers → Add
Name: Company Vibe Stack
URL: https://vibe-stack.company.com
API Key: prod-api-key-xxxxx
```

**Vibe Stack** (on-premise server):
```bash
# Run behind nginx with SSL
# Configure API key authentication
# Use Tailscale for VPN
```

---

### Multiple Open WebUI Instances

**Development Team**:
```
Open WebUI 1 (Developer 1) ──┐
Open WebUI 2 (Developer 2) ──┼──► Vibe Stack MCP Server ──► Vibe Kanban
Open WebUI 3 (Developer 3) ──┘
```

**Configuration**:
- All Open WebUI instances connect to same MCP Server URL
- Tasks synchronized across all users
- Real-time collaboration

---

## Testing Your Setup

### 1. Test MCP Server Health

```bash
curl http://YOUR_IP:4001/health

# Expected response:
# {"status":"healthy","server":"vibe-stack-mcp","version":"1.0.0"}
```

### 2. Test Tool Listing

```bash
curl http://YOUR_IP:4001/v1/functions

# Should return 90+ tools:
# vibe_get_board, vibe_create_task, vibe_generate_plan, etc.
```

### 3. Test Task Creation

```bash
curl -X POST http://YOUR_IP:4001/v1/tools/vibe_create_task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test from external Open WebUI",
    "description": "Verifying external access works",
    "priority": "high",
    "lane": "todo"
  }'
```

### 4. Verify in Vibe Kanban

Open http://localhost:4000 and verify the task appears.

---

## Summary

✅ **Vibe Stack fully supports external Open WebUI instances**

**Connection Options**:
- Local: Docker STDIO
- Network: HTTP API
- Internet: HTTP API + port forwarding

**Security**:
- Use reverse proxy with authentication
- Implement API key authentication
- Consider VPN for production

**Next Steps**:
1. Choose connection method
2. Configure network access
3. Set up security
4. Configure Open WebUI
5. Test integration

---

**For more information**:
- **[API Overview](../04-api/01-api-overview.md)** - Complete API reference
- **[OPENWEBUI.md](OPENWEBUI.md)** - Local Open WebUI guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[SECURITY.md](../SECURITY.md)** - Security guidelines

---

**Need help?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or [FAQ.md](FAQ.md)
