# Deployment Guide: Docker & VPS
## Sales Invoice History Feature

Panduan lengkap untuk deploy fitur Sales Invoice History ke VPS menggunakan Docker.

---

## 📋 Prerequisites

- VPS dengan Docker & Docker Compose terinstall
- SSH access ke VPS
- Git terinstall di VPS
- Domain/IP VPS sudah dikonfigurasi

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect ke VPS

```bash
# SSH ke VPS
ssh user@your-vps-ip

# Atau jika menggunakan key
ssh -i /path/to/key.pem user@your-vps-ip
```

### Step 2: Backup Database (PENTING!)

```bash
# Masuk ke direktori project
cd /path/to/iware-warehouse

# Backup database sebelum migration
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau backup semua database
docker exec iware-mysql mysqldump -u root -p --all-databases > backup_all_$(date +%Y%m%d_%H%M%S).sql
```

**SIMPAN FILE BACKUP INI!** Jika ada masalah, Anda bisa restore dengan:
```bash
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup_20260420_143000.sql
```

### Step 3: Pull Latest Code

```bash
# Pull latest code dari repository
git pull origin main

# Atau jika ada conflict, stash dulu
git stash
git pull origin main
git stash pop
```

### Step 4: Database Migration

#### Option A: Via Docker Exec (Recommended)

```bash
# Copy file migration ke container MySQL
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/

# Jalankan migration
docker exec -i iware-mysql mysql -u root -p[PASSWORD] iware_warehouse < /tmp/add-sales-invoice-history.sql

# Atau interactive (akan prompt password)
docker exec -it iware-mysql mysql -u root -p iware_warehouse
```

Kemudian di MySQL prompt:
```sql
source /tmp/add-sales-invoice-history.sql;
exit;
```

#### Option B: Via Script (Alternative)

```bash
# Masuk ke direktori database
cd backend/database

# Jalankan migration script
chmod +x run-migration.sh
./run-migration.sh
```

Saat diminta, masukkan:
- Host: `localhost` (atau IP container MySQL)
- Port: `3306`
- Database: `iware_warehouse`
- User: `root`
- Password: [your MySQL password]

#### Verifikasi Migration

```bash
# Cek tabel sudah dibuat
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';"

# Cek struktur tabel
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; DESCRIBE sales_invoice_history;"

# Cek view
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SHOW CREATE VIEW v_sales_invoice_history;"
```

### Step 5: Rebuild & Restart Containers

#### Option A: Rebuild Semua (Recommended untuk update besar)

```bash
# Stop containers
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Cek logs
docker-compose logs -f backend
```

#### Option B: Restart Backend Saja (Untuk update kecil)

```bash
# Rebuild backend
docker-compose build backend

# Restart backend
docker-compose restart backend

# Cek logs
docker-compose logs -f backend
```

#### Option C: Hot Reload (Jika development mode)

```bash
# Jika backend sudah running dengan volume mount, cukup restart
docker-compose restart backend
```

### Step 6: Rebuild Frontend

```bash
# Rebuild frontend
docker-compose build frontend

# Restart frontend
docker-compose restart frontend

# Atau rebuild tanpa cache
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Step 7: Verifikasi Deployment

#### A. Cek Container Status

```bash
# Cek semua container running
docker-compose ps

# Expected output:
# NAME              STATUS          PORTS
# iware-backend     Up 2 minutes    0.0.0.0:5000->5000/tcp
# iware-frontend    Up 2 minutes    0.0.0.0:3000->80/tcp
# iware-mysql       Up 2 minutes    0.0.0.0:3306->3306/tcp
```

#### B. Cek Backend Logs

```bash
# Cek logs backend
docker-compose logs -f backend

# Cari pesan sukses:
# ✅ Database connected successfully
# 🚀 iWare Warehouse v2.0
# 📡 Server running on port 5000
```

#### C. Test API Health

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {"success":true,"message":"Server is healthy",...}

# Test API health
curl http://localhost:5000/api/health

# Expected response:
# {"success":true,"message":"API is healthy","version":"2.0.0"}
```

#### D. Test New Endpoints

```bash
# 1. Login untuk dapat token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Test get recent history
curl "http://localhost:5000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"success":true,"data":[...]}
```

### Step 8: Test Frontend

```bash
# Akses dari browser
http://your-vps-ip:3000

# Atau jika sudah ada domain
http://your-domain.com
```

**Test checklist:**
- ✅ Login berhasil
- ✅ Buka halaman Sales Orders
- ✅ Cari order dengan status "Sebagian diproses"
- ✅ History muncul di bawah status badge
- ✅ Format: "Buat Faktur Penjualan [nomor] oleh [nama user]"

### Step 9: Sync Invoice History (Optional)

```bash
# Via curl
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-04-20",
    "pageSize": 100
  }'

# Atau via script di container
docker exec -it iware-backend node src/scripts/test-invoice-history.js
```

---

## 🔧 Troubleshooting

### Problem 1: Migration Gagal

**Error:** `Table 'sales_invoice_history' already exists`

**Solution:**
```bash
# Drop table dulu (HATI-HATI!)
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; DROP TABLE IF EXISTS sales_invoice_history;"

# Jalankan migration lagi
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backend/database/add-sales-invoice-history.sql
```

### Problem 2: Backend Tidak Start

**Error:** `Cannot find module './routes/salesInvoiceHistory'`

**Solution:**
```bash
# Cek file ada
ls -la backend/src/routes/salesInvoiceHistory.js

# Jika tidak ada, pull lagi
git pull origin main

# Rebuild container
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Problem 3: Frontend Tidak Update

**Solution:**
```bash
# Clear browser cache
# Atau rebuild frontend tanpa cache
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Cek logs
docker-compose logs frontend
```

### Problem 4: Database Connection Error

**Error:** `ER_ACCESS_DENIED_ERROR` atau `ECONNREFUSED`

**Solution:**
```bash
# Cek MySQL container running
docker-compose ps mysql

# Cek environment variables
docker exec iware-backend env | grep DB_

# Cek koneksi dari backend ke MySQL
docker exec iware-backend ping iware-mysql

# Restart MySQL
docker-compose restart mysql
```

### Problem 5: History Tidak Muncul

**Checklist:**
1. ✅ Cek tabel ada: `SHOW TABLES LIKE 'sales_invoice_history';`
2. ✅ Cek data ada: `SELECT COUNT(*) FROM sales_invoice_history;`
3. ✅ Cek status order: `SELECT status FROM sales_orders WHERE id = ?;`
4. ✅ Jalankan sync: `POST /api/sales-invoice-history/sync`
5. ✅ Cek browser console untuk error
6. ✅ Clear cache browser

---

## 📊 Monitoring

### Cek Logs Real-time

```bash
# All containers
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# MySQL only
docker-compose logs -f mysql

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Cek Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Cleanup unused images
docker system prune -a
```

### Cek Database Size

```bash
docker exec -it iware-mysql mysql -u root -p -e "
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'iware_warehouse'
ORDER BY (data_length + index_length) DESC;
"
```

---

## 🔄 Rollback Plan

Jika ada masalah serius dan perlu rollback:

### Step 1: Stop Containers

```bash
docker-compose down
```

### Step 2: Restore Database

```bash
# Restore dari backup
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup_20260420_143000.sql
```

### Step 3: Revert Code

```bash
# Revert ke commit sebelumnya
git log --oneline  # Cari commit hash sebelum update
git revert [commit-hash]

# Atau reset hard (HATI-HATI!)
git reset --hard [commit-hash]
```

### Step 4: Rebuild & Restart

```bash
docker-compose build
docker-compose up -d
```

---

## 🔐 Security Checklist

- ✅ Backup database sebelum migration
- ✅ Gunakan environment variables untuk credentials
- ✅ Jangan commit `.env` file
- ✅ Update password default
- ✅ Enable firewall di VPS
- ✅ Gunakan HTTPS (SSL/TLS)
- ✅ Rate limiting sudah aktif
- ✅ Regular backup database

---

## 📝 Post-Deployment Checklist

- [ ] Database migration berhasil
- [ ] Backend container running
- [ ] Frontend container running
- [ ] MySQL container running
- [ ] Health check endpoint OK
- [ ] New API endpoints accessible
- [ ] Frontend menampilkan history
- [ ] Sync history berhasil
- [ ] Logs tidak ada error
- [ ] Backup database tersimpan
- [ ] Documentation updated
- [ ] Team notified

---

## 🔗 Useful Commands

### Docker Compose

```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Rebuild and restart
docker-compose up -d --build

# Remove all containers and volumes (HATI-HATI!)
docker-compose down -v
```

### Docker

```bash
# List containers
docker ps -a

# List images
docker images

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Execute command in container
docker exec -it iware-backend bash

# Copy file to container
docker cp file.txt iware-backend:/app/

# Copy file from container
docker cp iware-backend:/app/file.txt ./
```

### MySQL

```bash
# MySQL shell
docker exec -it iware-mysql mysql -u root -p

# Execute SQL file
docker exec -i iware-mysql mysql -u root -p iware_warehouse < file.sql

# Dump database
docker exec iware-mysql mysqldump -u root -p iware_warehouse > dump.sql

# Show databases
docker exec -it iware-mysql mysql -u root -p -e "SHOW DATABASES;"
```

---

## 📞 Support

Jika ada masalah:

1. **Cek logs**: `docker-compose logs -f backend`
2. **Cek database**: `docker exec -it iware-mysql mysql -u root -p`
3. **Test API**: `curl http://localhost:5000/health`
4. **Restart**: `docker-compose restart backend`
5. **Rebuild**: `docker-compose up -d --build`

Jika masih error, hubungi tim development dengan informasi:
- Error message dari logs
- Output dari `docker-compose ps`
- Output dari `docker-compose logs backend`

---

## 📚 References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Node.js Docker Image](https://hub.docker.com/_/node)

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-20  
**Environment**: Docker + VPS
