'use strict';

/**
 * ============================================================
 * topup.scene.js — Flow Top-up Saldo
 * ============================================================
 */

const { Scenes }             = require('telegraf');
const { MENU_ACTIONS }       = require('../config/constants');
const {
    topupAmountKeyboard,
    topupConfirmationKeyboard,
    paymentLinkKeyboard,
} = require('../keyboards/inline.keyboard');
const { createTopupTransaction } = require('../services/payment.service');
const { formatCurrency }     = require('../utils/formatter');
const { safeEditMessage }    = require('../utils/bot-helper');
const logger                 = require('../utils/logger');

const topupScene = new Scenes.BaseScene('topup');

topupScene.enter(async (ctx) => {
    try {
        const text =
            `┌── 💰 <b>TOP-UP SALDO</b> ──\n` +
            `├ Silakan pilih nominal top-up\n` +
            `└ Saldo otomatis masuk 24 jam\n\n` +
            `👇 <b>Pilih nominal di bawah ini:</b>`;

        await safeEditMessage(ctx, text, topupAmountKeyboard());
    } catch (err) {
        logger.error('[topupScene.enter] Error:', err.message);
    }
});

topupScene.action(/^topup_amount:(\d+)$/, async (ctx) => {
    try {
        await ctx.answerCbQuery();
        const amount = parseInt(ctx.match[1], 10);

        const text =
            `┌── ✅ <b>KONFIRMASI TOP-UP</b> ──\n` +
            `├ Nominal: <b>${formatCurrency(amount)}</b>\n` +
            `└ Metode: <b>QRIS / Bank (Midtrans)</b>\n\n` +
            `Lanjutkan ke pembayaran?`;

        await safeEditMessage(ctx, text, topupConfirmationKeyboard(amount));
    } catch (err) {
        logger.error('[topupScene] topup_amount error:', err.message);
    }
});

topupScene.action(/^topup_confirm:(\d+)$/, async (ctx) => {
    try {
        const amount = parseInt(ctx.match[1], 10);
        await ctx.answerCbQuery('⏳ Menyiapkan pembayaran...');

        const user = ctx.session.user;
        if (!user) throw new Error('User session not found');

        await safeEditMessage(ctx, `⏳ Sedang meng-generate link pembayaran untuk <b>${formatCurrency(amount)}</b>...`, null);

        const result = await createTopupTransaction(user.id, amount, {
            telegram_id : ctx.from.id,
            first_name  : ctx.from.first_name,
            last_name   : ctx.from.last_name,
        }, ctx.callbackQuery.message.message_id);

        const text =
            `┌── 💳 <b>PEMBAYARAN SIAP</b> ──\n` +
            `├ Nominal: <b>${formatCurrency(amount)}</b>\n` +
            `├ Order ID: <code>${result.orderId}</code>\n` +
            `└ Berlaku: <b>24 Jam</b>\n\n` +
            `Silakan klik tombol di bawah untuk membayar.`;

        await safeEditMessage(ctx, text, paymentLinkKeyboard(result.redirectUrl));

    } catch (err) {
        logger.error('[topupScene] topup_confirm error:', err.message);
        await ctx.answerCbQuery('❌ Gagal membuat pembayaran.', { show_alert: true });
        await ctx.scene.enter('topup');
    }
});

topupScene.action(MENU_ACTIONS.TOPUP_CANCEL, async (ctx) => {
    await ctx.answerCbQuery('Dibatalkan');
    await ctx.scene.enter('start');
});

topupScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { topupScene };
