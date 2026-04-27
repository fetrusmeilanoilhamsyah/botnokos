'use strict';

/**
 * ============================================================
 * controllers/otp.controller.js — Logic Transaksi (Sync DB)
 * ============================================================
 */

const { getClient, query } = require('../config/database');
const otpService           = require('../services/otp.service');
const logger               = require('../utils/logger');
const { formatCurrency }   = require('../utils/formatter');
const { backToMainMenuKeyboard } = require('../keyboards/inline.keyboard');

/**
 * Handle Pembuatan Order Baru
 */
const createOrder = async (ctx, serviceCode, price, countryId) => {
    const telegramId = String(ctx.from.id);
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Ambil data user
        const userRes = await client.query(
            'SELECT id, balance FROM users WHERE telegram_id = $1 FOR UPDATE',
            [telegramId]
        );

        if (userRes.rows.length === 0) throw new Error('User tidak ditemukan.');
        const user = userRes.rows[0];

        // 2. Validasi Saldo
        if (parseFloat(user.balance) < price) {
            await client.query('ROLLBACK');
            return { success: false, message: 'Saldo Anda tidak mencukupi.' };
        }

        // 3. Tembak API Provider
        const apiResult = await otpService.createOrder(serviceCode, countryId);
        if (!apiResult.success) {
            await client.query('ROLLBACK');
            return { success: false, message: apiResult.message };
        }

        // 4. Potong Saldo & Catat Order (Sync dengan Schema: price, order_external_id, country_code)
        await client.query(
            'UPDATE users SET balance = balance - $1 WHERE id = $2',
            [price, user.id]
        );

        const orderRes = await client.query(
            `INSERT INTO orders (user_id, order_external_id, service_code, country_code, phone_number, price, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
             RETURNING id`,
            [user.id, String(apiResult.orderId), serviceCode, String(countryId), apiResult.number, price]
        );

        await client.query('COMMIT');
        
        return {
            success: true,
            orderId: apiResult.orderId,
            phoneNumber: apiResult.number,
            dbOrderId: orderRes.rows[0].id
        };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        logger.error('[otp.controller] createOrder error:', err.message);
        return { success: false, message: err.message };
    } finally {
        if (client) client.release();
    }
};

/**
 * Polling Background untuk Cek SMS
 */
const startSmsPolling = (ctx, externalOrderId, phoneNumber) => {
    let attempts = 0;
    const maxAttempts = 60;
    const intervalTime = 5000;

    const interval = setInterval(async () => {
        attempts++;
        
        try {
            const result = await otpService.checkSms(externalOrderId);

            if (result.status === 'OK') {
                clearInterval(interval);
                
                // Update Database (Sesuai Schema)
                await query(
                    `UPDATE orders SET status = 'completed', otp_code = $1, updated_at = NOW() WHERE order_external_id = $2`,
                    [result.otp, String(externalOrderId)]
                );

                const text = 
                    `┌── 🎉 <b>SMS DITERIMA!</b> ──\n` +
                    `├ Nomor: <code>+${phoneNumber}</code>\n` +
                    `├ OTP: <code>${result.otp}</code>\n` +
                    `└ Status: <b>BERHASIL</b>\n\n` +
                    `✅ Kode di atas sudah bisa digunakan.`;

                // Gunakan fallback jika edit gagal (tetap pertahankan warna di keyboard)
                const keyboard = backToMainMenuKeyboard();
                return await ctx.editMessageText(text, { 
                    parse_mode: 'HTML', 
                    ...keyboard 
                }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
            }

            if (result.status === 'ERROR') {
                clearInterval(interval);
                await handleRefund(ctx, externalOrderId, 'Terjadi kesalahan pada server provider.');
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                await handleRefund(ctx, externalOrderId, 'Waktu habis, SMS tidak kunjung tiba.');
            }

        } catch (err) {
            logger.error(`[polling] Error on ${externalOrderId}:`, err.message);
        }
    }, intervalTime);

    ctx.session.activeOrderInterval = interval;
};

/**
 * Handle Refund Saldo
 */
const handleRefund = async (ctx, externalOrderId, reason) => {
    try {
        const orderRes = await query(
            `SELECT id, user_id, price FROM orders WHERE order_external_id = $1 AND status = 'pending'`,
            [String(externalOrderId)]
        );

        if (orderRes.rows.length === 0) return;

        const order = orderRes.rows[0];

        await query(
            `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
            [order.id]
        );

        await query(
            `UPDATE users SET balance = balance + $1 WHERE id = $2`,
            [order.price, order.user_id]
        );

        const keyboard = backToMainMenuKeyboard();
        await ctx.reply(`❌ <b>ORDER DIBATALKAN</b>\n\nAlasan: <i>${reason}</i>\nSaldo Anda telah dikembalikan.`, {
            parse_mode: 'HTML',
            ...keyboard
        });

        await otpService.cancelOrder(externalOrderId);

    } catch (err) {
        logger.error('[otp.controller] handleRefund error:', err.message);
    }
};

module.exports = {
    createOrder,
    startSmsPolling,
    handleRefund
};
