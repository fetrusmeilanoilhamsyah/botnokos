/**
 * ============================================================
 * PostgreSQL Database Configuration
 * ============================================================
 * Connection pooling optimized for VPS 1GB RAM
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL,

    // Connection pool settings (optimized for 1GB RAM)
    min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,

    // Timeouts
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 5000,

    // SSL configuration
    ssl: process.env.DB_SSL_MODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Event handlers
pool.on('connect', (client) => {
    logger.info('✅ New PostgreSQL client connected');
});

pool.on('error', (err, client) => {
    logger.error('❌ Unexpected PostgreSQL pool error:', err);
    process.exit(-1);
});

pool.on('remove', (client) => {
    logger.debug('PostgreSQL client removed from pool');
});

/**
 * Execute query with error handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
    const start = Date.now();

    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        logger.debug('Query executed', {
            query: text,
            duration: `${duration}ms`,
            rows: result.rowCount,
        });

        return result;
    } catch (error) {
        logger.error('Database query error:', {
            query: text,
            params,
            error: error.message,
        });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Set a timeout of 5 seconds, after which we'll log a warning
    const timeout = setTimeout(() => {
        logger.warn('⚠️ Client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
    };

    // Monkey patch the release method to clear the timeout
    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release.apply(client);
    };

    return client;
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as now, version() as version');
        logger.info('✅ PostgreSQL connection successful', {
            time: result.rows[0].now,
            version: result.rows[0].version.split(' ')[0],
        });
        return true;
    } catch (error) {
        logger.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
};

/**
 * Graceful shutdown
 */
const closePool = async () => {
    try {
        await pool.end();
        logger.info('✅ PostgreSQL pool closed gracefully');
    } catch (error) {
        logger.error('❌ Error closing PostgreSQL pool:', error.message);
    }
};

// Handle process termination
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    closePool,
};