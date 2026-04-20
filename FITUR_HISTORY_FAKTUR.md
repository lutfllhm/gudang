# Fitur History Faktur Penjualan

## Deskripsi

Fitur ini menampilkan **history perubahan faktur penjualan** dari Accurate Online pada aplikasi iWare Warehouse. Khususnya untuk sales order dengan status **"Sebagian diproses"**, sistem akan menampilkan informasi siapa yang membuat/mengubah faktur tersebut.

### Contoh Tampilan:

```
Status: [Sebagian diproses]
┗━ 👤 Buat Faktur Penjualan SI.2026.04.00674 oleh Nur gudang admin
   📅 10 April 2026 14:15
```

## Cara Kerja

### 1. Integrasi dengan Accurate API

Fitur ini menggunakan API Accurate Online:

- **GET /api/customer/list.do** - Mengambil daftar customer
- **GET /api/customer/detail.do** - Mengambil detail customer  
- **GET /api/sales-order/detail.do** - Mengambil detail sales order dengan info user

### 2. Data yang Ditampilkan

Untuk setiap sales order dengan status "Sebagian diproses", sistem menampilkan:

- ✅ Nomor faktur penjualan
- ✅ Nama user yang membuat/mengubah faktur (dari Accurate)
- ✅ Tanggal dan waktu perubahan
- ✅ Deskripsi aksi (contoh: "Buat Faktur Penjualan SI.2026.04.00674")

### 3. Kapan History Muncul?

History **hanya muncul** untuk sales order dengan status:
- "Sebagian diproses"
- "Sebagian terproses"  
- "Partial"
- "Processing"
- "In Progress"

Untuk status lain (Terproses, Menunggu diproses), history tidak ditampilkan.

## Cara Menggunakan

### A. Setup Awal

#### 1. Jalankan Database Migration

**Linux/Mac:**
```bash
cd backend/database
chmod +x run-migration.sh
./run-migration.sh
```

**Windows:**
```bash
cd backend\database
run-migration.bat
```

**Manual (MySQL):**
```bash
mysql -u root -p iware_warehouse < backend/database/add-sales-invoice-history.sql
```

#### 2. Restart Backend

```bash
# Development
cd backend
npm run dev

# Production
pm2 restart iware-backend
```

#### 3. Rebuild Frontend (jika perlu)

```bash
cd frontend
npm run build
```

### B. Sync History dari Accurate

Ada 2 cara untuk sync history:

#### Cara 1: Via API (Manual)

```bash
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-04-20",
    "pageSize": 100
  }'
```

#### Cara 2: Via Script Testing

```bash
cd backend
node src/scripts/test-invoice-history.js
```

### C. Melihat History di Frontend

1. Login ke aplikasi
2. Buka menu **Sales Orders**
3. Cari sales order dengan status **"Sebagian diproses"**
4. History akan muncul di bawah badge status

## API Endpoints

### 1. Get History by Sales Order ID

```http
GET /api/sales-invoice-history/order/:orderId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoice_number": "SI.2026.04.00674",
      "invoice_date": "2026-04-10",
      "action_type": "status_changed",
      "status": "Sebagian diproses",
      "modified_by": "Nur gudang admin",
      "description": "Buat Faktur Penjualan SI.2026.04.00674 oleh Nur gudang admin",
      "created_at": "2026-04-10T14:15:00.000Z"
    }
  ]
}
```

### 2. Get History by SO ID (Accurate ID)

```http
GET /api/sales-invoice-history/so/:soId
Authorization: Bearer {token}
```

### 3. Get Recent History

```http
GET /api/sales-invoice-history/recent?limit=50
Authorization: Bearer {token}
```

### 4. Get History by Status

```http
GET /api/sales-invoice-history/status/Sebagian%20diproses?limit=100
Authorization: Bearer {token}
```

### 5. Sync History from Accurate

```http
POST /api/sales-invoice-history/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2026-03-01",
  "endDate": "2026-04-20",
  "pageSize": 100
}
```

## Database Schema

### Tabel: `sales_invoice_history`

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| sales_order_id | INT | Foreign key ke sales_orders |
| so_id | VARCHAR(50) | ID Sales Order dari Accurate |
| invoice_number | VARCHAR(100) | Nomor faktur penjualan |
| invoice_date | DATE | Tanggal faktur |
| action_type | VARCHAR(50) | Tipe aksi (created, updated, status_changed) |
| status | VARCHAR(100) | Status faktur |
| modified_by | VARCHAR(255) | Nama user yang mengubah |
| modified_by_id | VARCHAR(50) | ID user yang mengubah |
| description | TEXT | Deskripsi perubahan |
| accurate_data | JSON | Data lengkap dari Accurate |
| created_at | TIMESTAMP | Waktu record dibuat |

### View: `v_sales_invoice_history`

View yang menggabungkan data history dengan sales orders untuk kemudahan query.

## Troubleshooting

### History tidak muncul?

**Kemungkinan penyebab:**

1. ✅ **Status bukan "Sebagian diproses"**
   - History hanya muncul untuk status ini
   - Cek status di database: `SELECT status FROM sales_orders WHERE id = ?`

2. ✅ **Belum ada data history**
   - Jalankan sync: `POST /api/sales-invoice-history/sync`
   - Cek data: `SELECT * FROM sales_invoice_history`

3. ✅ **Frontend tidak load komponen**
   - Cek console browser untuk error
   - Pastikan `SalesInvoiceHistory.jsx` sudah di-import
   - Clear cache browser

### Sync gagal?

**Kemungkinan penyebab:**

1. ✅ **Token Accurate expired**
   - Reconnect Accurate di Settings
   - Cek: `SELECT * FROM accurate_tokens WHERE is_active = 1`

2. ✅ **Rate limit exceeded**
   - Tunggu beberapa detik
   - Kurangi `pageSize` di request sync

3. ✅ **API Accurate error**
   - Cek log: `backend/logs/accurate-[date].log`
   - Verifikasi endpoint tersedia di dokumentasi Accurate

### Data tidak akurat?

**Solusi:**

1. ✅ **Cek mapping field**
   - Lihat `CustomerService.syncInvoiceHistory()`
   - Update mapping jika struktur response Accurate berubah

2. ✅ **Cek data mentah**
   - Query: `SELECT accurate_data FROM sales_invoice_history WHERE id = ?`
   - Bandingkan dengan response Accurate API

3. ✅ **Re-sync data**
   - Hapus history lama: `DELETE FROM sales_invoice_history WHERE created_at < '2026-04-01'`
   - Jalankan sync ulang

## Maintenance

### Cleanup Old History

Untuk performa, disarankan hapus history lama secara berkala:

```sql
-- Hapus history lebih dari 90 hari
DELETE FROM sales_invoice_history 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

Atau buat cron job:

```javascript
// Di backend
const cron = require('node-cron');
const SalesInvoiceHistory = require('./models/SalesInvoiceHistory');

// Jalankan setiap hari jam 2 pagi
cron.schedule('0 2 * * *', async () => {
  await SalesInvoiceHistory.deleteOlderThan(90);
});
```

## Pengembangan Lebih Lanjut

### Fitur yang Bisa Ditambahkan:

1. **Modal untuk show all history**
   - Saat ini hanya menampilkan history terbaru
   - Bisa ditambahkan button "Lihat semua" yang membuka modal

2. **Filter by user**
   - Filter history berdasarkan user yang mengubah
   - Berguna untuk audit trail

3. **Export to Excel**
   - Export history ke Excel untuk reporting
   - Include filter by date range, user, status

4. **Real-time notification**
   - Notifikasi saat ada perubahan faktur
   - Menggunakan WebSocket atau polling

5. **History comparison**
   - Bandingkan perubahan antar history
   - Show diff untuk field yang berubah

## Referensi

- [Accurate Online API Documentation](https://accurate.id/api-docs)
- [Deployment Guide](./DEPLOY_HISTORY_FAKTUR_UPDATE.md)
- [Database Schema](./backend/database/schema.sql)

## Support

Jika ada pertanyaan atau issue:

1. Cek log backend: `backend/logs/`
2. Cek log Accurate: `backend/logs/accurate-[date].log`
3. Jalankan test script: `node backend/src/scripts/test-invoice-history.js`
4. Hubungi tim development

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-20  
**Author**: iWare Development Team
