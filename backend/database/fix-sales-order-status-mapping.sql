-- =============================================
-- Fix Sales Order Status Mapping
-- Memperbaiki status yang tidak konsisten dengan Accurate
-- =============================================

USE iware_warehouse;

-- Backup data sebelum update (optional)
CREATE TABLE IF NOT EXISTS sales_orders_backup_status AS 
SELECT * FROM sales_orders;

-- =============================================
-- Normalisasi Status ke 3 Label Baku Accurate
-- =============================================

-- 1. Status "Terproses" / "Completed" / "Closed"
UPDATE sales_orders 
SET status = 'Terproses',
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(status) IN (
    'CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE',
    'SELESAI', 'TERPROSES', 'FULLY PROCESSED', 'FULLY_PROCESSED'
)
AND status != 'Terproses';

-- 2. Status "Sebagian diproses" / "Partial"
UPDATE sales_orders 
SET status = 'Sebagian diproses',
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(status) IN (
    'PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE',
    'SEBAGIAN', 'SEBAGIAN TERPROSES', 'SEBAGIAN_TERPROSES',
    'SEBAGIAN DIPROSES', 'SEBAGIAN_DIPROSES',
    'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING',
    'PARTIALLY PROCESSED', 'PARTIALLY_PROCESSED'
)
AND status != 'Sebagian diproses';

-- 3. Status "Menunggu diproses" / "Pending" / "Open"
UPDATE sales_orders 
SET status = 'Menunggu diproses',
    updated_at = CURRENT_TIMESTAMP
WHERE UPPER(status) IN (
    'DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU',
    'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES',
    'MENUNGGU DI...', 'MENUNGGU DI', -- Dari screenshot Accurate
    'NEW', 'DRAFT', 'WAITING', 'QUEUE'
)
AND status != 'Menunggu diproses';

-- =============================================
-- Cek Status yang Belum Termapping
-- =============================================

SELECT 
    status,
    COUNT(*) as jumlah,
    GROUP_CONCAT(DISTINCT nomor_so SEPARATOR ', ') as contoh_so
FROM sales_orders
WHERE status NOT IN ('Terproses', 'Sebagian diproses', 'Menunggu diproses')
GROUP BY status;

-- =============================================
-- Statistik Setelah Perbaikan
-- =============================================

SELECT 
    status,
    COUNT(*) as jumlah,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sales_orders WHERE is_active = 1), 2) as persentase
FROM sales_orders
WHERE is_active = 1
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'Menunggu diproses' THEN 1
        WHEN 'Sebagian diproses' THEN 2
        WHEN 'Terproses' THEN 3
        ELSE 4
    END;

-- =============================================
-- Verifikasi Data
-- =============================================

-- Tampilkan 10 SO terbaru per status
SELECT 'Menunggu diproses' as status_group, nomor_so, nama_pelanggan, tanggal_so, status, total_amount
FROM sales_orders
WHERE status = 'Menunggu diproses' AND is_active = 1
ORDER BY tanggal_so DESC
LIMIT 10;

SELECT 'Sebagian diproses' as status_group, nomor_so, nama_pelanggan, tanggal_so, status, total_amount
FROM sales_orders
WHERE status = 'Sebagian diproses' AND is_active = 1
ORDER BY tanggal_so DESC
LIMIT 10;

SELECT 'Terproses' as status_group, nomor_so, nama_pelanggan, tanggal_so, status, total_amount
FROM sales_orders
WHERE status = 'Terproses' AND is_active = 1
ORDER BY tanggal_so DESC
LIMIT 10;
