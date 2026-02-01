/**
 * ============================================================================
 * VIBE STACK - Rate Limiting Middleware
 * ============================================================================
 * Express rate limiting middleware for API protection
 * @version 1.0.0
 * ============================================================================
 */

import rateLimit from 'express-rate-limit';
import { Logger } from '../utils/logger.js';

/**
 * Rate limit configuration from environment or defaults
 */
const RATE_LIMIT_CONFIG = {
  // Window duration in milliseconds (default: 15 minutes)
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),

  // Maximum requests per window
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),

  // Standard rate limit for most endpoints
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later.'
  },

  // Stricter rate limit for expensive operations (task creation, planning)
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: 'Too many expensive operations from this IP, please try again later.'
  },

  // Very strict rate limit for AI planning operations
  planning: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 planning requests per hour
    message: 'Too many AI planning requests from this IP, please try again later.'
  },

  // Lenient rate limit for read-only operations
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per window
    message: 'Too many read requests from this IP, please try again later.'
  }
};

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message
 * @param {string} options.prefix - Prefix for logging
 * @returns {Function} Express middleware
 */
function createRateLimiter(options) {
  const limiter = rateLimit({
    windowMs: options.windowMs || RATE_LIMIT_CONFIG.standard.windowMs,
    max: options.max || RATE_LIMIT_CONFIG.standard.max,
    message: options.message || RATE_LIMIT_CONFIG.standard.message,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers

    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      Logger.warn(`[RateLimit] ${options.prefix || 'API'} rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests',
        message: options.message || RATE_LIMIT_CONFIG.standard.message,
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },

    // Skip rate limiting for successful requests (optional optimization)
    skipSuccessfulRequests: false,

    // Skip failed requests from counting against the limit
    skipFailedRequests: false
  });

  return limiter;
}

/**
 * Standard rate limiter for most API endpoints
 * 100 requests per 15 minutes per IP
 */
export const standardRateLimit = createRateLimiter({
  ...RATE_LIMIT_CONFIG.standard,
  prefix: 'Standard'
});

/**
 * Strict rate limiter for expensive operations
 * 20 requests per 15 minutes per IP
 * Use for: task creation, updates, deletions
 */
export const strictRateLimit = createRateLimiter({
  ...RATE_LIMIT_CONFIG.strict,
  prefix: 'Strict'
});

/**
 * Planning rate limiter for AI operations
 * 10 planning requests per hour per IP
 * Use for: intelligent task planning, pattern detection
 */
export const planningRateLimit = createRateLimiter({
  ...RATE_LIMIT_CONFIG.planning,
  prefix: 'Planning'
});

/**
 * Read rate limiter for GET operations
 * 300 requests per 15 minutes per IP
 * Use for: board reads, statistics, searches
 */
export const readRateLimit = createRateLimiter({
  ...RATE_LIMIT_CONFIG.read,
  prefix: 'Read'
});

/**
 * Health check rate limiter (very lenient)
 * 1000 requests per 15 minutes per IP
 * Use for: health check endpoints
 */
export const healthCheckRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Health check rate limit exceeded',
  prefix: 'HealthCheck'
});

/**
 * Configure rate limiting from environment variables
 * Allows runtime configuration without code changes
 */
export function getRateLimitConfig() {
  return {
    standard: {
      windowMs: parseInt(process.env.RATE_LIMIT_STANDARD_WINDOW || '900000'),
      max: parseInt(process.env.RATE_LIMIT_STANDARD_MAX || '100')
    },
    strict: {
      windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW || '900000'),
      max: parseInt(process.env.RATE_LIMIT_STRICT_MAX || '20')
    },
    planning: {
      windowMs: parseInt(process.env.RATE_LIMIT_PLANNING_WINDOW || '3600000'),
      max: parseInt(process.env.RATE_LIMIT_PLANNING_MAX || '10')
    },
    read: {
      windowMs: parseInt(process.env.RATE_LIMIT_READ_WINDOW || '900000'),
      max: parseInt(process.env.RATE_LIMIT_READ_MAX || '300')
    }
  };
}

export default {
  standardRateLimit,
  strictRateLimit,
  planningRateLimit,
  readRateLimit,
  healthCheckRateLimit,
  getRateLimitConfig
};
