#!/bin/bash

# ============================================================
# AUTO DEPLOY SCRIPT - BOT JASA OTP (UBUNTU 22.04/24.04)
# Optimasi Khusus VPS RAM 1GB
# ============================================================

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Memulai Instalasi Bot Jasa OTP...${NC}"

# 1. Update System
echo -e "${GREEN}🔄 Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies (Node.js, Git, Redis, Postgres)
echo -e "${GREEN}📦 Installing dependencies...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git redis-server postgresql postgresql-contrib

# 3. Install PM2 Secara Global
echo -e "${GREEN}⚡ Installing PM2...${NC}"
sudo npm install -g pm2

# 4. Konfigurasi PostgreSQL
echo -e "${GREEN}🐘 Configuring Database...${NC}"
# Buat user dan database jika belum ada
sudo -u postgres psql -c "CREATE USER botuser WITH PASSWORD 'BotPass123!';"
sudo -u postgres psql -c "CREATE DATABASE otp_bot OWNER botuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE otp_bot TO botuser;"

# 5. Optimasi Swap (PENTING UNTUK RAM 1GB)
if [ [ $(free -m | grep Swap | awk '{print $2}') -eq 0 ] ]; then
    echo -e "${GREEN}💾 Creating 2GB Swap File for Stability...${NC}"
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 6. Setup Project
echo -e "${GREEN}📂 Setting up project...${NC}"
# Asumsi script ini dijalankan di dalam folder bot
npm install

# 7. Konfigurasi PM2 untuk RAM Kecil
echo -e "${GREEN}🚀 Starting Bot with PM2...${NC}"
# Jalankan dengan limit memori agar tidak crash
pm2 start src/app.js --name "bot-otp" --node-args="--max-old-space-size=768"
pm2 save
pm2 startup

echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}✅ INSTALASI SELESAI!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "1. Edit file .env Anda dengan 'nano .env'"
echo -e "2. Restart bot dengan 'pm2 restart bot-otp'"
echo -e "3. Cek log dengan 'pm2 logs bot-otp'"
echo -e "${BLUE}============================================================${NC}"
