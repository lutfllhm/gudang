# Setup Sales Order History & Schedule

Fitur ini memungkinkan Anda untuk menampilkan history dan schedule pada sales order, khususnya untuk status "Sebagian diproses" yang menunjukkan faktur penjualan yang telah dibuat.

## 1. Setup Database

Jalankan script SQL untuk membuat tabel `sales_order_history`:

```bash
mysql -u root -p iware_warehouse < backend/database/add-sales-order-history.sql
```

Atau jalankan manual melalui MySQL client:

```sql
USE iware_warehouse;

-- Tabel untuk menyimpan history/schedule sales order
CREATE TABLE IF NOT EXISTS sales_order_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT NOT NULL,
  so_id VARCHAR(50) NOT NULL,
  status VARCHAR(100) NOT NULL COMMENT 'Status: Menunggu diproses, Sebagian diproses, Terproses',
  description TEXT COMMENT 'Deskripsi perubahan status atau schedule',
  invoice_number VARCHAR(100) COMMENT 'Nomor faktur penjualan jika ada',
  created_by VARCHAR(100) COMMENT 'User yang membuat perubahan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_so_id (so_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger untuk otomatis menambah history saat status sales order berubah
DELIMITER //

CREATE TRIGGER IF NOT EXISTS trg_sales_order_status_change
AFTER UPDATE ON sales_orders
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO sales_order_history (
      sales_order_id,
      so_id,
      status,
      description,
      created_by
    ) VALUES (
      NEW.id,
      NEW.so_id,
      NEW.status,
      CONCAT('Status berubah dari "', OLD.status, '" ke "', NEW.status, '"'),
      'system'
    );
  END IF;
END //

DELIMITER ;
```

## 2. Restart Backend

Setelah database setup, restart backend server:

```bash
cd backend
npm restart
```

Atau jika menggunakan PM2:

```bash
pm2 restart backend
```

## 3. Cara Menggunakan

### Melihat History & Schedule

1. Buka halaman **Sales Orders**
2. Pada setiap baris sales order, klik tombol **"History"** di kolom Actions
3. Modal akan muncul menampilkan timeline history dan schedule

### Menambah Schedule Baru

1. Buka modal History dengan klik tombol "History" pada sales order
2. Klik tombol **"Tambah Schedule"**
3. Isi form:
   - **Status**: Pilih status (Menunggu diproses, Sebagian diproses, Terproses)
   - **Deskripsi**: Contoh: "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin"
   - **Nomor Faktur**: (Opsional) Contoh: "SI.2026.04.00652"
4. Klik **"Simpan"**

### Automatic History

Sistem akan otomatis mencatat history ketika:
- Status sales order berubah (melalui trigger database)
- Admin menambahkan schedule manual

## 4. API Endpoints

### Get History
```
GET /api/sales-orders/:id/history
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "salesOrderId": 123,
      "soId": "12345",
      "status": "Sebagian diproses",
      "description": "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin",
      "invoiceNumber": "SI.2026.04.00652",
      "createdBy": "admin",
      "createdAt": "2026-04-10T11:10:00.000Z"
    }
  ]
}
```

### Add History
```
POST /api/sales-orders/:id/history
Content-Type: application/json

{
  "status": "Sebagian diproses",
  "description": "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin",
  "invoiceNumber": "SI.2026.04.00652"
}
```

### Delete History
```
DELETE /api/sales-orders/:id/history/:historyId
```

## 5. Tampilan

History akan ditampilkan dalam format timeline dengan:
- **Icon status**: 
  - ✓ Hijau untuk "Terproses"
  - ⏱ Kuning untuk "Sebagian diproses"
  - ⚠ Abu-abu untuk "Menunggu diproses"
- **Tanggal dan waktu**: Format Indonesia (DD/MM/YYYY HH:MM)
- **Deskripsi**: Penjelasan lengkap
- **Nomor Faktur**: Jika ada
- **Created by**: Nama user yang membuat

## 6. Troubleshooting

### Tabel tidak terbuat
Pastikan user MySQL memiliki permission untuk CREATE TABLE dan CREATE TRIGGER:
```sql
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### History tidak muncul
1. Cek apakah tabel `sales_order_history` sudah ada:
   ```sql
   SHOW TABLES LIKE 'sales_order_history';
   ```

2. Cek apakah ada data:
   ```sql
   SELECT * FROM sales_order_history;
   ```

3. Cek log backend:
   ```bash
   tail -f backend/logs/all-*.log
   ```

### Trigger tidak jalan
Cek apakah trigger sudah terbuat:
```sql
SHOW TRIGGERS LIKE 'sales_orders';
```

Jika belum ada, jalankan ulang script trigger di atas.

## 7. Integrasi dengan Accurate

Ketika sync dari Accurate:
- Jika status sales order berubah, trigger otomatis akan mencatat history
- Anda bisa menambahkan schedule manual untuk mencatat faktur penjualan yang dibuat

Contoh workflow:
1. Sales Order masuk dengan status "Menunggu diproses"
2. Admin membuat faktur penjualan di Accurate
3. Status berubah menjadi "Sebagian diproses"
4. Admin menambahkan schedule: "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin"
5. History akan menampilkan timeline lengkap

## 8. Customization

Anda bisa customize tampilan modal di file:
```
frontend/src/components/SalesOrderHistoryModal.jsx
```

Untuk mengubah logic backend, edit:
```
backend/src/models/SalesOrderHistory.js
backend/src/controllers/SalesOrderController.js
```
