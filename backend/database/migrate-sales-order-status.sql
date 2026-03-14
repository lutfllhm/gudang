-- Migration: Samakan status Sales Order dengan Accurate Online (Dipesan, Diproses, Selesai)
-- Jalankan sekali: mysql -u user -p database < migrate-sales-order-status.sql

-- Ubah kolom status agar bisa menyimpan nilai dari Accurate (Dipesan, Diproses, Selesai)
ALTER TABLE sales_orders
  MODIFY COLUMN status VARCHAR(100) DEFAULT 'Dipesan';

-- Opsional: update data lama ke label baru (setelah sync, semua akan ikut Accurate)
-- UPDATE sales_orders SET status = CASE
--   WHEN status = 'Menunggu Proses' THEN 'Dipesan'
--   WHEN status = 'Sebagian Terproses' THEN 'Diproses'
--   WHEN status = 'Terproses' THEN 'Selesai'
--   ELSE status
-- END WHERE status IN ('Menunggu Proses', 'Sebagian Terproses', 'Terproses');
