/**
 * ============================================================================
 * VIBE STACK - Prometheus Metrics
 * ============================================================================
 * Prometheus metrics collection for monitoring and observability
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Metrics registry
 * Simple in-memory metrics store (production would use prom-client)
 */
class MetricsRegistry {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.summaries = new Map();
  }

  /**
   * Create or get a counter
   * @param {string} name - Metric name
   * @param {string} help - Metric description
   * @returns {Object} Counter metric
   */
  counter(name, help) {
    if (!this.counters.has(name)) {
      this.counters.set(name, {
        type: 'counter',
        help,
        value: 0,
        labels: new Map(),
        inc: function(amount = 1, labels = {}) {
          const key = JSON.stringify(labels);
          const current = this.labels.get(key) || 0;
          this.labels.set(key, current + amount);
          this.value += amount;
        },
        reset: function() {
          this.value = 0;
          this.labels.clear();
        },
        get: function(labels = {}) {
          const key = JSON.stringify(labels);
          return this.labels.get(key) || 0;
        }
      });
    }
    return this.counters.get(name);
  }

  /**
   * Create or get a gauge
   * @param {string} name - Metric name
   * @param {string} help - Metric description
   * @returns {Object} Gauge metric
   */
  gauge(name, help) {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, {
        type: 'gauge',
        help,
        value: 0,
        labels: new Map(),
        inc: function(amount = 1, labels = {}) {
          const key = JSON.stringify(labels);
          const current = this.labels.get(key) || 0;
          this.labels.set(key, current + amount);
          this.value = Math.max(...this.labels.values());
        },
        dec: function(amount = 1, labels = {}) {
          const key = JSON.stringify(labels);
          const current = this.labels.get(key) || 0;
          this.labels.set(key, Math.max(0, current - amount));
          this.value = Math.max(...this.labels.values());
        },
        set: function(value, labels = {}) {
          const key = JSON.stringify(labels);
          this.labels.set(key, value);
          this.value = Math.max(...this.labels.values());
        },
        get: function(labels = {}) {
          const key = JSON.stringify(labels);
          return this.labels.get(key) || 0;
        }
      });
    }
    return this.gauges.get(name);
  }

  /**
   * Create or get a histogram
   * @param {string} name - Metric name
   * @param {string} help - Metric description
   * @param {Array<number>} buckets - Histogram buckets
   * @returns {Object} Histogram metric
   */
  histogram(name, help, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, {
        type: 'histogram',
        help,
        buckets,
        observations: new Map(),
        observe: function(value, labels = {}) {
          const key = JSON.stringify(labels);
          if (!this.observations.has(key)) {
            this.observations.set(key, []);
          }
          this.observations.get(key).push(value);
        },
        getBuckets: function(labels = {}) {
          const key = JSON.stringify(labels);
          const values = this.observations.get(key) || [];
          const counts = {};
          for (const bucket of this.buckets) {
            counts[bucket] = values.filter(v => v <= bucket).length;
          }
          counts['+Inf'] = values.length;
          return counts;
        }
      });
    }
    return this.histograms.get(name);
  }

  /**
   * Create or get a summary
   * @param {string} name - Metric name
   * @param {string} help - Metric description
   * @param {Object} options - Summary options
   * @returns {Object} Summary metric
   */
  summary(name, help, options = { percentiles: [0.5, 0.9, 0.99] }) {
    if (!this.summaries.has(name)) {
      this.summaries.set(name, {
        type: 'summary',
        help,
        percentiles: options.percentiles,
        observations: new Map(),
        observe: function(value, labels = {}) {
          const key = JSON.stringify(labels);
          if (!this.observations.has(key)) {
            this.observations.set(key, []);
          }
          this.observations.get(key).push(value);
        },
        getPercentiles: function(labels = {}) {
          const key = JSON.stringify(labels);
          const values = this.observations.get(key) || [];
          if (values.length === 0) return {};

          const sorted = [...values].sort((a, b) => a - b);
          const result = {};
          for (const p of this.percentiles) {
            const index = Math.ceil(p * sorted.length) - 1;
            result[p] = sorted[index];
          }
          result.count = sorted.length;
          result.sum = sorted.reduce((a, b) => a + b, 0);
          return result;
        }
      });
    }
    return this.summaries.get(name);
  }

  /**
   * Export metrics in Prometheus text format
   * @returns {string} Metrics in Prometheus format
   */
  export() {
    const lines = [];

    // Export counters
    for (const [name, metric] of this.counters) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${metric.value}`);

      for (const [labelsKey, value] of metric.labels) {
        const labels = JSON.parse(labelsKey);
        const labelStr = Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        lines.push(`${name}{${labelStr}} ${value}`);
      }
      lines.push('');
    }

    // Export gauges
    for (const [name, metric] of this.gauges) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${metric.value}`);

      for (const [labelsKey, value] of metric.labels) {
        const labels = JSON.parse(labelsKey);
        const labelStr = Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        lines.push(`${name}{${labelStr}} ${value}`);
      }
      lines.push('');
    }

    // Export histograms
    for (const [name, metric] of this.histograms) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} histogram`);

      const allLabels = new Set();
      for (const key of metric.observations.keys()) {
        const labels = JSON.parse(key);
        Object.keys(labels).forEach(k => allLabels.add(k));
      }

      if (allLabels.size === 0) {
        const buckets = metric.getBuckets();
        lines.push(`${name}_bucket{le="0.005"} ${buckets[0.005] || 0}`);
        for (let i = 1; i < metric.buckets.length; i++) {
          lines.push(`${name}_bucket{le="${metric.buckets[i]}"} ${buckets[metric.buckets[i]] || 0}`);
        }
        lines.push(`${name}_bucket{le="+Inf"} ${buckets['+Inf'] || 0}`);
        lines.push(`${name}_sum 0`);
        lines.push(`${name}_count ${buckets['+Inf'] || 0}`);
      }

      lines.push('');
    }

    // Export summaries
    for (const [name, metric] of this.summaries) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} summary`);

      for (const [labelsKey, values] of metric.observations) {
        if (values.length === 0) continue;

        const labels = JSON.parse(labelsKey);
        const labelStr = Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');

        const percentiles = metric.getPercentiles(labels);
        for (const p of metric.percentiles) {
          lines.push(`${name}{${labelStr},quantile="${p}"} ${percentiles[p] || 0}`);
        }
        lines.push(`${name}_sum{${labelStr}} ${percentiles.sum || 0}`);
        lines.push(`${name}_count{${labelStr}} ${percentiles.count || 0}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
  }
}

// ============================================================================
// PREDEFINED METRICS
// ============================================================================

const registry = new MetricsRegistry();

// HTTP request metrics
export const httpRequestDuration = registry.histogram(
  'http_request_duration_seconds',
  'HTTP request duration in seconds',
  [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
);

export const httpRequestsTotal = registry.counter(
  'http_requests_total',
  'Total HTTP requests'
);

export const httpRequestsInProgress = registry.gauge(
  'http_requests_in_progress',
  'HTTP requests currently in progress'
);

// MCP tool metrics
export const mcpToolCallsTotal = registry.counter(
  'mcp_tool_calls_total',
  'Total MCP tool calls'
);

export const mcpToolDuration = registry.summary(
  'mcp_tool_duration_seconds',
  'MCP tool call duration in seconds',
  { percentiles: [0.5, 0.9, 0.95, 0.99] }
);

export const mcpToolErrorsTotal = registry.counter(
  'mcp_tool_errors_total',
  'Total MCP tool errors'
);

// Database metrics
export const dbQueryDuration = registry.histogram(
  'db_query_duration_seconds',
  'Database query duration in seconds'
);

export const dbQueriesTotal = registry.counter(
  'db_queries_total',
  'Total database queries'
);

export const dbConnectionsActive = registry.gauge(
  'db_connections_active',
  'Active database connections'
);

// Business metrics
export const tasksTotal = registry.gauge(
  'tasks_total',
  'Total number of tasks'
);

export const tasksByLane = registry.gauge(
  'tasks_by_lane',
  'Number of tasks by lane'
);

export const tasksByPriority = registry.gauge(
  'tasks_by_priority',
  'Number of tasks by priority'
);

// System metrics
export const memoryUsageBytes = registry.gauge(
  'process_memory_usage_bytes',
  'Process memory usage in bytes'
);

export const cpuUsagePercent = registry.gauge(
  'process_cpu_usage_percent',
  'Process CPU usage percentage'
);

export const eventLoopLagSeconds = registry.gauge(
  'process_event_loop_lag_seconds',
  'Event loop lag in seconds'
);

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Express middleware to track HTTP metrics
 */
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  httpRequestsInProgress.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsInProgress.dec();

    httpRequestDuration.observe(duration, {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });

    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
  });

  next();
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Get metrics endpoint handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export function getMetrics(req, res) {
  res.set('Content-Type', 'text/plain');
  res.send(registry.export());
}

/**
 * Update system metrics
 */
export function updateSystemMetrics() {
  // Memory usage
  const memUsage = process.memoryUsage();
  memoryUsageBytes.set(memUsage.heapUsed, { type: 'heap' });
  memoryUsageBytes.set(memUsage.external, { type: 'external' });

  // CPU usage (simplified)
  const cpus = require('os').cpus();
  const cpuAvg = require('os').loadavg();
  cpuUsagePercent.set(cpuAvg[0], { type: '1m' });
}

/**
 * Update business metrics from board state
 * @param {Object} board - Board state
 */
export function updateBusinessMetrics(board) {
  if (!board || !board.lanes) return;

  let totalTasks = 0;
  const byLane = {};
  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const [lane, tasks] of Object.entries(board.lanes)) {
    byLane[lane] = tasks.length;
    totalTasks += tasks.length;

    for (const task of tasks) {
      const priority = task.priority || 'medium';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    }
  }

  tasksTotal.set(totalTasks);

  for (const [lane, count] of Object.entries(byLane)) {
    tasksByLane.set(count, { lane });
  }

  for (const [priority, count] of Object.entries(byPriority)) {
    tasksByPriority.set(count, { priority });
  }
}

export default registry;
