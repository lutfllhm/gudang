-- =============================================
-- Sales Order History/Schedule Table
-- Untuk menyimpan history perubahan status dan schedule
-- =============================================

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

-- =============================================
-- End of Sales Order History Schema
-- =============================================
