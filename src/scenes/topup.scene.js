'use strict';

/**
 * ============================================================
 * topup.scene.js — Flow Top-up Saldo (Bug Fixed)
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

const MIN_TOPUP = parseInt(process.env.MIN_TOPUP_AMOUNT, 10) || 10000;
const MAX_TOPUP = parseInt(process.env.MAX_TOPUP_AMOUNT, 10) || 10000000;

const topupScene = new Scenes.BaseScene('topup');

// ============================================================
// ENTER: Tampilkan Pilihan Nominal
// ============================================================
topupScene.enter(async (ctx) => {
    try {
        const text =
            `┌── 💰 <b>TOP-UP SALDO</b> ──\n` +
            `├ Silakan pilih nominal top-up\n` +
            `└ Saldo otomatis masuk setelah bayar\n\n` +
            `👇 <b>Pilih nominal di bawah ini:</b>`;

        await safeEditMessage(ctx, text, topupAmountKeyboard());
    } catch (err) {
        logger.error('[topupScene.enter] Error:', err.message);
    }
});

// ============================================================
// Pilih Nominal
// ============================================================
topupScene.action(/^topup_amount:(\d+)$/, async (ctx) => {
    try {
        await ctx.answerCbQuery();
        const amount = parseInt(ctx.match[1], 10);

        // Validasi nominal (cegah manipulasi callback data)
        if (isNaN(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
            return ctx.answerCbQuery('❌ Nominal tidak valid!', { show_alert: true });
        }

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

// ============================================================
// Konfirmasi & Buat Transaksi
// ============================================================
topupScene.action(/^topup_confirm:(\d+)$/, async (ctx) => {
    try {
        const amount = parseInt(ctx.match[1], 10);
        await ctx.answerCbQuery('⏳ Menyiapkan pembayaran...');

        const user = ctx.session.user;
        if (!user) throw new Error('User session not found');

        // Validasi ulang amount untuk keamanan (double-check)
        if (isNaN(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
            return ctx.answerCbQuery('❌ Nominal tidak valid!', { show_alert: true });
        }

        // Tampilkan loading — gunakan {} bukan null (null menyebabkan crash saat di-spread)
        await safeEditMessage(ctx, `⏳ Sedang meng-generate link pembayaran untuk <b>${formatCurrency(amount)}</b>...`, {});

        // Ambil message_id dengan safe optional chaining
        const messageId = ctx.callbackQuery?.message?.message_id || null;

        // Buat transaksi Midtrans
        const result = await createTopupTransaction(user.id, amount, {
            telegram_id : ctx.from.id,
            first_name  : ctx.from.first_name,
            last_name   : ctx.from.last_name,
        }, messageId);

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
        await ctx.scene.enter('start'); // Kembali ke menu utama, bukan loop balik ke topup
    }
});

// ============================================================
// NAVIGASI
// ============================================================
topupScene.action(MENU_ACTIONS.TOPUP_CANCEL, async (ctx) => {
    await ctx.answerCbQuery('Dibatalkan');
    await ctx.scene.enter('start');
});

topupScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

module.exports = { topupScene };
