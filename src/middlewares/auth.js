'use strict';

/**
 * ============================================================
 * middlewares/auth.js — Autentikasi & Auto-registrasi User
 * ============================================================
 * Middleware ini berjalan setiap request:
 * 1. Cek apakah user sudah terdaftar di DB
 * 2. Jika belum → auto-registrasi
 * 3. Simpan data user ke ctx.session.user untuk akses cepat
 */

const logger  = require('../utils/logger');
const { query: db } = require('../config/database');

const authMiddleware = async (ctx, next) => {
    // Skip jika tidak ada informasi pengirim (channel posts, dll)
    if (!ctx.from) {
        return next();
    }

    try {
        const telegramId = ctx.from.id;

        // Hanya ambil kolom yang dibutuhkan (jangan SELECT *)
        const result = await db(
            'SELECT id, telegram_id, username, first_name, balance, role, is_banned, total_topup, referred_by, created_at FROM users WHERE telegram_id = $1 LIMIT 1',
            [String(telegramId)]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Cek apakah user dibanned
            if (user.is_banned) {
                logger.warn(`[auth] Banned user attempted access: ${telegramId}`);
                if (ctx.message) {
                    await ctx.reply('⛔ Akun Anda telah diblokir. Hubungi admin untuk info lebih lanjut.');
                } else if (ctx.callbackQuery) {
                    await ctx.answerCbQuery('⛔ Akun Anda diblokir!', { show_alert: true });
                }
                return; // Jangan panggil next()
            }

            // User aktif → simpan ke session
            ctx.session.user = user;
        } else {
            // Auto-registrasi user baru
            const adminId = process.env.ADMIN_TELEGRAM_ID;
            const role = String(telegramId) === String(adminId) ? 'admin' : 'user';

            // Ambil Referral ID dari payload /start (jika ada)
            let referredBy = null;
            if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/start ')) {
                const payload = ctx.message.text.split(' ')[1];
                if (payload && payload !== String(telegramId) && !isNaN(payload)) {
                    referredBy = payload;
                }
            }

            const newUser = await db(
                `INSERT INTO users (telegram_id, username, first_name, last_name, balance, role, referred_by, created_at)
                 VALUES ($1, $2, $3, $4, 0, $5, $6, NOW())
                 RETURNING *`,
                [
                    String(telegramId),
                    ctx.from.username || null,
                    ctx.from.first_name || null,
                    ctx.from.last_name  || null,
                    role,
                    referredBy
                ]
            );

            // Update stats pengundang jika ada
            if (referredBy) {
                await db('UPDATE users SET referred_count = referred_count + 1 WHERE telegram_id = $1', [referredBy]);
                logger.info(`[referral] User ${telegramId} referred by ${referredBy}`);
            }

            ctx.session.user = newUser.rows[0];
            logger.info(`[auth] New user registered: ${telegramId} (@${ctx.from.username || 'no-username'})`);
        }
    } catch (err) {
        // Jika DB error, tetap lanjutkan agar bot tidak mati total
        logger.error('[auth] Database error:', err.message);
        // Set user kosong agar ctx.session.user tidak undefined
        ctx.session.user = ctx.session.user || { balance: 0 };
    }

    return next();
};

module.exports = { authMiddleware };
