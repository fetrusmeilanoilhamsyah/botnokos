# 🚀 Panduan Instalasi VPS Ultimate (Ubuntu 22.04 / 24.04)
**Target: feepay.web.id | RAM: 1GB**

Ikuti langkah-langkah di bawah ini secara berurutan untuk hasil 100% sukses.

---

## **Langkah 1: Persiapan DNS (Wajib Sebelum Deploy)**
Login ke panel domain Anda (DomaiNesia) dan atur **DNS Management**:
1.  **A Record** (`@`) -> IP VPS: `202.155.95.73`
2.  **A Record** (`www`) -> IP VPS: `202.155.95.73`
3.  Simpan dan tunggu 2 menit.

---

## **Langkah 2: Eksekusi Instalasi Otomatis**
Login ke VPS via SSH, lalu jalankan perintah gabungan ini:
```bash
git clone https://github.com/fetrusmeilanoilhamsyah/botnokos.git && cd botnokos && chmod +x deploy.sh && ./deploy.sh
```
*Script ini akan menginstal Node, Postgres, Redis, Nginx, dan membuat database otomatis.*

---

## **Langkah 3: Konfigurasi Domain & SSL (HTTPS)**
Agar link `feepay.web.id` aktif dan aman (HTTPS):

1. **Buat file konfigurasi Nginx:**
   ```bash
   nano /etc/nginx/sites-available/feepay
   ```
2. **Copy & Paste kode ini (Ubah nama domain jika berbeda):**
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
3. **Aktifkan & Pasang SSL Gratis:**
   ```bash
   ln -s /etc/nginx/sites-available/feepay /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t && systemctl restart nginx
   certbot --nginx -d feepay.web.id -d www.feepay.web.id
   ```

---

## **Langkah 4: Setup API Keys & Webhook**
1. **Buka file .env:**
   ```bash
   nano .env
   ```
2. **Isi variabel berikut (Penting!):**
   *   `TELEGRAM_BOT_TOKEN`: Token dari @BotFather.
   *   `MIDTRANS_SERVER_KEY`: Server Key Production dari Midtrans.
   *   `MIDTRANS_NOTIFICATION_URL`: `https://feepay.web.id/webhook/midtrans`
   *   `OTP_API_KEY`: API Key dari JasaOTP.
3. **Simpan (CTRL+O, Enter, CTRL+X) dan Restart Bot:**
   ```bash
   pm2 restart bot-otp
   ```

---

## **Langkah 5: Dashboard Midtrans (Production)**
Login ke Dashboard Midtrans Anda:
1.  Buka **Settings > Configuration**.
2.  **Payment Notification URL**: `https://feepay.web.id/webhook/midtrans`
3.  **Finish Redirect URL**: `https://t.me/NAMA_BOT_ANDA`
4.  Klik **Update/Save**.

---

## **🚀 Perintah Maintenance (Hafalkan Ini)**
*   `pm2 logs bot-otp` (Melihat aktivitas/error bot).
*   `pm2 restart bot-otp` (Restart bot setelah ganti .env).
*   `git pull origin main && pm2 restart bot-otp` (Update kode terbaru).

---
**Bot Anda sekarang aktif di: https://feepay.web.id** 💎🚀
```
