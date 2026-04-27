/**
 * ============================================================
 * Formatter Utilities
 * ============================================================
 * Format currency, dates, and messages
 */

const moment = require('moment-timezone');
const numeral = require('numeral');

// Set timezone
const TIMEZONE = process.env.TZ || 'Asia/Jakarta';
moment.tz.setDefault(TIMEZONE);

/**
 * Format currency to IDR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return `Rp ${numeral(amount).format('0,0')}`;
};

/**
 * Format currency without prefix
 * @param {number} amount - Amount to format
 * @returns {string} Formatted number
 */
const formatNumber = (amount) => {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return numeral(amount).format('0,0');
};

/**
 * Parse currency string to number
 * @param {string} currencyStr - Currency string
 * @returns {number} Parsed number
 */
const parseCurrency = (currencyStr) => {
    if (typeof currencyStr === 'number') {
        return currencyStr;
    }
    // Remove Rp, dots, commas, and whitespace
    const cleaned = currencyStr.replace(/[Rp\s.,]/g, '');
    return parseInt(cleaned, 10) || 0;
};

/**
 * Format date to readable format
 * @param {Date|string} date - Date to format
 * @param {string} format - Moment format string
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'DD MMM YYYY HH:mm') => {
    return moment(date).format(format);
};

/**
 * Format relative time (e.g., "5 menit yang lalu")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time
 */
const formatRelativeTime = (date) => {
    moment.locale('id');
    return moment(date).fromNow();
};

/**
 * Format phone number
 * @param {string} phoneNumber - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';

    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Add spaces for readability
    if (cleaned.length <= 10) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3');
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Escape Markdown special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeMarkdown = (text) => {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

/**
 * Format order status with emoji
 * @param {string} status - Order status
 * @returns {string} Status with emoji
 */
const formatOrderStatus = (status) => {
    const statusMap = {
        pending: '⏳ Pending',
        waiting_sms: '⏰ Menunggu SMS',
        completed: '✅ Selesai',
        cancelled: '❌ Dibatalkan',
        expired: '⏰ Expired',
        failed: '❌ Gagal',
    };
    return statusMap[status] || status;
};

/**
 * Format transaction status with emoji
 * @param {string} status - Transaction status
 * @returns {string} Status with emoji
 */
const formatTransactionStatus = (status) => {
    const statusMap = {
        pending: '⏳ Pending',
        processing: '⏳ Diproses',
        completed: '✅ Berhasil',
        failed: '❌ Gagal',
        expired: '⏰ Expired',
        cancelled: '❌ Dibatalkan',
    };
    return statusMap[status] || status;
};

/**
 * Format message with user data
 * @param {string} template - Message template
 * @param {Object} data - Data to inject
 * @returns {string} Formatted message
 */
const formatMessage = (template, data = {}) => {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
};

/**
 * Create pagination text
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total pages
 * @returns {string} Pagination text
 */
const formatPagination = (currentPage, totalPages) => {
    return `Halaman ${currentPage} dari ${totalPages}`;
};

/**
 * Format duration in seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Readable duration
 */
const formatDuration = (seconds) => {
    if (seconds < 60) {
        return `${seconds} detik`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
        return remainingSeconds > 0
            ? `${minutes} menit ${remainingSeconds} detik`
            : `${minutes} menit`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours} jam ${remainingMinutes} menit`;
};

/**
 * Format balance change for audit trail
 * @param {number} amount - Amount (positive or negative)
 * @returns {string} Formatted change
 */
const formatBalanceChange = (amount) => {
    if (amount >= 0) {
        return `+${formatCurrency(amount)}`;
    }
    return formatCurrency(amount);
};

/**
 * Create progress bar
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {number} length - Bar length
 * @returns {string} Progress bar
 */
const createProgressBar = (current, total, length = 10) => {
    const percentage = Math.min(Math.max(current / total, 0), 1);
    const filled = Math.round(length * percentage);
    const empty = length - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
};

module.exports = {
    formatCurrency,
    formatNumber,
    parseCurrency,
    formatDate,
    formatRelativeTime,
    formatPhoneNumber,
    truncateText,
    escapeMarkdown,
    formatOrderStatus,
    formatTransactionStatus,
    formatMessage,
    formatPagination,
    formatDuration,
    formatBalanceChange,
    createProgressBar,
};