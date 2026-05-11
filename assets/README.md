# Assets — Banner & Logo Bot

## Cara Pakai

Letakkan file gambar banner di folder ini.

### Format yang Direkomendasikan

| File          | Ukuran       | Format | Keterangan                        |
|---------------|--------------|--------|-----------------------------------|
| `banner.jpg`  | 800×400 px   | JPEG   | Banner utama saat user /start     |
| `logo.png`    | 512×512 px   | PNG    | Logo bot (bulat, background putih)|

### Rekomendasi Teknis (agar ringan & cepat)
- **JPEG**: Kualitas 80%, file < 200KB
- **PNG**: Compress pakai TinyPNG, file < 100KB
- Telegram hanya mendukung file gambar < 10MB untuk `sendPhoto`
- Untuk kecepatan maksimal, gunakan JPEG daripada PNG

### Upload ke VPS
Setelah deploy, upload banner ke VPS dengan:
```bash
scp assets/banner.jpg root@202.155.95.73:~/botnokos/assets/
```
