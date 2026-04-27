/**
 * ============================================================
 * Application Constants & Enums
 * ============================================================
 */

// ============================================================
// SERVICE CODES (HANYA WhatsApp & Telegram)
// ============================================================
const SERVICES = {
    WHATSAPP: {
        code: 'wa',
        name: 'WhatsApp',
        emoji: '💬',
        description: 'WhatsApp OTP Service',
    },
    TELEGRAM: {
        code: 'tg',
        name: 'Telegram',
        emoji: '✈️',
        description: 'Telegram OTP Service',
    },
};

// Service codes array
const SERVICE_CODES = Object.values(SERVICES).map(s => s.code);

// ============================================================
// ORDER STATUS
// ============================================================
const ORDER_STATUS = {
    PENDING: 'pending',
    WAITING_SMS: 'waiting_sms',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    FAILED: 'failed',
};

// ============================================================
// TRANSACTION STATUS
// ============================================================
const TRANSACTION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};

// ============================================================
// PAYMENT METHODS
// ============================================================
const PAYMENT_METHODS = {
    QRIS: 'qris',
    BANK_TRANSFER: 'bank_transfer',
    E_WALLET: 'e_wallet',
    VIRTUAL_ACCOUNT: 'virtual_account',
};

// ============================================================
// USER ROLES
// ============================================================
const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
};

// ============================================================
// MENU ACTIONS (untuk callback_query)
// ============================================================
const MENU_ACTIONS = {
    // Main Menu
    MAIN_MENU: 'main_menu',
    PROFILE: 'profile',
    ORDER_OTP: 'order_otp',
    TOPUP: 'topup',
    HISTORY: 'history',
    HELP: 'help',

    // Profile Menu
    PROFILE_BALANCE: 'profile_balance',
    PROFILE_STATS: 'profile_stats',
    PROFILE_SETTINGS: 'profile_settings',

    // Order Flow
    SELECT_SERVICE: 'select_service',
    SELECT_COUNTRY: 'select_country',
    CONFIRM_ORDER: 'confirm_order',
    CANCEL_ORDER: 'cancel_order',
    CHECK_SMS: 'check_sms',

    // Top-up Flow
    TOPUP_AMOUNT: 'topup_amount',
    TOPUP_CONFIRM: 'topup_confirm',
    TOPUP_CANCEL: 'topup_cancel',

    // History
    HISTORY_ORDERS: 'history_orders',
    HISTORY_TRANSACTIONS: 'history_transactions',
    ORDER_DETAIL: 'order_detail',

    // Navigation
    BACK: 'back',
    CLOSE: 'close',
    REFRESH: 'refresh',
};

// ============================================================
// RESPONSE MESSAGES
// ============================================================
const MESSAGES = {
    // Welcome & Registration
    WELCOME: '🎉 *Selamat Datang di Bot OTP Service!*\n\nBot ini menyediakan layanan nomor OTP untuk verifikasi akun Anda.\n\nGunakan tombol di bawah untuk memulai.',

    REGISTER_SUCCESS: '✅ *Registrasi Berhasil!*\n\nAkun Anda telah terdaftar. Selamat menggunakan layanan kami!',

    // Main Menu
    MAIN_MENU_TEXT: '🏠 *Menu Utama*\n\nSilakan pilih menu yang Anda inginkan:',

    // Profile
    PROFILE_TEXT: (userData) => {
        return `👤 *Profil Anda*\n\n` +
            `📱 Username: ${userData.username || '-'}\n` +
            `🆔 Telegram ID: ${userData.telegram_id}\n` +
            `💰 Saldo: Rp ${userData.balance.toLocaleString('id-ID')}\n` +
            `📊 Total Transaksi: ${userData.total_orders || 0}\n` +
            `📅 Bergabung: ${userData.created_at}`;
    },

    // Order
    SELECT_SERVICE_TEXT: '📱 *Pilih Layanan OTP*\n\nPilih layanan yang ingin Anda gunakan:',

    SELECT_COUNTRY_TEXT: (service) => {
        return `🌍 *Pilih Negara untuk ${service}*\n\nPilih negara untuk nomor OTP:`;
    },

    ORDER_PROCESSING: '⏳ Sedang memproses order Anda...',

    ORDER_SUCCESS: (orderData) => {
        return `✅ *Order Berhasil!*\n\n` +
            `📱 Layanan: ${orderData.service}\n` +
            `🌍 Negara: ${orderData.country}\n` +
            `📞 Nomor: ${orderData.phone_number}\n` +
            `💰 Harga: Rp ${orderData.price.toLocaleString('id-ID')}\n\n` +
            `Menunggu SMS...`;
    },

    SMS_RECEIVED: (code) => {
        return `✅ *SMS Diterima!*\n\n` +
            `📩 Kode OTP: \`${code}\`\n\n` +
            `Silakan gunakan kode ini untuk verifikasi.`;
    },

    ORDER_CANCELLED: '❌ Order dibatalkan.',

    ORDER_EXPIRED: '⏰ Order expired. Saldo dikembalikan.',

    // Top-up
    TOPUP_PROMPT: '💰 *Top-up Saldo*\n\nMasukkan jumlah yang ingin Anda top-up (minimal Rp 10.000):',

    TOPUP_SUCCESS: (amount) => {
        return `✅ *Top-up Berhasil!*\n\n` +
            `💰 Jumlah: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Saldo Anda telah bertambah.`;
    },

    // Errors
    ERROR_GENERIC: '❌ Terjadi kesalahan. Silakan coba lagi.',
    ERROR_INSUFFICIENT_BALANCE: '❌ Saldo tidak mencukupi.',
    ERROR_INVALID_AMOUNT: '❌ Jumlah tidak valid.',
    ERROR_SERVICE_UNAVAILABLE: '❌ Layanan tidak tersedia saat ini.',
    ERROR_RATE_LIMIT: '⚠️ Terlalu banyak request. Silakan tunggu sebentar.',
    ERROR_DAILY_LIMIT: '⚠️ Anda telah mencapai batas order harian.',

    // Info
    HELP_TEXT: '❓ *Bantuan*\n\n' +
        '1. Pilih "Order OTP" untuk membuat order\n' +
        '2. Pilih "Top-up" untuk menambah saldo\n' +
        '3. Pilih "Profil" untuk melihat informasi akun\n' +
        '4. Pilih "Riwayat" untuk melihat transaksi\n\n' +
        'Hubungi @Support untuk bantuan lebih lanjut.',

    PROCESSING: '⏳ Sedang memproses...',

    MAINTENANCE: '🔧 Sistem sedang dalam maintenance. Silakan coba lagi nanti.',
};

// ============================================================
// LIMITS & CONSTRAINTS
// ============================================================
const LIMITS = {
    // Top-up
    MIN_TOPUP_AMOUNT: parseInt(process.env.MIN_TOPUP_AMOUNT, 10) || 10000,
    MAX_TOPUP_AMOUNT: parseInt(process.env.MAX_TOPUP_AMOUNT, 10) || 10000000,

    // Orders
    DAILY_ORDER_LIMIT: parseInt(process.env.DAILY_ORDER_LIMIT, 10) || 50,

    // Rate Limiting
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30,

    // OTP Timeout
    OTP_AUTO_CANCEL_TIMEOUT: parseInt(process.env.OTP_AUTO_CANCEL_TIMEOUT, 10) || 300,
};

// ============================================================
// CACHE KEYS
// ============================================================
const CACHE_KEYS = {
    USER: (telegramId) => `user:${telegramId}`,
    USER_BALANCE: (userId) => `user_balance:${userId}`,
    ORDER: (orderId) => `order:${orderId}`,
    TRANSACTION: (transactionId) => `transaction:${transactionId}`,
    COUNTRIES: 'countries:list',
    OPERATORS: (countryCode) => `operators:${countryCode}`,
    PRICES: (service, country) => `prices:${service}:${country}`,
};

// ============================================================
// CACHE TTL (Time To Live in seconds)
// ============================================================
const CACHE_TTL = {
    SHORT: parseInt(process.env.CACHE_TTL_SHORT, 10) || 300,      // 5 minutes
    MEDIUM: parseInt(process.env.CACHE_TTL_MEDIUM, 10) || 3600,   // 1 hour
    LONG: parseInt(process.env.CACHE_TTL_LONG, 10) || 86400,      // 24 hours
};

// ============================================================
// COUNTRIES (dapat ditambahkan lebih banyak)
// ============================================================
const COUNTRIES = {
    ID: {
        code: 'ID',
        name: 'Indonesia',
        emoji: '🇮🇩',
        dialCode: '+62',
    },
    MY: {
        code: 'MY',
        name: 'Malaysia',
        emoji: '🇲🇾',
        dialCode: '+60',
    },
    SG: {
        code: 'SG',
        name: 'Singapore',
        emoji: '🇸🇬',
        dialCode: '+65',
    },
    TH: {
        code: 'TH',
        name: 'Thailand',
        emoji: '🇹🇭',
        dialCode: '+66',
    },
    VN: {
        code: 'VN',
        name: 'Vietnam',
        emoji: '🇻🇳',
        dialCode: '+84',
    },
};

// Country codes array
const COUNTRY_CODES = Object.keys(COUNTRIES);

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    SERVICES,
    SERVICE_CODES,
    ORDER_STATUS,
    TRANSACTION_STATUS,
    PAYMENT_METHODS,
    USER_ROLES,
    MENU_ACTIONS,
    MESSAGES,
    LIMITS,
    CACHE_KEYS,
    CACHE_TTL,
    COUNTRIES,
    COUNTRY_CODES,
};