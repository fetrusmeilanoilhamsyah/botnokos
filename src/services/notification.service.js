'use strict';

/**
 * ============================================================
 * services/notification.service.js — Telegram Notifications
 * ============================================================
 * Mengirim pesan ke user di luar alur bot normal (dari webhook).
 * CATATAN: Menggunakan Telegraf.telegram langsung tanpa bikin
 * instance baru, lebih hemat memori untuk VPS RAM 1GB.
 */

const { Telegraf }       = require('telegraf');
const logger             = require('../utils/logger');
const { formatCurrency } = require('../utils/formatter');

// Pakai instance minimal (hanya gunakan .telegram API, tidak launch bot baru)
const telegram = new Telegraf(process.env.TELEGRAM_BOT_TOKEN).telegram;

/**
 * Kirim notifikasi pembayaran berhasil ke user
 * @param {string|number} telegramId - ID Telegram user
 * @param {number} amount            - Nominal topup
 * @param {number} newBalance        - Saldo baru setelah topup
 */
const notifyPaymentSuccess = async (telegramId, amount, newBalance) => {
    try {
        const text =
            `✅ <b>Top-up Berhasil!</b>\n\n` +
            `Saldo sebesar <b>${formatCurrency(amount)}</b> telah ditambahkan ke akun Anda.\n` +
            `💰 Saldo sekarang: <b>${formatCurrency(newBalance)}</b>\n\n` +
            `Terima kasih telah menggunakan layanan kami! 🙏`;

        await telegram.sendMessage(telegramId, text, { parse_mode: 'HTML' });
        logger.info(`[notification] Payment success notification sent to ${telegramId}`);
    } catch (err) {
        logger.error(`[notification] Failed to send payment notification to ${telegramId}:`, err.message);
    }
};

/**
 * Kirim notifikasi ke admin
 * @param {string} message - Pesan yang ingin dikirim
 */
const notifyAdmin = async (message) => {
    try {
        const adminId = process.env.ADMIN_TELEGRAM_ID;
        if (!adminId) return;

        await telegram.sendMessage(adminId, `🔔 <b>Admin Notification</b>\n\n${message}`, { parse_mode: 'HTML' });
    } catch (err) {
        logger.error(`[notification] Failed to notify admin:`, err.message);
    }
};

/**
 * Hapus pesan dari chat (anti-numpuk)
 * @param {string|number} chatId    - ID chat
 * @param {string|number} messageId - ID pesan yang akan dihapus
 */
const deleteMessage = async (chatId, messageId) => {
    try {
        if (!chatId || !messageId) return;
        await telegram.deleteMessage(chatId, messageId);
        logger.info(`[notification] Deleted message ${messageId} in chat ${chatId}`);
    } catch (err) {
        // Diam-diam gagal jika pesan sudah dihapus atau tidak ditemukan
        logger.debug(`[notification] Could not delete message ${messageId}: ${err.message}`);
    }
};

module.exports = {
    notifyPaymentSuccess,
    notifyAdmin,
    deleteMessage,
};
