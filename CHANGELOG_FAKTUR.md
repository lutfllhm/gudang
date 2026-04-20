# Changelog - Fitur Faktur Penjualan di Schedule

## Tanggal: 20 April 2026

### ✨ Fitur Baru

#### Tampilan Faktur Penjualan di Schedule Page
Pada halaman Schedule, SO dengan status "Sebagian diproses" sekarang menampilkan informasi faktur penjualan yang sudah dibuat di Accurate Online.

**Tampilan:**
- Nomor faktur penjualan (contoh: SI.2026.04.00652)
- Nama user yang membuat faktur (contoh: Nur gudang admin)
- Tanggal faktur dibuat

**Lokasi:**
- Ditampilkan di bawah baris SO dengan status "Sebagian diproses"
- Border kuning/amber di sebelah kiri untuk membedakan dari baris SO utama

### 🔧 Perubahan Backend

#### Database
- **Tabel baru**: `sales_invoices`
  - Menyimpan data faktur penjualan dari Accurate
  - Relasi dengan `sales_orders`

#### API
- **Endpoint baru**: `GET /api/sales-orders/:soId/invoices`
  - Mengambil faktur penjualan untuk SO tertentu
  - Auto-sync dari Accurate API

#### Service
- `SalesOrderService.getSalesInvoicesForOrder()` - Ambil faktur dari Accurate
- `SalesOrderService.syncInvoicesForOrder()` - Sync faktur ke database
- `SalesOrderService.getInvoicesForOrder()` - Ambil faktur dari database

### 🎨 Perubahan Frontend

#### SchedulePage.jsx
- State baru: `invoicesData` untuk cache data faktur
- Function baru: `fetchInvoices()` untuk fetch faktur dari API
- Render faktur di bawah SO dengan status "Sebagian diproses"

### 📦 File Baru

1. `backend/database/add-sales-invoices-table.sql` - Migration SQL
2. `FITUR_FAKTUR_PENJUALAN.md` - Dokumentasi lengkap
3. `CHANGELOG_FAKTUR.md` - Changelog ini

### 🚀 Cara Install

1. **Update Database:**
   ```bash
   mysql -u root -p iware_warehouse < backend/database/add-sales-invoices-table.sql
   ```

2. **Restart Services:**
   ```bash
   docker-compose restart backend frontend
   ```
   
   Atau tanpa Docker:
   ```bash
   cd backend && npm restart
   cd frontend && npm run build
   ```

### 📝 Catatan

- Faktur akan di-fetch otomatis saat SO ditampilkan
- Data di-cache untuk menghindari fetch berulang
- Hanya SO dengan status "Sebagian diproses" yang menampilkan faktur

### 🐛 Bug Fixes

- Tidak ada bug fix di release ini

### ⚠️ Breaking Changes

- Tidak ada breaking changes

### 📚 Dokumentasi

Lihat `FITUR_FAKTUR_PENJUALAN.md` untuk dokumentasi lengkap.
