-- Migration: Status Sales Order = Accurate (Menunggu Diproses, Sebagian Terproses, Terproses)
-- Jalankan sekali: mysql -u user -p database < migrate-sales-order-status.sql

ALTER TABLE sales_orders
  MODIFY COLUMN status VARCHAR(100) DEFAULT 'Menunggu Diproses';

-- Opsional: ubah data lama ke 3 status Accurate (jalankan setelah ALTER di atas)
-- UPDATE sales_orders SET status = CASE
--   WHEN status IN ('Menunggu Proses', 'Dipesan') THEN 'Menunggu Diproses'
--   WHEN status IN ('Sebagian Terproses', 'Diproses') THEN 'Sebagian Terproses'
--   WHEN status IN ('Terproses', 'Selesai') THEN 'Terproses'
--   ELSE status
-- END;
