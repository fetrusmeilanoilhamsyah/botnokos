-- ============================================================
-- Initial Schema for OTP Telegram Bot (Production Ready)
-- ============================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id                   SERIAL PRIMARY KEY,
    telegram_id          VARCHAR(255) UNIQUE NOT NULL,
    username             VARCHAR(255),
    first_name           VARCHAR(255),
    last_name            VARCHAR(255),
    balance              DECIMAL(15, 2) DEFAULT 0.00,
    role                 VARCHAR(50) DEFAULT 'user',         -- user, admin
    total_orders         INTEGER DEFAULT 0,
    success_orders       INTEGER DEFAULT 0,
    failed_orders        INTEGER DEFAULT 0,
    total_topup          DECIMAL(15, 2) DEFAULT 0.00,
    referred_by          VARCHAR(255),                        -- telegram_id pengundang
    referred_count       INTEGER DEFAULT 0,                   -- jumlah yang berhasil diundang
    referral_bonus_total DECIMAL(15, 2) DEFAULT 0.00,        -- total bonus referral diterima
    is_banned            BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRANSACTIONS TABLE (Topups via Midtrans)
CREATE TABLE IF NOT EXISTS transactions (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER REFERENCES users(id),
    external_id    VARCHAR(255) UNIQUE,                      -- Midtrans order_id
    amount         DECIMAL(15, 2) NOT NULL,                  -- nominal topup
    status         VARCHAR(50) DEFAULT 'pending',            -- pending, completed, failed, expired
    payment_method VARCHAR(100),
    payment_url    TEXT,
    message_id     VARCHAR(255),                             -- Telegram message_id untuk auto-delete
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE (OTP Orders via JasaOTP)
CREATE TABLE IF NOT EXISTS orders (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER REFERENCES users(id),
    service_code      VARCHAR(50) NOT NULL,                  -- wa, tg
    country_code      VARCHAR(10) NOT NULL,                  -- 6 = Indonesia, 4 = Philippines
    phone_number      VARCHAR(50),
    order_external_id VARCHAR(255),                          -- ID order dari provider JasaOTP
    price             DECIMAL(15, 2) NOT NULL,               -- harga yang dibayarkan user
    status            VARCHAR(50) DEFAULT 'pending',         -- pending, completed, cancelled, expired
    otp_code          VARCHAR(50),                           -- kode OTP yang diterima
    full_sms          TEXT,                                  -- isi SMS lengkap (opsional)
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUTO UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_modtime ON users;
DROP TRIGGER IF EXISTS update_transactions_modtime ON transactions;
DROP TRIGGER IF EXISTS update_orders_modtime ON orders;

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- INDEXES (untuk performa query)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON orders(order_external_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
