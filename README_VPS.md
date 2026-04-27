# 🚀 Panduan Instalasi VPS (Ubuntu 22.04 / 24.04)
**Optimasi Khusus VPS RAM 1GB**

Panduan ini akan membimbing Anda menginstal Bot Jasa OTP dari nol sampai jalan 24 jam.

---

## **1. Persiapan Awal**
Login ke VPS Anda via SSH (Gunakan Termius, PuTTY, atau Terminal):
```bash
ssh root@IP_VPS_ANDA
```

## **2. Clone Project**
Masuk ke folder yang diinginkan dan clone repository Anda:
```bash
git clone https://github.com/fetrusmeilanoilhamsyah/botnokos.git
cd botnokos
```

## **3. Jalankan Auto-Deploy**
Saya sudah buatkan script sakti agar Anda tidak perlu mengetik perintah satu per satu.
```bash
# Beri izin eksekusi
chmod +x deploy.sh

# Jalankan script (Tunggu 3-5 menit)
./deploy.sh
```

---

## **4. Konfigurasi Database & Env**
Setelah instalasi selesai, Anda **WAJIB** mengisi kredensial di file `.env`.

1. Buat file .env dari example (jika belum ada):
   ```bash
   cp .env.example .env
   ```
2. Edit file `.env`:
   ```bash
   nano .env
   ```
3. Sesuaikan bagian database (Gunakan user yang dibuat script deploy):
   ```env
   DATABASE_URL=postgresql://botuser:BotPass123!@localhost:5432/otp_bot
   ```
4. Masukkan **TELEGRAM_BOT_TOKEN**, **MIDTRANS_SERVER_KEY**, dan **OTP_API_KEY**.
5. Simpan (Tekan `CTRL+O`, lalu `ENTER`, lalu `CTRL+X`).

---

## **5. Inisialisasi Database**
Jalankan perintah ini untuk membuat tabel-tabel awal:
```bash
psql postgresql://botuser:BotPass123!@localhost:5432/otp_bot -f src/database/migrations/init.sql
```

---

## **6. Menjalankan Bot (24 Jam Nonstop)**
Gunakan PM2 agar bot tetap jalan meskipun SSH ditutup:
```bash
# Restart agar membaca .env terbaru
pm2 restart bot-otp

# Cek apakah sudah jalan (Status harus 'online')
pm2 status

# Melihat log aktivitas (Sangat berguna untuk debug)
pm2 logs bot-otp
```

---

## **💡 Tips Untuk RAM 1GB**
1. **Swap File:** Script `deploy.sh` sudah otomatis membuat Swap 2GB. Ini adalah "RAM Bayangan" agar VPS tidak macet saat beban tinggi.
2. **Memory Limit:** Bot dijalankan dengan limit 768MB agar sistem operasi VPS tetap punya sisa RAM untuk bernapas.
3. **Database Maintenance:** Jangan lupa backup berkala dengan perintah:
   ```bash
   pg_dump -U botuser otp_bot > backup.sql
   ```

---
**Bot Anda sekarang sudah online!** 💎🚀
```
