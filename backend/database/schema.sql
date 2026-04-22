-- =============================================
-- iWare Warehouse Database Schema v2.0
-- Production Ready
-- =============================================

CREATE DATABASE IF NOT EXISTS iware_warehouse 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE iware_warehouse;

-- =============================================
-- Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin') DEFAULT 'admin',
  foto_profil VARCHAR(255) DEFAULT NULL,
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Accurate OAuth Tokens Table
-- =============================================
CREATE TABLE IF NOT EXISTS accurate_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_in INT DEFAULT 3600,
  expires_at DATETIME NOT NULL,
  scope TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Items Table (Cache from Accurate)
-- =============================================
CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id VARCHAR(50) UNIQUE NOT NULL,
  nama_item VARCHAR(255) NOT NULL,
  kode_item VARCHAR(100),
  kategori VARCHAR(100),
  satuan VARCHAR(50),
  stok_tersedia DECIMAL(15,2) DEFAULT 0,
  harga_jual DECIMAL(15,2) DEFAULT 0,
  harga_beli DECIMAL(15,2) DEFAULT 0,
  deskripsi TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_id (item_id),
  INDEX idx_nama_item (nama_item),
  INDEX idx_kode_item (kode_item),
  INDEX idx_kategori (kategori),
  INDEX idx_is_active (is_active),
  INDEX idx_last_sync (last_sync),
  FULLTEXT idx_search (nama_item, kode_item, deskripsi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sales Orders Table (Cache from Accurate)
-- =============================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  so_id VARCHAR(50) UNIQUE NOT NULL,
  nomor_so VARCHAR(100) NOT NULL,
  tanggal_so DATE NOT NULL,
  customer_id VARCHAR(50),
  nama_pelanggan VARCHAR(255) NOT NULL,
  keterangan TEXT,
  status VARCHAR(100) DEFAULT 'Menunggu diproses' COMMENT 'Sama dengan Accurate: Menunggu diproses, Sebagian diproses, Terproses',
  invoice_created_by VARCHAR(255) NULL COMMENT 'Nama user Accurate yang membuat Sales Invoice terkait SO',
  total_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'IDR',
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_so_id (so_id),
  INDEX idx_nomor_so (nomor_so),
  INDEX idx_tanggal_so (tanggal_so),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_is_active (is_active),
  INDEX idx_last_sync (last_sync),
  FULLTEXT idx_search (nomor_so, nama_pelanggan, keterangan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sales Order Details Table
-- =============================================
CREATE TABLE IF NOT EXISTS sales_order_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  nama_item VARCHAR(255) NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Activity Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  aktivitas VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_aktivitas (aktivitas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sync Configuration Table
-- =============================================
CREATE TABLE IF NOT EXISTS sync_config (
  id INT PRIMARY KEY,
  sync_start_date DATE NOT NULL DEFAULT '2026-02-24',
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_interval_seconds INT DEFAULT 300,
  last_sync_items TIMESTAMP NULL,
  last_sync_sales_orders TIMESTAMP NULL,
  last_sync_status VARCHAR(50) DEFAULT 'idle',
  last_sync_error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sync Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sync_type ENUM('items', 'sales_orders', 'full') NOT NULL,
  status ENUM('started', 'success', 'failed') NOT NULL,
  records_synced INT DEFAULT 0,
  error_message TEXT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  duration_seconds INT NULL,
  INDEX idx_sync_type (sync_type),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Webhook Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(100) NOT NULL,
  payload TEXT,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  INDEX idx_event_type (event_type),
  INDEX idx_received_at (received_at),
  INDEX idx_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Insert Default Data
-- =============================================

-- Default Super Admin
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (nama, email, password, role, status) 
VALUES (
  'Super Admin', 
  'superadmin@iware.id', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL2tOiHe', 
  'superadmin', 
  'aktif'
) ON DUPLICATE KEY UPDATE id=id;

-- Default Sync Config (Auto sync setiap 1 menit = 60 detik)
INSERT INTO sync_config (id, sync_start_date, auto_sync_enabled, sync_interval_seconds) 
VALUES (1, '2026-02-24', TRUE, 60)
ON DUPLICATE KEY UPDATE id=id;

-- =============================================
-- Views for Reporting
-- =============================================

-- Active Items View
CREATE OR REPLACE VIEW v_active_items AS
SELECT 
  id,
  item_id,
  nama_item,
  kode_item,
  kategori,
  satuan,
  stok_tersedia,
  harga_jual,
  harga_beli,
  last_sync
FROM items
WHERE is_active = TRUE;

-- Active Sales Orders View
CREATE OR REPLACE VIEW v_active_sales_orders AS
SELECT 
  id,
  so_id,
  nomor_so,
  tanggal_so,
  nama_pelanggan,
  status,
  total_amount,
  last_sync
FROM sales_orders
WHERE is_active = TRUE
ORDER BY tanggal_so DESC;

-- Dashboard Stats View
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM items WHERE is_active = TRUE) as total_items,
  (SELECT SUM(stok_tersedia) FROM items WHERE is_active = TRUE) as total_stock,
  (SELECT COUNT(*) FROM sales_orders WHERE is_active = TRUE) as total_sales_orders,
  (SELECT COUNT(*) FROM sales_orders WHERE is_active = TRUE AND status = 'Menunggu Proses') as pending_orders,
  (SELECT SUM(total_amount) FROM sales_orders WHERE is_active = TRUE) as total_sales_amount;

-- =============================================
-- Stored Procedures
-- =============================================

DELIMITER //

-- Get Dashboard Statistics
CREATE PROCEDURE IF NOT EXISTS sp_get_dashboard_stats()
BEGIN
  SELECT * FROM v_dashboard_stats;
END //

-- Cleanup Old Logs
CREATE PROCEDURE IF NOT EXISTS sp_cleanup_old_logs(IN days_to_keep INT)
BEGIN
  DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  DELETE FROM sync_logs WHERE started_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  DELETE FROM webhook_logs WHERE received_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
END //

DELIMITER ;

-- =============================================
-- Triggers
-- =============================================

DELIMITER //

-- Update sales_order total when details change
CREATE TRIGGER IF NOT EXISTS trg_update_so_total_after_insert
AFTER INSERT ON sales_order_details
FOR EACH ROW
BEGIN
  UPDATE sales_orders 
  SET total_amount = (
    SELECT SUM(subtotal) 
    FROM sales_order_details 
    WHERE sales_order_id = NEW.sales_order_id
  )
  WHERE id = NEW.sales_order_id;
END //

CREATE TRIGGER IF NOT EXISTS trg_update_so_total_after_update
AFTER UPDATE ON sales_order_details
FOR EACH ROW
BEGIN
  UPDATE sales_orders 
  SET total_amount = (
    SELECT SUM(subtotal) 
    FROM sales_order_details 
    WHERE sales_order_id = NEW.sales_order_id
  )
  WHERE id = NEW.sales_order_id;
END //

CREATE TRIGGER IF NOT EXISTS trg_update_so_total_after_delete
AFTER DELETE ON sales_order_details
FOR EACH ROW
BEGIN
  UPDATE sales_orders 
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM sales_order_details 
    WHERE sales_order_id = OLD.sales_order_id
  )
  WHERE id = OLD.sales_order_id;
END //

DELIMITER ;

-- =============================================
-- Grants (adjust as needed)
-- =============================================

-- GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'accurate_user'@'localhost';
-- FLUSH PRIVILEGES;

-- =============================================
-- End of Schema
-- =============================================
