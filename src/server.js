'use strict';

/**
 * ============================================================
 * server.js — Webhook & API Server
 * ============================================================
 * Server Express untuk menangani webhook dari Midtrans
 * dan potensi API dashboard di masa depan.
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const { midtransWebhook } = require('./controllers/webhook.controller');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Midtrans Webhook Route
app.post('/webhook/midtrans', midtransWebhook);

// Global Error Handler for Express
app.use((err, req, res, next) => {
    logger.error('[express] Internal Server Error:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

// Start Server
const startServer = () => {
    app.listen(PORT, () => {
        logger.info(`🚀 Webhook server running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
