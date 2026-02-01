/**
 * ============================================================================
 * VIBE STACK - Credential Usage Analytics
 * ============================================================================
 * Tracks credential usage and provides insights
 * @version 1.0.0
 * ============================================================================
 */

import { Logger } from '../../utils/logger.js';

/**
 * Credential usage analytics
 */
export class CredentialAnalytics {
  #storage;

  constructor(storage) {
    this.#storage = storage;
  }

  /**
   * Record a credential usage
   * @param {Object} args - Usage data
   * @returns {Promise<void>}
   */
  async recordUsage(args = {}) {
    const { userId, provider, scope, operation, success = true, metadata = {} } = args;

    // Store usage event in PostgreSQL
    const query = `
      INSERT INTO credential_usage (user_id, provider, scope, operation, success, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    try {
      await this.#storage.pool.query(query, [
        userId,
        provider,
        scope || null,
        operation,
        success,
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      // Don't fail if analytics table doesn't exist
      Logger.debug('[ANALYTICS] Could not record usage:', error.message);
    }
  }

  /**
   * Get usage statistics for credentials
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Usage stats
   */
  async getUsageStats(args = {}) {
    const { userId, days = 30 } = args;

    const query = `
      SELECT 
        provider,
        scope,
        operation,
        COUNT(*) as usage_count,
        COUNT(*) FILTER (WHERE success = true) as success_count,
        COUNT(*) FILTER (WHERE success = false) as failure_count,
        MAX(created_at) as last_used
      FROM credential_usage
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY provider, scope, operation
      ORDER BY usage_count DESC
    `;

    try {
      const result = await this.#storage.pool.query(query, [userId]);

      return {
        userId,
        period: `${days} days`,
        totalUsage: result.rows.reduce((sum, row) => sum + parseInt(row.usage_count), 0),
        byProvider: this.#groupByProvider(result.rows),
        details: result.rows
      };
    } catch (error) {
      if (error.message.includes('does not exist')) {
        return {
          userId,
          period: `${days} days`,
          totalUsage: 0,
          byProvider: {},
          details: [],
          note: 'Analytics not yet available'
        };
      }
      throw error;
    }
  }

  /**
   * Get cost estimate for AI providers
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Cost estimate
   */
  async getCostEstimate(args = {}) {
    const { userId, days = 30 } = args;

    // Approximate pricing (as of 2024)
    const pricing = {
      openai: {
        'gpt-4': { input: 0.03, output: 0.06, per: '1k tokens' },
        'gpt-4-turbo': { input: 0.01, output: 0.03, per: '1k tokens' },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, per: '1k tokens' }
      },
      anthropic: {
        'claude-3-opus': { input: 0.015, output: 0.075, per: '1k tokens' },
        'claude-3-sonnet': { input: 0.003, output: 0.015, per: '1k tokens' },
        'claude-3-haiku': { input: 0.00025, output: 0.00125, per: '1k tokens' }
      }
    };

    const query = `
      SELECT 
        provider,
        COUNT(*) FILTER (WHERE operation = 'api_call') as api_calls,
        SUM((metadata->>'tokens')::int) FILTER (WHERE operation = 'api_call' AND metadata->>'tokens' IS NOT NULL) as total_tokens
      FROM credential_usage
      WHERE user_id = $1
        AND provider IN ('openai', 'anthropic')
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY provider
    `;

    try {
      const result = await this.#storage.pool.query(query, [userId]);

      const estimates = result.rows.map(row => {
        const providerPricing = pricing[row.provider];
        const estimatedCost = row.total_tokens 
          ? (row.total_tokens / 1000) * (providerPricing?.['gpt-4']?.input || 0.01) // Rough estimate
          : row.api_calls * 0.001; // Fallback estimate

        return {
          provider: row.provider,
          apiCalls: parseInt(row.api_calls) || 0,
          totalTokens: parseInt(row.total_tokens) || 0,
          estimatedCost: estimatedCost.toFixed(4)
        };
      });

      return {
        userId,
        period: `${days} days`,
        estimates,
        totalEstimatedCost: estimates.reduce((sum, e) => sum + parseFloat(e.estimatedCost), 0).toFixed(4)
      };
    } catch (error) {
      return {
        userId,
        period: `${days} days',
        estimates: [],
        totalEstimatedCost: '0',
        note: 'Cost tracking not yet available'
      };
    }
  }

  /**
   * Get most used credentials
   * @param {Object} args - Arguments
   * @returns {Promise<Object>} Most used credentials
   */
  async getMostUsed(args = {}) {
    const { userId, limit = 5 } = args;

    const query = `
      SELECT 
        provider,
        scope,
        COUNT(*) as usage_count,
        MAX(created_at) as last_used
      FROM credential_usage
      WHERE user_id = $1
        AND success = true
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY provider, scope
      ORDER BY usage_count DESC
      LIMIT $2
    `;

    try {
      const result = await this.#storage.pool.query(query, [userId, limit]);

      return {
        userId,
        period: '30 days',
        mostUsed: result.rows.map(row => ({
          provider: row.provider,
          scope: row.scope,
          usageCount: parseInt(row.usage_count),
          lastUsed: row.last_used
        }))
      };
    } catch (error) {
      return {
        userId,
        period: '30 days',
        mostUsed: [],
        note: 'Usage tracking not yet available'
      };
    }
  }

  /**
   * Group usage stats by provider
   * @private
   */
  #groupByProvider(rows) {
    const byProvider = {};

    for (const row of rows) {
      if (!byProvider[row.provider]) {
        byProvider[row.provider] = {
          totalUsage: 0,
          successCount: 0,
          failureCount: 0,
          operations: {}
        };
      }

      const provider = byProvider[row.provider];
      provider.totalUsage += parseInt(row.usage_count);
      provider.successCount += parseInt(row.success_count);
      provider.failureCount += parseInt(row.failure_count);

      if (!provider.operations[row.operation]) {
        provider.operations[row.operation] = 0;
      }
      provider.operations[row.operation] += parseInt(row.usage_count);
    }

    return byProvider;
  }
}

export default CredentialAnalytics;
