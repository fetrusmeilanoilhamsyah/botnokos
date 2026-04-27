'use strict';

/**
 * ============================================================
 * history.scene.js — Scene Riwayat Transaksi & Deposit
 * ============================================================
 */

const { Scenes } = require('telegraf');
const { MENU_ACTIONS } = require('../config/constants');
const { backToMainMenuKeyboard } = require('../keyboards/inline.keyboard');
const { formatCurrency, formatDate } = require('../utils/formatter');
const { safeEditMessage } = require('../utils/bot-helper');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const historyScene = new Scenes.BaseScene('history');

// ============================================================
// RIWAYAT DEPOSIT (Transactions)
// ============================================================
historyScene.action(MENU_ACTIONS.HISTORY_TRANSACTIONS, async (ctx) => {
    try {
        await ctx.answerCbQuery('Memuat Riwayat Depo...');
        const user = ctx.session.user;

        // Ambil 5 deposit terakhir
        const result = await query(
            `SELECT amount, status, created_at, external_id 
             FROM transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 5`,
            [user.id]
        );

        let text = `┌── 💰 <b>RIWAYAT DEPOSIT</b> ──\n`;

        if (result.rows.length === 0) {
            text += `├ <i>Belum ada riwayat deposit.</i>\n`;
        } else {
            result.rows.forEach((row, index) => {
                const statusEmoji = row.status === 'completed' ? '✅' : (row.status === 'pending' ? '⏳' : '❌');
                const date = formatDate(row.created_at);
                text += `├ ${index + 1}. <b>${formatCurrency(row.amount)}</b>\n`;
                text += `│  Status: ${statusEmoji} ${row.status.toUpperCase()}\n`;
                text += `│  Tanggal: <code>${date}</code>\n`;
                if (index < result.rows.length - 1) text += `│\n`;
            });
        }

        text += `└──────────────────\n\n`;
        text += `👇 Gunakan menu di bawah untuk kembali:`;

        await safeEditMessage(ctx, text, backToMainMenuKeyboard());
    } catch (err) {
        logger.error('[historyScene] transactions error:', err.message);
        await ctx.answerCbQuery('Gagal memuat riwayat.', { show_alert: true });
    }
});

// ============================================================
// RIWAYAT ORDER (OTP Orders)
// ============================================================
historyScene.action(MENU_ACTIONS.HISTORY_ORDERS, async (ctx) => {
    try {
        await ctx.answerCbQuery('Memuat Riwayat Order...');
        const user = ctx.session.user;

        // Ambil 5 order terakhir
        const result = await query(
            `SELECT service_code, phone_number, price, status, created_at 
             FROM orders 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 5`,
            [user.id]
        );

        let text = `┌── 📋 <b>RIWAYAT ORDER OTP</b> ──\n`;

        if (result.rows.length === 0) {
            text += `├ <i>Belum ada riwayat order.</i>\n`;
        } else {
            result.rows.forEach((row, index) => {
                const statusEmoji = row.status === 'completed' ? '✅' : '❌';
                const date = formatDate(row.created_at);
                text += `├ ${index + 1}. <b>${row.service_code.toUpperCase()}</b> - ${row.phone_number || 'N/A'}\n`;
                text += `│  Harga: ${formatCurrency(row.price)}\n`;
                text += `│  Status: ${statusEmoji} ${row.status.toUpperCase()}\n`;
                text += `│  Tanggal: <code>${date}</code>\n`;
                if (index < result.rows.length - 1) text += `│\n`;
            });
        }

        text += `└──────────────────\n\n`;
        text += `👇 Gunakan menu di bawah untuk kembali:`;

        await safeEditMessage(ctx, text, backToMainMenuKeyboard());
    } catch (err) {
        logger.error('[historyScene] orders error:', err.message);
        await ctx.answerCbQuery('Gagal memuat riwayat.', { show_alert: true });
    }
});

// ============================================================
// NAVIGASI
// ============================================================
historyScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { historyScene };
