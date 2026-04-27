#!/bin/bash

# ============================================================
# AUTO DEPLOY SCRIPT v2.0 - BOT JASA OTP (UBUNTU)
# Optimasi Khusus VPS RAM 1GB + Auto Nginx SSL
# ============================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Memulai Instalasi Bot Jasa OTP v2.0...${NC}"

# 1. Update System
echo -e "${GREEN}🔄 Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies
echo -e "${GREEN}📦 Installing Node.js, Redis, Postgres, Nginx, Certbot...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git redis-server postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# 3. Install PM2
sudo npm install -g pm2

# 4. Konfigurasi PostgreSQL
echo -e "${GREEN}🐘 Configuring Database...${NC}"
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'botuser') THEN CREATE ROLE botuser WITH LOGIN PASSWORD 'BotPass123!'; END IF; END \$\$;"
sudo -u postgres psql -c "SELECT 'CREATE DATABASE otp_bot OWNER botuser' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'otp_bot')\gexec"

# 5. Optimasi Swap (RAM 1GB)
if [ ! -f /swapfile ]; then
    echo -e "${GREEN}💾 Creating 2GB Swap File...${NC}"
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 6. Setup Project
echo -e "${GREEN}📂 Installing NPM Packages...${NC}"
npm install

# 7. Setup Database Tables
echo -e "${GREEN}🗄️ Initializing Database Tables...${NC}"
if [ -f src/database/migrations/init.sql ]; then
    cat src/database/migrations/init.sql | sudo -u postgres psql -d otp_bot
fi

# 8. Start Bot with PM2
echo -e "${GREEN}🚀 Starting Bot...${NC}"
pm2 delete bot-otp 2>/dev/null
pm2 start src/app.js --name "bot-otp" --node-args="--max-old-space-size=768"
pm2 save
pm2 startup

echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}✅ INSTALASI DASAR SELESAI!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "1. Edit .env: ${RED}nano .env${NC}"
echo -e "2. Restart: ${RED}pm2 restart bot-otp${NC}"
echo -e "3. Setup Domain: Lihat README_VPS.md${NC}"
echo -e "${BLUE}============================================================${NC}"
