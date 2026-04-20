# Fitur Tampilan Faktur Penjualan di Schedule

## Deskripsi
Fitur ini menampilkan informasi faktur penjualan (sales invoice) dari Accurate Online pada halaman Schedule untuk Sales Order dengan status "Sebagian diproses". Informasi yang ditampilkan meliputi:
- Nomor faktur penjualan
- Nama user yang membuat faktur (dari Accurate)
- Tanggal faktur dibuat

## Cara Kerja

### Backend
1. **Tabel Database Baru**: `sales_invoices`
   - Menyimpan data faktur penjualan dari Accurate
   - Relasi dengan `sales_orders` melalui `sales_order_id`
   - Kolom penting:
     - `invoice_id`: ID faktur dari Accurate
     - `nomor_faktur`: Nomor faktur penjualan
     - `created_by_name`: Nama user yang membuat faktur
     - `tanggal_faktur`: Tanggal faktur dibuat

2. **API Endpoint Baru**: `GET /api/sales-orders/:soId/invoices`
   - Mengambil data faktur dari Accurate API
   - Menyimpan ke database
   - Mengembalikan list faktur untuk SO tertentu

3. **Service Methods**:
   - `getSalesInvoicesForOrder()`: Ambil faktur dari Accurate API
   - `syncInvoicesForOrder()`: Sync faktur ke database
   - `getInvoicesForOrder()`: Ambil faktur dari database

### Frontend
1. **State Management**:
   - `invoicesData`: Menyimpan data faktur per SO ID
   - `fetchInvoices()`: Fungsi untuk fetch faktur dari API

2. **Tampilan**:
   - Faktur ditampilkan di bawah baris SO dengan status "Sebagian diproses"
   - Format: "Faktur: [nomor] oleh [nama user] [tanggal]"
   - Styling: Border kuning/amber di sebelah kiri, icon dokumen

## Instalasi

### 1. Update Database
Jalankan migration SQL untuk menambahkan tabel baru:

```bash
mysql -u root -p iware_warehouse < backend/database/add-sales-invoices-table.sql
```

Atau jalankan manual di MySQL:
```sql
USE iware_warehouse;

CREATE TABLE IF NOT EXISTS sales_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id VARCHAR(50) UNIQUE NOT NULL,
  sales_order_id INT NOT NULL,
  nomor_faktur VARCHAR(100) NOT NULL,
  tanggal_faktur DATE NOT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'IDR',
  created_by_name VARCHAR(255) COMMENT 'Nama user yang membuat faktur di Accurate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_nomor_faktur (nomor_faktur),
  INDEX idx_tanggal_faktur (tanggal_faktur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Restart Backend
Setelah update database, restart backend service:

```bash
cd backend
npm restart
```

Atau jika menggunakan Docker:
```bash
docker-compose restart backend
```

### 3. Rebuild Frontend
Rebuild frontend untuk menerapkan perubahan:

```bash
cd frontend
npm run build
```

Atau jika menggunakan Docker:
```bash
docker-compose restart frontend
```

## Penggunaan

1. Buka halaman Schedule (`/schedule`)
2. Lihat SO dengan status "Sebagian diproses" (warna kuning/amber)
3. Di bawah baris SO tersebut akan muncul informasi faktur penjualan yang sudah dibuat
4. Format tampilan:
   ```
   📄 Faktur: SI.2026.04.00652 oleh Nur gudang admin 10 Apr 2026
   ```

## Catatan Teknis

### Accurate API Endpoints
- `/sales-invoice/list.do`: List faktur penjualan
- `/sales-invoice/detail.do`: Detail faktur penjualan

### Filter Accurate API
Untuk mendapatkan faktur berdasarkan SO, gunakan filter:
```
filter=salesOrderId={soId}
```

### Auto-fetch
- Faktur akan di-fetch otomatis saat SO dengan status "Sebagian diproses" ditampilkan
- Data di-cache di state `invoicesData` untuk menghindari fetch berulang
- Refresh halaman akan fetch ulang data terbaru

## Troubleshooting

### Faktur tidak muncul
1. Cek apakah tabel `sales_invoices` sudah dibuat
2. Cek log backend untuk error API Accurate
3. Cek apakah SO memiliki faktur di Accurate Online
4. Cek network tab di browser untuk melihat response API

### Error saat fetch faktur
1. Pastikan token Accurate masih valid
2. Cek rate limit Accurate API
3. Cek log backend untuk detail error

## Pengembangan Selanjutnya

Fitur yang bisa ditambahkan:
1. Tampilkan detail item di faktur
2. Link ke detail faktur di Accurate
3. Notifikasi saat faktur baru dibuat
4. Export data faktur ke Excel/PDF
5. Filter berdasarkan user yang membuat faktur
