# Integrasi Histori Faktur Penjualan dengan Accurate

## Status Integrasi

✅ **SUDAH TERINTEGRASI**

Histori faktur penjualan sudah terintegrasi dengan Accurate Online API. Sistem dapat:
- Menyimpan histori perubahan faktur penjualan
- Melacak siapa yang membuat/mengubah faktur
- Menyimpan data lengkap dari Accurate
- Menampilkan histori berdasarkan berbagai filter

## Arsitektur

### Database

**Tabel: `sales_invoice_history`**
```sql
- id (INT, PRIMARY KEY)
- sales_order_id (INT) - ID sales order lokal
- so_id (BIGINT) - ID sales order di Accurate
- invoice_number (VARCHAR) - Nomor faktur
- invoice_date (DATE) - Tanggal faktur
- action_type (VARCHAR) - Tipe aksi (status_changed, created, updated)
- status (VARCHAR) - Status faktur
- modified_by (VARCHAR) - Nama user yang mengubah
- modified_by_id (BIGINT) - ID user di Accurate
- description (TEXT) - Deskripsi perubahan
- accurate_data (JSON) - Data lengkap dari Accurate
- created_at (TIMESTAMP)
```

**View: `v_sales_invoice_history`**
- Menggabungkan data history dengan sales order
- Menampilkan nama pelanggan dan status terkini

### Backend Components

#### 1. Model: `SalesInvoiceHistory.js`
**Methods:**
- `create(data)` - Membuat entry history baru
- `getBySalesOrderId(salesOrderId)` - Ambil history berdasarkan order ID lokal
- `getBySoId(soId)` - Ambil history berdasarkan SO ID Accurate
- `getRecent(limit)` - Ambil history terbaru
- `getByStatus(status, limit)` - Ambil history berdasarkan status
- `deleteOlderThan(days)` - Hapus history lama (cleanup)

#### 2. Controller: `SalesInvoiceHistoryController.js`
**Endpoints:**
- `GET /api/sales-invoice-history/order/:orderId` - History by order ID
- `GET /api/sales-invoice-history/so/:soId` - History by SO ID
- `GET /api/sales-invoice-history/recent?limit=50` - Recent history
- `GET /api/sales-invoice-history/status/:status?limit=100` - History by status
- `POST /api/sales-invoice-history/sync` - Manual sync dari Accurate

#### 3. Service: `CustomerService.js`
**Method: `syncInvoiceHistory(userId, options)`**

Proses sync:
1. Ambil daftar customer dari Accurate (dengan filter date range opsional)
2. Untuk setiap customer, cari sales orders terkait
3. Ambil detail sales order dari Accurate
4. Ekstrak informasi user yang mengubah
5. Cek status faktur (fokus pada "Sebagian diproses")
6. Simpan ke database dengan data lengkap

**Parameters:**
```javascript
{
  startDate: "2026-01-01",  // Optional
  endDate: "2026-12-31",    // Optional
  pageSize: 100             // Optional, default 100
}
```

## API Endpoints

### 1. Get Recent History
```bash
GET /api/sales-invoice-history/recent?limit=50
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sales_order_id": 123,
      "so_id": 456789,
      "invoice_number": "INV-2026-001",
      "invoice_date": "2026-04-20",
      "action_type": "status_changed",
      "status": "Sebagian diproses",
      "modified_by": "John Doe",
      "modified_by_id": 12345,
      "description": "Buat Faktur Penjualan INV-2026-001 oleh John Doe",
      "accurate_data": { /* full data */ },
      "created_at": "2026-04-20T10:30:00Z",
      "nama_pelanggan": "PT ABC",
      "current_status": "Sebagian diproses"
    }
  ]
}
```

### 2. Get History by Order ID
```bash
GET /api/sales-invoice-history/order/123
Authorization: Bearer {token}
```

### 3. Get History by SO ID (Accurate)
```bash
GET /api/sales-invoice-history/so/456789
Authorization: Bearer {token}
```

### 4. Get History by Status
```bash
GET /api/sales-invoice-history/status/Sebagian%20diproses?limit=100
Authorization: Bearer {token}
```

### 5. Manual Sync from Accurate
```bash
POST /api/sales-invoice-history/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "pageSize": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "synced": 25
  },
  "message": "Invoice history sync completed"
}
```

## Deployment ke VPS

### Langkah 1: Deploy
```bash
chmod +x deploy-invoice-history.sh
./deploy-invoice-history.sh
```

Script akan:
1. ✓ Check koneksi VPS
2. ✓ Backup database
3. ✓ Upload migration file
4. ✓ Run migration
5. ✓ Upload updated files
6. ✓ Restart backend
7. ✓ Verify deployment

### Langkah 2: Verifikasi
```bash
chmod +x verify-invoice-history.sh
./verify-invoice-history.sh
```

Script akan:
1. ✓ Check database table & view
2. ✓ Check record count
3. ✓ Show recent records
4. ✓ Check backend logs
5. ✓ List API endpoints

### Manual Deployment (Alternatif)

Jika script tidak bisa dijalankan, deploy manual:

```bash
# 1. Connect ke VPS
ssh root@212.85.26.166

# 2. Masuk ke direktori aplikasi
cd /root/accurate-sync

# 3. Backup database
cd backend
docker-compose exec db mysqldump -u root -p accurate_sync > backup_$(date +%Y%m%d).sql

# 4. Upload file dari local (di terminal local)
scp backend/database/add-sales-invoice-history.sql root@212.85.26.166:/root/accurate-sync/backend/database/
scp backend/src/controllers/SalesInvoiceHistoryController.js root@212.85.26.166:/root/accurate-sync/backend/src/controllers/
scp backend/src/models/SalesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/models/
scp backend/src/services/CustomerService.js root@212.85.26.166:/root/accurate-sync/backend/src/services/
scp backend/src/routes/salesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/routes/

# 5. Run migration (di VPS)
cd /root/accurate-sync/backend
docker-compose exec -T db mysql -u root -p accurate_sync < database/add-sales-invoice-history.sql

# 6. Restart backend
cd /root/accurate-sync
docker-compose restart backend

# 7. Check status
docker-compose ps
docker-compose logs --tail=50 backend
```

## Testing

### 1. Test Login & Get Token
```bash
curl -X POST http://212.85.26.166:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

Simpan token dari response.

### 2. Test Get Recent History
```bash
curl -X GET http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Manual Sync
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

### 4. Test Get by Status
```bash
curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/status/Sebagian%20diproses?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Monitoring & Maintenance

### Check Logs
```bash
# Di VPS
cd /root/accurate-sync
docker-compose logs -f backend | grep -i "invoice\|history"
```

### Database Queries
```sql
-- Total records
SELECT COUNT(*) FROM sales_invoice_history;

-- Recent history
SELECT * FROM v_sales_invoice_history 
ORDER BY created_at DESC 
LIMIT 10;

-- History by status
SELECT status, COUNT(*) as count 
FROM sales_invoice_history 
GROUP BY status;

-- History by date range
SELECT * FROM v_sales_invoice_history 
WHERE invoice_date BETWEEN '2026-01-01' AND '2026-12-31'
ORDER BY invoice_date DESC;
```

### Cleanup Old Records
```javascript
// Hapus history lebih dari 90 hari
const SalesInvoiceHistory = require('./src/models/SalesInvoiceHistory');
await SalesInvoiceHistory.deleteOlderThan(90);
```

## Troubleshooting

### Issue: Tidak ada data history
**Solution:**
1. Pastikan ada sales orders dengan status "Sebagian diproses"
2. Jalankan manual sync
3. Check logs untuk error

### Issue: Sync gagal
**Solution:**
1. Check token Accurate masih valid
2. Check koneksi ke Accurate API
3. Check logs: `docker-compose logs backend`

### Issue: Data tidak lengkap
**Solution:**
1. Check field `accurate_data` di database
2. Pastikan API Accurate mengembalikan data lengkap
3. Update CustomerService.syncInvoiceHistory jika perlu

## Integrasi dengan Frontend

Endpoint ini siap digunakan oleh frontend untuk:
- Menampilkan timeline perubahan faktur
- Tracking siapa yang membuat/mengubah faktur
- Audit trail untuk compliance
- Dashboard monitoring

Contoh implementasi di frontend akan tersedia di dokumentasi terpisah.

## Kesimpulan

✅ Histori faktur penjualan **SUDAH TERINTEGRASI** dengan Accurate
✅ Database schema sudah dibuat
✅ Backend API sudah tersedia
✅ Siap untuk deployment ke VPS
✅ Script deployment otomatis tersedia

Jalankan `./deploy-invoice-history.sh` untuk deploy ke VPS Anda.
