# 🚀 Panduan Lengkap: Fix Status Sales Order - Docker

## 📋 Ringkasan

**Masalah:** Status Sales Order di aplikasi tidak sesuai dengan Accurate Online  
**Solusi:** Perbaikan mapping status + re-sync data  
**Deployment:** Docker Compose  
**Estimasi Waktu:** 10-15 menit  
**Downtime:** 0 menit (zero downtime)

---

## 🎯 Perubahan yang Dibuat

### 1. Kode yang Diubah
- ✅ `backend/src/services/SalesOrderService.js` - Mapping status lebih lengkap

### 2. File Baru
- ✅ `backend/database/fix-sales-order-status-mapping.sql` - Script SQL normalisasi
- ✅ `backend/src/scripts/fix-and-resync-sales-orders.js` - Script fix + re-sync
- ✅ `backend/src/scripts/debug-sales-order-status.js` - Script debug status

### 3. Status Baku (3 Status)
| Status | Keterangan |
|--------|------------|
| **Menunggu diproses** | Belum diproses sama sekali |
| **Sebagian diproses** | Sudah ada invoice tapi belum semua |
| **Terproses** | Sudah selesai semua |

---

## 🔐 Step 1: Login ke VPS

```bash
ssh root@[IP_VPS_ANDA]
# atau
ssh user@[IP_VPS_ANDA]

# Masukkan password
```

---

## 📦 Step 2: Cek Container yang Berjalan

```bash
# Masuk ke direktori project
cd /var/www/gudang

# Cek status containers
docker-compose ps

# Output yang diharapkan:
# NAME              IMAGE              STATUS         PORTS
# iware_backend     gudang-backend     Up 17 hours    0.0.0.0:5000->5000/tcp
# iware_db          mysql:8.0          Up 17 hours    3306/tcp, 33060/tcp
# gudang-frontend   gudang-frontend    Up 17 hours    80/tcp
# iware_redis       redis:7-alpine     Up 17 hours    6379/tcp
```

**⚠️ PENTING:** Catat nama container database Anda (contoh: `iware_db`)

---

## 💾 Step 3: Backup Database (WAJIB!)

```bash
# Backup database dari container
docker-compose exec iware_db mysqldump -u iware -pJasadenam66/ iware_warehouse > ~/backup_fix_status_$(date +%Y%m%d_%H%M%S).sql

# Verifikasi backup berhasil
ls -lh ~/backup_fix_status_*

# Output contoh:
# -rw-r--r-- 1 root root 2.5M Apr 22 14:30 backup_fix_status_20260422_143045.sql
```

**💡 Tips:** Simpan nama file backup untuk rollback jika diperlukan!

**Alternatif (jika nama container berbeda):**
```bash
# Ganti 'iware_db' dengan nama container database Anda
docker exec iware_db mysqldump -u iware -pJasadenam66/ iware_warehouse > ~/backup_fix_status_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📥 Step 4: Pull Perubahan dari Git

```bash
# Pastikan di direktori project
cd /var/www/gudang

# Cek status git
git status

# Stash perubahan lokal jika ada
git stash

# Pull perubahan terbaru
git pull origin main
# atau sesuai branch Anda: git pull origin master

# Output yang diharapkan:
# Updating xxxxx..yyyyy
# Fast-forward
#  backend/src/services/SalesOrderService.js           | 25 +++++++++++
#  backend/database/fix-sales-order-status-mapping.sql | 89 +++++++++++
#  backend/src/scripts/fix-and-resync-sales-orders.js  | 245 ++++++++++
#  backend/src/scripts/debug-sales-order-status.js     | 198 +++++++++
#  5 files changed, 557 insertions(+)
```

**Jika ada conflict:**
```bash
# Lihat file yang conflict
git status

# Resolve conflict manual atau gunakan:
git checkout --theirs path/to/file  # Gunakan versi dari Git
git checkout --ours path/to/file    # Gunakan versi lokal

# Setelah resolve
git add .
git commit -m "Resolve conflict"
```

---

## 🔄 Step 5: Restart Backend Container

```bash
# Restart backend container
docker-compose restart iware_backend

# Cek status setelah restart
docker-compose ps iware_backend

# Output yang diharapkan:
# NAME            STATUS
# iware_backend   Up 5 seconds (healthy)

# Cek logs untuk memastikan tidak ada error
docker-compose logs iware_backend --tail 30 --follow
# Tekan Ctrl+C untuk keluar

# Pastikan tidak ada error seperti:
# ✅ "Server running on port 5000"
# ✅ "Database connected"
# ❌ "Error connecting to database"
# ❌ "Module not found"
```

---

## 🔍 Step 6: Debug Status (Opsional tapi Recommended)

```bash
# Masuk ke container backend
docker-compose exec iware_backend bash

# Di dalam container, jalankan debug script
node src/scripts/debug-sales-order-status.js

# Output contoh:
# ╔══════════════════════════════════════════════════════════════════╗
# ║               DEBUG SALES ORDER STATUS                           ║
# ╚══════════════════════════════════════════════════════════════════╝
# 
# Checking 10 latest SO from database...
# Ditemukan 10 Sales Order
# 
# Nomor SO              | Status DB            | Status Accurate      | Match?
# ------------------------------------------------------------------------------------------
# SO.2026.04.01004      | Sebagian diproses    | Menunggu di...       | ✗
# SO.2026.04.01003      | Sebagian diproses    | Menunggu di...       | ✗
# SO.2026.04.01002      | Sebagian diproses    | Menunggu di...       | ✗
# SO.2026.04.00999      | Sebagian diproses    | Menunggu di...       | ✗
# SO.2026.04.00998      | Sebagian diproses    | Terproses            | ✗
# SO.2026.04.00997      | Terproses            | Terproses            | ✓
# SO.2026.04.00996      | Menunggu diproses    | Menunggu di...       | ✓
# ------------------------------------------------------------------------------------------
# 
# Total: 10 | Match: 2 | Mismatch: 8
# 
# ============================================================
# DETAIL MISMATCH
# ============================================================
# 
# 1. SO.2026.04.01004 (ID: 12345)
#    Database        : "Sebagian diproses" → SEBAGIAN_DIPROSES
#    Accurate        : "Menunggu di..." → MENUNGGU_DIPROSES
# 
# 2. SO.2026.04.00998 (ID: 12340)
#    Database        : "Sebagian diproses" → SEBAGIAN_DIPROSES
#    Accurate        : "Terproses" → TERPROSES

# Keluar dari container
exit
```

**Atau jalankan langsung tanpa masuk container:**
```bash
docker-compose exec iware_backend node src/scripts/debug-sales-order-status.js
```

**Debug SO tertentu:**
```bash
docker-compose exec iware_backend node src/scripts/debug-sales-order-status.js SO.2026.04.00997 SO.2026.04.00998
```

---

## 🛠️ Step 7: Jalankan Perbaikan (UTAMA)

### Opsi A: Fix + Re-sync (RECOMMENDED)

```bash
# Masuk ke container backend
docker-compose exec iware_backend bash

# Di dalam container, jalankan fix script
node src/scripts/fix-and-resync-sales-orders.js

# Script akan menampilkan progress:
# ╔══════════════════════════════════════════════════════════╗
# ║          FIX & RE-SYNC SALES ORDERS                      ║
# ╚══════════════════════════════════════════════════════════╝
# 
# ============================================================
# MEMPERBAIKI STATUS SALES ORDER
# ============================================================
# 
# 1. Membuat backup data...
#    ✓ Backup berhasil dibuat
# 
# 2. Normalisasi status "Terproses"...
#    ✓ 45 record diupdate ke "Terproses"
# 
# 3. Normalisasi status "Sebagian diproses"...
#    ✓ 12 record diupdate ke "Sebagian diproses"
# 
# 4. Normalisasi status "Menunggu diproses"...
#    ✓ 23 record diupdate ke "Menunggu diproses"
# 
# 5. Mengecek status yang belum termapping...
#    ✓ Semua status sudah termapping dengan benar
# 
# 6. Statistik status setelah perbaikan:
# 
#    Status                  | Jumlah | Persentase
#    --------------------------------------------------
#    Menunggu diproses       |     23 |  28.75%
#    Sebagian diproses       |     12 |  15.00%
#    Terproses               |     45 |  56.25%
# 
# ============================================================
# PERBAIKAN STATUS SELESAI
# ============================================================
# 
# ============================================================
# RE-SYNC SALES ORDERS DARI ACCURATE
# ============================================================
# 
# User ID: 1
# 
# Memulai sync dari Accurate...
# (Proses ini mungkin memakan waktu beberapa menit)
# 
# Fetching sales orders page 1...
# Retrieved sales orders list: 100
# Sales orders page 1 synced: inserted=5, updated=95
# 
# Fetching sales orders page 2...
# Retrieved sales orders list: 50
# Sales orders page 2 synced: inserted=2, updated=48
# 
# ============================================================
# RE-SYNC SELESAI
# ============================================================
# 
# Total record di-sync: 150
# Durasi: 245 detik
# 
# ✓ Semua proses selesai!

# Keluar dari container
exit
```

**Atau jalankan langsung:**
```bash
docker-compose exec iware_backend node src/scripts/fix-and-resync-sales-orders.js
```

### Opsi B: Hanya Fix (Tanpa Re-sync)

```bash
# Jika tidak ingin re-sync (lebih cepat)
docker-compose exec iware_backend node src/scripts/fix-and-resync-sales-orders.js --skip-resync

# Kemudian lakukan sync manual dari aplikasi web
```

### Opsi C: Menggunakan SQL Script Langsung

```bash
# Import SQL script ke database
cat /var/www/gudang/backend/database/fix-sales-order-status-mapping.sql | docker-compose exec -T iware_db mysql -u iware -pJasadenam66/ iware_warehouse

# Atau copy script ke container lalu jalankan
docker cp /var/www/gudang/backend/database/fix-sales-order-status-mapping.sql iware_db:/tmp/
docker-compose exec iware_db mysql -u iware -pJasadenam66/ iware_warehouse < /tmp/fix-sales-order-status-mapping.sql
```

---

## ✅ Step 8: Verifikasi Hasil

### 8.1 Cek Logs Container

```bash
# Cek logs backend
docker-compose logs iware_backend --tail 50 --follow

# Pastikan tidak ada error
# Tekan Ctrl+C untuk keluar
```

### 8.2 Cek Database

```bash
# Masuk ke database
docker-compose exec iware_db mysql -u iware -pJasadenam66/ iware_warehouse
```

Jalankan query berikut:

```sql
-- 1. Cek statistik status
SELECT 
    status,
    COUNT(*) as jumlah,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sales_orders WHERE is_active = 1), 2) as persentase
FROM sales_orders
WHERE is_active = 1
GROUP BY status;

-- Output yang diharapkan:
-- +-------------------+--------+------------+
-- | status            | jumlah | persentase |
-- +-------------------+--------+------------+
-- | Menunggu diproses |     23 |      28.75 |
-- | Sebagian diproses |     12 |      15.00 |
-- | Terproses         |     45 |      56.25 |
-- +-------------------+--------+------------+

-- 2. Cek SO dari screenshot
SELECT nomor_so, nama_pelanggan, status, total_amount
FROM sales_orders
WHERE nomor_so IN (
    'SO.2026.04.00997',
    'SO.2026.04.00998',
    'SO.2026.04.00999',
    'SO.2026.04.01000',
    'SO.2026.04.01001',
    'SO.2026.04.01002',
    'SO.2026.04.01003',
    'SO.2026.04.01004'
)
ORDER BY nomor_so DESC;

-- 3. Cek apakah ada status yang aneh
SELECT DISTINCT status 
FROM sales_orders 
WHERE is_active = 1;

-- Seharusnya hanya ada 3 status:
-- - Menunggu diproses
-- - Sebagian diproses
-- - Terproses

-- Keluar dari MySQL
exit;
```

**Atau query langsung dari host:**
```bash
docker-compose exec iware_db mysql -u iware -pJasadenam66/ iware_warehouse -e "
SELECT status, COUNT(*) as jumlah 
FROM sales_orders 
WHERE is_active = 1 
GROUP BY status;
"
```

### 8.3 Cek Aplikasi Web

```bash
# Buka browser dan akses aplikasi
# https://iwareid.com (atau domain Anda)

# 1. Login ke aplikasi
# 2. Buka menu "Sales Orders"
# 3. Bandingkan status dengan Accurate Online
# 4. Pastikan statusnya sudah sama

# Contoh yang diharapkan:
# SO.2026.04.01004: Menunggu diproses ✓
# SO.2026.04.01003: Menunggu diproses ✓
# SO.2026.04.00998: Terproses ✓
# SO.2026.04.00997: Terproses ✓
```

---

## 🔄 Step 9: Monitor Aplikasi

```bash
# Monitor logs real-time
docker-compose logs iware_backend --tail 50 --follow

# Di terminal lain, cek resource usage
docker stats iware_backend

# Output contoh:
# CONTAINER ID   NAME            CPU %   MEM USAGE / LIMIT   MEM %
# abc123def456   iware_backend   0.5%    150MiB / 2GiB      7.5%

# Cek status semua containers
docker-compose ps

# Pastikan semua status "Up" dan "healthy"
```

---

## 🆘 Troubleshooting

### ❌ Error: "No user with Accurate token found"

**Penyebab:** Token Accurate expired atau tidak ada

**Solusi:**
```bash
# Cek token di database
docker-compose exec iware_db mysql -u iware -pJasadenam66/ iware_warehouse -e "
SELECT user_id, expires_at, is_active 
FROM accurate_tokens 
WHERE is_active = 1 AND expires_at > NOW();
"

# Jika tidak ada hasil atau expired:
# 1. Buka aplikasi web
# 2. Login sebagai admin
# 3. Masuk ke menu "Pengaturan" > "Accurate"
# 4. Klik "Koneksi ke Accurate" dan login ulang
# 5. Jalankan ulang script fix
```

### ❌ Error: "Cannot connect to database"

**Solusi:**
```bash
# Cek container database
docker-compose ps iware_db

# Jika stopped, start ulang
docker-compose start iware_db

# Cek logs database
docker-compose logs iware_db --tail 50

# Test koneksi
docker-compose exec iware_db mysql -u iware -pJasadenam66/ -e "SELECT 1;"
```

### ❌ Error: "Module not found" atau "Cannot find module"

**Solusi:**
```bash
# Masuk ke container
docker-compose exec iware_backend bash

# Install dependencies
npm install

# Keluar
exit

# Restart container
docker-compose restart iware_backend
```

### ❌ Container Restart Terus-menerus

**Solusi:**
```bash
# Cek logs untuk error
docker-compose logs iware_backend --tail 200

# Cek exit code
docker ps -a | grep iware_backend

# Rebuild container jika perlu
docker-compose up -d --build iware_backend
```

### ❌ Script Terlalu Lama / Timeout

**Solusi:** Gunakan screen agar tidak terputus
```bash
# Install screen jika belum ada
apt-get install screen

# Buat session baru
screen -S fix-status

# Jalankan script
docker-compose exec iware_backend node src/scripts/fix-and-resync-sales-orders.js

# Detach dari screen: Ctrl+A lalu D
# Anda bisa logout dari SSH, script tetap jalan

# Untuk kembali ke session
screen -r fix-status

# Lihat semua session
screen -ls
```

### 🔙 Rollback Jika Ada Masalah

```bash
# Restore dari backup
docker-compose exec -T iware_db mysql -u iware -pJasadenam66/ iware_warehouse < ~/backup_fix_status_20260422_143045.sql

# Ganti dengan nama file backup Anda

# Restart backend
docker-compose restart iware_backend

# Cek logs
docker-compose logs iware_backend --tail 50
```

---

## 📊 Hasil yang Diharapkan

### ✅ Database
- Semua status ternormalisasi ke 3 label baku
- Tidak ada status yang aneh/tidak dikenal
- Statistik menunjukkan distribusi yang wajar

### ✅ Aplikasi Web
- Status SO sama dengan Accurate Online
- SO.2026.04.01004: **Menunggu diproses** ✓
- SO.2026.04.01003: **Menunggu diproses** ✓
- SO.2026.04.00998: **Terproses** ✓
- SO.2026.04.00997: **Terproses** ✓

### ✅ Logs
- Tidak ada error di logs
- Sync berjalan normal
- Container status "healthy"

---

## 🎯 Quick Commands (Copy-Paste Semua)

```bash
# === FULL DEPLOYMENT ===

# 1. Login ke VPS
ssh root@[IP_VPS_ANDA]

# 2. Masuk ke direktori project
cd /var/www/gudang

# 3. Backup database
docker-compose exec iware_db mysqldump -u iware -pJasadenam66/ iware_warehouse > ~/backup_fix_status_$(date +%Y%m%d_%H%M%S).sql

# 4. Pull perubahan
git pull origin main

# 5. Restart backend
docker-compose restart iware_backend

# 6. Debug (opsional)
docker-compose exec iware_backend node src/scripts/debug-sales-order-status.js

# 7. Fix + Re-sync
docker-compose exec iware_backend node src/scripts/fix-and-resync-sales-orders.js

# 8. Verifikasi logs
docker-compose logs iware_backend --tail 50

# 9. Cek database
docker-compose exec iware_db mysql -u iware -pJasadenam66/ iware_warehouse -e "
SELECT status, COUNT(*) as jumlah 
FROM sales_orders 
WHERE is_active = 1 
GROUP BY status;
"

# SELESAI! ✅
```

---

## 📝 Checklist Deploy

```
[ ] Login ke VPS
[ ] Cek container yang berjalan (docker-compose ps)
[ ] Backup database
[ ] Pull perubahan dari Git
[ ] Restart backend container
[ ] Debug status (opsional)
[ ] Jalankan fix + re-sync
[ ] Verifikasi logs (tidak ada error)
[ ] Verifikasi database (3 status baku)
[ ] Verifikasi aplikasi web (sama dengan Accurate)
[ ] Monitor 5-10 menit
[ ] Dokumentasikan hasil
```

---

## 📞 Support

Jika ada masalah:

1. **Cek logs**: `docker-compose logs iware_backend --tail 100`
2. **Cek database**: `docker-compose exec iware_db mysql -u iware -pJasadenam66/ iware_warehouse`
3. **Cek container**: `docker-compose ps`
4. **Masuk ke container**: `docker-compose exec iware_backend bash`
5. **Rollback**: Restore dari backup
6. **Screenshot error** dan kirim ke tim development

---

## 📅 Informasi Deploy

- **Tanggal**: 22 April 2026
- **Server**: VPS KMV 2 (srv1565221)
- **Deployment**: Docker Compose
- **Container Database**: iware_db
- **Container Backend**: iware_backend
- **Database**: iware_warehouse
- **User**: iware
- **Perubahan**: Fix status Sales Order mapping
- **Estimasi Waktu**: 10-15 menit
- **Downtime**: 0 menit (zero downtime)
- **Rollback Plan**: Restore dari backup database

---

## 🎉 Selesai!

Setelah mengikuti panduan ini:
- ✅ Status Sales Order sudah sesuai dengan Accurate
- ✅ Mapping status lebih lengkap dan robust
- ✅ Data sudah di-sync ulang dari Accurate
- ✅ Aplikasi berjalan normal tanpa error

**Selamat! Deploy berhasil!** 🚀

---

**Dibuat untuk VPS KMV 2 dengan Docker Compose**  
**Last Updated: 22 April 2026**
