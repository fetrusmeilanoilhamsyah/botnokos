'use strict';

/**
 * ============================================================
 * scenes/top_users.scene.js — Leaderboard Pengguna Teratas
 * ============================================================
 */

const { Scenes } = require('telegraf');
const { backToMainMenuKeyboard } = require('../keyboards/inline.keyboard');
const { formatCurrency } = require('../utils/formatter');
const { safeEditMessage } = require('../utils/bot-helper');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const topUsersScene = new Scenes.BaseScene('top_users');

topUsersScene.enter(async (ctx) => {
    try {
        const textLoad = `⏳ <i>Sedang memuat data peringkat...</i>`;
        await safeEditMessage(ctx, textLoad);

        // Ambil 10 user dengan total transaksi (orders) terbanyak (Sync Schema: price)
        const result = await query(
            `SELECT u.username, u.telegram_id, COUNT(o.id) as total_orders, SUM(o.price) as total_spend
             FROM users u
             LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
             GROUP BY u.id
             ORDER BY total_orders DESC
             LIMIT 10`
        );

        let leaderboard = `┌── 🏆 <b>TOP 10 PENGGUNA</b> ──\n`;
        leaderboard += `├ <i>Berdasarkan total order sukses</i>\n`;
        leaderboard += `└──────────────────\n\n`;

        if (result.rows.length === 0) {
            leaderboard += `<i>Belum ada data peringkat.</i>\n`;
        } else {
            result.rows.forEach((row, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                const name = row.username ? `@${row.username}` : `User_${String(row.telegram_id).slice(-4)}`;
                leaderboard += `${medal} <b>${index + 1}. ${name}</b>\n`;
                leaderboard += `└ Order: <code>${row.total_orders}</code> | Spend: <code>${formatCurrency(row.total_spend || 0)}</code>\n\n`;
            });
        }

        leaderboard += `✨ <i>Terus bertransaksi untuk jadi nomor 1!</i>`;

        const keyboard = backToMainMenuKeyboard();
        await safeEditMessage(ctx, leaderboard, keyboard);
    } catch (err) {
        logger.error('[topUsersScene] Error:', err.message);
        await ctx.reply('❌ Gagal memuat peringkat.', backToMainMenuKeyboard());
    }
});

topUsersScene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { topUsersScene };
