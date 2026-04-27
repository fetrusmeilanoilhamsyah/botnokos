#!/bin/bash

# ============================================================
# AUTO DEPLOY SCRIPT ULTIMATE - BOT JASA OTP (UBUNTU)
# Optimasi Khusus VPS RAM 1GB + Auto Setup Everything
# ============================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Memulai Instalasi Bot Jasa OTP Ultimate Edition...${NC}"

# 1. Update & Install Core Dependencies
echo -e "${GREEN}🔄 Updating system & Installing Packages...${NC}"
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git redis-server postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# 2. Install PM2 Secara Global
sudo npm install -g pm2

# 3. Konfigurasi Database (botuser & otp_bot)
echo -e "${GREEN}🐘 Configuring PostgreSQL Database...${NC}"
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'botuser') THEN CREATE ROLE botuser WITH LOGIN PASSWORD 'BotPass123!'; END IF; END \$\$;"
sudo -u postgres psql -c "SELECT 'CREATE DATABASE otp_bot OWNER botuser' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'otp_bot')\gexec"

# 4. Optimasi Swap (PENTING untuk VPS 1GB)
if [ ! -f /swapfile ]; then
    echo -e "${GREEN}💾 Creating 2GB Swap File for RAM Stability...${NC}"
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 5. Setup Folder Project & NPM
echo -e "${GREEN}📂 Installing NPM Packages...${NC}"
npm install

# 6. Otomatisasi File .env
echo -e "${GREEN}📝 Setting up .env file...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    # Isi otomatis DATABASE_URL ke .env
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://botuser:BotPass123!@localhost:5432/otp_bot|g" .env
    echo -e "${BLUE}✅ File .env berhasil dibuat dengan koneksi database otomatis.${NC}"
fi

# 7. Inisialisasi Tabel Database
echo -e "${GREEN}🗄️ Initializing Database Tables...${NC}"
if [ -f src/database/migrations/init.sql ]; then
    cat src/database/migrations/init.sql | sudo -u postgres psql -d otp_bot
    echo -e "${BLUE}✅ Tabel database berhasil dibuat.${NC}"
fi

# 8. Start Bot dengan PM2 (Optimasi RAM)
echo -e "${GREEN}🚀 Starting Bot with PM2...${NC}"
pm2 delete bot-otp 2>/dev/null
pm2 start src/app.js --name "bot-otp" --node-args="--max-old-space-size=768"
pm2 save
pm2 startup

echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}✅ INSTALASI CORE SELESAI!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}TUGAS ANDA SEKARANG:${NC}"
echo -e "1. Edit file .env Anda: ${RED}nano .env${NC}"
echo -e "2. Masukkan Bot Token & API Keys."
echo -e "3. Simpan dan jalankan: ${RED}pm2 restart bot-otp${NC}"
echo -e "4. Setup Domain Nginx: Lihat README_VPS.md"
echo -e "${BLUE}============================================================${NC}"
