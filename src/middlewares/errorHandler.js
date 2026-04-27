'use strict';

/**
 * ============================================================
 * middlewares/errorHandler.js — Global Error Handler
 * ============================================================
 * Dipasang via bot.catch() untuk menangkap semua unhandled error.
 * Mengirim pesan yang ramah ke user dan mencatat error ke log.
 */

const logger = require('../utils/logger');

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

const errorHandler = async (err, ctx) => {
    const userId = ctx?.from?.id || 'unknown';
    const action = ctx?.callbackQuery?.data || ctx?.message?.text || 'unknown';

    logger.error(`[errorHandler] Error for user ${userId} on action "${action}":`, {
        message : err.message,
        stack   : err.stack,
    });

    try {
        // Pesan user-friendly
        const userMessage =
            `❌ <b>Terjadi kesalahan.</b>\n\n` +
            `Silakan coba lagi dalam beberapa saat. Jika masalah berlanjut, hubungi admin.`;

        if (ctx?.callbackQuery) {
            await ctx.answerCbQuery('Terjadi kesalahan. Coba lagi.', { show_alert: true });
        } else if (ctx?.reply) {
            await ctx.reply(userMessage, { parse_mode: 'HTML' });
        }

        // Notifikasi admin jika ADMIN_ID tersedia
        if (ADMIN_ID && ctx?.telegram) {
            const adminMsg =
                `🚨 <b>Bot Error</b>\n\n` +
                `User: <code>${userId}</code>\n` +
                `Action: <code>${action}</code>\n` +
                `Error: <code>${err.message}</code>`;

            await ctx.telegram
                .sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'HTML' })
                .catch(() => null); // Jangan throw jika notifikasi admin gagal
        }
    } catch (notifyErr) {
        logger.error('[errorHandler] Failed to send error notification:', notifyErr.message);
    }
};

module.exports = { errorHandler };
