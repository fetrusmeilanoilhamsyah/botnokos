'use strict';

/**
 * ============================================================
 * utils/logger.js — Winston Logger Setup
 * ============================================================
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const path = require('path');
const fs = require('fs');

// Pastikan direktori log ada
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Format untuk console (berwarna)
const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...meta }) => {
        let log = `[${timestamp}] ${level}: ${message}`;
        if (stack) {
            log += `\n${stack}`;
        } else if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

// Format untuk file (plain JSON)
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }),
    format.json()
);

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    exitOnError: false,
    transports: [
        // Console output
        ...(process.env.LOG_CONSOLE !== 'false'
            ? [new transports.Console({ format: consoleFormat })]
            : []),

        // File: semua log
        ...(process.env.LOG_FILE !== 'false'
            ? [
                new transports.File({
                    filename: path.join(logDir, 'combined.log'),
                    format: fileFormat,
                    maxsize: (parseInt(process.env.LOG_MAX_SIZE, 10) || 10) * 1024 * 1024,
                    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
                }),
                new transports.File({
                    filename: path.join(logDir, 'error.log'),
                    level: 'error',
                    format: fileFormat,
                    maxsize: (parseInt(process.env.LOG_MAX_SIZE, 10) || 10) * 1024 * 1024,
                    maxFiles: 7,
                }),
            ]
            : []),
    ],
});

module.exports = logger;
