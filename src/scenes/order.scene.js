'use strict';

/**
 * ============================================================
 * order.scene.js — Layanan Pembelian Nomor OTP (Premium Colors)
 * ============================================================
 */

const { Scenes }                = require('telegraf');
const { MENU_ACTIONS }           = require('../config/constants');
const otpController              = require('../controllers/otp.controller');
const otpService                 = require('../services/otp.service');
const { backToMainMenuKeyboard } = require('../keyboards/inline.keyboard');
const { safeEditMessage }        = require('../utils/bot-helper');
const { formatCurrency }         = require('../utils/formatter');
const logger                     = require('../utils/logger');

const orderScene = new Scenes.BaseScene('order_otp');

/**
 * STEP 1: PILIH LAYANAN (WA / TG)
 */
orderScene.enter(async (ctx) => {
    try {
        const text = 
            `┌── 📱 <b>PILIH LAYANAN OTP</b> ──\n` +
            `├ Silakan pilih aplikasi yang ingin\n` +
            `├ Anda verifikasi hari ini.\n` +
            `└ <i>Tersedia nomor fresh & berkualitas.</i>\n\n` +
            `👇 <b>Pilih Aplikasi:</b>`;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💬 WHATSAPP', callback_data: 'pick_service:wa', style: 'primary' },
                        { text: '✈️ TELEGRAM', callback_data: 'pick_service:tg', style: 'primary' }
                    ],
                    [{ text: '⬅️ KEMBALI KE MENU', callback_data: MENU_ACTIONS.MAIN_MENU, style: 'danger' }]
                ]
            }
        };

        await safeEditMessage(ctx, text, keyboard);
    } catch (err) {
        logger.error('[orderScene.enter] Error:', err.message);
    }
});

/**
 * STEP 2: PILIH NEGARA (WA: ID/PH | TG: ID)
 */
orderScene.action(/pick_service:(wa|tg)/, async (ctx) => {
    try {
        const serviceCode = ctx.match[1];
        ctx.scene.session.service = serviceCode;

        await ctx.answerCbQuery('⚡ Menyiapkan daftar negara...');

        const margin = parseInt(process.env.OTP_MARGIN_FLAT) || 1000;
        const targetIds = serviceCode === 'wa' ? [6, 4] : [6];

        const countries = await otpService.getCountries();
        if (!Array.isArray(countries)) throw new Error('Daftar negara tidak valid.');

        const countryData = await Promise.all(
            targetIds.map(async (id) => {
                const country = countries.find(c => String(c.id_negara) === String(id));
                if (!country) return null;

                const services = await otpService.getServicesByCountry(id);
                if (services && services[serviceCode]) {
                    return { country, info: services[serviceCode] };
                }
                return null;
            })
        );

        const countryButtons = [];
        for (const data of countryData) {
            if (data && data.info.stok > 0) {
                const finalPrice = data.info.harga + margin;
                const flag = String(data.country.id_negara) === '6' ? '🇮🇩' : '🇵🇭';
                countryButtons.push([
                    { 
                        text: `${flag} ${data.country.nama_negara.toUpperCase()} | ${formatCurrency(finalPrice)}`,
                        callback_data: `confirm_order:${data.country.id_negara}:${finalPrice}`,
                        style: 'primary'
                    }
                ]);
            }
        }

        if (countryButtons.length === 0) {
            return await safeEditMessage(ctx, '❌ Maaf, stok untuk layanan ini sedang kosong.', backToMainMenuKeyboard());
        }

        countryButtons.push([{ text: '⬅️ GANTI LAYANAN', callback_data: 'back_to_services', style: 'primary' }]);
        countryButtons.push([{ text: '🏠 MENU UTAMA', callback_data: MENU_ACTIONS.MAIN_MENU, style: 'danger' }]);

        const text = 
            `┌── 🌍 <b>PILIH NEGARA ASAL</b> ──\n` +
            `├ Layanan: <b>${serviceCode === 'wa' ? 'WhatsApp ✅' : 'Telegram ✈️'}</b>\n` +
            `├ Margin: <pre>+${formatCurrency(margin)}</pre>\n` +
            `└ <i>Pilih negara untuk mendapatkan nomor.</i>\n\n` +
            `💰 <i>Harga sudah termasuk biaya layanan.</i>`;

        await ctx.editMessageText(text, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: countryButtons }
        }).catch(() => ctx.reply(text, { 
            parse_mode: 'HTML', 
            reply_markup: { inline_keyboard: countryButtons } 
        }));

    } catch (err) {
        logger.error('[orderScene] pick_service error:', err.message);
        await ctx.answerCbQuery('❌ Gagal: ' + (err.message || 'Error tidak diketahui'), { show_alert: true });
    }
});

/**
 * STEP 3: KONFIRMASI & EKSEKUSI ORDER
 */
orderScene.action(/confirm_order:(\d+):(\d+)/, async (ctx) => {
    try {
        const countryId = ctx.match[1];
        const price = parseInt(ctx.match[2]);
        const serviceCode = ctx.scene.session.service;

        await ctx.answerCbQuery('🚀 Memesan nomor...');

        const result = await otpController.createOrder(ctx, serviceCode, price, countryId);

        if (!result.success) {
            return await safeEditMessage(ctx, 
                `❌ <b>PESANAN GAGAL</b>\n\n` +
                `Alasan: <code>${result.message}</code>\n` +
                `<i>Pastikan saldo Anda mencukupi.</i>`,
                backToMainMenuKeyboard()
            );
        }

        const text = 
            `┌── 📱 <b>NOMOR TELAH SIAP</b> ──\n` +
            `├ Layanan: <b>${serviceCode.toUpperCase()}</b>\n` +
            `├ Nomor: <code>+${result.phoneNumber}</code>\n` +
            `├ Biaya: <b>${formatCurrency(price)}</b>\n` +
            `└ ID Order: <code>#${result.orderId}</code>\n\n` +
            `⏳ <b>STATUS: Menunggu SMS...</b>\n` +
            `<i>Kode OTP akan tampil otomatis di sini.</i>\n\n` +
            `⚠️ <i>Klik "Batal" jika nomor tidak bisa dipakai.</i>`;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '❌ BATALKAN & REFUND', callback_data: `cancel_order:${result.orderId}`, style: 'danger' }]
                ]
            }
        };

        await safeEditMessage(ctx, text, keyboard);
        otpController.startSmsPolling(ctx, result.orderId, result.phoneNumber);

    } catch (err) {
        logger.error('[orderScene] confirm_order error:', err.message);
    }
});

/**
 * NAVIGASI
 */
orderScene.action('back_to_services', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.reenter();
});

orderScene.action(MENU_ACTIONS.MAIN_MENU, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('start');
});

/**
 * PEMBATALAN MANUAL
 */
orderScene.action(/cancel_order:(.+)/, async (ctx) => {
    try {
        const orderId = ctx.match[1];
        await ctx.answerCbQuery('Membatalkan order...');
        if (ctx.session.activeOrderInterval) {
            clearInterval(ctx.session.activeOrderInterval);
            delete ctx.session.activeOrderInterval;
        }
        await otpController.handleRefund(ctx, orderId, 'Dibatalkan oleh pengguna.');
        await ctx.scene.enter('start');
    } catch (err) {
        logger.error('[orderScene] cancel error:', err.message);
    }
});

module.exports = { orderScene };
