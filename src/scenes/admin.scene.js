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

// ============================================================
// ENTER: Tampilan Panel Admin
// ============================================================
adminScene.enter(async (ctx) => {
    try {
        // Double security check
        if (ctx.session.user?.role !== 'admin') {
            await ctx.answerCbQuery('⛔ Akses Ditolak!', { show_alert: true });
            return ctx.scene.enter('start');
        }

        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT SUM(balance) FROM users) as total_balance,
                (SELECT COUNT(*) FROM transactions WHERE status = 'completed') as total_success_topup,
                (SELECT COUNT(*) FROM orders WHERE status = 'completed') as total_success_orders,
                (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_today
        `);

        const { total_users, total_balance, total_success_topup, total_success_orders, orders_today } = stats.rows[0];

        const text =
            `┌── 🛠️ <b>PANEL ADMINISTRATOR</b> ──\n` +
            `├ Total User: <b>${total_users}</b>\n` +
            `├ Total Saldo Beredar: <b>${formatCurrency(total_balance || 0)}</b>\n` +
            `├ Topup Berhasil: <b>${total_success_topup}</b>\n` +
            `├ Order OTP Sukses: <b>${total_success_orders}</b>\n` +
            `└ Order Hari Ini: <b>${orders_today}</b>\n\n` +
            `👇 <b>Menu Kelola:</b>`;

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('👥 Daftar User', 'admin_users'),
                Markup.button.callback('📊 Statistik', 'admin_stats'),
            ],
            [
                Markup.button.callback('📢 Broadcast', 'admin_broadcast'),
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

// ============================================================
// ADMIN: Daftar User
// ============================================================
adminScene.action('admin_users', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        if (ctx.session.user?.role !== 'admin') return;

        const result = await query(
            `SELECT telegram_id, username, first_name, balance, role, created_at 
             FROM users ORDER BY created_at DESC LIMIT 10`
        );

        let text = `┌── 👥 <b>DAFTAR USER TERBARU</b> ──\n`;
        result.rows.forEach((u, i) => {
            text += `├ ${i + 1}. <code>${u.telegram_id}</code> @${u.username || '-'}\n`;
            text += `│  Saldo: ${formatCurrency(u.balance)} | Role: ${u.role}\n`;
        });
        text += `└──────────────────`;

        await safeEditMessage(ctx, text, Markup.inlineKeyboard([
            [Markup.button.callback('« Kembali', 'back_to_admin')]
        ]));
    } catch (err) {
        logger.error('[adminScene] admin_users error:', err.message);
    }
});

// ============================================================
// ADMIN: Statistik Detail
// ============================================================
adminScene.action('admin_stats', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        if (ctx.session.user?.role !== 'admin') return;

        const result = await query(`
            SELECT
                (SELECT SUM(amount) FROM transactions WHERE status = 'completed') as total_revenue,
                (SELECT COUNT(*) FROM orders WHERE status = 'completed') as success_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
                (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week
        `);

        const { total_revenue, success_orders, cancelled_orders, new_users_week } = result.rows[0];

        const text =
            `┌── 📊 <b>STATISTIK DETAIL</b> ──\n` +
            `├ Total Revenue: <b>${formatCurrency(total_revenue || 0)}</b>\n` +
            `├ Order Sukses: <b>${success_orders}</b>\n` +
            `├ Order Batal: <b>${cancelled_orders}</b>\n` +
            `└ User Baru (7 hari): <b>${new_users_week}</b>`;

        await safeEditMessage(ctx, text, Markup.inlineKeyboard([
            [Markup.button.callback('« Kembali', 'back_to_admin')]
        ]));
    } catch (err) {
        logger.error('[adminScene] admin_stats error:', err.message);
    }
});

// ============================================================
// ADMIN: Broadcast (placeholder siap pakai)
// ============================================================
adminScene.action('admin_broadcast', async (ctx) => {
    await ctx.answerCbQuery();
    await safeEditMessage(ctx,
        `📢 <b>BROADCAST</b>\n\nFitur ini belum aktif.\nHubungi developer untuk mengaktifkan.`,
        Markup.inlineKeyboard([[Markup.button.callback('« Kembali', 'back_to_admin')]])
    );
});

// ============================================================
// NAVIGASI
// ============================================================
adminScene.action('back_to_admin', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.reenter();
});

adminScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

adminScene.action('admin_panel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.reenter();
});

module.exports = { adminScene };
