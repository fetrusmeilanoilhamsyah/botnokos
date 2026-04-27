# 🚀 Panduan Instalasi VPS v2.0 (Ubuntu 22.04 / 24.04)
**Domain: feepay.web.id | RAM: 1GB**

Panduan ini sudah diperbarui untuk setup domain otomatis dan database.

---

## **1. Persiapan DNS (WAJIB)**
Sebelum mulai, pastikan di Panel Domain Anda (DomaiNesia):
*   **A Record** (@) arahkan ke IP VPS: `202.155.95.73`
*   **A Record** (www) arahkan ke IP VPS: `202.155.95.73`

---

## **2. Instalasi Cepat**
Login ke VPS dan jalankan perintah ini:
```bash
git clone https://github.com/fetrusmeilanoilhamsyah/botnokos.git
cd botnokos
chmod +x deploy.sh
./deploy.sh
```

---

## **3. Konfigurasi Domain & SSL (HTTPS)**
Agar domain `feepay.web.id` aktif, jalankan ini:

1. **Buat Config Nginx:**
   ```bash
   nano /etc/nginx/sites-available/feepay
   ```
2. **Copy & Paste isi ini:**
   ```nginx
   server {
       listen 80;
       server_name feepay.web.id www.feepay.web.id;
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. **Aktifkan & Pasang SSL:**
   ```bash
   ln -s /etc/nginx/sites-available/feepay /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t && systemctl restart nginx
   certbot --nginx -d feepay.web.id -d www.feepay.web.id
   ```

---

## **4. Pengisian API Key**
Edit file `.env` Anda:
```bash
nano .env
```
Isi bagian penting ini:
*   `DATABASE_URL=postgresql://botuser:BotPass123!@localhost:5432/otp_bot`
*   `TELEGRAM_BOT_TOKEN=...`
*   `MIDTRANS_SERVER_KEY=...`
*   `MIDTRANS_NOTIFICATION_URL=https://feepay.web.id/webhook/midtrans`
*   `OTP_API_KEY=...`

---

## **5. Perintah Berguna (Maintenance)**
*   **Cek Log Bot:** `pm2 logs bot-otp`
*   **Restart Bot:** `pm2 restart bot-otp`
*   **Cek Database:** `sudo -u postgres psql -d otp_bot`
*   **Update Code:** `git pull origin main && pm2 restart bot-otp`

---
**Status Bot:** `https://feepay.web.id` 🚀🔥
```
