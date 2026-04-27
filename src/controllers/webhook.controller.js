'use strict';

/**
 * ============================================================
 * controllers/webhook.controller.js — Midtrans Webhook Handler
 * ============================================================
 * Menangani notifikasi status pembayaran dari Midtrans.
 * Dilengkapi dengan Signature Key validation untuk keamanan.
 */

const crypto     = require('crypto');
const logger     = require('../utils/logger');
const { query, getClient } = require('../config/database');
const { serverKey } = require('../config/midtrans');
const { notifyPaymentSuccess, deleteMessage } = require('../services/notification.service');

/**
 * Handle Midtrans Notification Webhook
 */
const midtransWebhook = async (req, res) => {
    try {
        const notification = req.body;
        
        // 1. Validate Signature Key (SHA512)
        // Formula: SHA512(order_id + status_code + gross_amount + server_key)
        const payload = 
            notification.order_id + 
            notification.status_code + 
            notification.gross_amount + 
            serverKey;
        
        const hash = crypto.createHash('sha512').update(payload).digest('hex');

        if (hash !== notification.signature_key) {
            logger.warn(`[webhook] Invalid signature key for order ${notification.order_id}`);
            return res.status(403).json({ status: 'error', message: 'Invalid signature' });
        }

        // 2. Extract Notification Details
        const orderId           = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus       = notification.fraud_status;

        logger.info(`[webhook] Received status "${transactionStatus}" for order ${orderId}`);

        // 3. Process Status
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'challenge') {
                // TODO: handle challenge status if needed
                await updateTransactionStatus(orderId, 'pending');
            } else if (fraudStatus === 'accept' || transactionStatus === 'settlement') {
                // PAYMENT SUCCESS → Update Balance
                await handlePaymentSuccess(orderId, parseFloat(notification.gross_amount));
            }
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            await updateTransactionStatus(orderId, 'failed');
        } else if (transactionStatus === 'pending') {
            await updateTransactionStatus(orderId, 'pending');
        }

        return res.status(200).json({ status: 'ok' });

    } catch (err) {
        logger.error('[webhook] Critical error:', err.message);
        return res.status(500).json({ status: 'error' });
    }
};

/**
 * Update transaction status in DB
 */
const updateTransactionStatus = async (orderId, status) => {
    await query(
        'UPDATE transactions SET status = $1, updated_at = NOW() WHERE external_id = $2',
        [status, orderId]
    );
};

/**
 * Handle successful payment: Update Transaction & User Balance (Atomic)
 */
const handlePaymentSuccess = async (orderId, amount) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // 1. Check if already processed (idempotency)
        const check = await client.query(
            'SELECT status, user_id FROM transactions WHERE external_id = $1 FOR UPDATE',
            [orderId]
        );

        if (check.rows.length === 0) {
            throw new Error(`Transaction ${orderId} not found`);
        }

        if (check.rows[0].status === 'completed') {
            logger.info(`[webhook] Transaction ${orderId} already processed.`);
            await client.query('ROLLBACK');
            return;
        }

        const userId    = check.rows[0].user_id;
        const messageId = check.rows[0].message_id;

        // 2. Update transaction status
        await client.query(
            "UPDATE transactions SET status = 'completed', updated_at = NOW() WHERE external_id = $1",
            [orderId]
        );

        // 3. Update user balance & stats
        const userUpdate = await client.query(
            `UPDATE users 
             SET balance = balance + $1, 
                 total_topup = total_topup + $1,
                 updated_at = NOW() 
             WHERE id = $2
             RETURNING telegram_id, balance`,
            [amount, userId]
        );

        await client.query('COMMIT');
        logger.info(`[webhook] Successfully updated balance for user ${userId} (+${amount})`);

        // 4. REFERRAL REWARD (Check if first successful deposit)
        try {
            const firstDepoCheck = await query(
                `SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND status = 'completed'`,
                [userId]
            );

            if (parseInt(firstDepoCheck.rows[0].count) === 1) {
                // First deposit! Check for referrer
                const userRes = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
                const referrerId = userRes.rows[0]?.referred_by;

                if (referrerId) {
                    const bonus = 100;
                    await query(
                        `UPDATE users 
                         SET balance = balance + $1, 
                             referral_bonus_total = referral_bonus_total + $1 
                         WHERE telegram_id = $2`,
                        [bonus, String(referrerId)]
                    );
                    logger.info(`[referral] Rewarded ${referrerId} with ${bonus} for ${userId}'s first deposit`);
                }
            }
        } catch (refErr) {
            logger.error('[webhook] Referral reward error:', refErr.message);
        }

        // 5. Send Telegram Notification
        const { telegram_id, balance: newBalance } = userUpdate.rows[0];
        await notifyPaymentSuccess(telegram_id, amount, newBalance);
        
        // 6. Delete old payment message (Clean up)
        if (messageId) {
            await deleteMessage(telegram_id, messageId);
        }
        
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`[webhook] Transactional update failed for ${orderId}:`, err.message);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    midtransWebhook,
};
