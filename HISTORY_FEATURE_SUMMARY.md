# Sales Order History & Schedule Feature - Summary

## 📋 Overview

Fitur ini menambahkan kemampuan untuk menampilkan **history** dan **schedule** pada sales order, khususnya untuk status "Sebagian diproses" yang menunjukkan faktur penjualan yang telah dibuat di Accurate.

## ✨ Fitur Utama

1. **Timeline History**: Menampilkan history perubahan status sales order dalam format timeline
2. **Manual Schedule**: Admin dapat menambahkan schedule/catatan manual
3. **Automatic Tracking**: Sistem otomatis mencatat perubahan status melalui database trigger
4. **Invoice Tracking**: Mencatat nomor faktur penjualan yang dibuat
5. **User Attribution**: Mencatat siapa yang membuat perubahan

## 📁 File yang Dibuat/Dimodifikasi

### Backend (New Files)
- ✅ `backend/src/models/SalesOrderHistory.js` - Model untuk history
- ✅ `backend/database/add-sales-order-history.sql` - Schema database
- ✅ `backend/database/setup-history.sh` - Setup script (Linux/Mac)
- ✅ `backend/database/setup-history.bat` - Setup script (Windows)
- ✅ `backend/database/sample-history-data.sql` - Sample data untuk testing

### Backend (Modified Files)
- ✅ `backend/src/controllers/SalesOrderController.js` - Tambah endpoint history
- ✅ `backend/src/routes/salesOrderRoutes.js` - Tambah routes history

### Frontend (New Files)
- ✅ `frontend/src/components/SalesOrderHistoryModal.jsx` - Modal component

### Frontend (Modified Files)
- ✅ `frontend/src/pages/SalesOrdersPage.jsx` - Tambah button & modal

### Documentation
- ✅ `SALES_ORDER_HISTORY_SETUP.md` - Dokumentasi lengkap (English)
- ✅ `CARA_SETUP_HISTORY.txt` - Panduan setup (Bahasa Indonesia)
- ✅ `HISTORY_FEATURE_SUMMARY.md` - Summary ini

## 🚀 Quick Start

### 1. Setup Database

**Windows:**
```bash
cd backend\database
setup-history.bat
```

**Linux/Mac:**
```bash
cd backend/database
bash setup-history.sh
```

**Manual:**
```bash
mysql -u root -p iware_warehouse < backend/database/add-sales-order-history.sql
```

### 2. Restart Backend

```bash
cd backend
npm restart
```

Atau dengan PM2:
```bash
pm2 restart backend
```

### 3. Test di Browser

1. Buka halaman Sales Orders
2. Klik tombol "History" pada sales order
3. Modal akan muncul
4. Klik "Tambah Schedule" untuk menambah entry baru

## 🔌 API Endpoints

### Get History
```http
GET /api/sales-orders/:id/history
Authorization: Bearer <token>
```

### Add History
```http
POST /api/sales-orders/:id/history
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Sebagian diproses",
  "description": "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin",
  "invoiceNumber": "SI.2026.04.00652"
}
```

### Delete History
```http
DELETE /api/sales-orders/:id/history/:historyId
Authorization: Bearer <token>
```

## 🗄️ Database Schema

```sql
CREATE TABLE sales_order_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT NOT NULL,
  so_id VARCHAR(50) NOT NULL,
  status VARCHAR(100) NOT NULL,
  description TEXT,
  invoice_number VARCHAR(100),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);
```

## 🎨 UI Components

### History Modal Features:
- ✅ Timeline view dengan icon status
- ✅ Form untuk tambah schedule baru
- ✅ Display tanggal dan waktu (format Indonesia)
- ✅ Display nomor faktur jika ada
- ✅ Display nama user yang membuat
- ✅ Responsive design
- ✅ Smooth animations

### Status Icons:
- 🟢 **Terproses**: CheckCircle (hijau)
- 🟡 **Sebagian diproses**: Clock (kuning)
- ⚪ **Menunggu diproses**: AlertCircle (abu-abu)

## 📊 Use Case Example

### Workflow:
1. Sales Order dibuat dengan status "Menunggu diproses"
2. Admin membuat faktur penjualan di Accurate
3. Status berubah menjadi "Sebagian diproses" (auto-logged)
4. Admin menambahkan schedule manual:
   - Status: Sebagian diproses
   - Deskripsi: "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin"
   - Nomor Faktur: SI.2026.04.00652
5. Timeline menampilkan semua history dengan lengkap

## 🔧 Troubleshooting

### Tabel tidak terbuat
```sql
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
```

### History tidak muncul
1. Cek tabel: `SHOW TABLES LIKE 'sales_order_history';`
2. Cek data: `SELECT * FROM sales_order_history;`
3. Cek log: `tail -f backend/logs/all-*.log`

### Button tidak muncul
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart frontend dev server
3. Check browser console

## 🧪 Testing

### Manual Testing:
1. Jalankan sample data:
   ```bash
   mysql -u root -p iware_warehouse < backend/database/sample-history-data.sql
   ```
2. Buka Sales Orders page
3. Klik "History" pada sales order
4. Verifikasi data muncul

### API Testing (Postman/curl):
```bash
# Get history
curl -X GET http://localhost:5000/api/sales-orders/1/history \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add history
curl -X POST http://localhost:5000/api/sales-orders/1/history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Sebagian diproses",
    "description": "Test schedule",
    "invoiceNumber": "SI.2026.04.00999"
  }'
```

## 📝 Notes

- History otomatis tercatat saat status berubah (via trigger)
- Manual schedule bisa ditambahkan kapan saja
- Semua history tersimpan permanent (tidak ada soft delete)
- History akan terhapus otomatis jika sales order dihapus (CASCADE)

## 🎯 Next Steps

Setelah setup selesai:
1. ✅ Test fitur di development
2. ✅ Verifikasi trigger berjalan dengan baik
3. ✅ Test dengan data real dari Accurate
4. ✅ Deploy ke production
5. ✅ Train user cara menggunakan fitur

## 📞 Support

Jika ada masalah:
1. Cek dokumentasi: `SALES_ORDER_HISTORY_SETUP.md`
2. Cek panduan: `CARA_SETUP_HISTORY.txt`
3. Cek log backend: `backend/logs/`
4. Cek browser console untuk error frontend

---

**Created:** April 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
