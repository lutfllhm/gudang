# Panduan Setup Webhook & Auto Sync

Dokumen ini menjelaskan cara setup auto sync dan webhook untuk update real-time dari Accurate Online.

## 📋 Ringkasan

Sistem ini memiliki 2 mekanisme untuk update data dari Accurate:

1. **Auto Sync** - Sync otomatis setiap 1 menit (dapat dikonfigurasi)
2. **Webhook** - Update real-time saat ada perubahan di Accurate

Kombinasi keduanya memastikan data selalu up-to-date dengan delay maksimal 1 menit.

---

## 🔄 1. Auto Sync Setup

### Status Saat Ini
✅ Auto sync sudah aktif secara default
✅ Interval: **1 menit** (60 detik)

### Cara Mengubah Interval Sync

#### Opsi A: Via Database (Recommended)

Jalankan script SQL berikut:

```bash
# Masuk ke MySQL
mysql -u root -p iware_warehouse

# Atau jika menggunakan Docker
docker exec -it <container_name> mysql -u root -p iware_warehouse
```

```sql
-- Update interval menjadi 1 menit (60 detik)
UPDATE sync_config 
SET sync_interval_seconds = 60,
    auto_sync_enabled = TRUE
WHERE id = 1;

-- Verifikasi
SELECT 
    auto_sync_enabled,
    sync_interval_seconds,
    CONCAT(FLOOR(sync_interval_seconds / 60), ' menit') as interval_readable
FROM sync_config;
```

Atau jalankan script yang sudah disediakan:
```bash
mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql
```

#### Opsi B: Via API (Coming Soon)

Endpoint untuk update konfigurasi sync via API akan ditambahkan di versi berikutnya.

### Restart Server

Setelah mengubah konfigurasi, restart server agar perubahan diterapkan:

```bash
# Jika menggunakan PM2
pm2 restart backend

# Jika menggunakan Docker
docker-compose restart backend

# Jika manual
# Stop server (Ctrl+C) lalu jalankan lagi
cd backend
npm start
```

### Monitoring Auto Sync

Cek log untuk memastikan auto sync berjalan:

```bash
# Lihat log backend
tail -f backend/logs/all-*.log | grep -i sync

# Atau jika menggunakan PM2
pm2 logs backend | grep -i sync
```

Log yang normal:
```
[INFO] Starting auto sync { interval: 60, cronExpression: '*/1 * * * *' }
[INFO] Auto sync started successfully
[INFO] Starting sync process
[INFO] Sales orders sync completed { totalSynced: 150, duration: 12 }
```

---

## 🔔 2. Webhook Setup

Webhook memungkinkan Accurate mengirim notifikasi real-time ke aplikasi Anda saat ada perubahan data.

### Webhook Endpoint

```
POST https://your-domain.com/api/accurate/webhook
```

**Catatan:** Endpoint ini harus bisa diakses dari internet (public). Jika server Anda di localhost, gunakan ngrok atau cloudflare tunnel.

### Cara Setup di Accurate Online

1. **Login ke Accurate Online**
   - Buka https://accurate.id
   - Login dengan akun Anda

2. **Buka Pengaturan Webhook**
   - Menu: Settings → Integrations → Webhooks
   - Atau hubungi support Accurate untuk mengaktifkan webhook

3. **Tambah Webhook Baru**
   - URL: `https://your-domain.com/api/accurate/webhook`
   - Method: `POST`
   - Events yang perlu diaktifkan:
     - ✅ `sales_order.created` - SO baru dibuat
     - ✅ `sales_order.updated` - SO diupdate (termasuk perubahan status)
     - ✅ `sales_order.deleted` - SO dihapus
     - ✅ `item.created` - Item baru
     - ✅ `item.updated` - Item diupdate
     - ✅ `item.deleted` - Item dihapus

4. **Security (Optional tapi Recommended)**
   
   Tambahkan secret key untuk keamanan:
   
   a. Generate secret key:
   ```bash
   # Generate random secret
   openssl rand -hex 32
   ```
   
   b. Tambahkan ke `.env`:
   ```env
   WEBHOOK_SECRET=your_generated_secret_here
   ```
   
   c. Di Accurate, tambahkan header:
   ```
   x-webhook-secret: your_generated_secret_here
   ```

### Testing Webhook

#### Test 1: Endpoint Availability

```bash
# Test apakah endpoint bisa diakses
curl -X POST https://your-domain.com/api/accurate/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "sales_order.updated",
    "data": {
      "id": "12345"
    }
  }'
```

Response yang diharapkan:
```json
{
  "success": true,
  "message": "Webhook processed",
  "event": "sales_order.updated"
}
```

#### Test 2: Simulasi Update Status

```bash
# Simulasi webhook dari Accurate saat status SO berubah
curl -X POST https://your-domain.com/api/accurate/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your_secret_here" \
  -d '{
    "event": "sales_order.updated",
    "data": {
      "id": "SO_ID_DARI_ACCURATE",
      "number": "SO.2026.04.00123",
      "status": "Terproses"
    }
  }'
```

#### Test 3: Lihat Webhook Logs

Login ke aplikasi, lalu akses:
```
GET https://your-domain.com/api/accurate/webhook/logs?limit=50
```

Atau via curl:
```bash
curl -X GET "https://your-domain.com/api/accurate/webhook/logs?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Webhook Event Format

Accurate akan mengirim data dalam format berikut:

```json
{
  "event": "sales_order.updated",
  "timestamp": "2026-04-15T10:30:00Z",
  "data": {
    "id": "12345",
    "number": "SO.2026.04.00123",
    "transDate": "15/04/2026",
    "customer": {
      "id": "67890",
      "name": "PT. Customer Name"
    },
    "status": "Terproses",
    "totalAmount": 5000000,
    "currency": "IDR"
  }
}
```

### Troubleshooting Webhook

#### Problem: Webhook tidak diterima

**Solusi:**
1. Pastikan server bisa diakses dari internet
2. Cek firewall/security group
3. Gunakan ngrok untuk testing:
   ```bash
   ngrok http 5000
   # Gunakan URL ngrok sebagai webhook URL
   ```

#### Problem: Webhook diterima tapi tidak diproses

**Solusi:**
1. Cek log error:
   ```bash
   tail -f backend/logs/error-*.log
   ```

2. Cek webhook logs via API:
   ```bash
   curl -X GET "http://localhost:5000/api/accurate/webhook/logs?limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. Pastikan Accurate token masih valid:
   ```sql
   SELECT user_id, expires_at, is_active 
   FROM accurate_tokens 
   WHERE is_active = 1 
   ORDER BY id DESC 
   LIMIT 1;
   ```

#### Problem: Secret key tidak cocok

**Solusi:**
1. Pastikan `WEBHOOK_SECRET` di `.env` sama dengan yang dikonfigurasi di Accurate
2. Restart server setelah mengubah `.env`
3. Test tanpa secret dulu untuk debugging:
   ```bash
   # Hapus sementara WEBHOOK_SECRET dari .env
   # Restart server
   # Test webhook
   ```

---

## 📊 Monitoring & Logs

### Database Tables untuk Monitoring

#### 1. sync_config
```sql
SELECT * FROM sync_config;
```
Menampilkan konfigurasi sync saat ini.

#### 2. sync_logs
```sql
SELECT * FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 10;
```
Menampilkan history sync terakhir.

#### 3. webhook_logs
```sql
SELECT 
    id,
    event_type,
    processed,
    error_message,
    received_at,
    processed_at
FROM webhook_logs 
ORDER BY received_at DESC 
LIMIT 20;
```
Menampilkan history webhook yang diterima.

### Log Files

```bash
# All logs
tail -f backend/logs/all-*.log

# Error logs only
tail -f backend/logs/error-*.log

# Accurate API logs
tail -f backend/logs/accurate-*.log

# Filter sync logs
tail -f backend/logs/all-*.log | grep -i "sync"

# Filter webhook logs
tail -f backend/logs/all-*.log | grep -i "webhook"
```

---

## 🎯 Timeline Update Status

Dengan setup ini, timeline update status dari Accurate ke Schedule TV:

### Scenario 1: Dengan Webhook (Optimal)
```
00:00 - Status di Accurate berubah: "Menunggu diproses" → "Terproses"
00:00 - Accurate mengirim webhook
00:01 - Aplikasi menerima webhook dan sync SO tersebut
00:01 - Database lokal terupdate
00:30 - Schedule TV auto refresh (max 30 detik)
00:30 - SO hilang dari tampilan schedule (karena sudah "Terproses")
```
**Total delay: ~30 detik**

### Scenario 2: Tanpa Webhook (Auto Sync Only)
```
00:00 - Status di Accurate berubah: "Menunggu diproses" → "Terproses"
01:00 - Auto sync berjalan (setiap 1 menit)
01:05 - Sync selesai, database terupdate
01:30 - Schedule TV auto refresh (max 30 detik)
01:30 - SO hilang dari tampilan schedule
```
**Total delay: ~1.5 menit**

---

## ✅ Checklist Setup

- [ ] Update sync interval ke 1 menit via SQL
- [ ] Restart backend server
- [ ] Verifikasi auto sync berjalan (cek log)
- [ ] Setup webhook di Accurate Online
- [ ] Generate dan set WEBHOOK_SECRET
- [ ] Test webhook endpoint
- [ ] Monitor webhook logs
- [ ] Verifikasi perubahan status terdeteksi

---

## 🆘 Support

Jika ada masalah:

1. Cek log error: `backend/logs/error-*.log`
2. Cek webhook logs via API atau database
3. Pastikan Accurate token masih valid
4. Restart server jika perlu

---

## 📝 Notes

- Auto sync berjalan di background, tidak mengganggu performa aplikasi
- Webhook lebih cepat tapi memerlukan public endpoint
- Kombinasi keduanya memberikan redundancy (jika webhook gagal, auto sync akan catch up)
- Schedule TV refresh setiap 30 detik untuk menampilkan data terbaru
