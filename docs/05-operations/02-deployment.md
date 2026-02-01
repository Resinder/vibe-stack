# Vibe Stack - Deployment Guide

Complete guide for deploying Vibe Stack to production.

> **Note:** For basic installation and local development setup, see the **[Installation Guide](02-installation.md)**. This guide covers production deployment.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Options](#deployment-options)
3. [Production Configuration](#production-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Reverse Proxy Setup](#reverse-proxy-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Scaling](#scaling)

---

## Pre-Deployment Checklist

### Security

- [ ] Change all default passwords
- [ ] Set strong admin passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Review `.gitignore` to ensure secrets aren't committed
- [ ] Enable rate limiting if exposing publicly

### Configuration

- [ ] Update `.env` with production values
- [ ] Set appropriate resource limits
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review all environment variables
- [ ] Test in staging environment first

### Infrastructure

- [ ] Sufficient resources (CPU, RAM, disk)
- [ ] Network connectivity between services
- [ ] Persistent storage for volumes
- [ ] DNS records configured
- [ ] Load balancer (if needed)
- [ ] Disaster recovery plan

---

## Deployment Options

### Option 1: Single Server (Simple)

**Best for:** Small teams, development, testing

```
┌─────────────────────────────────┐
│      Single Server              │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Docker Compose          │  │
│  │  - All 4 services        │  │
│  └──────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Pros:** Simple, easy to manage
**Cons:** Single point of failure, limited scalability

### Option 2: Multi-Server (Production)

**Best for:** Production, high availability

```
┌──────────────┐     ┌──────────────┐
│   App Server 1     │   App Server 2 │
│                 │                 │
│  ┌───────────┐ │   │  ┌───────────┐ │
│  │ Vibe Stack │ │   │  │ Vibe Stack │ │
│  └───────────┘ │   │  └───────────┘ │
└──────────────┘     └──────────────┘
        │                    │
        └────────┬───────────┘
                 ▼
        ┌──────────────┐
        │  Database    │
        │  (Optional)  │
        └──────────────┘
```

**Pros:** High availability, scalable
**Cons:** More complex, requires load balancer

### Option 3: Cloud-Native (Kubernetes)

**Best for:** Large scale, enterprise

```
┌──────────────────────────────────────┐
│          Kubernetes Cluster           │
│                                      │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ Pod │  │ Pod │  │ Pod │  ...    │
│  └─────┘  └─────┘  └─────┘         │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      Shared Storage/DB         │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Pros:** Auto-scaling, self-healing
**Cons:** Complex setup, requires Kubernetes expertise

---

## Production Configuration

### Environment Variables

Create production `.env`:

```bash
# ============================================================================
# REQUIRED: Change these for production!
# ============================================================================

# code-server password (REQUIRED - change this!)
CODE_SERVER_PASSWORD=your-secure-random-password-here

# Ports (optional - change if needed)
VIBE_PORT=4000
CODE_SERVER_PORT=8443
OPEN_WEBUI_PORT=8081

# ============================================================================
# OPTIONAL: Advanced Configuration
# ============================================================================

# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Vibe-Kanban configuration
VIBE_KANBAN_URL=http://localhost:4000

# MCP Server configuration
HTTP_PORT=4001
BRIDGE_FILE=/data/.vibe-kanban-bridge.json

# Node environment
NODE_ENV=production
```

### Resource Limits

For production, ensure adequate resources in `docker-compose.yml`:

```yaml
services:
  vibe-kanban:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
      window: 120s

  mcp-server:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 64M

  code-server:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M

  open-webui:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## Docker Deployment

### 1. Prepare Server

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/Resinder/vibe-stack.git
cd vibe-stack

# Configure environment
cp .env.example .env
nano .env  # Edit production values

# Start services
docker-compose up -d

# Verify health
make health
```

### 3. Configure Auto-Start

Create `/etc/systemd/system/vibe-stack.service`:

```ini
[Unit]
Description=Vibe Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/vibe-stack
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable vibe-stack
sudo systemctl start vibe-stack
```

---

## Cloud Deployment

### AWS (Amazon Web Services)

#### Using ECS

1. **Create ECR Repository**:
```bash
aws ecr create-repository --repository-name vibe-stack
```

2. **Build and Push Image**:
```bash
docker build -t vibe-stack .
aws ecr get-login-password | docker login --username AWS --password-stdin <your-ecr-url>
docker tag vibe-stack:latest <your-ecr-url>/vibe-stack:latest
docker push <your-ecr-url>/vibe-stack:latest
```

3. **Deploy to ECS**:
   - Create ECS Cluster
   - Create Task Definition
   - Create Service

#### Using EC2

```bash
# Launch EC2 instance
# - AMI: Ubuntu 22.04
# - Instance Type: t3.medium (minimum)
# - Security Group: Allow 4000, 4001, 8081, 8443

# SSH into instance
ssh ubuntu@<instance-ip>

# Install Docker
# Follow "Docker Deployment" steps above
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/vibe-stack

# Deploy to Cloud Run
gcloud run deploy vibe-stack \
  --image gcr.io/PROJECT_ID/vibe-stack \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Using GKE (Google Kubernetes Engine)

Create `k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-stack
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vibe-stack
  template:
    metadata:
      labels:
        app: vibe-stack
    spec:
      containers:
      - name: vibe-mcp
        image: gcr.io/PROJECT_ID/vibe-stack:latest
        ports:
        - containerPort: 4001
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
          limits:
            cpu: 500m
            memory: 256Mi
```

Deploy:
```bash
kubectl apply -f k8s/deployment.yaml
```

### Microsoft Azure

#### Using Container Instances

```bash
# Create resource group
az group create --name vibe-stack-rg --location eastus

# Create container
az container create \
  --resource-group vibe-stack-rg \
  --name vibe-stack \
  --image vibestack/vibe-stack:latest \
  --ports 4000 4001 8081 8443 \
  --cpu 2 \
  --memory 4
```

### DigitalOcean

#### Using App Platform

```bash
# Create app
doctl apps create --spec spec.yaml

# spec.yaml:
name: vibe-stack
services:
- name: vibe-mcp
  github:
    repo: Resinder/vibe-stack
    branch: main
  run_command: docker-compose up
  instance_count: 1
  instance_size_slug: basic-xxs
```

---

## Reverse Proxy Setup

### Nginx Configuration

Create `/etc/nginx/sites-available/vibe-stack`:

```nginx
server {
    listen 80;
    server_name vibe.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vibe.example.com;

    ssl_certificate /etc/ssl/certs/vibe-stack.crt;
    ssl_certificate_key /etc/ssl/private/vibe-stack.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Vibe-Kanban
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # MCP Server
    location /mcp/ {
        proxy_pass http://localhost:4001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Open WebUI
    location /webui/ {
        proxy_pass http://localhost:8081/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # code-server
    location /ide/ {
        proxy_pass http://localhost:8443/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/vibe-stack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Traefik (Docker-native)

Add to `docker-compose.yml`:

```yaml
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  vibe-kanban:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vibe.rule=Host(`vibe.example.com`)"
      - "traefik.http.routers.vibe.entrypoints=websecure"
      - "traefik.http.routers.vibe.tls=true"
      - "traefik.http.routers.vibe.tls.certresolver=myresolver"
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d vibe.example.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL Certificates

```bash
# Generate private key
openssl genrsa -out vibe-stack.key 2048

# Generate CSR
openssl req -new -key vibe-stack.key -out vibe-stack.csr

# Get certificate signed by CA
# (Use vibe-stack.csr with your CA)

# Combine files
cat vibe-stack.crt intermediate.crt > bundle.crt
```

### Self-Signed Certificates (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout vibe-stack.key \
  -out vibe-stack.crt \
  -subj "/CN=vibe.example.com"

# Configure nginx to use self-signed cert
# (Browsers will show warning - expected for self-signed)
```

---

## Monitoring & Logging

### Health Checks

```bash
# Add to crontab for monitoring
*/5 * * * * /usr/local/bin/curl -f http://localhost:4000/api/health || echo "Vibe-Kanban down" | mail -s "Alert" admin@example.com
```

### Log Aggregation (ELK Stack)

```bash
# Run ELK stack
docker-compose -f docker-compose.monitoring.yml up -d
```

Create `docker-compose.monitoring.yml`:
```yaml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.0.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### Metrics (Prometheus + Grafana)

```yaml
# Add to docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Backup Strategy

### Automated Backups

Create backup script `/opt/backup-vibe-stack.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/vibe-stack"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup volumes
docker run --rm \
  -v vibe-stack_vibe_data:/data \
  -v "$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/vibe-data-$DATE.tar.gz" -C /data .

docker run --rm \
  -v vibe-stack_code_server_data:/data \
  -v "$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/code-server-$DATE.tar.gz" -C /data .

# Backup configuration
cp .env "$BACKUP_DIR/env-$DATE.backup"
cp docker-compose.yml "$BACKUP_DIR/docker-compose-$DATE.yml"

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
0 2 * * * /opt/backup-vibe-stack.sh
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore volumes
docker run --rm \
  -v vibe-stack_vibe_data:/data \
  -v /backups/vibe-stack:/backup \
  alpine tar xzf "/backup/vibe-data-YYYYMMDD.tar.gz" -C /data

# Start services
docker-compose up -d
```

---

## Scaling

### Horizontal Scaling

For multiple application servers:

```yaml
# docker-compose.yml
services:
  vibe-kanban:
    deploy:
      replicas: 3
    # ... rest of config
```

### Load Balancing

Use HAProxy or Nginx:

```bash
# Install HAProxy
sudo apt-get install haproxy

# Configure /etc/haproxy/haproxy.cfg
frontend vibe_front
    bind *:4000
    default_backend vibe_backends

backend vibe_backends
    balance roundrobin
    server app1 10.0.1.10:4000 check
    server app2 10.0.1.11:4000 check
    server app3 10.0.1.12:4000 check
```

### Database Scaling (Optional)

If using external database:

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: vibestack
      POSTGRES_USER: vibe
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

Update `.env`:
```bash
DATABASE_URL=postgresql://vibe:password@postgres:5432/vibestack
```

---

## Production Checklist

### Pre-Launch

- [ ] All passwords changed from defaults
- [ ] SSL/TLS configured
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Log aggregation set up
- [ ] Resource limits tested
- [ ] Health checks passing
- [ ] Documentation updated

### Post-Launch

- [ ] Verify all services healthy
- [ ] Test critical workflows
- [ ] Monitor resource usage
- [ ] Review logs for errors
- [ ] Test backup/restore
- [ ] Verify SSL certificates
- [ ] Check security headers
- [ ] Load test if needed

---

## Support

For deployment issues:
- **Documentation**: [docs/](docs/)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Issues**: [GitHub Issues](https://github.com/Resinder/vibe-stack/issues)

---

**Good luck with your deployment! 🚀**
