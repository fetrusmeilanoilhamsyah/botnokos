'use strict';

/**
 * ============================================================
 * utils/bot-helper.js — Bot UI Helpers
 * ============================================================
 */

const logger = require('./logger');

/**
 * Mengedit pesan yang sudah ada dengan aman.
 * Jika gagal (karena pesan dihapus atau terlalu lama), akan mengirim pesan baru.
 */
const safeEditMessage = async (ctx, text, keyboard) => {
    try {
        const chatId    = ctx.session.menuChatId    || ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id;
        const messageId = ctx.session.menuMessageId || ctx.callbackQuery?.message?.message_id;

        if (messageId && chatId) {
            await ctx.telegram.editMessageText(
                chatId,
                messageId,
                null,
                text,
                { parse_mode: 'HTML', ...keyboard }
            );
        } else {
            // Jika tidak ada ID pesan untuk di-edit, kirim pesan baru
            const sent = await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
            ctx.session.menuMessageId = sent.message_id;
            ctx.session.menuChatId    = sent.chat.id;
        }
    } catch (err) {
        // Jika error "message is not modified", abaikan saja
        if (err.message && err.message.includes('message is not modified')) {
            return;
        }

        // Fallback: kirim pesan baru jika edit gagal
        logger.warn('[safeEditMessage] Edit failed, falling back to new message:', err.message);
        try {
            const sent = await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
            ctx.session.menuMessageId = sent.message_id;
            ctx.session.menuChatId    = sent.chat.id;
        } catch (replyErr) {
            logger.error('[safeEditMessage] Critical failure:', replyErr.message);
        }
    }
};

module.exports = {
    safeEditMessage,
};
