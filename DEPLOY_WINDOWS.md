# Deploy Histori Faktur Penjualan - Windows Guide

Jika Anda menggunakan Windows dan tidak bisa menjalankan bash script, ikuti langkah manual ini.

## Prerequisites

- PuTTY atau Windows Terminal dengan SSH
- WinSCP atau command line SCP
- Akses ke VPS: root@212.85.26.166

## Langkah 1: Connect ke VPS

### Menggunakan Windows Terminal / PowerShell
```powershell
ssh root@212.85.26.166
```

### Menggunakan PuTTY
- Host: 212.85.26.166
- Port: 22
- Username: root
- Password: [your password]

## Langkah 2: Backup Database (di VPS)

```bash
cd /root/accurate-sync/backend
docker-compose exec db mysqldump -u root -p accurate_sync > backup_$(date +%Y%m%d).sql
```

Masukkan password MySQL saat diminta.

## Langkah 3: Upload Files ke VPS

### Opsi A: Menggunakan WinSCP (GUI)

1. Download WinSCP: https://winscp.net/
2. Connect ke VPS:
   - Host: 212.85.26.166
   - Username: root
   - Password: [your password]
3. Upload files berikut:

**Database Migration:**
- Local: `backend/database/add-sales-invoice-history.sql`
- Remote: `/root/accurate-sync/backend/database/add-sales-invoice-history.sql`

**Controllers:**
- Local: `backend/src/controllers/SalesInvoiceHistoryController.js`
- Remote: `/root/accurate-sync/backend/src/controllers/SalesInvoiceHistoryController.js`

**Models:**
- Local: `backend/src/models/SalesInvoiceHistory.js`
- Remote: `/root/accurate-sync/backend/src/models/SalesInvoiceHistory.js`

**Services:**
- Local: `backend/src/services/CustomerService.js`
- Remote: `/root/accurate-sync/backend/src/services/CustomerService.js`

- Local: `backend/src/services/SyncService.js`
- Remote: `/root/accurate-sync/backend/src/services/SyncService.js`

**Routes:**
- Local: `backend/src/routes/salesInvoiceHistory.js`
- Remote: `/root/accurate-sync/backend/src/routes/salesInvoiceHistory.js`

### Opsi B: Menggunakan PowerShell SCP

Buka PowerShell di folder project Anda, lalu jalankan:

```powershell
# Database migration
scp backend/database/add-sales-invoice-history.sql root@212.85.26.166:/root/accurate-sync/backend/database/

# Controllers
scp backend/src/controllers/SalesInvoiceHistoryController.js root@212.85.26.166:/root/accurate-sync/backend/src/controllers/

# Models
scp backend/src/models/SalesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/models/

# Services
scp backend/src/services/CustomerService.js root@212.85.26.166:/root/accurate-sync/backend/src/services/
scp backend/src/services/SyncService.js root@212.85.26.166:/root/accurate-sync/backend/src/services/

# Routes
scp backend/src/routes/salesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/routes/
```

## Langkah 4: Run Database Migration (di VPS)

```bash
cd /root/accurate-sync/backend

# Get MySQL password from .env
cat .env | grep MYSQL_ROOT_PASSWORD

# Run migration (ganti YOUR_PASSWORD dengan password dari .env)
docker-compose exec -T db mysql -u root -pYOUR_PASSWORD accurate_sync < database/add-sales-invoice-history.sql
```

Atau jika command di atas tidak berhasil:

```bash
docker-compose exec db mysql -u root -p accurate_sync
# Masukkan password saat diminta
# Lalu di MySQL prompt:
source /database/add-sales-invoice-history.sql;
exit;
```

## Langkah 5: Restart Backend (di VPS)

```bash
cd /root/accurate-sync
docker-compose restart backend
```

## Langkah 6: Verify Deployment (di VPS)

### Check Container Status
```bash
docker-compose ps
```

Output harus menunjukkan backend dalam status "Up".

### Check Logs
```bash
docker-compose logs --tail=50 backend
```

Pastikan tidak ada error.

### Check Database Table
```bash
cd backend
docker-compose exec db mysql -u root -p accurate_sync -e "SHOW TABLES LIKE 'sales_invoice_history';"
```

Harus menampilkan tabel `sales_invoice_history`.

### Check Records
```bash
docker-compose exec db mysql -u root -p accurate_sync -e "SELECT COUNT(*) FROM sales_invoice_history;"
```

## Langkah 7: Test API

### Get Token

Buka PowerShell atau Command Prompt:

```powershell
# Login
curl -X POST http://212.85.26.166:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"your_password\"}'
```

Simpan token dari response.

### Test Get Recent History

```powershell
curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=10" `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Manual Sync

```powershell
curl -X POST http://212.85.26.166:3000/api/sales-invoice-history/sync `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\",\"pageSize\":100}'
```

## Troubleshooting

### Error: "Permission denied"
Pastikan Anda login sebagai root atau user dengan sudo privileges.

### Error: "docker-compose: command not found"
```bash
# Check if docker-compose installed
which docker-compose

# If not, install it
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Error: "Table already exists"
Tabel sudah ada, skip migration atau drop table dulu:
```bash
docker-compose exec db mysql -u root -p accurate_sync -e "DROP TABLE IF EXISTS sales_invoice_history;"
```
Lalu run migration lagi.

### Backend tidak restart
```bash
# Stop dan start ulang
docker-compose stop backend
docker-compose start backend

# Atau rebuild
docker-compose up -d --build backend
```

### Tidak bisa connect ke VPS
- Check firewall: Port 22 (SSH) harus terbuka
- Check credentials: Username dan password benar
- Check network: Pastikan VPS online

## Alternative: Git Bash di Windows

Jika Anda punya Git Bash, Anda bisa menjalankan bash script:

```bash
# Buka Git Bash
cd /path/to/project

# Make executable
chmod +x deploy-invoice-history.sh

# Run
./deploy-invoice-history.sh
```

## Selesai!

Setelah semua langkah selesai, histori faktur penjualan sudah terintegrasi dengan Accurate di VPS Anda.

### Endpoints yang tersedia:
```
GET  http://212.85.26.166:3000/api/sales-invoice-history/recent
GET  http://212.85.26.166:3000/api/sales-invoice-history/order/:orderId
GET  http://212.85.26.166:3000/api/sales-invoice-history/so/:soId
GET  http://212.85.26.166:3000/api/sales-invoice-history/status/:status
POST http://212.85.26.166:3000/api/sales-invoice-history/sync
```

### Monitoring
```bash
# Check logs
ssh root@212.85.26.166
cd /root/accurate-sync
docker-compose logs -f backend | grep -i "invoice\|history"
```

---

**Butuh bantuan?** Lihat dokumentasi lengkap di `INVOICE_HISTORY_INTEGRATION.md`
