-- =============================================
-- Add Sales Invoices Table
-- Migration untuk menambahkan tabel faktur penjualan
-- =============================================

USE iware_warehouse;

-- =============================================
-- Sales Invoices Table (Faktur Penjualan dari Accurate)
-- =============================================
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

-- =============================================
-- End of Migration
-- =============================================
