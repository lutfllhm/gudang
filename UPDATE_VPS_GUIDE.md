# Panduan Update Sync Interval di VPS

Panduan ini menjelaskan cara mengupdate konfigurasi sync interval dari 5 menit menjadi 1 menit di VPS.

---

## 📋 Pilihan Metode

Ada 3 cara untuk update:

1. **Via SQL Script** (Paling Mudah & Recommended) ✅
2. **Via Git Pull + SQL** (Jika menggunakan Git)
3. **Manual via MySQL Client**

---

## ✅ Metode 1: Via SQL Script (Recommended)

### Step 1: Upload File SQL ke VPS

Gunakan SCP atau SFTP untuk upload file:

```bash
# Dari komputer lokal, upload file SQL ke VPS
scp backend/database/update-sync-interval.sql user@your-vps-ip:/path/to/app/backend/database/

# Contoh:
scp backend/database/update-sync-interval.sql root@192.168.1.100:/var/www/iware/backend/database/
```

Atau jika menggunakan FileZilla/WinSCP:
1. Connect ke VPS
2. Navigate ke folder `/var/www/iware/backend/database/` (sesuaikan path Anda)
3. Upload file `update-sync-interval.sql`

### Step 2: SSH ke VPS

```bash
ssh user@your-vps-ip

# Contoh:
ssh root@192.168.1.100
```

### Step 3: Jalankan SQL Script

#### Jika MySQL/MariaDB Standalone:

```bash
# Masuk ke folder aplikasi
cd /var/www/iware

# Jalankan SQL script
mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql

# Masukkan password MySQL saat diminta
```

#### Jika Menggunakan Docker:

```bash
# Masuk ke folder aplikasi
cd /var/www/iware

# Jalankan SQL script via Docker
docker exec -i $(docker ps -qf "name=mysql") mysql -u root -p'your_mysql_password' iware_warehouse < backend/database/update-sync-interval.sql

# Atau jika nama container spesifik:
docker exec -i iware_mysql mysql -u root -p'your_mysql_password' iware_warehouse < backend/database/update-sync-interval.sql
```

### Step 4: Verifikasi Perubahan

```bash
# Cek apakah interval sudah berubah
mysql -u root -p iware_warehouse -e "SELECT auto_sync_enabled, sync_interval_seconds, CONCAT(FLOOR(sync_interval_seconds / 60), ' menit') as interval FROM sync_config WHERE id = 1;"

# Atau via Docker:
docker exec -i iware_mysql mysql -u root -p'your_mysql_password' iware_warehouse -e "SELECT auto_sync_enabled, sync_interval_seconds FROM sync_config WHERE id = 1;"
```

Output yang diharapkan:
```
+-------------------+-----------------------+----------+
| auto_sync_enabled | sync_interval_seconds | interval |
+-------------------+-----------------------+----------+
|                 1 |                    60 | 1 menit  |
+-------------------+-----------------------+----------+
```

### Step 5: Restart Backend

```bash
# Jika menggunakan PM2:
pm2 restart backend
# atau
pm2 restart all

# Jika menggunakan Docker Compose:
docker-compose restart backend

# Jika menggunakan systemd:
sudo systemctl restart iware-backend
```

### Step 6: Verifikasi Auto Sync Berjalan

```bash
# Cek log untuk memastikan auto sync berjalan dengan interval baru
tail -f /var/www/iware/backend/logs/all-*.log | grep -i "auto sync"

# Atau jika menggunakan PM2:
pm2 logs backend | grep -i "auto sync"

# Atau jika menggunakan Docker:
docker logs -f iware_backend | grep -i "auto sync"
```

Log yang diharapkan:
```
[INFO] Starting auto sync { interval: 60, cronExpression: '*/1 * * * *' }
[INFO] Auto sync started successfully
```

---

## 🔄 Metode 2: Via Git Pull + SQL

Jika aplikasi Anda menggunakan Git:

### Step 1: SSH ke VPS

```bash
ssh user@your-vps-ip
```

### Step 2: Pull Update dari Git

```bash
# Masuk ke folder aplikasi
cd /var/www/iware

# Backup dulu (optional tapi recommended)
cp backend/database/schema.sql backend/database/schema.sql.backup

# Pull update terbaru
git pull origin main
# atau
git pull origin master
```

### Step 3: Jalankan SQL Script

```bash
# Jalankan update script
mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql

# Atau via Docker:
docker exec -i iware_mysql mysql -u root -p'password' iware_warehouse < backend/database/update-sync-interval.sql
```

### Step 4: Restart Backend

```bash
pm2 restart backend
# atau
docker-compose restart backend
```

---

## 🔧 Metode 3: Manual via MySQL Client

Jika Anda lebih suka manual:

### Step 1: SSH ke VPS

```bash
ssh user@your-vps-ip
```

### Step 2: Masuk ke MySQL

```bash
# Jika MySQL standalone:
mysql -u root -p iware_warehouse

# Jika menggunakan Docker:
docker exec -it iware_mysql mysql -u root -p iware_warehouse
```

### Step 3: Jalankan Query Manual

```sql
-- Update sync interval menjadi 1 menit (60 detik)
UPDATE sync_config 
SET sync_interval_seconds = 60,
    auto_sync_enabled = TRUE
WHERE id = 1;

-- Verifikasi perubahan
SELECT 
    id,
    auto_sync_enabled,
    sync_interval_seconds,
    CONCAT(FLOOR(sync_interval_seconds / 60), ' menit ', MOD(sync_interval_seconds, 60), ' detik') as interval_readable,
    last_sync_items,
    last_sync_sales_orders,
    last_sync_status
FROM sync_config 
WHERE id = 1;

-- Keluar dari MySQL
EXIT;
```

### Step 4: Restart Backend

```bash
pm2 restart backend
# atau
docker-compose restart backend
```

---

## 🐳 Khusus untuk Docker Compose

Jika menggunakan Docker Compose, ada cara lebih mudah:

### Step 1: Update File di VPS

```bash
# SSH ke VPS
ssh user@your-vps-ip

# Masuk ke folder aplikasi
cd /var/www/iware

# Edit file langsung atau upload via SCP
nano backend/database/update-sync-interval.sql
# Paste isi file, lalu Ctrl+X, Y, Enter
```

### Step 2: Jalankan SQL via Docker

```bash
# Cari nama container MySQL
docker ps | grep mysql

# Jalankan SQL script
cat backend/database/update-sync-interval.sql | docker exec -i <mysql_container_name> mysql -u root -p'password' iware_warehouse

# Contoh:
cat backend/database/update-sync-interval.sql | docker exec -i iware_mysql mysql -u root -pMySecretPassword123 iware_warehouse
```

### Step 3: Restart Backend Container

```bash
docker-compose restart backend

# Atau restart semua:
docker-compose restart
```

---

## 📊 Monitoring Setelah Update

### 1. Cek Konfigurasi Sync

```bash
# Via MySQL
mysql -u root -p iware_warehouse -e "SELECT * FROM sync_config WHERE id = 1;"

# Via Docker
docker exec iware_mysql mysql -u root -p'password' iware_warehouse -e "SELECT * FROM sync_config WHERE id = 1;"
```

### 2. Cek Log Auto Sync

```bash
# Standalone
tail -f /var/www/iware/backend/logs/all-*.log | grep -i sync

# PM2
pm2 logs backend --lines 50 | grep -i sync

# Docker
docker logs -f iware_backend --tail 50 | grep -i sync
```

### 3. Cek Sync History

```sql
-- Via MySQL client
SELECT 
    sync_type,
    status,
    records_synced,
    started_at,
    completed_at,
    duration_seconds
FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 10;
```

### 4. Monitor Real-time

```bash
# Watch sync logs real-time
watch -n 5 'mysql -u root -p"password" iware_warehouse -e "SELECT last_sync_sales_orders, last_sync_status FROM sync_config WHERE id = 1;"'

# Atau via Docker:
watch -n 5 'docker exec iware_mysql mysql -u root -p"password" iware_warehouse -e "SELECT last_sync_sales_orders, last_sync_status FROM sync_config WHERE id = 1;"'
```

---

## 🔍 Troubleshooting

### Problem: File SQL tidak ditemukan

**Solusi:**
```bash
# Cek lokasi file
ls -la backend/database/update-sync-interval.sql

# Jika tidak ada, buat manual:
cat > backend/database/update-sync-interval.sql << 'EOF'
UPDATE sync_config 
SET sync_interval_seconds = 60,
    auto_sync_enabled = TRUE
WHERE id = 1;

SELECT 
    auto_sync_enabled,
    sync_interval_seconds,
    CONCAT(FLOOR(sync_interval_seconds / 60), ' menit') as interval_readable
FROM sync_config 
WHERE id = 1;
EOF
```

### Problem: Permission denied

**Solusi:**
```bash
# Berikan permission
chmod 644 backend/database/update-sync-interval.sql

# Atau jalankan dengan sudo
sudo mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql
```

### Problem: MySQL password tidak diketahui

**Solusi:**
```bash
# Cek password di .env
cat .env | grep DB_PASSWORD

# Atau cek di docker-compose.yml
cat docker-compose.yml | grep MYSQL_ROOT_PASSWORD
```

### Problem: Auto sync tidak berjalan setelah restart

**Solusi:**
```bash
# 1. Cek apakah backend benar-benar restart
pm2 status
# atau
docker ps

# 2. Cek log error
tail -f backend/logs/error-*.log

# 3. Cek konfigurasi database
mysql -u root -p iware_warehouse -e "SELECT * FROM sync_config;"

# 4. Restart ulang dengan force
pm2 restart backend --update-env
# atau
docker-compose down && docker-compose up -d
```

---

## ✅ Checklist Update

- [ ] Backup database (optional tapi recommended)
- [ ] Upload/buat file `update-sync-interval.sql` di VPS
- [ ] Jalankan SQL script
- [ ] Verifikasi perubahan di database
- [ ] Restart backend service
- [ ] Cek log untuk memastikan auto sync berjalan
- [ ] Monitor sync logs selama 5-10 menit
- [ ] Verifikasi data di schedule TV terupdate

---

## 📝 Quick Commands Cheat Sheet

```bash
# Upload file ke VPS
scp backend/database/update-sync-interval.sql user@vps:/path/to/app/backend/database/

# SSH ke VPS
ssh user@vps-ip

# Jalankan SQL (Standalone)
mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql

# Jalankan SQL (Docker)
docker exec -i iware_mysql mysql -u root -p'password' iware_warehouse < backend/database/update-sync-interval.sql

# Restart Backend (PM2)
pm2 restart backend

# Restart Backend (Docker)
docker-compose restart backend

# Cek Log
tail -f backend/logs/all-*.log | grep -i sync

# Verifikasi
mysql -u root -p iware_warehouse -e "SELECT * FROM sync_config WHERE id = 1;"
```

---

## 🆘 Butuh Bantuan?

Jika masih ada masalah:

1. Screenshot error message
2. Cek log: `backend/logs/error-*.log`
3. Cek status service: `pm2 status` atau `docker ps`
4. Cek database connection: `mysql -u root -p iware_warehouse -e "SELECT 1;"`

---

**Setelah update berhasil, auto sync akan berjalan setiap 1 menit dan perubahan status di Accurate akan terdeteksi maksimal dalam 1.5 menit!** 🚀
