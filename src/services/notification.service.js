'use strict';

/**
 * ============================================================
 * services/notification.service.js — Telegram Notifications
 * ============================================================
 * Mengirim pesan ke user di luar alur bot normal (misal: dari webhook)
 */

const { Telegraf } = require('telegraf');
const logger       = require('../utils/logger');
const { formatCurrency } = require('../utils/formatter');

// Inisialisasi bot instance terpisah untuk pengiriman pesan (non-polling/webhook)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

/**
 * Send notification to user about successful payment
 * @param {string|number} telegramId - User's Telegram ID
 * @param {number} amount - Topup amount
 * @param {number} newBalance - User's new total balance
 */
const notifyPaymentSuccess = async (telegramId, amount, newBalance) => {
    try {
        const text =
            `✅ <b>Top-up Berhasil!</b>\n\n` +
            `Saldo sebesar <b>${formatCurrency(amount)}</b> telah ditambahkan ke akun Anda.\n` +
            `💰 Saldo sekarang: <b>${formatCurrency(newBalance)}</b>\n\n` +
            `Terima kasih telah menggunakan layanan kami! 🙏`;

        await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'HTML' });
        logger.info(`[notification] Payment success notification sent to ${telegramId}`);
    } catch (err) {
        logger.error(`[notification] Failed to send payment notification to ${telegramId}:`, err.message);
    }
};

/**
 * Send custom notification to admin
 * @param {string} message - Message to send
 */
const notifyAdmin = async (message) => {
    try {
        const adminId = process.env.ADMIN_TELEGRAM_ID;
        if (!adminId) return;

        await bot.telegram.sendMessage(adminId, `🔔 <b>Admin Notification</b>\n\n${message}`, { parse_mode: 'HTML' });
    } catch (err) {
        logger.error(`[notification] Failed to notify admin:`, err.message);
    }
};

/**
 * Delete a message from chat
 * @param {string|number} chatId 
 * @param {string|number} messageId 
 */
const deleteMessage = async (chatId, messageId) => {
    try {
        if (!chatId || !messageId) return;
        await bot.telegram.deleteMessage(chatId, messageId);
        logger.info(`[notification] Deleted message ${messageId} in chat ${chatId}`);
    } catch (err) {
        // Silently fail if message already deleted or not found
        logger.debug(`[notification] Failed to delete message ${messageId}: ${err.message}`);
    }
};

module.exports = {
    notifyPaymentSuccess,
    notifyAdmin,
    deleteMessage,
};
