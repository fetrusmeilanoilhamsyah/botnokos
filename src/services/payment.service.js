'use strict';

/**
 * ============================================================
 * services/payment.service.js — Midtrans Logic
 * ============================================================
 */

const { snap }    = require('../config/midtrans');
const { query }   = require('../config/database');
const logger      = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new payment transaction via Midtrans Snap
 * @param {number} userId - Internal database user ID
 * @param {number} amount - Amount in IDR
 * @param {Object} userData - User information for billing
 * @returns {Promise<Object>} Snap transaction object
 */
const createTopupTransaction = async (userId, amount, userData, messageId) => {
    try {
        const orderId = `TOPUP-${userId}-${Date.now()}`;

        // 1. Save pending transaction to DB
        await query(
            `INSERT INTO transactions (user_id, external_id, amount, status, message_id, created_at)
             VALUES ($1, $2, $3, 'pending', $4, NOW())`,
            [userId, orderId, amount, String(messageId)]
        );

        // 2. Prepare Midtrans parameter
        const parameter = {
            transaction_details: {
                order_id     : orderId,
                gross_amount : amount,
            },
            customer_details: {
                first_name : userData.first_name || 'User',
                last_name  : userData.last_name  || '',
                email      : userData.email      || `${userData.telegram_id}@telegram.com`,
            },
            item_details: [{
                id       : 'topup_balance',
                price    : amount,
                quantity : 1,
                name     : `Top-up Saldo Bot OTP - Rp ${amount.toLocaleString('id-ID')}`,
            }],
            usage_limit: 1,
        };

        // 3. Create Snap transaction
        const transaction = await snap.createTransaction(parameter);
        
        // Update transaction with payment URL
        await query(
            `UPDATE transactions SET payment_url = $1 WHERE external_id = $2`,
            [transaction.redirect_url, orderId]
        );

        logger.info(`[paymentService] Created topup ${orderId} for user ${userId}`);
        
        return {
            orderId,
            redirectUrl : transaction.redirect_url,
            token       : transaction.token,
        };
    } catch (err) {
        const errorMsg = err.ApiResponse ? JSON.stringify(err.ApiResponse) : err.message;
        logger.error(`[paymentService] Error creating transaction: ${errorMsg}`);
        throw err;
    }
};

module.exports = {
    createTopupTransaction,
};
