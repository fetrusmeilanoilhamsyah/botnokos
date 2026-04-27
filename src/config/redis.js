/**
 * ============================================================
 * Redis Configuration
 * ============================================================
 * Redis client for session management, caching, and rate limiting
 */

const Redis = require('ioredis');
const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,

  // Connection options
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnecting... attempt ${times}, delay: ${delay}ms`);
    return delay;
  },

  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Performance
  lazyConnect: false,
  keepAlive: 30000,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Event handlers
redis.on('connect', () => {
  logger.info('🔗 Redis connecting...');
});

redis.on('ready', () => {
  logger.info('✅ Redis connection ready');
});

redis.on('error', (err) => {
  logger.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  logger.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.warn('🔄 Redis reconnecting...');
});

/**
 * ============================================================
 * REDIS SESSION STORE for Telegraf
 * ============================================================
 */
class RedisSession {
  constructor(client, options = {}) {
    this.client = client;
    this.ttl = options.ttl || parseInt(process.env.SESSION_TTL, 10) || 3600;
    this.prefix = options.prefix || process.env.SESSION_PREFIX || 'otp_bot:session:';
  }

  /**
   * Get session key
   */
  getSessionKey(ctx) {
    if (!ctx.from || !ctx.chat) {
      return null;
    }
    return `${this.prefix}${ctx.chat.id}:${ctx.from.id}`;
  }

  /**
   * Get session data
   */
  async getSession(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logger.error('Error getting session:', error);
      return {};
    }
  }

  /**
   * Save session data
   */
  async saveSession(key, session) {
    try {
      if (session && Object.keys(session).length > 0) {
        await this.client.setex(key, this.ttl, JSON.stringify(session));
      } else {
        await this.client.del(key);
      }
    } catch (error) {
      logger.error('Error saving session:', error);
    }
  }

  /**
   * Middleware for Telegraf
   */
  middleware() {
    return async (ctx, next) => {
      const key = this.getSessionKey(ctx);

      if (!key) {
        return next();
      }

      // Load session
      ctx.session = await this.getSession(key);

      // Save session after processing
      await next();

      // Save updated session
      await this.saveSession(key, ctx.session);
    };
  }
}

/**
 * ============================================================
 * CACHE UTILITIES
 * ============================================================
 */

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any>}
 */
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null;
  }
};

/**
 * Set cache data
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Error setting cache:', error);
    return false;
  }
};

/**
 * Delete cache
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Error deleting cache:', error);
    return false;
  }
};

/**
 * Clear all cache with prefix
 * @param {string} prefix - Key prefix
 */
const clearCacheByPrefix = async (prefix) => {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * ============================================================
 * RATE LIMITING
 * ============================================================
 */

/**
 * Check rate limit
 * @param {string} key - Rate limit key (e.g., user_id)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<boolean>} True if allowed, false if rate limited
 */
const checkRateLimit = async (key, maxRequests = 30, windowMs = 60000) => {
  try {
    const rateLimitKey = `rate_limit:${key}`;
    const current = await redis.incr(rateLimitKey);

    if (current === 1) {
      await redis.pexpire(rateLimitKey, windowMs);
    }

    return current <= maxRequests;
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    return true; // Allow on error
  }
};

/**
 * Get remaining rate limit
 * @param {string} key - Rate limit key
 * @returns {Promise<number>} Remaining requests
 */
const getRateLimitRemaining = async (key) => {
  try {
    const rateLimitKey = `rate_limit:${key}`;
    const current = await redis.get(rateLimitKey);
    return current ? parseInt(current, 10) : 0;
  } catch (error) {
    logger.error('Error getting rate limit:', error);
    return 0;
  }
};

/**
 * ============================================================
 * GRACEFUL SHUTDOWN
 * ============================================================
 */
const closeRedis = async () => {
  try {
    await redis.quit();
    logger.info('✅ Redis connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error);
  }
};

// Handle process termination
process.on('SIGTERM', closeRedis);
process.on('SIGINT', closeRedis);

module.exports = {
  redis,
  RedisSession,
  getCache,
  setCache,
  deleteCache,
  clearCacheByPrefix,
  checkRateLimit,
  getRateLimitRemaining,
  closeRedis,
};