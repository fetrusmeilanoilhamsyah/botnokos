'use strict';

/**
 * ============================================================
 * app.js — Bot Entry Point
 * ============================================================
 * Inisialisasi Telegraf, Redis Session, Middleware, dan Scenes
 */

require('dotenv').config();

const { Telegraf, session, Scenes } = require('telegraf');
const logger = require('./utils/logger');
const { redis, RedisSession } = require('./config/redis');
const { MESSAGES } = require('./config/constants');

// ── Scenes ──────────────────────────────────────────────────
const { allScenes } = require('./scenes');

// ── Middlewares ──────────────────────────────────────────────
const { authMiddleware } = require('./middlewares/auth');
const { rateLimiterMiddleware } = require('./middlewares/rateLimiter');
const { errorHandler } = require('./middlewares/errorHandler');
const { loggerMiddleware } = require('./middlewares/logger');

// ============================================================
// BOT INITIALIZATION
// ============================================================
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ============================================================
// REDIS SESSION MIDDLEWARE
// ============================================================
const redisSession = new RedisSession(redis, {
    ttl: parseInt(process.env.SESSION_TTL, 10) || 3600,
    prefix: process.env.SESSION_PREFIX || 'otp_bot:session:',
});

bot.use(redisSession.middleware());

// ============================================================
// SCENE MANAGER (Stage)
// ============================================================
const stage = new Scenes.Stage(allScenes);

// ============================================================
// GLOBAL MIDDLEWARES
// ============================================================
bot.use(loggerMiddleware);
bot.use(rateLimiterMiddleware);
bot.use(authMiddleware);
bot.use(stage.middleware());

// ============================================================
// /start COMMAND → enter startScene
// ============================================================
bot.start(async (ctx) => {
    try {
        ctx.session.step = null; // reset step setiap /start
        await ctx.scene.enter('start');
    } catch (err) {
        logger.error('Error on /start:', err);
        await ctx.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
});

// ============================================================
// /menu COMMAND (shortcut ke main menu)
// ============================================================
bot.command('menu', async (ctx) => {
    try {
        await ctx.scene.enter('start');
    } catch (err) {
        logger.error('Error on /menu:', err);
    }
});

// ============================================================
// GLOBAL CALLBACK QUERY FALLBACK
// ============================================================
bot.on('callback_query', async (ctx) => {
    try {
        await ctx.answerCbQuery('Memuat...', { cache_time: 1 });
    } catch (_) {
        // silent
    }
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
bot.catch(errorHandler);

// ============================================================
// LAUNCH BOT
// ============================================================
const startBot = async () => {
    try {
        logger.info('🤖 Starting bot...');

        const mode = process.env.BOT_MODE || 'polling';

        if (mode === 'webhook') {
            const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
            await bot.launch({ webhook: { domain: webhookUrl } });
            logger.info(`✅ Bot launched in WEBHOOK mode → ${webhookUrl}`);
        } else {
            await bot.launch();
            logger.info('✅ Bot launched in POLLING mode');
        }
    } catch (err) {
        logger.error('❌ Failed to start bot:', err);
        process.exit(1);
    }
};

startBot();

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
const shutdown = (signal) => {
    logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);
    bot.stop(signal);
    process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

module.exports = bot;
