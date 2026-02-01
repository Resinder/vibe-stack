# Vibe Stack - Security Implementation Guide

Comprehensive security implementation guide for Vibe Stack production deployments.

---

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Network Security](#network-security)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Secret Management](#secret-management)
- [Audit Logging](#audit-logging)
- [Security Hardening](#security-hardening)
- [Compliance](#compliance)

---

## Security Overview

Vibe Stack implements multiple layers of security:

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Network Security    → Firewall, TLS, VPN               │
│  2. Authentication      → JWT, OAuth, API Keys             │
│  3. Authorization       → RBAC, Lane Permissions           │
│  4. Input Validation    → Sanitization, Schema Validation  │
│  5. Data Protection     → Encryption at Rest/Transit       │
│  6. Audit Logging       → Activity Tracking                │
│  7. Secret Management   → Vault, Environment Variables     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Current Security Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Input Sanitization** | ✅ Implemented | Path traversal, injection protection |
| **HTTPS/TLS** | ⚠️ Optional | Requires nginx setup |
| **Authentication** | ⚠️ Basic | code-server has password, services open |
| **Authorization** | ❌ Not Implemented | No RBAC currently |
| **Audit Logging** | ❌ Not Implemented | No activity tracking |
| **Secret Management** | ⚠️ Basic | Environment variables only |

---

## Authentication

### Option 1: API Key Authentication (Recommended for API)

**Implementation:**

```javascript
// mcp-server/src/middleware/auth.js
const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  const validKeys = process.env.API_KEYS.split(',');
  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  req.apiKey = apiKey;
  next();
}

module.exports = { generateApiKey, validateApiKey };
```

**Usage:**

```javascript
// Apply to routes
app.use('/api/tools', validateApiKey);
```

**Generate API Keys:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Option 2: JWT Authentication (Recommended for Web UI)

**Implementation:**

```javascript
// mcp-server/src/middleware/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

module.exports = { generateToken, verifyToken };
```

---

### Option 3: OAuth 2.0 / SSO (Enterprise)

**Setup with OAuth2 Proxy:**

```yaml
# docker-compose.security.yml
version: '3.8'

services:
  oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:v7.5.1
    container_name: vibe-oauth2-proxy
    ports:
      - "4180:4180"
    environment:
      - OAUTH2_PROXY_PROVIDER=google
      - OAUTH2_PROXY_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH2_PROXY_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
      - OAUTH2_PROXY_COOKIE_SECRET=${OAUTH_COOKIE_SECRET}
      - OAUTH2_PROXY_EMAIL_DOMAIN=your-domain.com
      - OAUTH2_PROXY_UPSTREAMS=http://vibe-kanban:4000
      - OAUTH2_PROXY_HTTP_ADDRESS=0.0.0.0:4180
    networks:
      - vibe-network
```

---

## Authorization

### Role-Based Access Control (RBAC)

**Define Roles:**

```javascript
// mcp-server/src/middleware/rbac.js
const ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  [ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
  [ROLES.DEVELOPER]: ['create', 'read', 'update'],
  [ROLES.VIEWER]: ['read']
};

function checkPermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role || ROLES.VIEWER;
    const allowed = PERMISSIONS[userRole]?.includes(permission);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = { ROLES, checkPermission };
```

**Usage:**

```javascript
// Protected routes
app.post('/api/tasks', verifyToken, checkPermission('create'), createTask);
app.delete('/api/tasks/:id', verifyToken, checkPermission('delete'), deleteTask);
```

---

### Lane-Level Permissions

**Configuration:**

```json
{
  "lanePermissions": {
    "backlog": ["admin", "developer", "viewer"],
    "todo": ["admin", "developer", "viewer"],
    "in_progress": ["admin", "developer"],
    "code_review": ["admin", "developer"],
    "done": ["admin", "developer", "viewer"],
    "recovery": ["admin"]
  }
}
```

---

## Network Security

### TLS/SSL Setup

**Using Let's Encrypt with Certbot:**

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d vibe-stack.yourdomain.com

# Certificates will be saved to:
# /etc/letsencrypt/live/vibe-stack.yourdomain.com/
```

**Nginx Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name vibe-stack.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vibe-stack.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibe-stack.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Vibe-Kanban
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Firewall Configuration

**UFW (Ubuntu):**

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow VPN (Tailscale)
sudo ufw allow 41641/udp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

### VPN for Remote Access

**Tailscale (Recommended):**

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Connect to VPN
sudo tailscale up

# Access services via Tailscale IP
tailscale ip -4
```

**WireGuard:**

```bash
# Install WireGuard
sudo apt-get install wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure interface
sudo wg-quick up wg0
```

---

## Data Protection

### Encryption at Rest

**Using Docker Secrets:**

```yaml
# docker-compose.security.yml
version: '3.8'

services:
  mcp-server:
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

---

### Encryption in Transit

**Force HTTPS:**

```nginx
server {
    listen 80;
    server_name vibe-stack.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

### Database Encryption

**PostgreSQL Encryption:**

```sql
-- Enable encryption
ALTER DATABASE vibe_stack WITH ENCRYPTION = ON;

-- Encrypt specific columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted data
INSERT INTO tasks (title, encrypted_data)
VALUES ('Task Title', pgp_sym_encrypt('Sensitive data', 'encryption-key'));
```

---

## API Security

### Rate Limiting

**Implementation:**

```javascript
// mcp-server/src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many write requests',
});

app.use('/api/', limiter);
app.use('/api/tasks', strictLimiter);
app.post('/api/tasks', strictLimiter);
```

---

### CORS Configuration

**Secure CORS:**

```javascript
// mcp-server/src/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

### Input Validation

**Already Implemented in Vibe Stack:**

```javascript
// mcp-server/src/utils/sanitizer.js
const sanitizer = require('./sanitizer');

function createTask(req, res) {
  const sanitized = sanitizer.sanitizeTaskInput(req.body);
  // ... process sanitized input
}
```

---

## Secret Management

### Environment Variables

**Secure .env setup:**

```bash
# .env
JWT_SECRET=$(openssl rand -hex 32)
API_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
CODE_SERVER_PASSWORD=$(openssl rand -hex 16)
```

---

### HashiCorp Vault (Enterprise)

**Setup:**

```bash
# Install Vault
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

# Configure
export VAULT_ADDR='http://127.0.0.1:8200'
vault login token=<your-token>

# Store secrets
vault kv put secret/vibe-stack db_password=value api_key=value
```

---

### AWS Secrets Manager

**Usage:**

```javascript
const AWS = require('aws-sdk');

async function getSecret(secretName) {
  const client = new AWS.SecretsManager({ region: 'us-east-1' });
  const response = await client.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(response.SecretString);
}
```

---

## Audit Logging

### Implementation

```javascript
// mcp-server/src/middleware/audit.js
const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || './logs/audit.log';

function auditLog(action) {
  return (req, res, next) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method,
      body: req.body
    };

    fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(logEntry) + '\n');
    next();
  };
}

module.exports = auditLog;
```

**Usage:**

```javascript
app.post('/api/tasks', auditLog('task.create'), createTask);
app.put('/api/tasks/:id', auditLog('task.update'), updateTask);
app.delete('/api/tasks/:id', auditLog('task.delete'), deleteTask);
```

---

### Log Analysis

**View audit logs:**

```bash
# View recent activity
tail -f logs/audit.log

# Search for specific user
grep "user-123" logs/audit.log

# Count actions by type
awk -F'"' '{print $8}' logs/audit.log | sort | uniq -c
```

---

## Security Hardening

### Docker Security

**Secure Docker Daemon:**

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "icc": false,
  "userns-remap": "default"
}
```

**Run as Non-Root:**

```dockerfile
# Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

WORKDIR /app
...
```

---

### Operating System Hardening

**Disable unused services:**

```bash
# Disable unused services
sudo systemctl disable bluetooth
sudo systemctl disable cups

# Enable automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Compliance

### GDPR Compliance

**Data Protection:**

```javascript
// Implement right to be forgotten
function deleteUser(userId) {
  // Delete all user data
  // Anonymize audit logs
  // Confirm deletion
}
```

---

### SOC 2 Compliance

**Required Controls:**

- Access controls
- Data encryption
- Audit logging
- Change management
- Incident response

---

## Security Checklist

### Pre-Deployment Checklist

- [ ] All services use HTTPS/TLS
- [ ] Strong passwords (20+ characters)
- [ ] API keys generated and stored securely
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Audit logging enabled
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] VPN for remote access
- [ ] Backup and recovery plan

---

## Related Documentation

- **[API_REFERENCE.md](API_REFERENCE.md)** - API security
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Secure deployment
- **[MONITORING.md](MONITORING.md)** - Security monitoring
- **[PERFORMANCE.md](PERFORMANCE.md)** - Security performance

---

**Report Security Issues:** See [SECURITY.md](../SECURITY.md)
