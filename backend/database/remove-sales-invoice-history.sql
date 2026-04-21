-- =============================================
-- Remove Sales Invoice History Feature
-- Script untuk menghapus tabel dan view sales_invoice_history
-- =============================================

-- Drop view terlebih dahulu
DROP VIEW IF EXISTS v_sales_invoice_history;

-- Drop tabel sales_invoice_history
DROP TABLE IF EXISTS sales_invoice_history;

-- Verifikasi penghapusan
SELECT 'Sales invoice history feature removed successfully' as status;
