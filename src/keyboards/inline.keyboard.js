'use strict';

/**
 * ============================================================
 * Inline Keyboard Layouts
 * ============================================================
 * Reusable inline keyboards with Bot API 9.4 Color Styles
 */

const { Markup } = require('telegraf');
const { MENU_ACTIONS, SERVICES, COUNTRIES } = require('../config/constants');

/**
 * ============================================================
 * MAIN MENU KEYBOARD (NATIVE COLORS 9.4)
 * ============================================================
 */
const mainMenuKeyboard = (user = {}) => {
    const supportUser = (process.env.SUPPORT_TELEGRAM || '@Support').replace('@', '');
    const supportUrl = `https://t.me/${supportUser}`;

    const buttons = [
        [
            { text: '📱 Layanan OTP', callback_data: MENU_ACTIONS.ORDER_OTP, style: 'primary' },
            { text: '💳 Isi Saldo', callback_data: MENU_ACTIONS.TOPUP, style: 'success' },
        ],
        [
            { text: '🎁 Referral', callback_data: 'referral', style: 'success' },
            { text: '🏆 Top Pengguna', callback_data: 'top_users', style: 'primary' },
        ],
        [
            { text: '📋 Riwayat Trx', callback_data: 'history_orders', style: 'primary' },
            { text: '💰 Riwayat Depo', callback_data: 'history_transactions', style: 'primary' },
        ],
        [
            { text: '👤 Profil Akun', callback_data: MENU_ACTIONS.PROFILE },
            { text: '📞 Hubungi Admin', url: supportUrl, style: 'danger' },
        ],
    ];

    if (user.role === 'admin') {
        buttons.push([
            { text: '🛠️ Panel Admin', callback_data: 'admin_panel', style: 'primary' },
        ]);
    }

    // Return format yang benar untuk Telegraf extra params
    return {
        reply_markup: {
            inline_keyboard: buttons
        }
    };
};

/**
 * ============================================================
 * PROFILE MENU KEYBOARD
 * ============================================================
 */
const profileMenuKeyboard = (user = {}) => {
    const buttons = [
        [
            { text: '💰 Lihat Saldo', callback_data: MENU_ACTIONS.PROFILE_BALANCE, style: 'primary' },
        ],
        [
            { text: '📊 Statistik', callback_data: MENU_ACTIONS.PROFILE_STATS },
        ],
        [
            { text: '⚙️ Pengaturan', callback_data: MENU_ACTIONS.PROFILE_SETTINGS },
        ],
        [
            { text: '🔄 Refresh Info', callback_data: MENU_ACTIONS.REFRESH, style: 'success' },
        ],
        [
            { text: '« Kembali', callback_data: MENU_ACTIONS.MAIN_MENU },
        ],
    ];

    if (user.role === 'admin') {
        buttons.splice(buttons.length - 1, 0, [
            { text: '🛠️ Panel Admin', callback_data: 'admin_panel', style: 'primary' },
        ]);
    }

    return {
        reply_markup: {
            inline_keyboard: buttons
        }
    };
};

/**
 * ============================================================
 * SERVICE SELECTION KEYBOARD
 * ============================================================
 */
const serviceSelectionKeyboard = () => {
    const buttons = [
        [
            { text: `${SERVICES.WHATSAPP.emoji} ${SERVICES.WHATSAPP.name}`, callback_data: `select_service:${SERVICES.WHATSAPP.code}`, style: 'primary' },
        ],
        [
            { text: `${SERVICES.TELEGRAM.emoji} ${SERVICES.TELEGRAM.name}`, callback_data: `select_service:${SERVICES.TELEGRAM.code}`, style: 'primary' },
        ],
        [
            { text: '« Kembali', callback_data: MENU_ACTIONS.MAIN_MENU },
        ],
    ];
    return { reply_markup: { inline_keyboard: buttons } };
};

/**
 * ============================================================
 * TOP-UP KEYBOARDS
 * ============================================================
 */
const topupAmountKeyboard = () => {
    const amounts = [10000, 20000, 50000, 100000, 200000, 500000];
    const buttons = [];

    for (let i = 0; i < amounts.length; i += 2) {
        buttons.push([
            { text: `Rp ${amounts[i].toLocaleString('id-ID')}`, callback_data: `topup_amount:${amounts[i]}`, style: 'success' },
            { text: `Rp ${amounts[i + 1].toLocaleString('id-ID')}`, callback_data: `topup_amount:${amounts[i + 1]}`, style: 'success' },
        ]);
    }

    buttons.push([{ text: '« Kembali', callback_data: MENU_ACTIONS.MAIN_MENU }]);
    return { reply_markup: { inline_keyboard: buttons } };
};

const topupConfirmationKeyboard = (amount) => {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Lanjutkan', callback_data: `topup_confirm:${amount}`, style: 'success' },
                    { text: '❌ Batal', callback_data: MENU_ACTIONS.TOPUP_CANCEL, style: 'danger' },
                ],
            ]
        }
    };
};

const paymentLinkKeyboard = (url) => {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '💳 Bayar Sekarang', url: url, style: 'success' },
                ],
                [
                    { text: '« Kembali ke Menu Utama', callback_data: MENU_ACTIONS.MAIN_MENU },
                ],
            ]
        }
    };
};

/**
 * ============================================================
 * HISTORY MENU KEYBOARD
 * ============================================================
 */
const historyMenuKeyboard = () => {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📋 Riwayat Order OTP', callback_data: 'history_orders', style: 'primary' },
                ],
                [
                    { text: '💰 Riwayat Deposit', callback_data: 'history_transactions', style: 'primary' },
                ],
                [
                    { text: '« Kembali', callback_data: MENU_ACTIONS.MAIN_MENU },
                ],
            ]
        }
    };
};

const backToMainMenuKeyboard = () => {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '« Kembali ke Menu Utama', callback_data: MENU_ACTIONS.MAIN_MENU },
                ],
            ]
        }
    };
};

module.exports = {
    mainMenuKeyboard,
    profileMenuKeyboard,
    serviceSelectionKeyboard,
    topupAmountKeyboard,
    topupConfirmationKeyboard,
    paymentLinkKeyboard,
    historyMenuKeyboard,
    backToMainMenuKeyboard,
};