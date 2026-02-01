# NGINX Configuration for Vibe Stack Production

This directory contains NGINX configuration files for production deployment.

## Directory Structure

```
config/nginx/
├── nginx.conf           # Main NGINX configuration
├── ssl/                 # SSL certificates (create these)
│   ├── fullchain.pem    # Full certificate chain
│   └── privkey.pem      # Private key
└── confd/               # Server-specific configurations
    ├── vibe-kanban.conf # Vibe-Kanban
    ├── code-server.conf # code-server
    └── grafana.conf     # Grafana
```

## Setup Instructions

### 1. Obtain SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone \
    -d kanban.yourdomain.com \
    -d code.yourdomain.com \
    -d grafana.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chmod 644 ssl/*.pem
```

#### Option B: Self-Signed (Development Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### 2. Update Domain Names

Edit the `.conf` files in `confd/` to replace:
- `kanban.yourdomain.com` → Your actual domain
- `code.yourdomain.com` → Your actual domain
- `grafana.yourdomain.com` → Your actual domain

### 3. Update docker-compose.prod.yml

The production compose file already includes the NGINX service with these volumes mounted.

### 4. Start Services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Configuration Details

### Main Configuration (nginx.conf)

- **Worker Processes**: Auto-detected
- **Worker Connections**: 1024
- **Keepalive**: 65 seconds
- **Max Body Size**: 100MB
- **Gzip**: Enabled for text-based content
- **Rate Limiting**: 10 req/s (API), 20 req/s (general)

### Security Features

- HTTP to HTTPS redirect
- TLS 1.2 and 1.3 only
- Secure cipher suites
- Security headers:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: no-referrer-when-downgrade

### Upstream Servers

All services are configured to connect to Docker services:

| Service | Upstream | Port |
|---------|----------|------|
| Vibe-Kanban | vibe-kanban | 4000 |
| code-server | code-server | 8080 |
| Open WebUI | open-webui | 8080 |
| MCP Server | mcp-server | 4001 |
| Grafana | grafana | 3000 |
| Prometheus | prometheus | 9090 |

## Monitoring

### View NGINX Logs

```bash
# Access logs
docker compose exec nginx tail -f /var/log/nginx/access.log

# Error logs
docker compose exec nginx tail -f /var/log/nginx/error.log
```

### Test Configuration

```bash
# Test NGINX configuration
docker compose exec nginx nginx -t

# Reload NGINX
docker compose exec nginx nginx -s reload
```

## Troubleshooting

### 502 Bad Gateway

- Check if upstream services are running: `docker compose ps`
- Check upstream service logs
- Verify DNS resolution of service names

### SSL Certificate Errors

- Verify certificate files exist in `ssl/` directory
- Check certificate permissions: `ls -la ssl/`
- Verify certificate chain: `openssl s_client -connect yourdomain.com:443`

### Rate Limiting Issues

If legitimate requests are blocked, adjust rate limits in `nginx.conf`:

```nginx
# Increase from 10 req/s to 20 req/s
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
```

## Customization

### Add New Service

1. Create new config file in `confd/`
2. Define upstream in `nginx.conf`
3. Add server block with SSL and proxy settings
4. Reload NGINX: `docker compose exec nginx nginx -s reload`

### Modify Rate Limits

Edit `nginx.conf`:

```nginx
# API rate limit (default: 10 req/s)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

# General rate limit (default: 20 req/s)
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
```

### Enable HTTP/3

Add to server block:

```nginx
listen 443 quic;
add_header Alt-Svc 'h3=":443"; ma=86400';
```

## Security Best Practices

1. **Keep SSL certificates updated** - Set up auto-renewal with certbot
2. **Monitor logs** - Set up log aggregation
3. **Use strong cipher suites** - Already configured
4. **Enable fail2ban** - Block repeated failed attempts
5. **Regular security updates** - Keep NGINX updated
6. **Disable unused services** - Remove unused server blocks

## Performance Tuning

### Enable Caching

Add to server block:

```nginx
location /static/ {
    proxy_pass http://vibe_kanban;
    proxy_cache_valid 200 1d;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Increase Worker Connections

```nginx
events {
    worker_connections 2048;  # Default: 1024
}
```

### Enable Brotli Compression

Install brotli module and add:

```nginx
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```
