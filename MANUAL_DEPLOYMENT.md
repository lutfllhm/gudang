# Manual Deployment - Histori Faktur Penjualan

Panduan deployment manual step-by-step tanpa script otomatis.

---

## Persiapan

### Yang Anda Butuhkan:
- Akses SSH ke VPS: `root@212.85.26.166`
- Password VPS
- File-file yang akan di-upload (sudah ada di folder project)

---

## STEP 1: Cari Lokasi Aplikasi di VPS

### 1.1 Login ke VPS
```bash
ssh root@212.85.26.166
```
Masukkan password saat diminta.

### 1.2 Cari Directory Aplikasi
```bash
# Cari docker-compose.yml
find / -name "docker-compose.yml" 2>/dev/null | grep -v node_modules
```

**Catat hasilnya!** Misalnya:
- `/var/www/gudang/docker-compose.yml`
- `/root/accurate-sync/docker-compose.yml`
- Atau path lainnya

### 1.3 Masuk ke Directory Aplikasi
```bash
# Ganti dengan path yang Anda temukan
cd /var/www/gudang

# Atau
cd /root/accurate-sync

# Cek isi folder
ls -la
```

Anda harus melihat folder seperti:
- `backend/`
- `frontend/` (mungkin)
- `docker-compose.yml`
- `.env`

### 1.4 Cek Struktur Backend
```bash
cd backend
ls -la

# Harus ada folder:
# - src/
# - database/
# - node_modules/
```

**PENTING:** Catat path lengkap aplikasi Anda. Contoh:
```
/var/www/gudang
```

---

## STEP 2: Backup Database

### 2.1 Masuk ke Directory Backend
```bash
# Ganti dengan path Anda
cd /var/www/gudang/backend
```

### 2.2 Cek MySQL Password
```bash
cat .env | grep MYSQL_ROOT_PASSWORD
```

Catat passwordnya. Misalnya: `MYSQL_ROOT_PASSWORD=rahasia123`

### 2.3 Backup Database
```bash
docker-compose exec db mysqldump -u root -prahasia123 accurate_sync > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Ganti `rahasia123` dengan password MySQL Anda!**

### 2.4 Verifikasi Backup
```bash
ls -lh backup_*.sql
```

Harus ada file backup dengan ukuran > 0 bytes.

---

## STEP 3: Upload Files dari Local ke VPS

**Buka terminal BARU di komputer local Anda** (jangan di VPS).

### 3.1 Masuk ke Folder Project
```bash
# Di komputer local
cd /path/to/your/project
```

### 3.2 Upload Migration File
```bash
# Ganti /var/www/gudang dengan path aplikasi Anda
scp backend/database/add-sales-invoice-history.sql root@212.85.26.166:/var/www/gudang/backend/database/
```

Masukkan password VPS saat diminta.

### 3.3 Upload Controller
```bash
scp backend/src/controllers/SalesInvoiceHistoryController.js root@212.85.26.166:/var/www/gudang/backend/src/controllers/
```

### 3.4 Upload Model
```bash
scp backend/src/models/SalesInvoiceHistory.js root@212.85.26.166:/var/www/gudang/backend/src/models/
```

### 3.5 Upload Services
```bash
scp backend/src/services/CustomerService.js root@212.85.26.166:/var/www/gudang/backend/src/services/

scp backend/src/services/SyncService.js root@212.85.26.166:/var/www/gudang/backend/src/services/
```

### 3.6 Upload Routes
```bash
scp backend/src/routes/salesInvoiceHistory.js root@212.85.26.166:/var/www/gudang/backend/src/routes/
```

**Catatan:** Ganti `/var/www/gudang` dengan path aplikasi Anda di semua command di atas!

---

## STEP 4: Verifikasi Upload

**Kembali ke terminal VPS** (yang sudah login SSH).

### 4.1 Cek Files Sudah Terupload
```bash
# Masuk ke directory aplikasi
cd /var/www/gudang/backend

# Cek migration file
ls -la database/add-sales-invoice-history.sql

# Cek controller
ls -la src/controllers/SalesInvoiceHistoryController.js

# Cek model
ls -la src/models/SalesInvoiceHistory.js

# Cek services
ls -la src/services/CustomerService.js
ls -la src/services/SyncService.js

# Cek routes
ls -la src/routes/salesInvoiceHistory.js
```

Semua file harus ada dan ukurannya > 0 bytes.

---

## STEP 5: Run Database Migration

### 5.1 Masuk ke Directory Backend
```bash
cd /var/www/gudang/backend
```

### 5.2 Run Migration
```bash
# Ganti rahasia123 dengan password MySQL Anda
docker-compose exec -T db mysql -u root -prahasia123 accurate_sync < database/add-sales-invoice-history.sql
```

**Jika berhasil:** Tidak ada error message.

**Jika ada error:** Catat error messagenya dan beritahu saya.

### 5.3 Verifikasi Table Sudah Dibuat
```bash
docker-compose exec db mysql -u root -prahasia123 accurate_sync -e "SHOW TABLES LIKE 'sales_invoice_history';"
```

Harus muncul:
```
+---------------------------------------+
| Tables_in_accurate_sync (sales_invoice_history) |
+---------------------------------------+
| sales_invoice_history                 |
+---------------------------------------+
```

### 5.4 Cek Structure Table
```bash
docker-compose exec db mysql -u root -prahasia123 accurate_sync -e "DESCRIBE sales_invoice_history;"
```

Harus muncul struktur table dengan kolom-kolom seperti:
- id
- sales_order_id
- so_id
- invoice_number
- dll.

---

## STEP 6: Restart Backend

### 6.1 Masuk ke Directory Aplikasi
```bash
cd /var/www/gudang
```

### 6.2 Restart Backend Container
```bash
docker-compose restart backend
```

### 6.3 Tunggu Beberapa Detik
```bash
sleep 5
```

### 6.4 Cek Status Container
```bash
docker-compose ps
```

Backend harus dalam status **Up**.

### 6.5 Cek Logs
```bash
docker-compose logs --tail=50 backend
```

**Cari error:** Jika ada error, catat dan beritahu saya.

**Jika tidak ada error:** Lanjut ke step berikutnya.

---

## STEP 7: Test API

### 7.1 Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Atau dari komputer local:
```bash
curl http://212.85.26.166:3000/health
```

Harus return: `{"status":"ok"}` atau sejenisnya.

### 7.2 Login untuk Dapat Token
```bash
# Ganti username dan password dengan credentials Anda
curl -X POST http://212.85.26.166:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Catat token dari response!**

### 7.3 Test Get Recent History
```bash
# Ganti YOUR_TOKEN dengan token dari step sebelumnya
curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected response:**
```json
{
  "success": true,
  "data": []
}
```

Atau dengan data jika sudah ada history.

### 7.4 Test Manual Sync
```bash
curl -X POST http://212.85.26.166:3000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "pageSize": 100
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "synced": 0
  },
  "message": "Invoice history sync completed"
}
```

---

## STEP 8: Verifikasi Database

### 8.1 Cek Record Count
```bash
docker-compose exec db mysql -u root -prahasia123 accurate_sync -e "SELECT COUNT(*) as total FROM sales_invoice_history;"
```

### 8.2 Cek Recent Records
```bash
docker-compose exec db mysql -u root -prahasia123 accurate_sync -e "SELECT * FROM v_sales_invoice_history ORDER BY created_at DESC LIMIT 5;"
```

---

## STEP 9: Monitoring

### 9.1 Monitor Logs Real-time
```bash
cd /var/www/gudang
docker-compose logs -f backend | grep -i "invoice\|history"
```

Press `Ctrl+C` untuk stop monitoring.

### 9.2 Cek Backend Logs File
```bash
cd /var/www/gudang/backend/logs
tail -f all-$(date +%Y-%m-%d).log | grep -i invoice
```

---

## Troubleshooting

### Error: "Permission denied"
```bash
# Cek ownership
ls -la /var/www/gudang/backend/src/

# Fix ownership jika perlu
chown -R root:root /var/www/gudang/backend/src/
```

### Error: "Table already exists"
Table sudah ada, skip migration atau drop table dulu:
```bash
docker-compose exec db mysql -u root -prahasia123 accurate_sync -e "DROP TABLE IF EXISTS sales_invoice_history;"
```
Lalu run migration lagi.

### Error: "Cannot connect to database"
```bash
# Cek database container
docker-compose ps db

# Restart database
docker-compose restart db

# Tunggu 10 detik
sleep 10
```

### Backend tidak restart
```bash
# Stop dan start ulang
docker-compose stop backend
docker-compose start backend

# Atau rebuild
docker-compose up -d --build backend
```

### API return 404
```bash
# Cek routes file sudah terupload
ls -la /var/www/gudang/backend/src/routes/salesInvoiceHistory.js

# Cek server.js sudah register routes
grep -n "salesInvoiceHistory" /var/www/gudang/backend/server.js
```

Harus ada line seperti:
```javascript
app.use('/api/sales-invoice-history', require('./src/routes/salesInvoiceHistory'));
```

---

## Checklist Deployment

- [ ] Step 1: Lokasi aplikasi ditemukan
- [ ] Step 2: Database di-backup
- [ ] Step 3: Semua files terupload
- [ ] Step 4: Upload terverifikasi
- [ ] Step 5: Migration berhasil
- [ ] Step 6: Backend restart berhasil
- [ ] Step 7: API test berhasil
- [ ] Step 8: Database terverifikasi
- [ ] Step 9: Monitoring setup

---

## Summary Commands (Copy-Paste Ready)

**Ganti variabel berikut:**
- `APP_PATH`: Path aplikasi Anda (contoh: `/var/www/gudang`)
- `MYSQL_PASS`: Password MySQL Anda
- `YOUR_TOKEN`: Token dari login

### Di VPS:
```bash
# 1. Masuk ke directory
cd APP_PATH

# 2. Backup
cd backend
docker-compose exec db mysqldump -u root -pMYSQL_PASS accurate_sync > backup_$(date +%Y%m%d).sql

# 3. Run migration
docker-compose exec -T db mysql -u root -pMYSQL_PASS accurate_sync < database/add-sales-invoice-history.sql

# 4. Verify table
docker-compose exec db mysql -u root -pMYSQL_PASS accurate_sync -e "SHOW TABLES LIKE 'sales_invoice_history';"

# 5. Restart
cd ..
docker-compose restart backend

# 6. Check status
docker-compose ps
docker-compose logs --tail=50 backend
```

### Di Local:
```bash
# Upload files (ganti APP_PATH)
scp backend/database/add-sales-invoice-history.sql root@212.85.26.166:APP_PATH/backend/database/
scp backend/src/controllers/SalesInvoiceHistoryController.js root@212.85.26.166:APP_PATH/backend/src/controllers/
scp backend/src/models/SalesInvoiceHistory.js root@212.85.26.166:APP_PATH/backend/src/models/
scp backend/src/services/CustomerService.js root@212.85.26.166:APP_PATH/backend/src/services/
scp backend/src/services/SyncService.js root@212.85.26.166:APP_PATH/backend/src/services/
scp backend/src/routes/salesInvoiceHistory.js root@212.85.26.166:APP_PATH/backend/src/routes/

# Test API
curl -X POST http://212.85.26.166:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Selesai!

Jika semua step berhasil, histori faktur penjualan sudah terintegrasi dengan Accurate di VPS Anda.

**Endpoints yang tersedia:**
- `GET /api/sales-invoice-history/recent`
- `GET /api/sales-invoice-history/order/:orderId`
- `GET /api/sales-invoice-history/so/:soId`
- `GET /api/sales-invoice-history/status/:status`
- `POST /api/sales-invoice-history/sync`

**Monitoring:**
```bash
ssh root@212.85.26.166
cd APP_PATH
docker-compose logs -f backend | grep -i invoice
```
