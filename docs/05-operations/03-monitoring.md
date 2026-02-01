# Vibe Stack - Monitoring and Observability Guide

Complete guide for monitoring, logging, and observability in Vibe Stack production deployments.

---

## Table of Contents

- [Overview](#overview)
- [Built-in Monitoring](#built-in-monitoring)
- [Observer Dashboard](#observer-dashboard)
- [Prometheus Integration](#prometheus-integration)
- [Grafana Dashboards](#grafana-dashboards)
- [Log Aggregation](#log-aggregation)
- [Health Checks](#health-checks)
- [Alerting](#alerting)
- [Performance Metrics](#performance-metrics)

---

## Overview

Vibe Stack provides multiple layers of monitoring and observability:

1. **Built-in Health Checks** - Service health monitoring
2. **Observer Dashboard** - Web-based monitoring UI
3. **Prometheus Metrics** - Time-series metrics collection
4. **Log Aggregation** - Centralized logging
5. **Custom Alerts** - Notification system integration

---

## Built-in Monitoring

### Service Health Checks

Each service exposes a health check endpoint:

```bash
# Vibe-Kanban health
curl http://localhost:4000/health

# MCP Server health
curl http://localhost:4001/health

# Open WebUI health
curl http://localhost:8081/health

# code-server health
curl http://localhost:8443/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:00Z",
  "services": {
    "api": "ok",
    "database": "ok",
    "bridge": "ok"
  }
}
```

### Makefile Health Commands

```bash
# Check all service health
make health

# View service logs
make logs

# Check resource usage
make stats

# Run full diagnostics
make doctor
```

---

## Observer Dashboard

Vibe Stack includes a built-in web dashboard for monitoring.

### Access

```
http://localhost:4000/observer
```

### Features

- **Service Status** - Real-time health of all services
- **Resource Usage** - CPU, memory, disk I/O
- **Task Statistics** - Board metrics and task counts
- **Recent Activity** - Latest task changes
- **System Logs** - Live log streaming

### Dashboard Metrics

| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| Service Status | Health check results | Every 30s |
| CPU Usage | Percentage by service | Every 5s |
| Memory Usage | RAM consumption | Every 5s |
| Task Counts | Tasks per lane | Every 10s |
| API Response Time | Request latency | Real-time |

---

## Prometheus Integration

### Setup Prometheus

Add Prometheus to your monitoring stack:

```bash
# Create prometheus directory
mkdir -p monitoring/prometheus

# Create prometheus.yml
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'vibe-kanban'
    static_configs:
      - targets: ['vibe-kanban:4000']

  - job_name: 'mcp-server'
    static_configs:
      - targets: ['mcp-server:4001']

  - job_name: 'open-webui'
    static_configs:
      - targets: ['open-webui:8081']

  - job_name: 'code-server'
    static_configs:
      - targets: ['code-server:8443']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF
```

### Docker Compose for Monitoring

Create `docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: vibe-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - vibe-network

  grafana:
    image: grafana/grafana:latest
    container_name: vibe-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - vibe-network

  node-exporter:
    image: prom/node-exporter:latest
    container_name: vibe-node-exporter
    ports:
      - "9100:9100"
    networks:
      - vibe-network

volumes:
  prometheus-data:
  grafana-data:

networks:
  vibe-network:
    external: true
```

### Start Monitoring Stack

```bash
# Start monitoring services
docker compose -f docker-compose.monitoring.yml up -d

# Access Prometheus
open http://localhost:9090

# Access Grafana
open http://localhost:3000
```

---

## Grafana Dashboards

### Pre-configured Dashboards

Import the following dashboards in Grafana:

#### 1. Vibe Stack Overview

**Dashboard ID:** `vibe-stack-overview`

**Panels:**
- Service Health (Gauge)
- CPU Usage (Graph)
- Memory Usage (Graph)
- API Request Rate (Graph)
- Task Creation Rate (Graph)
- Response Time (Heatmap)

#### 2. MCP Server Metrics

**Dashboard ID:** `mcp-server-metrics`

**Panels:**
- Tool Execution Count (Stat)
- Tool Execution Time (Graph)
- Error Rate (Graph)
- Active Connections (Gauge)
- Queue Depth (Graph)

#### 3. Vibe-Kanban Metrics

**Dashboard ID:** `vibe-kanban-metrics`

**Panels:**
- Tasks by Lane (Pie Chart)
- Tasks by Priority (Pie Chart)
- Task Movement Flow (Sankey)
- Completion Rate (Graph)
- Average Cycle Time (Graph)

### Import Dashboards

```bash
# Via Grafana UI
1. Login to Grafana (admin/admin)
2. Navigate to Dashboards → Import
3. Upload dashboard JSON files
4. Select Prometheus datasource
```

---

## Log Aggregation

### ELK Stack Setup

For production deployments, use the ELK stack:

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./monitoring/logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

### Configure Log Parsing

`monitoring/logstash/pipeline/logstash.conf`:

```conf
input {
  tcp {
    port => 5044
    codec => json
  }
}

filter {
  if [service] == "mcp-server" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "vibe-stack-%{+YYYY.MM.dd}"
  }
}
```

---

## Health Checks

### Custom Health Check Script

Create `scripts/ops/health-check.sh`:

```bash
#!/bin/bash

# Health check script for Vibe Stack
# Returns exit code 0 if all services healthy, 1 otherwise

SERVICES=("vibe-kanban:4000" "mcp-server:4001" "open-webui:8081" "code-server:8443")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
  NAME="${service%%:*}"
  PORT="${service##*:}"

  if curl -sf "http://localhost:$PORT/health" > /dev/null; then
    echo "✓ $NAME is healthy"
  else
    echo "✗ $NAME is unhealthy"
    ALL_HEALTHY=false
  fi
done

if [ "$ALL_HEALTHY" = true ]; then
  echo "All services are healthy!"
  exit 0
else
  echo "Some services are unhealthy!"
  exit 1
fi
```

### Kubernetes Health Probes

For Kubernetes deployments:

```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Alerting

### Alertmanager Setup

```yaml
# docker-compose.monitoring.yml
alertmanager:
  image: prom/alertmanager:latest
  container_name: vibe-alertmanager
  ports:
    - "9093:9093"
  volumes:
    - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
  networks:
    - vibe-network
```

### Alert Rules

`monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: vibe-stack-alerts
    interval: 30s
    rules:
      # Service Down Alert
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"

      # High CPU Alert
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.job }}"
          description: "CPU usage is above 80% for 5 minutes"

      # High Memory Alert
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1024
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.job }}"
          description: "Memory usage is above 1GB for 5 minutes"

      # API Error Rate Alert
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is above 5% for 5 minutes"
```

### Slack Integration

`monitoring/alertmanager/alertmanager.yml`:

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#vibe-stack-alerts'
        title: 'Vibe Stack Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## Performance Metrics

### Key Metrics to Monitor

| Metric | Type | Description | Threshold |
|--------|------|-------------|-----------|
| **Service Uptime** | Gauge | Percentage of time service is available | > 99.9% |
| **API Response Time** | Histogram | Time to process API requests | p95 < 500ms |
| **Error Rate** | Counter | Percentage of failed requests | < 1% |
| **CPU Usage** | Gauge | CPU utilization percentage | < 80% |
| **Memory Usage** | Gauge | RAM consumption | < 1GB |
| **Task Creation Rate** | Counter | Tasks created per minute | Track trend |
| **Task Completion Rate** | Counter | Tasks completed per minute | Track trend |
| **Active Connections** | Gauge | Current active connections | < 100 |

### Performance Baselines

Establish baselines for your deployment:

```bash
# Collect baseline metrics
./scripts/ops/collect-baseline.sh --duration 24h --output baseline.json
```

---

## Related Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[Security](../05-operations/05-security.md)** - Security implementation
- **[PERFORMANCE.md](PERFORMANCE.md)** - Performance optimization
- **[API_REFERENCE.md](API_REFERENCE.md)** - API documentation

---

**Need help?** See [FAQ.md](FAQ.md) or [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
