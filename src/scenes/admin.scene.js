'use strict';

/**
 * ============================================================
 * admin.scene.js — Panel Admin (Khusus Pengelola)
 * ============================================================
 */

const { Scenes, Markup }        = require('telegraf');
const { MENU_ACTIONS }           = require('../config/constants');
const { safeEditMessage }        = require('../utils/bot-helper');
const { query }                  = require('../config/database');
const logger                     = require('../utils/logger');
const { formatCurrency }         = require('../utils/formatter');

const adminScene = new Scenes.BaseScene('admin_panel');

adminScene.enter(async (ctx) => {
    try {
        // Double security check
        if (ctx.session.user?.role !== 'admin') {
            await ctx.answerCbQuery('Akses Ditolak!', { show_alert: true });
            return ctx.scene.enter('start');
        }

        // Ambil statistik ringkas
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT SUM(balance) FROM users) as total_balance,
                (SELECT COUNT(*) FROM transactions WHERE status = 'completed') as total_success_topup
        `);

        const { total_users, total_balance, total_success_topup } = stats.rows[0];

        const text =
            `┌── 🛠️ <b>PANEL ADMINISTRATOR</b> ──\n` +
            `├ Total User: <b>${total_users}</b>\n` +
            `├ Total Saldo User: <b>${formatCurrency(total_balance || 0)}</b>\n` +
            `└ Topup Berhasil: <b>${total_success_topup}</b>\n\n` +
            `👇 <b>Menu Kelola:</b>`;

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('👥 Kelola User', 'admin_users'),
                Markup.button.callback('💰 Broadcast', 'admin_broadcast'),
            ],
            [
                Markup.button.callback('📊 Statistik Detail', 'admin_stats'),
            ],
            [
                Markup.button.callback('« Kembali ke Menu Utama', MENU_ACTIONS.MAIN_MENU),
            ],
        ]);

        await safeEditMessage(ctx, text, keyboard);
    } catch (err) {
        logger.error('[adminScene.enter] Error:', err.message);
    }
});

// Kembali ke Menu Utama
adminScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { adminScene };
