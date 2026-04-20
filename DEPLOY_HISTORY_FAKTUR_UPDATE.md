# Deployment Guide: Sales Invoice History Feature

## Overview
Fitur ini menambahkan kemampuan untuk menampilkan **history perubahan faktur penjualan** dari Accurate Online. Khususnya untuk sales order dengan status **"Sebagian diproses"**, sistem akan menampilkan informasi siapa yang membuat/mengubah faktur tersebut (contoh: "Nur gudang admin").

## Fitur yang Ditambahkan

### 1. Database
- **Tabel baru**: `sales_invoice_history`
  - Menyimpan history perubahan faktur penjualan
  - Mencatat siapa yang membuat/mengubah (modified_by)
  - Menyimpan data lengkap dari Accurate untuk referensi
  
- **View baru**: `v_sales_invoice_history`
  - Menggabungkan data history dengan sales orders
  - Memudahkan query untuk menampilkan history

### 2. Backend API

#### New Endpoints:
```
GET  /api/sales-invoice-history/order/:orderId    - Get history by sales order ID
GET  /api/sales-invoice-history/so/:soId          - Get history by SO ID (Accurate)
GET  /api/sales-invoice-history/recent            - Get recent history
GET  /api/sales-invoice-history/status/:status    - Get history by status
POST /api/sales-invoice-history/sync              - Sync history from Accurate
```

#### New Services:
- **CustomerService**: Service untuk mengambil data customer dari Accurate API
- **SalesInvoiceHistory Model**: Model untuk manage history data

#### Updated:
- **SalesOrderController**: Sekarang mengembalikan `invoiceHistory` saat get by ID

### 3. Frontend

#### New Components:
- **SalesInvoiceHistory.jsx**: Komponen untuk menampilkan history di bawah status

#### Updated:
- **SalesOrdersPage.jsx**: Menampilkan history untuk order dengan status "Sebagian diproses"

## Deployment Steps

### Step 1: Database Migration

```bash
# Masuk ke MySQL
mysql -u root -p

# Jalankan migration
source backend/database/add-sales-invoice-history.sql
```

Atau via Docker:
```bash
docker exec -i iware-mysql mysql -u root -p[PASSWORD] iware_warehouse < backend/database/add-sales-invoice-history.sql
```

### Step 2: Install Dependencies (jika ada yang baru)

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 3: Restart Backend

```bash
# Development
cd backend
npm run dev

# Production (PM2)
pm2 restart iware-backend
```

### Step 4: Rebuild Frontend

```bash
cd frontend
npm run build

# Jika menggunakan Docker
docker-compose up -d --build frontend
```

### Step 5: Sync Invoice History (Optional)

Setelah deployment, Anda bisa sync history dari Accurate:

```bash
# Via API (gunakan Postman atau curl)
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-04-20",
    "pageSize": 100
  }'
```

## Cara Kerja

### 1. Sync Process
Ketika sync dijalankan:
1. System mengambil data customer dari Accurate (`/api/customer/list.do`)
2. Untuk setiap customer, cari sales orders terkait
3. Ambil detail sales order dari Accurate (`/api/sales-order/detail.do`)
4. Extract informasi user yang mengubah (modifiedBy, createdBy, userName)
5. Simpan ke tabel `sales_invoice_history` jika status "Sebagian diproses"

### 2. Display Logic
Di frontend:
1. Komponen `SalesInvoiceHistory` hanya muncul untuk status "Sebagian diproses"
2. Menampilkan history terbaru (yang pertama)
3. Format: "Buat Faktur Penjualan [nomor] oleh [nama user]"
4. Ditampilkan di bawah badge status dengan styling khusus

### 3. Data Flow
```
Accurate API → CustomerService → SalesInvoiceHistory Model → Database
                                                              ↓
Frontend ← API Response ← SalesInvoiceHistoryController ← Database
```

## API Integration dengan Accurate

### Endpoint yang Digunakan:

1. **GET /api/customer/list.do**
   - Mengambil daftar customer
   - Parameter: `sp.page`, `sp.pageSize`, `filter`
   - Response: Array of customers

2. **GET /api/customer/detail.do**
   - Mengambil detail customer
   - Parameter: `id`
   - Response: Customer detail object

3. **GET /api/sales-order/detail.do**
   - Mengambil detail sales order
   - Parameter: `id`
   - Response: Sales order detail dengan info user

### Data yang Diambil dari Accurate:
```javascript
{
  "modifiedBy": "Nur gudang admin",      // Nama user yang mengubah
  "modifiedById": "123",                  // ID user
  "documentStatus": {
    "name": "Sebagian diproses"
  },
  "number": "SI.2026.04.00674",          // Nomor faktur
  "transDate": "10/04/2026",             // Tanggal transaksi
  // ... data lainnya
}
```

## Testing

### 1. Test Database
```sql
-- Cek tabel sudah dibuat
SHOW TABLES LIKE 'sales_invoice_history';

-- Cek struktur tabel
DESCRIBE sales_invoice_history;

-- Cek view
SELECT * FROM v_sales_invoice_history LIMIT 5;
```

### 2. Test Backend API
```bash
# Test get history by SO ID
curl http://localhost:5000/api/sales-invoice-history/so/[SO_ID] \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test sync
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2026-03-01", "endDate": "2026-04-20"}'
```

### 3. Test Frontend
1. Login ke aplikasi
2. Buka halaman Sales Orders
3. Cari order dengan status "Sebagian diproses"
4. Verifikasi history muncul di bawah status badge
5. Format harus: "Buat Faktur Penjualan [nomor] oleh [nama user]"

## Troubleshooting

### History tidak muncul?
1. Cek apakah status order adalah "Sebagian diproses"
2. Cek apakah ada data di tabel `sales_invoice_history`
3. Jalankan sync manual via API
4. Cek log backend untuk error

### Sync gagal?
1. Cek koneksi ke Accurate API
2. Cek token Accurate masih valid
3. Cek log backend: `backend/logs/accurate-[date].log`
4. Verifikasi API endpoint Accurate tersedia

### Data tidak akurat?
1. Cek mapping field dari Accurate response
2. Update `CustomerService.syncInvoiceHistory()` jika perlu
3. Cek format data di `accurate_data` JSON field

## Maintenance

### Cleanup Old History
```sql
-- Hapus history lebih dari 90 hari
DELETE FROM sales_invoice_history 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

Atau via API (bisa dijadwalkan):
```javascript
// Di backend, tambahkan cron job
const SalesInvoiceHistory = require('./models/SalesInvoiceHistory');
await SalesInvoiceHistory.deleteOlderThan(90); // 90 hari
```

## Notes

1. **Rate Limiting**: Sync process mengikuti rate limit Accurate (8 req/sec, 8 parallel)
2. **Performance**: History hanya di-load untuk order dengan status "Sebagian diproses"
3. **Storage**: JSON field `accurate_data` menyimpan full response untuk debugging
4. **Future Enhancement**: 
   - Bisa ditambahkan modal untuk show all history
   - Bisa ditambahkan filter by user
   - Bisa ditambahkan export history to Excel

## Rollback Plan

Jika ada masalah:

```sql
-- Drop tabel dan view
DROP VIEW IF EXISTS v_sales_invoice_history;
DROP TABLE IF EXISTS sales_invoice_history;
```

```bash
# Revert backend code
git revert [commit-hash]

# Restart services
pm2 restart iware-backend
```

## Contact

Jika ada pertanyaan atau issue, hubungi tim development.

---
**Last Updated**: 2026-04-20
**Version**: 1.0.0
