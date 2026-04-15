# Quick Update Guide - Sync Interval

Panduan singkat untuk update sync interval di VPS.

---

## 🚀 Cara Tercepat (Copy-Paste)

### 1. Upload File SQL ke VPS

**Dari komputer lokal:**
```bash
scp backend/database/update-sync-interval.sql user@your-vps-ip:/path/to/app/backend/database/
```

### 2. SSH ke VPS & Jalankan

**SSH:**
```bash
ssh user@your-vps-ip
cd /path/to/app
```

**Jalankan SQL:**

**Jika Standalone MySQL:**
```bash
mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql
```

**Jika Docker:**
```bash
# Cari nama container MySQL
docker ps | grep mysql

# Jalankan SQL (ganti 'password' dengan password MySQL Anda)
cat backend/database/update-sync-interval.sql | docker exec -i <mysql_container_name> mysql -u root -p'password' iware_warehouse
```

### 3. Restart Backend

**PM2:**
```bash
pm2 restart backend
```

**Docker:**
```bash
docker-compose restart backend
```

### 4. Verifikasi

```bash
# Cek konfigurasi
mysql -u root -p iware_warehouse -e "SELECT sync_interval_seconds FROM sync_config WHERE id = 1;"

# Atau via Docker:
docker exec <mysql_container> mysql -u root -p'password' iware_warehouse -e "SELECT sync_interval_seconds FROM sync_config WHERE id = 1;"

# Cek log
tail -f backend/logs/all-*.log | grep -i "auto sync"
```

**Output yang diharapkan:**
- `sync_interval_seconds = 60`
- Log: `Starting auto sync { interval: 60, cronExpression: '*/1 * * * *' }`

---

## 🔧 Alternatif: Manual Query

Jika tidak bisa upload file, jalankan query manual:

```bash
# Masuk MySQL
mysql -u root -p iware_warehouse
# atau via Docker:
docker exec -it <mysql_container> mysql -u root -p iware_warehouse
```

```sql
-- Update interval
UPDATE sync_config SET sync_interval_seconds = 60, auto_sync_enabled = TRUE WHERE id = 1;

-- Verifikasi
SELECT sync_interval_seconds, auto_sync_enabled FROM sync_config WHERE id = 1;

-- Keluar
EXIT;
```

Lalu restart backend.

---

## 📋 Checklist

- [ ] Upload file SQL ke VPS
- [ ] Jalankan SQL script
- [ ] Restart backend
- [ ] Verifikasi di database (60 detik)
- [ ] Cek log auto sync berjalan
- [ ] Test: ubah status di Accurate, tunggu 1-2 menit, cek schedule TV

---

## ⚡ One-Liner Commands

**Upload + Execute + Restart (Standalone):**
```bash
scp backend/database/update-sync-interval.sql user@vps:/tmp/ && \
ssh user@vps "mysql -u root -p iware_warehouse < /tmp/update-sync-interval.sql && pm2 restart backend"
```

**Upload + Execute + Restart (Docker):**
```bash
scp backend/database/update-sync-interval.sql user@vps:/tmp/ && \
ssh user@vps "cat /tmp/update-sync-interval.sql | docker exec -i mysql_container mysql -u root -p'password' iware_warehouse && docker-compose restart backend"
```

---

## 🆘 Troubleshooting

**Problem:** File tidak ditemukan
```bash
# Buat file manual di VPS
cat > backend/database/update-sync-interval.sql << 'EOF'
UPDATE sync_config SET sync_interval_seconds = 60, auto_sync_enabled = TRUE WHERE id = 1;
SELECT * FROM sync_config WHERE id = 1;
EOF
```

**Problem:** Permission denied
```bash
sudo mysql -u root -p iware_warehouse < backend/database/update-sync-interval.sql
```

**Problem:** Auto sync tidak jalan
```bash
# Cek log error
tail -f backend/logs/error-*.log

# Restart dengan force
pm2 restart backend --update-env
# atau
docker-compose down && docker-compose up -d
```

---

## ✅ Hasil Akhir

Setelah update berhasil:
- ✅ Auto sync berjalan setiap **1 menit** (bukan 5 menit)
- ✅ Perubahan status di Accurate terdeteksi dalam **max 1.5 menit**
- ✅ Schedule TV update lebih cepat
- ✅ Kombinasi dengan webhook = update **real-time** (~30 detik)

---

**Selesai! 🎉**
