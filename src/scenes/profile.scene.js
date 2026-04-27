'use strict';

/**
 * ============================================================
 * profile.scene.js — Scene Profil User
 * ============================================================
 */

const { Scenes }                = require('telegraf');
const { MENU_ACTIONS }           = require('../config/constants');
const { profileMenuKeyboard }    = require('../keyboards/inline.keyboard');
const { formatCurrency, formatDate } = require('../utils/formatter');
const { safeEditMessage }           = require('../utils/bot-helper');
const logger                         = require('../utils/logger');

const profileScene = new Scenes.BaseScene('profile');

profileScene.enter(async (ctx) => {
    try {
        const user = ctx.session.user || {};
        const joinDate = user.created_at ? formatDate(user.created_at) : '-';

        const text =
            `┌── 👤 <b>PROFIL PENGGUNA</b> ──\n` +
            `├ Nama: <b>${ctx.from.first_name}</b>\n` +
            `├ Username: @${ctx.from.username || '-'}\n` +
            `├ ID: <code>${user.telegram_id}</code>\n` +
            `├ Bergabung: <code>${joinDate}</code>\n` +
            `└ Pangkat: <b>${(user.role || 'user').toUpperCase()}</b>\n\n` +

            `┌── 💰 <b>KEUANGAN</b> ──\n` +
            `├ Saldo: <b>${formatCurrency(user.balance || 0)}</b>\n` +
            `└ Total Topup: <b>${formatCurrency(user.total_topup || 0)}</b>\n\n` +
            
            `👇 Gunakan tombol di bawah untuk navigasi:`;

        await safeEditMessage(ctx, text, profileMenuKeyboard(user));
    } catch (err) {
        logger.error('[profileScene.enter] Error:', err.message);
    }
});

// Refresh profile
profileScene.action(MENU_ACTIONS.REFRESH, async (ctx) => {
    await ctx.answerCbQuery('Memperbarui...');
    await ctx.scene.enter('profile');
});

// Handler untuk tombol yang ada di keyboard profil
profileScene.action(MENU_ACTIONS.PROFILE_BALANCE, async (ctx) => {
    await ctx.answerCbQuery(`Saldo Anda: ${formatCurrency(ctx.session.user.balance)}`, { show_alert: true });
});

profileScene.action(MENU_ACTIONS.PROFILE_STATS, async (ctx) => {
    await ctx.answerCbQuery('Statistik Anda akan muncul di sini.', { show_alert: true });
});

profileScene.action(MENU_ACTIONS.PROFILE_SETTINGS, async (ctx) => {
    await ctx.answerCbQuery('Pengaturan segera hadir!', { show_alert: true });
});

// Menu Utama
profileScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { profileScene };
