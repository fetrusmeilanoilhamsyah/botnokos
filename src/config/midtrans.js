'use strict';

/**
 * ============================================================
 * config/midtrans.js — Midtrans Configuration
 * ============================================================
 */

const midtransClient = require('midtrans-client');

// Initialize Snap client
const snap = new midtransClient.Snap({
    isProduction : process.env.MIDTRANS_ENVIRONMENT === 'production',
    serverKey    : process.env.MIDTRANS_SERVER_KEY,
    clientKey    : process.env.MIDTRANS_CLIENT_KEY,
});

// Initialize Core API client (optional, but useful for status checks)
const coreApi = new midtransClient.CoreApi({
    isProduction : process.env.MIDTRANS_ENVIRONMENT === 'production',
    serverKey    : process.env.MIDTRANS_SERVER_KEY,
    clientKey    : process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = {
    snap,
    coreApi,
    serverKey : process.env.MIDTRANS_SERVER_KEY,
};
