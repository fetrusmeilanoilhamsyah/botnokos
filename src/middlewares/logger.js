'use strict';

/**
 * ============================================================
 * middlewares/logger.js — Request Logger Middleware
 * ============================================================
 * Mencatat setiap update yang masuk ke bot untuk audit trail.
 */

const logger = require('../utils/logger');

const loggerMiddleware = async (ctx, next) => {
    const start  = Date.now();
    const userId = ctx.from?.id || 'anon';
    const type   = ctx.updateType;

    let detail = '';
    if (type === 'message')        detail = ctx.message?.text?.substring(0, 80) || '[media]';
    if (type === 'callback_query') detail = ctx.callbackQuery?.data || '';

    await next();

    const ms = Date.now() - start;
    logger.info(`[${type}] user=${userId} | "${detail}" | ${ms}ms`);
};

module.exports = { loggerMiddleware };
