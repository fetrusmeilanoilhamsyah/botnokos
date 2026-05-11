'use strict';

/**
 * ============================================================
 * referral.scene.js — Sistem Undang Teman (Affiliate)
 * ============================================================
 */

const { Scenes }             = require('telegraf');
const { MENU_ACTIONS }       = require('../config/constants');
const { backToMainMenuKeyboard } = require('../keyboards/inline.keyboard');
const { formatCurrency }     = require('../utils/formatter');
const { safeEditMessage }    = require('../utils/bot-helper');
const { query }              = require('../config/database');
const logger                 = require('../utils/logger');

const referralScene = new Scenes.BaseScene('referral');

referralScene.enter(async (ctx) => {
    try {
        const user = ctx.session.user;
        const botUsername = ctx.botInfo.username;
        const referralLink = `https://t.me/${botUsername}?start=${user.telegram_id}`;

        // Ambil statistik terbaru dari DB
        const stats = await query(
            'SELECT referred_count, referral_bonus_total FROM users WHERE id = $1',
            [user.id]
        );

        const { referred_count, referral_bonus_total } = stats.rows[0];

        const text = 
            `<b>Program Referral</b>\n` +
            `<i>Ajak teman, dapatkan bonus saldo otomatis.</i>\n\n` +
            `<b>Statistik Anda</b>\n` +
            `Teman Diajak: <b>${referred_count} orang</b>\n` +
            `Total Bonus: <b>${formatCurrency(referral_bonus_total || 0)}</b>\n\n` +
            `Bonus <b>Rp 100</b> masuk otomatis setiap teman yang Anda undang berhasil melakukan deposit pertama.\n\n` +
            `<b>Link Referral Anda</b> (tap untuk salin):\n` +
            `<code>${referralLink}</code>`;

        await safeEditMessage(ctx, text, backToMainMenuKeyboard());
    } catch (err) {
        logger.error('[referralScene] Error:', err.message);
    }
});

// Kembali ke Menu Utama
referralScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { referralScene };
