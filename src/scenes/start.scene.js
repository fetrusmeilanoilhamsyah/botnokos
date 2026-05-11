'use strict';

/**
 * ============================================================
 * start.scene.js — Main Menu Hub
 * ============================================================
 */

const path               = require('path');
const fs                 = require('fs');
const { Scenes }         = require('telegraf');
const { MENU_ACTIONS }   = require('../config/constants');
const {
    mainMenuKeyboard,
    backToMainMenuKeyboard,
} = require('../keyboards/inline.keyboard');
const { formatCurrency, formatDate } = require('../utils/formatter');
const { safeEditMessage }            = require('../utils/bot-helper');
const logger                         = require('../utils/logger');

const startScene = new Scenes.BaseScene('start');

// Path banner (opsional — jika tidak ada, bot tetap jalan normal)
const BANNER_PATH = path.join(__dirname, '../../assets/banner.jpg');

// ============================================================
// SCENE ENTER
// ============================================================
startScene.enter(async (ctx) => {
    try {
        const user = ctx.session.user || {};
        const name = ctx.from?.first_name || 'Pengguna';
        const text = buildMainMenuText(name, user);

        if (ctx.updateType === 'message') {
            // Hapus menu lama agar tidak numpuk
            if (ctx.session.menuMessageId && ctx.session.menuChatId) {
                await ctx.telegram
                    .deleteMessage(ctx.session.menuChatId, ctx.session.menuMessageId)
                    .catch(() => null);
            }

            // Kirim banner jika ada, jika tidak kirim teks biasa
            const bannerExists = fs.existsSync(BANNER_PATH);
            let sent;

            if (bannerExists) {
                sent = await ctx.replyWithPhoto(
                    { source: BANNER_PATH },
                    {
                        caption    : text,
                        parse_mode : 'HTML',
                        ...mainMenuKeyboard(user),
                    }
                );
            } else {
                sent = await ctx.reply(text, {
                    parse_mode: 'HTML',
                    ...mainMenuKeyboard(user),
                });
            }

            ctx.session.menuMessageId = sent.message_id;
            ctx.session.menuChatId    = sent.chat.id;

        } else {
            // Dari callback → edit pesan saja (tidak perlu kirim foto lagi)
            await safeEditMessage(ctx, text, mainMenuKeyboard(user));
        }
    } catch (err) {
        logger.error('[startScene.enter] Error:', err.message);
    }
});

// ============================================================
// ACTIONS
// ============================================================
startScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('start');
});

startScene.action(MENU_ACTIONS.PROFILE, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('profile');
});

startScene.action(MENU_ACTIONS.ORDER_OTP, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('order_otp');
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
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('top_users');
});

startScene.action(MENU_ACTIONS.HISTORY, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('history');
});

startScene.action('history_orders', async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('history');
});

startScene.action('history_transactions', async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('history');
});

startScene.action(MENU_ACTIONS.HELP, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    const support = process.env.SUPPORT_TELEGRAM || '@Support';
    await safeEditMessage(
        ctx,
        `<b>Bantuan</b>\n\nHubungi ${support} untuk pertanyaan dan kendala.`,
        backToMainMenuKeyboard()
    );
});

startScene.action('admin_panel', async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.scene.enter('admin_panel');
});

startScene.action(MENU_ACTIONS.CLOSE, async (ctx) => {
    await ctx.answerCbQuery().catch(() => null);
    await ctx.deleteMessage().catch(() => null);
});

// ============================================================
// HELPER: Teks Menu Utama (Bersih, Tanpa Emoji Berlebihan)
// ============================================================
function buildMainMenuText(name, user) {
    const balance  = formatCurrency(parseFloat(user.balance) || 0);
    const role     = (user.role === 'admin') ? 'Administrator' : 'Member';
    const joinDate = user.created_at ? formatDate(user.created_at, 'DD MMM YYYY') : '-';

    return (
        `<b>RUMAH OTP</b> — Layanan Virtual Number\n` +
        `<i>Nomor OTP untuk semua platform</i>\n\n` +
        `<b>Informasi Akun</b>\n` +
        `ID: <code>${user.telegram_id || '-'}</code>\n` +
        `Status: ${role}\n` +
        `Bergabung: ${joinDate}\n` +
        `Saldo: <b>${balance}</b>\n\n` +
        `Pilih menu di bawah untuk memulai.`
    );
}

module.exports = { startScene };
