# Testing Accurate Status Mapping

## Masalah
Status "Sebagian diproses" dari Accurate tidak muncul di aplikasi.

## Solusi yang Diterapkan

### 1. Backend Changes
- **File**: `backend/src/services/SalesOrderService.js`
  - Menambahkan logging detail untuk melihat status yang datang dari Accurate
  - Memastikan mapping status menggunakan "Sebagian diproses" (bukan "Sebagian terproses")
  - Menambahkan lebih banyak variasi status dalam `partialSet`

### 2. Frontend Changes
- **File**: `frontend/src/pages/SchedulePage.jsx`
  - Mengubah label dari "Sebagian Terproses" menjadi "Sebagian diproses"
  - Memperbaiki fungsi `getOrderStatusGroup` untuk menggunakan `includes` instead of exact match
  - Menambahkan `.trim()` untuk menghindari masalah whitespace

- **File**: `frontend/src/pages/SalesOrdersPage.jsx`
  - Mengubah label dari "Sebagian terproses" menjadi "Sebagian diproses"
  - Menggunakan `includes` untuk matching yang lebih fleksibel

- **File**: `frontend/src/utils/helpers.js`
  - Menambahkan lebih banyak variasi status dalam mapping warna

## Testing

### 1. Test Status Mapping dari Accurate
Jalankan script untuk melihat status yang sebenarnya datang dari Accurate:

```bash
cd backend
node src/scripts/test-accurate-status.js
```

Script ini akan:
- Mengambil 5 sales order pertama dari Accurate
- Menampilkan semua field status yang tersedia
- Menunjukkan bagaimana status di-mapping ke aplikasi

### 2. Sync Data dari Accurate
Setelah memastikan mapping benar, sync ulang data:

```bash
# Via API (gunakan Postman atau curl)
POST http://localhost:5000/api/sync/sales-orders
Authorization: Bearer <your-token>
```

Atau melalui UI:
1. Login ke aplikasi
2. Buka halaman Dashboard
3. Klik tombol "Sync Now" atau tunggu auto-sync

### 3. Verifikasi di Frontend
1. Buka halaman Schedule (`/schedule`)
2. Periksa apakah status "Sebagian diproses" muncul dengan warna kuning/amber
3. Buka halaman Sales Orders (`/sales-orders`)
4. Verifikasi status yang sama

## Status Mapping Reference

### Accurate → Aplikasi

| Accurate Status | Aplikasi Status | Warna | Kategori |
|----------------|-----------------|-------|----------|
| Dipesan, Open, Pending, Menunggu Diproses | Menunggu diproses | Merah | pending |
| Sebagian Diproses, Partial, Processing | Sebagian diproses | Kuning | processing |
| Terproses, Closed, Completed | Terproses | Hijau | completed |

### Status Groups

```javascript
const STATUS_GROUP = {
  completed: ['completed', 'terproses', 'selesai', 'proceed', 'closed', 'close', 'finished', 'done'],
  processing: ['processing', 'sebagian terproses', 'sebagian diproses', 'diproses', 'partial', 'partially', 'in progress', 'in_progress'],
  pending: ['pending', 'belum terproses', 'menunggu proses', 'menunggu diproses', 'dipesan', 'queue', 'waiting', 'open', 'opened', 'new', 'draft']
}
```

## Troubleshooting

### Status tidak muncul setelah sync
1. Periksa log backend: `backend/logs/accurate-*.log`
2. Cari log dengan keyword "Status mapping result"
3. Verifikasi status yang datang dari Accurate

### Status salah warna
1. Periksa `frontend/src/utils/helpers.js` → `getStatusColor()`
2. Pastikan status ada dalam mapping
3. Clear browser cache dan reload

### Data tidak ter-update
1. Pastikan auto-sync aktif di database:
   ```sql
   SELECT * FROM sync_config;
   UPDATE sync_config SET auto_sync_enabled = TRUE WHERE id = 1;
   ```
2. Periksa interval sync (default 60 detik)
3. Restart backend service

## Logs untuk Debugging

### Backend Logs
```bash
# Lihat log Accurate
tail -f backend/logs/accurate-*.log

# Lihat semua log
tail -f backend/logs/all-*.log

# Lihat error log
tail -f backend/logs/error-*.log
```

### Frontend Console
Buka browser console (F12) dan cari:
- `[SchedulePage] Stats breakdown:` - untuk melihat penghitungan status
- `[SchedulePage] Filtered orders count:` - untuk melihat filter yang aktif

## Next Steps

Jika masalah masih terjadi:
1. Jalankan test script untuk melihat status asli dari Accurate
2. Periksa apakah field status di response Accurate berbeda
3. Update mapping di `SalesOrderService.transformAccurateOrder()` jika perlu
4. Sync ulang data dari Accurate
