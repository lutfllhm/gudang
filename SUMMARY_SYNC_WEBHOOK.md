# Summary: Auto Sync & Webhook Setup

## 📝 Yang Sudah Dilakukan

### 1. ✅ Mengurangi Interval Auto Sync

**Perubahan:**
- Interval sync: **5 menit → 1 menit**
- File yang diubah:
  - `backend/database/schema.sql` - Default config untuk instalasi baru
  - `backend/database/update-sync-interval.sql` - Script update untuk database yang sudah ada

**Cara Update di VPS:**
Lihat file: `QUICK_UPDATE_GUIDE.md` atau `UPDATE_VPS_GUIDE.md`

**Ringkas:**
```bash
# 1. Upload file SQL
scp backend/database/update-sync-interval.sql user@vps:/path/to/app/backend/database/

# 2. SSH & jalankan
ssh user@vps
mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql

# 3. Restart backend
pm2 restart backend
```

### 2. ✅ Webhook Sudah Siap

**Status:**
- Webhook endpoint sudah ada: `POST /api/accurate/webhook`
- Support events:
  - `sales_order.created` - SO baru
  - `sales_order.updated` - SO update (termasuk perubahan status)
  - `sales_order.deleted` - SO dihapus
  - `item.created/updated/deleted` - Item changes

**Cara Setup:**
Lihat file: `WEBHOOK_SETUP_GUIDE.md`

**Ringkas:**
1. Setup webhook di Accurate Online
2. URL: `https://your-domain.com/api/accurate/webhook`
3. (Optional) Set `WEBHOOK_SECRET` di `.env` untuk keamanan
4. Test dengan script: `backend/test-webhook.sh`

---

## 🎯 Timeline Update Status

### Dengan Auto Sync Saja (1 menit)
```
00:00 - Status berubah di Accurate
01:00 - Auto sync detect perubahan
01:05 - Database terupdate
01:30 - Schedule TV refresh (max 30 detik)
```
**Total: ~1.5 menit**

### Dengan Webhook + Auto Sync (Optimal)
```
00:00 - Status berubah di Accurate
00:01 - Webhook diterima & sync
00:01 - Database terupdate
00:30 - Schedule TV refresh (max 30 detik)
```
**Total: ~30 detik**

---

## 📂 File-File Baru

### Dokumentasi
1. `WEBHOOK_SETUP_GUIDE.md` - Panduan lengkap setup webhook
2. `UPDATE_VPS_GUIDE.md` - Panduan detail update di VPS
3. `QUICK_UPDATE_GUIDE.md` - Panduan singkat (copy-paste)
4. `SUMMARY_SYNC_WEBHOOK.md` - File ini (ringkasan)

### Scripts
1. `backend/database/update-sync-interval.sql` - SQL script update interval
2. `backend/test-webhook.sh` - Script test webhook (Linux/Mac)
3. `update-sync-vps.sh` - Script otomatis update di VPS

---

## 🚀 Langkah Selanjutnya

### Prioritas 1: Update Sync Interval di VPS ⭐

**Mengapa penting:**
- Perubahan status akan terdeteksi 5x lebih cepat
- Tidak perlu setup tambahan (webhook)
- Langsung bisa digunakan

**Cara:**
1. Buka `QUICK_UPDATE_GUIDE.md`
2. Ikuti 4 langkah sederhana
3. Selesai dalam 5 menit

### Prioritas 2: Setup Webhook (Optional tapi Recommended)

**Mengapa penting:**
- Update real-time (~30 detik)
- Tidak perlu tunggu auto sync
- Lebih efisien (tidak perlu fetch semua data)

**Cara:**
1. Buka `WEBHOOK_SETUP_GUIDE.md`
2. Setup di Accurate Online
3. Test dengan script

**Catatan:** Webhook memerlukan public endpoint. Jika VPS Anda tidak public, gunakan:
- Ngrok (untuk testing)
- Cloudflare Tunnel (untuk production)
- VPN/Reverse Proxy

---

## 📊 Monitoring

### Cek Auto Sync Berjalan

```bash
# Via log
tail -f backend/logs/all-*.log | grep -i "auto sync"

# Via database
mysql -u root -p iware_warehouse -e "SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;"
```

### Cek Webhook Logs

```bash
# Via API (perlu login)
curl -X GET "http://your-domain/api/accurate/webhook/logs?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Via database
mysql -u root -p iware_warehouse -e "SELECT * FROM webhook_logs ORDER BY received_at DESC LIMIT 10;"
```

### Cek Konfigurasi Sync

```bash
mysql -u root -p iware_warehouse -e "SELECT auto_sync_enabled, sync_interval_seconds, last_sync_status FROM sync_config WHERE id = 1;"
```

---

## ✅ Checklist Implementasi

### Update Sync Interval
- [ ] Upload file `update-sync-interval.sql` ke VPS
- [ ] Jalankan SQL script
- [ ] Restart backend service
- [ ] Verifikasi interval = 60 detik
- [ ] Monitor log auto sync
- [ ] Test: ubah status di Accurate, tunggu 1-2 menit

### Setup Webhook (Optional)
- [ ] Baca `WEBHOOK_SETUP_GUIDE.md`
- [ ] Pastikan endpoint public accessible
- [ ] Setup webhook di Accurate Online
- [ ] Set `WEBHOOK_SECRET` di `.env` (optional)
- [ ] Test webhook dengan script
- [ ] Monitor webhook logs
- [ ] Test: ubah status di Accurate, tunggu 30 detik

---

## 🔍 Troubleshooting

### Auto Sync Tidak Berjalan

**Cek:**
1. Database config: `SELECT * FROM sync_config;`
2. Log error: `tail -f backend/logs/error-*.log`
3. Backend running: `pm2 status` atau `docker ps`
4. Accurate token valid: `SELECT expires_at FROM accurate_tokens WHERE is_active = 1;`

**Solusi:**
```bash
# Restart backend
pm2 restart backend --update-env
# atau
docker-compose restart backend
```

### Webhook Tidak Diterima

**Cek:**
1. Endpoint accessible: `curl -X POST https://your-domain/api/accurate/webhook`
2. Firewall/security group
3. Webhook config di Accurate
4. Log: `tail -f backend/logs/all-*.log | grep webhook`

**Solusi:**
- Gunakan ngrok untuk testing
- Cek webhook logs via API
- Verifikasi `WEBHOOK_SECRET` match

### Status Tidak Update di Schedule

**Cek:**
1. Auto sync berjalan: cek log
2. Data di database: `SELECT status FROM sales_orders WHERE nomor_so = 'XXX';`
3. Schedule TV refresh: tunggu max 30 detik
4. Filter schedule: pastikan tidak filter "Terproses"

---

## 📞 Support

Jika ada masalah:

1. **Cek dokumentasi:**
   - `QUICK_UPDATE_GUIDE.md` - Panduan singkat
   - `UPDATE_VPS_GUIDE.md` - Panduan detail
   - `WEBHOOK_SETUP_GUIDE.md` - Setup webhook

2. **Cek log:**
   - Error: `backend/logs/error-*.log`
   - All: `backend/logs/all-*.log`
   - Accurate: `backend/logs/accurate-*.log`

3. **Cek database:**
   - Sync config: `SELECT * FROM sync_config;`
   - Sync logs: `SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 10;`
   - Webhook logs: `SELECT * FROM webhook_logs ORDER BY received_at DESC LIMIT 10;`

---

## 🎉 Hasil Akhir

Setelah implementasi lengkap:

✅ **Auto Sync:** Berjalan setiap 1 menit
✅ **Webhook:** Real-time update (~30 detik)
✅ **Schedule TV:** Update otomatis setiap 30 detik
✅ **Perubahan Status:** Terdeteksi dalam 30 detik - 1.5 menit
✅ **Redundancy:** Jika webhook gagal, auto sync akan catch up

**Status di Accurate berubah → Aplikasi ikut berubah → Schedule TV terupdate** 🚀

---

**Mulai dari Prioritas 1 (Update Sync Interval) dulu, baru Prioritas 2 (Webhook) jika diperlukan!**
