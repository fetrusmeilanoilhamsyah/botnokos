'use strict';

/**
 * ============================================================
 * services/otp.service.js — JasaOTP v1 Integration (Official)
 * ============================================================
 * Documentation match for: https://api.jasaotp.id/v1/
 */

const axios = require('axios');
const logger = require('../utils/logger');

const API_KEY = process.env.OTP_API_KEY;
const BASE_URL = 'https://api.jasaotp.id/v1';

/**
 * Browser-like Headers to bypass 403 Forbidden
 */
const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://jasaotp.id',
    'Referer': 'https://jasaotp.id/',
});

const otpService = {
    /**
     * Cek Saldo (balance.php)
     */
    getBalance: async () => {
        try {
            const res = await axios.get(`${BASE_URL}/balance.php?api_key=${API_KEY}`, { headers: getHeaders() });
            if (res.data && res.data.success) {
                return parseFloat(res.data.data.saldo || 0);
            }
            return 0;
        } catch (err) {
            logger.error('[otpService] getBalance error:', err.message);
            return 0;
        }
    },

    /**
     * Ambil Daftar Negara (negara.php)
     */
    getCountries: async () => {
        try {
            const res = await axios.get(`${BASE_URL}/negara.php`, { headers: getHeaders() });
            if (res.data && res.data.success) {
                return res.data.data; // Array of {id_negara, nama_negara}
            }
            return [];
        } catch (err) {
            logger.error('[otpService] getCountries error:', err.message);
            return [];
        }
    },

    /**
     * Ambil Layanan (layanan.php)
     */
    getServicesByCountry: async (countryId) => {
        try {
            const res = await axios.get(`${BASE_URL}/layanan.php?negara=${countryId}`, { headers: getHeaders() });
            // JasaOTP v1 response is often keyed by the country ID directly
            if (res.data) {
                // If nested under .data
                if (res.data.success && res.data.data && res.data.data[countryId]) {
                    return res.data.data[countryId];
                }
                // If directly returning the country object
                if (res.data[countryId]) return res.data[countryId];
                // If it's the raw services object
                return res.data;
            }
            return null;
        } catch (err) {
            logger.error('[otpService] getServicesByCountry error:', err.message);
            return null;
        }
    },

    /**
     * Buat Order (order.php)
     */
    createOrder: async (serviceCode, countryId) => {
        try {
            // Default operator is 'any' as per documentation
            const url = `${BASE_URL}/order.php?api_key=${API_KEY}&negara=${countryId}&layanan=${serviceCode}&operator=any`;
            const res = await axios.get(url, { headers: getHeaders() });
            
            if (res.data && res.data.success) {
                return {
                    success: true,
                    orderId: res.data.data.order_id,
                    number: res.data.data.number,
                };
            }
            return { success: false, message: res.data.message || 'Gagal memesan nomor.' };
        } catch (err) {
            logger.error('[otpService] createOrder error:', err.message);
            return { success: false, message: 'Server provider sedang sibuk.' };
        }
    },

    /**
     * Cek OTP (sms.php)
     */
    checkSms: async (orderId) => {
        try {
            const res = await axios.get(`${BASE_URL}/sms.php?api_key=${API_KEY}&id=${orderId}`, { headers: getHeaders() });
            if (res.data && res.data.success && res.data.data.otp) {
                return {
                    status: 'OK',
                    otp: res.data.data.otp,
                };
            }
            return { status: 'WAITING' };
        } catch (err) {
            logger.error('[otpService] checkSms error:', err.message);
            return { status: 'ERROR' };
        }
    },

    /**
     * Batalkan Order (cancel.php)
     */
    cancelOrder: async (orderId) => {
        try {
            const res = await axios.get(`${BASE_URL}/cancel.php?api_key=${API_KEY}&id=${orderId}`, { headers: getHeaders() });
            return res.data.success;
        } catch (err) {
            logger.error('[otpService] cancelOrder error:', err.message);
            return false;
        }
    }
};

module.exports = otpService;
