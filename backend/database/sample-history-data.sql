-- =============================================
-- Sample Data untuk Testing Sales Order History
-- =============================================

USE iware_warehouse;

-- Contoh: Tambahkan history untuk sales order yang sudah ada
-- Ganti sales_order_id dan so_id sesuai dengan data Anda

-- Contoh 1: History untuk SO yang statusnya "Sebagian diproses"
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  invoice_number,
  created_by,
  created_at
) VALUES 
(
  1, -- Ganti dengan ID sales order yang ada
  'SO.2026.04.00496', -- Ganti dengan nomor SO yang ada
  'Sebagian diproses',
  'Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin',
  'SI.2026.04.00652',
  'Nur gudang admin',
  '2026-04-10 11:10:00'
);

-- Contoh 2: History status berubah dari Menunggu ke Sebagian
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  created_by,
  created_at
) VALUES 
(
  1, -- Ganti dengan ID sales order yang ada
  'SO.2026.04.00496',
  'Menunggu diproses',
  'Sales order dibuat dan menunggu proses',
  'system',
  '2026-04-09 08:00:00'
);

-- Contoh 3: Multiple history entries untuk satu SO
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  invoice_number,
  created_by,
  created_at
) VALUES 
(
  2, -- Ganti dengan ID sales order lain
  'SO.2026.04.00507',
  'Menunggu diproses',
  'Sales order dibuat',
  NULL,
  'system',
  '2026-04-10 09:00:00'
),
(
  2,
  'SO.2026.04.00507',
  'Sebagian diproses',
  'Buat Faktur Penjualan SI.2026.04.00653 oleh Admin',
  'SI.2026.04.00653',
  'Admin',
  '2026-04-10 14:30:00'
),
(
  2,
  'SO.2026.04.00507',
  'Sebagian diproses',
  'Buat Faktur Penjualan SI.2026.04.00654 oleh Admin (Pengiriman kedua)',
  'SI.2026.04.00654',
  'Admin',
  '2026-04-11 10:15:00'
);

-- Query untuk melihat history yang baru ditambahkan
SELECT 
  h.id,
  h.sales_order_id,
  s.nomor_so,
  h.status,
  h.description,
  h.invoice_number,
  h.created_by,
  h.created_at
FROM sales_order_history h
JOIN sales_orders s ON h.sales_order_id = s.id
ORDER BY h.created_at DESC;

-- =============================================
-- Catatan:
-- 1. Ganti sales_order_id dengan ID yang ada di tabel sales_orders
-- 2. Ganti so_id dengan nomor SO yang sesuai
-- 3. Sesuaikan tanggal created_at dengan kebutuhan
-- =============================================
