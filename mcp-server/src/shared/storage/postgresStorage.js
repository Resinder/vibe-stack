/**
 * ============================================================================
 * VIBE STACK - PostgreSQL Storage Service
 * ============================================================================
 * Async PostgreSQL storage with connection pooling and write queue
 * Replaces synchronous file I/O for better performance and concurrency
 * @version 1.0.0
 * ============================================================================
 */

import { Pool } from 'pg';
import { Logger } from '../../utils/logger.js';
import { BoardError } from '../../middleware/errorHandler.js';

/**
 * PostgreSQL Storage Service
 * @class PostgresStorage
 * @description Provides async CRUD operations with connection pooling
 */
export class PostgresStorage {
  /** @type {Pool} PostgreSQL connection pool */
  #pool;

  /** @type {Map} In-memory cache with TTL */
  #cache;

  /** @type {number} Cache TTL in milliseconds */
  #cacheTTL;

  /** @type {number} Maximum cache size */
  #maxCacheSize;

  /** @type {boolean} Whether storage is initialized */
  #initialized;

  /**
   * Create a new PostgresStorage instance
   * @param {Object} config - Database configuration
   * @param {string} config.host - Database host
   * @param {number} config.port - Database port
   * @param {string} config.database - Database name
   * @param {string} config.user - Database user
   * @param {string} config.password - Database password
   * @param {Object} cacheConfig - Cache configuration
   * @param {number} cacheConfig.ttl - Cache TTL in milliseconds (default: 5000)
   * @param {number} cacheConfig.maxSize - Maximum cache size (default: 100)
   */
  constructor(config, cacheConfig = {}) {
    // SECURITY: Validate required database credentials in production
    const isProduction = process.env.NODE_ENV === 'production';
    const password = config.password || process.env.PGPASSWORD;

    if (isProduction && !password) {
      throw new Error(
        '[SECURITY] Database password (PGPASSWORD) is required in production. ' +
        'Set the PGPASSWORD environment variable or pass it in the config.'
      );
    }

    if (!isProduction && !password) {
      Logger.warn('[SECURITY] No database password set. Using default credentials for development only!');
    }

    this.#pool = new Pool({
      host: config.host || process.env.PGHOST || 'localhost',
      port: config.port || parseInt(process.env.PGPORT || '5432'),
      database: config.database || process.env.PGDATABASE || 'vibestack',
      user: config.user || process.env.PGUSER || 'vibeuser',
      password: password,
      max: config.max || 20, // Maximum pool size
      idleTimeoutMillis: config.idleTimeout || 30000,
      connectionTimeoutMillis: config.connectionTimeout || 10000,
    });

    this.#cache = new Map();
    this.#cacheTTL = cacheConfig.ttl || 5000; // 5 seconds
    this.#maxCacheSize = cacheConfig.maxSize || 100;
    this.#initialized = false;

    // Handle pool errors
    this.#pool.on('error', (err) => {
      Logger.error('[PostgresStorage] Unexpected pool error', err);
    });
  }

  /**
   * Initialize storage connection
   * @returns {Promise<void>}
   * @throws {BoardError} If connection fails
   */
  async initialize() {
    if (this.#initialized) {
      return;
    }

    try {
      const client = await this.#pool.connect();
      try {
        // Verify connection and schema
        await client.query('SELECT 1');
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'boards'
          );
        `);

        if (!result.rows[0].exists) {
          throw new BoardError('Database schema not initialized. Run migrations first.', 'initialize');
        }

        this.#initialized = true;
        Logger.info('[PostgresStorage] Connected to PostgreSQL database');
      } finally {
        client.release();
      }
    } catch (error) {
      throw new BoardError(`Failed to initialize PostgreSQL: ${error.message}`, 'initialize');
    }
  }

  /**
   * Get or create default board
   * @returns {Promise<Object>} Board data
   */
  async getOrCreateBoard() {
    const cacheKey = 'board:default';
    const cached = this.#getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.#pool.query(`
        INSERT INTO boards (id, name, description)
        VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'default', 'Default Vibe Stack board')
        ON CONFLICT (id) DO NOTHING
        RETURNING id, name, description, created_at, updated_at;
      `);

      const board = result.rows[0];
      this.#setCache(cacheKey, board);
      return board;
    } catch (error) {
      throw new BoardError(`Failed to get board: ${error.message}`, 'getBoard');
    }
  }

  /**
   * Load all tasks grouped by lane
   * @returns {Promise<Object>} Object with lanes as keys and task arrays as values
   */
  async loadTasks() {
    const cacheKey = 'tasks:all';
    const cached = this.#getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.#pool.query(`
        SELECT id, title, description, lane, priority, status,
               estimated_hours, tags, metadata, created_at, updated_at
        FROM tasks
        WHERE board_id = '00000000-0000-0000-0000-000000000001'::uuid
        ORDER BY created_at DESC;
      `);

      const lanes = {
        backlog: [],
        todo: [],
        in_progress: [],
        done: [],
        recovery: []
      };

      for (const row of result.rows) {
        lanes[row.lane].push({
          id: row.id,
          title: row.title,
          description: row.description,
          lane: row.lane,
          priority: row.priority,
          status: row.status,
          estimatedHours: parseFloat(row.estimated_hours) || 0,
          tags: row.tags || [],
          metadata: row.metadata || {},
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }

      this.#setCache(cacheKey, lanes);
      return lanes;
    } catch (error) {
      throw new BoardError(`Failed to load tasks: ${error.message}`, 'loadTasks');
    }
  }

  /**
   * Create a new task
   * @param {Object} task - Task data
   * @returns {Promise<Object>} Created task
   */
  async createTask(task) {
    this.#invalidateCache('tasks:all');

    try {
      const result = await this.#pool.query(`
        INSERT INTO tasks (board_id, title, description, lane, priority, status, estimated_hours, tags, metadata)
        VALUES (
          '00000000-0000-0000-0000-000000000001'::uuid,
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING id, title, description, lane, priority, status,
                  estimated_hours as "estimatedHours", tags, metadata,
                  created_at as "createdAt", updated_at as "updatedAt";
      `, [
        task.title,
        task.description || null,
        task.lane || 'backlog',
        task.priority || 'medium',
        task.status || 'pending',
        task.estimatedHours || 0,
        JSON.stringify(task.tags || []),
        JSON.stringify(task.metadata || {})
      ]);

      return result.rows[0];
    } catch (error) {
      throw new BoardError(`Failed to create task: ${error.message}`, 'createTask');
    }
  }

  /**
   * Update a task
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(taskId, updates) {
    this.#invalidateCache('tasks:all');

    try {
      const buildUpdateQuery = () => {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.title !== undefined) {
          fields.push(`title = $${paramCount++}`);
          values.push(updates.title);
        }
        if (updates.description !== undefined) {
          fields.push(`description = $${paramCount++}`);
          values.push(updates.description);
        }
        if (updates.lane !== undefined) {
          fields.push(`lane = $${paramCount++}`);
          values.push(updates.lane);
        }
        if (updates.priority !== undefined) {
          fields.push(`priority = $${paramCount++}`);
          values.push(updates.priority);
        }
        if (updates.status !== undefined) {
          fields.push(`status = $${paramCount++}`);
          values.push(updates.status);
        }
        if (updates.estimatedHours !== undefined) {
          fields.push(`estimated_hours = $${paramCount++}`);
          values.push(updates.estimatedHours);
        }
        if (updates.tags !== undefined) {
          fields.push(`tags = $${paramCount++}`);
          values.push(JSON.stringify(updates.tags));
        }
        if (updates.metadata !== undefined) {
          fields.push(`metadata = $${paramCount++}`);
          values.push(JSON.stringify(updates.metadata));
        }

        return { query: fields.join(', '), values, paramCount };
      };

      const { query, values } = buildUpdateQuery();
      values.push(taskId); // Add task ID as last parameter

      const result = await this.#pool.query(`
        UPDATE tasks
        SET ${query}
        WHERE id = $${values.length}
        RETURNING id, title, description, lane, priority, status,
                  estimated_hours as "estimatedHours", tags, metadata,
                  created_at as "createdAt", updated_at as "updatedAt";
      `, values);

      if (result.rows.length === 0) {
        throw new BoardError(`Task not found: ${taskId}`, 'updateTask');
      }

      return result.rows[0];
    } catch (error) {
      throw new BoardError(`Failed to update task: ${error.message}`, 'updateTask');
    }
  }

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteTask(taskId) {
    this.#invalidateCache('tasks:all');

    try {
      const result = await this.#pool.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING id',
        [taskId]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw new BoardError(`Failed to delete task: ${error.message}`, 'deleteTask');
    }
  }

  /**
   * Get board statistics
   * @returns {Promise<Object>} Board statistics
   */
  async getStats() {
    const cacheKey = 'stats:board';
    const cached = this.#getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.#pool.query(`
        SELECT
          lane,
          COUNT(*) as task_count,
          SUM(estimated_hours) as total_hours,
          COUNT(*) FILTER (WHERE priority = 'low') as low_priority,
          COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
          COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_priority
        FROM tasks
        WHERE board_id = '00000000-0000-0000-0000-000000000001'::uuid
        GROUP BY lane;
      `);

      const stats = {
        totalTasks: 0,
        byLane: { backlog: 0, todo: 0, in_progress: 0, done: 0, recovery: 0 },
        byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
        totalEstimatedHours: 0
      };

      for (const row of result.rows) {
        stats.byLane[row.lane] = parseInt(row.task_count);
        stats.totalTasks += parseInt(row.task_count);
        stats.totalEstimatedHours += parseFloat(row.total_hours) || 0;
        stats.byPriority.low += parseInt(row.low_priority) || 0;
        stats.byPriority.medium += parseInt(row.medium_priority) || 0;
        stats.byPriority.high += parseInt(row.high_priority) || 0;
        stats.byPriority.critical += parseInt(row.critical_priority) || 0;
      }

      this.#setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      throw new BoardError(`Failed to get stats: ${error.message}`, 'getStats');
    }
  }

  /**
   * Search tasks by query
   * @param {string} query - Search query
   * @param {string} [lane] - Optional lane filter
   * @returns {Promise<Array>} Matching tasks
   */
  async searchTasks(query, lane) {
    try {
      const sanitizedQuery = `%${query.toLowerCase()}%`;
      let sql = `
        SELECT id, title, description, lane, priority, status,
               estimated_hours as "estimatedHours", tags, metadata,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM tasks
        WHERE board_id = '00000000-0000-0000-0000-000000000001'::uuid
          AND (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
      `;
      const params = [sanitizedQuery];

      if (lane) {
        sql += ' AND lane = $2';
        params.push(lane);
      }

      sql += ' ORDER BY created_at DESC';

      const result = await this.#pool.query(sql, params);
      return result.rows;
    } catch (error) {
      throw new BoardError(`Failed to search tasks: ${error.message}`, 'searchTasks');
    }
  }

  /**
   * Get value from cache
   * @private
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  #getFromCache(key) {
    const entry = this.#cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.#cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   * @private
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  #setCache(key, value) {
    // Implement LRU eviction if cache is full
    if (this.#cache.size >= this.#maxCacheSize) {
      const firstKey = this.#cache.keys().next().value;
      this.#cache.delete(firstKey);
    }

    this.#cache.set(key, {
      value,
      expiresAt: Date.now() + this.#cacheTTL
    });
  }

  /**
   * Invalidate cache entry
   * @private
   * @param {string} key - Cache key to invalidate
   */
  #invalidateCache(key) {
    this.#cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearCache() {
    this.#cache.clear();
  }

  /**
   * Health check for database connection
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      const result = await this.#pool.query('SELECT 1');
      const row = result.rows[0];
      const column = row ? row[Object.keys(row)[0]] : null;
      return column === 1;
    } catch {
      return false;
    }
  }

  /**
   * Close all connections and cleanup
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.#pool.end();
      this.#cache.clear();
      this.#initialized = false;
      Logger.info('[PostgresStorage] Database connection closed');
    } catch (error) {
      Logger.error('[PostgresStorage] Error closing connection', error);
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.#pool.totalCount,
      idleCount: this.#pool.idleCount,
      waitingCount: this.#pool.waitingCount
    };
  }
}

export default PostgresStorage;
