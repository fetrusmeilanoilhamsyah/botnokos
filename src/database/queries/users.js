/**
 * ============================================================
 * User Database Queries
 * ============================================================
 * Prepared statements for user-related database operations
 */

const { query } = require('../../config/database');

/**
 * Find user by telegram ID
 * @param {number} telegramId - Telegram user ID
 * @returns {Promise<Object|null>} User object or null
 */
const findByTelegramId = async (telegramId) => {
    const sql = `
    SELECT * FROM users 
    WHERE telegram_id = $1
    LIMIT 1
  `;

    const result = await query(sql, [telegramId]);
    return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const findById = async (userId) => {
    const sql = `
    SELECT * FROM users 
    WHERE id = $1
    LIMIT 1
  `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
    const {
        telegram_id,
        username,
        first_name,
        last_name,
        language_code,
    } = userData;

    const sql = `
    INSERT INTO users (
      telegram_id, 
      username, 
      first_name, 
      last_name,
      language_code,
      referral_code
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

    // Generate unique referral code
    const referralCode = `REF${telegram_id}${Date.now().toString(36).toUpperCase()}`;

    const result = await query(sql, [
        telegram_id,
        username || null,
        first_name || null,
        last_name || null,
        language_code || 'id',
        referralCode,
    ]);

    return result.rows[0];
};

/**
 * Update user info
 * @param {number} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.keys(updates).forEach((key) => {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
    });

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(userId);

    const sql = `
    UPDATE users 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

    const result = await query(sql, values);
    return result.rows[0];
};

/**
 * Update last active timestamp
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const updateLastActive = async (userId) => {
    const sql = `
    UPDATE users 
    SET last_active = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

    await query(sql, [userId]);
};

/**
 * Get user balance
 * @param {number} userId - User ID
 * @returns {Promise<number>} User balance
 */
const getBalance = async (userId) => {
    const sql = `
    SELECT balance FROM users 
    WHERE id = $1
  `;

    const result = await query(sql, [userId]);
    return result.rows[0]?.balance || 0;
};

/**
 * Update user balance (use this function with caution, prefer updateUserBalance)
 * @param {number} userId - User ID
 * @param {number} newBalance - New balance
 * @returns {Promise<Object>} Updated user
 */
const setBalance = async (userId, newBalance) => {
    const sql = `
    UPDATE users 
    SET balance = $1
    WHERE id = $2
    RETURNING *
  `;

    const result = await query(sql, [newBalance, userId]);
    return result.rows[0];
};

/**
 * Update user balance with audit trail (uses database function)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to add/subtract (positive or negative)
 * @param {string} transactionType - Type of transaction
 * @param {string} referenceId - Reference ID (transaction_id or order_id)
 * @param {string} description - Description
 * @returns {Promise<boolean>} Success status
 */
const updateUserBalance = async (userId, amount, transactionType, referenceId, description) => {
    const sql = `
    SELECT update_user_balance($1, $2, $3, $4, $5) as success
  `;

    const result = await query(sql, [
        userId,
        amount,
        transactionType,
        referenceId,
        description,
    ]);

    return result.rows[0]?.success || false;
};

/**
 * Get user statistics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async (userId) => {
    const sql = `
    SELECT 
      u.balance,
      u.total_spent,
      u.total_topup,
      COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as total_topup_count,
      COUNT(DISTINCT o.id) as total_order_count,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed') as completed_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
      u.created_at,
      u.last_active
    FROM users u
    LEFT JOIN transactions t ON u.id = t.user_id
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = $1
    GROUP BY u.id
  `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
};

/**
 * Check daily order limit
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Limit info
 */
const checkDailyOrderLimit = async (userId) => {
    const sql = `
    SELECT 
      daily_order_count,
      last_order_reset,
      CASE 
        WHEN last_order_reset < CURRENT_DATE 
        THEN 0 
        ELSE daily_order_count 
      END as current_count
    FROM users
    WHERE id = $1
  `;

    const result = await query(sql, [userId]);
    return result.rows[0] || { current_count: 0 };
};

/**
 * Increment daily order count
 * @param {number} userId - User ID
 * @returns {Promise<number>} New count
 */
const incrementDailyOrderCount = async (userId) => {
    const sql = `
    UPDATE users
    SET 
      daily_order_count = CASE 
        WHEN last_order_reset < CURRENT_DATE 
        THEN 1 
        ELSE daily_order_count + 1 
      END,
      last_order_reset = CASE 
        WHEN last_order_reset < CURRENT_DATE 
        THEN CURRENT_DATE 
        ELSE last_order_reset 
      END
    WHERE id = $1
    RETURNING daily_order_count
  `;

    const result = await query(sql, [userId]);
    return result.rows[0]?.daily_order_count || 0;
};

/**
 * Reset daily order count (called by cron)
 * @returns {Promise<number>} Number of users reset
 */
const resetDailyOrderCounts = async () => {
    const sql = `
    UPDATE users
    SET 
      daily_order_count = 0,
      last_order_reset = CURRENT_DATE
    WHERE last_order_reset < CURRENT_DATE
    RETURNING id
  `;

    const result = await query(sql);
    return result.rowCount;
};

/**
 * Ban user
 * @param {number} userId - User ID
 * @param {string} reason - Ban reason
 * @returns {Promise<Object>} Updated user
 */
const banUser = async (userId, reason) => {
    const sql = `
    UPDATE users
    SET 
      is_banned = true,
      ban_reason = $1,
      is_active = false
    WHERE id = $2
    RETURNING *
  `;

    const result = await query(sql, [reason, userId]);
    return result.rows[0];
};

/**
 * Unban user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const unbanUser = async (userId) => {
    const sql = `
    UPDATE users
    SET 
      is_banned = false,
      ban_reason = NULL,
      is_active = true
    WHERE id = $1
    RETURNING *
  `;

    const result = await query(sql, [userId]);
    return result.rows[0];
};

/**
 * Get user balance history
 * @param {number} userId - User ID
 * @param {number} limit - Limit results
 * @returns {Promise<Array>} Balance history
 */
const getBalanceHistory = async (userId, limit = 10) => {
    const sql = `
    SELECT 
      amount,
      balance_before,
      balance_after,
      transaction_type,
      reference_id,
      description,
      created_at
    FROM balance_history
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
};

module.exports = {
    findByTelegramId,
    findById,
    createUser,
    updateUser,
    updateLastActive,
    getBalance,
    setBalance,
    updateUserBalance,
    getUserStats,
    checkDailyOrderLimit,
    incrementDailyOrderCount,
    resetDailyOrderCounts,
    banUser,
    unbanUser,
    getBalanceHistory,
};