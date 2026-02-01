# Vibe Stack - Performance Optimization Guide

Comprehensive performance tuning and optimization guide for Vibe Stack.

---

## Table of Contents

- [Performance Overview](#performance-overview)
- [Benchmarks](#benchmarks)
- [Resource Optimization](#resource-optimization)
- [Database Optimization](#database-optimization)
- [Caching Strategies](#caching-strategies)
- [Load Balancing](#load-balancing)
- [Scaling Strategies](#scaling-strategies)
- [Monitoring Performance](#monitoring-performance)

---

## Performance Overview

### Current Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| **API Response Time** | < 100ms | < 200ms |
| **Task Creation** | < 50ms | < 100ms |
| **Board Load** | < 500ms | < 1s |
| **Memory per Service** | 64-256MB | < 512MB |
| **CPU per Service** | < 5% | < 20% |
| **Concurrent Users** | 2-20 | 50+ |

---

## Benchmarks

### API Performance

```bash
# Benchmark API endpoints
ab -n 1000 -c 10 http://localhost:4001/health

# Expected results:
# - 1000 requests in < 5 seconds
# - 200+ requests per second
# - < 100ms average response time
```

### Task Operations

| Operation | Baseline | Optimized |
|-----------|----------|-----------|
| Create Task | 45ms | 25ms |
| Update Task | 35ms | 20ms |
| List Tasks | 80ms | 40ms |
| Move Task | 30ms | 15ms |

---

## Resource Optimization

### Docker Resource Limits

**Current docker-compose.yml:**

```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
```

**Optimized for Production:**

```yaml
services:
  vibe-kanban:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 64M

  mcp-server:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

  open-webui:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  code-server:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

### Node.js Optimization

**Enable Cluster Mode:**

```javascript
// mcp-server/src/cluster.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  require('./index.js');
}
```

---

## Database Optimization

### Migration from SQLite to PostgreSQL

**Setup:**

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: vibe-postgres
    environment:
      - POSTGRES_DB=vibe_stack
      - POSTGRES_USER=vibe
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - vibe-network

volumes:
  postgres-data:
```

**Configuration:**

```javascript
// mcp-server/src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vibe_stack',
  user: process.env.DB_USER || 'vibe',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

### Query Optimization

**Add Indexes:**

```sql
-- Create indexes for common queries
CREATE INDEX idx_tasks_lane ON tasks(lane);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
```

---

## Caching Strategies

### Redis Caching Layer

**Setup:**

```yaml
# docker-compose.prod.yml
services:
  redis:
    image: redis:7-alpine
    container_name: vibe-redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - vibe-network
```

**Implementation:**

```javascript
// mcp-server/src/cache/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

async function get(key) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function set(key, value, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

async function del(key) {
  await redis.del(key);
}

module.exports = { get, set, del };
```

**Cache Frequently Accessed Data:**

```javascript
const cache = require('./cache/redis');

async function getBoard(req, res) {
  const cacheKey = `board:${req.params.id}`;

  // Try cache first
  let board = await cache.get(cacheKey);
  if (board) {
    return res.json(board);
  }

  // Query database
  board = await fetchBoardFromDB(req.params.id);

  // Cache for 5 minutes
  await cache.set(cacheKey, board, 300);

  res.json(board);
}
```

---

### Application-Level Caching

```javascript
// mcp-server/src/cache/memory.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

function get(key) {
  return cache.get(key);
}

function set(key, value, ttl) {
  return cache.set(key, value, ttl);
}

function del(key) {
  return cache.del(key);
}

module.exports = { get, set, del };
```

---

## Load Balancing

### Nginx Load Balancer

**Configuration:**

```nginx
# /etc/nginx/conf.d/vibe-stack.conf

upstream vibe_backend {
    least_conn;
    server mcp-server-1:4001 max_fails=3 fail_timeout=30s;
    server mcp-server-2:4001 max_fails=3 fail_timeout=30s;
    server mcp-server-3:4001 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name vibe-stack.yourdomain.com;

    location /api/ {
        proxy_pass http://vibe_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Enable connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

### HAProxy Load Balancer

**Configuration:**

```yaml
# docker-compose.haproxy.yml
services:
  haproxy:
    image: haproxy:2.8-alpine
    container_name: vibe-haproxy
    ports:
      - "80:80"
      - "443:443"
      - "8404:8404"  # Stats
    volumes:
      - ./config/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    networks:
      - vibe-network

networks:
  vibe-network:
    external: true
```

**haproxy.cfg:**

```conf
defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

backend vibe_backend
    balance roundrobin
    option httpchk GET /health
    server mcp1 mcp-server-1:4001 check
    server mcp2 mcp-server-2:4001 check
    server mcp3 mcp-server-3:4001 check

frontend vite_frontend
    bind *:80
    default_backend vibe_backend

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
```

---

## Scaling Strategies

### Horizontal Scaling

**Multiple Instances:**

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  mcp-server:
    image: vibe-stack/mcp-server:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

**Scale Up:**

```bash
docker compose up -d --scale mcp-server=3
```

---

### Vertical Scaling

**Increase Resources:**

```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Increase from 1.0
          memory: 1G       # Increase from 512M
```

---

### Session Affinity

**Sticky Sessions:**

```nginx
upstream vibe_backend {
    ip_hash;  # Use client IP for session affinity
    server mcp-server-1:4001;
    server mcp-server-2:4001;
}
```

---

## Monitoring Performance

### Key Performance Indicators (KPIs)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response Time** | < 200ms | > 500ms |
| **Error Rate** | < 1% | > 5% |
| **CPU Usage** | < 70% | > 90% |
| **Memory Usage** | < 80% | > 95% |
| **Disk I/O** | < 70% | > 90% |

---

### Performance Profiling

**Node.js Profiling:**

```bash
# Enable profiling
node --prof index.js

# Analyze profile
node --prof-process isolate-0xnnnnnnnnnnnn-v8.log > processed.txt
```

---

### Load Testing

**Using Apache Bench:**

```bash
# Test task creation endpoint
ab -n 1000 -c 10 \
   -H "Content-Type: application/json" \
   -p create-task.json \
   http://localhost:4001/tools
```

**Using k6:**

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const payload = JSON.stringify({
    name: 'vbm_create_task',
    arguments: {
      title: 'Performance Test Task',
      priority: 'medium'
    }
  });

  const params = {
    headers: { 'Content-Type': 'application/json' }
  };

  const res = http.post('http://localhost:4001/tools', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });
}
```

**Run Load Test:**

```bash
k6 run --vus 10 --duration 30s load-test.js
```

---

## Performance Tuning Checklist

### Quick Wins

- [ ] Enable Redis caching
- [ ] Add database indexes
- [ ] Configure resource limits
- [ ] Enable gzip compression
- [ ] Use CDN for static assets

### Medium-Term

- [ ] Migrate to PostgreSQL
- [ ] Implement load balancing
- [ ] Enable cluster mode
- [ ] Optimize queries
- [ ] Add connection pooling

### Long-Term

- [ ] Implement multi-region deployment
- [ ] Add CDN for global distribution
- [ ] Optimize for specific workloads
- [ ] Implement auto-scaling
- [ ] Performance testing in CI/CD

---

## Performance Tips

### 1. Use Connection Pooling

```javascript
const pool = new Pool({
  max: 20,  // Adjust based on workload
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 2. Enable Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Batch Operations

```javascript
// Instead of multiple individual calls
for (const task of tasks) {
  await createTask(task);
}

// Use batch operations
await createTasks(tasks);
```

### 4. Lazy Loading

```javascript
// Load board data only when needed
async function getBoard(id) {
  const board = await cache.get(`board:${id}`);
  if (board) return board;

  return await fetchBoardFromDB(id);
}
```

---

## Related Documentation

- **[MONITORING.md](MONITORING.md)** - Performance monitoring
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[API_REFERENCE.md](API_REFERENCE.md)** - API performance
- **[Security](../05-operations/05-security.md)** - Security vs performance tradeoffs

---

**Need help?** See [FAQ.md](FAQ.md) or [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
