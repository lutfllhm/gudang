# 🚀 Quick Start - Real-Time Updates

## Aktifkan Fitur Real-Time dalam 3 Langkah

### 1️⃣ Install Dependencies (Sudah Selesai ✅)

```bash
# Backend
cd backend && npm install socket.io

# Frontend  
cd frontend && npm install socket.io-client
```

### 2️⃣ Aktifkan Auto Sync

Edit file `.env` di root project, tambahkan:

```env
# SYNC CONFIGURATION
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=60
SYNC_BATCH_SIZE=100
```

### 3️⃣ Restart Aplikasi

```bash
# Jika pakai PM2
pm2 restart backend

# Jika pakai Docker
docker-compose restart backend

# Jika manual
cd backend && npm start
```

## ✅ Selesai!

Buka aplikasi di browser, Anda akan melihat:
- 🟢 Indikator **"Live"** di pojok kanan atas halaman Sales Orders
- 🔔 Notifikasi toast saat ada sales order baru
- 📦 Data otomatis muncul tanpa refresh

## 🎯 Untuk Hasil Terbaik (Optional)

### Setup Webhook di Accurate Online

1. Login ke [Accurate Online](https://account.accurate.id)
2. Buka **Settings → Webhooks**
3. Tambah webhook:
   - **URL**: `https://iwareid.com/api/accurate/webhook`
   - **Secret**: Ambil dari `.env` → `WEBHOOK_SECRET`
   - **Events**: Centang semua `sales_order.*` dan `item.*`

Dengan webhook, data akan **instant** (< 1 detik) tanpa perlu menunggu sync interval!

## 🔍 Cara Test

### Test 1: Buat Sales Order Baru di Accurate
1. Buka Accurate Online
2. Buat sales order baru
3. Lihat aplikasi iWare → Data langsung muncul + notifikasi 🔔

### Test 2: Cek Koneksi WebSocket
1. Buka browser console (F12)
2. Lihat log: `✅ WebSocket connected`
3. Lihat indikator "Live" berwarna hijau

## 📊 Interval Sync yang Disarankan

| Interval | Kecepatan | Beban Server | Rekomendasi |
|----------|-----------|--------------|-------------|
| 30 detik | ⚡⚡⚡ | 🔴 Tinggi | Hanya jika perlu |
| **60 detik (1 menit)** | ⚡⚡ | 🟡 Sedang | ✅ **Rekomendasi** |
| 120 detik (2 menit) | ⚡ | 🟢 Rendah | OK untuk traffic rendah |
| 300 detik (5 menit) | 🐌 | 🟢 Rendah | Terlalu lambat |

## 🆘 Troubleshooting

### Indikator "Offline" terus?
```bash
# Cek apakah backend running
pm2 status

# Cek log error
tail -f backend/logs/error-*.log
```

### Data tidak update otomatis?
1. Pastikan `AUTO_SYNC_ENABLED=true`
2. Restart backend
3. Cek webhook logs: `/api/accurate/webhook/logs`

### Notifikasi tidak muncul?
- Refresh halaman (Ctrl+F5)
- Cek browser console untuk error
- Pastikan tidak ada ad-blocker yang block WebSocket

## 📚 Dokumentasi Lengkap

Lihat [REALTIME_UPDATES.md](./REALTIME_UPDATES.md) untuk dokumentasi lengkap.

---

**Selamat! Aplikasi Anda sekarang real-time! 🎉**
