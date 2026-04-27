'use strict';

/**
 * ============================================================
 * middlewares/rateLimiter.js — Rate Limiter berbasis Redis
 * ============================================================
 * Mencegah user spam request ke bot.
 * Menggunakan INCR + EXPIRE di Redis untuk sliding window.
 */

const { checkRateLimit } = require('../config/redis');
const logger             = require('../utils/logger');

const RATE_LIMIT_MAX     = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30;
const RATE_LIMIT_WINDOW  = parseInt(process.env.RATE_LIMIT_WINDOW,        10) || 60000;

const rateLimiterMiddleware = async (ctx, next) => {
    if (!ctx.from) {
        return next();
    }

    try {
        const key     = `user:${ctx.from.id}`;
        const allowed = await checkRateLimit(key, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);

        if (!allowed) {
            logger.warn(`[rateLimiter] Rate limit hit for user ${ctx.from.id}`);

            // Untuk callback_query, jawab dengan alert kecil agar tidak hang
            if (ctx.callbackQuery) {
                await ctx.answerCbQuery('⚠️ Terlalu banyak request. Tunggu sebentar.', {
                    show_alert : false,
                    cache_time : 5,
                });
            }
            // Jangan lanjutkan ke handler berikutnya
            return;
        }
    } catch (err) {
        // Jika Redis error, biarkan request lewat (fail-open)
        logger.error('[rateLimiter] Redis error:', err.message);
    }

    return next();
};

module.exports = { rateLimiterMiddleware };
