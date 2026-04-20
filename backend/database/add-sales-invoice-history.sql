-- =============================================
-- Sales Invoice History Table
-- Untuk menyimpan history perubahan faktur penjualan dari Accurate
-- =============================================

USE iware_warehouse;

-- Tabel untuk menyimpan history faktur penjualan
CREATE TABLE IF NOT EXISTS sales_invoice_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT NOT NULL,
  so_id VARCHAR(50) NOT NULL COMMENT 'ID Sales Order dari Accurate',
  invoice_number VARCHAR(100) NOT NULL COMMENT 'Nomor faktur penjualan',
  invoice_date DATE NOT NULL COMMENT 'Tanggal faktur',
  action_type VARCHAR(50) NOT NULL COMMENT 'Tipe aksi: created, updated, status_changed',
  status VARCHAR(100) COMMENT 'Status faktur',
  modified_by VARCHAR(255) COMMENT 'Nama user yang mengubah (dari Accurate)',
  modified_by_id VARCHAR(50) COMMENT 'ID user yang mengubah (dari Accurate)',
  description TEXT COMMENT 'Deskripsi perubahan',
  accurate_data JSON COMMENT 'Data lengkap dari Accurate (untuk referensi)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_so_id (so_id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View untuk menampilkan history dengan detail sales order
CREATE OR REPLACE VIEW v_sales_invoice_history AS
SELECT 
  h.id,
  h.sales_order_id,
  h.so_id,
  h.invoice_number,
  h.invoice_date,
  h.action_type,
  h.status,
  h.modified_by,
  h.modified_by_id,
  h.description,
  h.created_at,
  so.nomor_so,
  so.nama_pelanggan,
  so.status as current_status
FROM sales_invoice_history h
LEFT JOIN sales_orders so ON h.sales_order_id = so.id
ORDER BY h.created_at DESC;
