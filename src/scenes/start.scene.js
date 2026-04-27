'use strict';

/**
 * ============================================================
 * start.scene.js — Scene Utama (Main Menu Hub)
 * ============================================================
 */

const { Scenes } = require('telegraf');
const { MENU_ACTIONS } = require('../config/constants');
const {
    mainMenuKeyboard,
    historyMenuKeyboard,
    backToMainMenuKeyboard,
} = require('../keyboards/inline.keyboard');
const { formatCurrency, formatDate } = require('../utils/formatter');
const { safeEditMessage } = require('../utils/bot-helper');
const logger = require('../utils/logger');

const startScene = new Scenes.BaseScene('start');

/**
 * SCENE ENTER
 */
startScene.enter(async (ctx) => {
    try {
        const user = ctx.session.user || {};
        const name = ctx.from.first_name || 'Pengguna';
        const text = buildMainMenuText(name, user);

        // Jika dipicu dari command /start, kita kirim pesan baru
        if (ctx.updateType === 'message') {
            // Hapus menu lama agar tidak numpuk
            if (ctx.session.menuMessageId && ctx.session.menuChatId) {
                await ctx.telegram.deleteMessage(ctx.session.menuChatId, ctx.session.menuMessageId).catch(() => null);
            }

            const sent = await ctx.reply(text, {
                parse_mode: 'HTML',
                ...mainMenuKeyboard(user),
            });
            ctx.session.menuMessageId = sent.message_id;
            ctx.session.menuChatId = sent.chat.id;
        } else {
            await safeEditMessage(ctx, text, mainMenuKeyboard(user));
        }
    } catch (err) {
        logger.error('[startScene.enter] Error:', err.message);
    }
});

/**
 * ACTIONS
 */
startScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('start');
});

startScene.action(MENU_ACTIONS.PROFILE, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('profile');
});

startScene.action(MENU_ACTIONS.ORDER_OTP, async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => null);
        await ctx.scene.enter('order_otp');
    } catch (err) {
        logger.error('[startScene] ORDER_OTP error:', err.message);
    }
});

startScene.action(MENU_ACTIONS.TOPUP, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('topup');
});

startScene.action('referral', async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('referral');
});

startScene.action('top_users', async (ctx) => {
    try {
        await ctx.answerCbQuery().catch(() => null);
        await ctx.scene.enter('top_users');
    } catch (err) {
        logger.error('[startScene] top_users error:', err.message);
    }
});

startScene.action(MENU_ACTIONS.HISTORY, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('history');
});

startScene.action(MENU_ACTIONS.HISTORY_ORDERS, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('history');
});

startScene.action(MENU_ACTIONS.HISTORY_TRANSACTIONS, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('history');
});

startScene.action(MENU_ACTIONS.HELP, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    const support = process.env.SUPPORT_TELEGRAM || '@Support';
    const text = `<b>❓ Bantuan</b>\n\nHubungi ${support} untuk bantuan.`;
    await safeEditMessage(ctx, text, backToMainMenuKeyboard());
});

startScene.action(MENU_ACTIONS.CLOSE, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => null);
});

/**
 * HELPER
 */
function buildMainMenuText(name, user) {
    const balance = user.balance != null ? formatCurrency(parseFloat(user.balance)) : formatCurrency(0);
    const role = (user.role || 'Member').toUpperCase();
    const joinDate = user.created_at ? formatDate(user.created_at) : formatDate(new Date());

    return (
        `Selamat datang di <b>RUMAH OTP OFFICIAL</b>\n` +
        `<i>Pusat Layanan Virtual Number & Sesi Telegram</i>\n\n` +
        `┌── 👤 <b>INFORMASI AKUN</b> ──\n` +
        `├ ID User: <code>${user.telegram_id || 'N/A'}</code>\n` +
        `├ Pangkat: <b>${role}</b> 👤\n` +
        `├ Join Date: <code>${joinDate}</code>\n` +
        `└ Sisa Saldo: <b>${balance}</b>\n\n` +
        `👇 <b>Silakan pilih menu transaksi di bawah ini:</b>`
    );
}

module.exports = { startScene };
