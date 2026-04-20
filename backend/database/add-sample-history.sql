-- =============================================
-- Add Sample History untuk Testing
-- Jalankan setelah tabel sales_order_history dibuat
-- =============================================

USE iware_warehouse;

-- Ambil beberapa sales order dengan status "Sebagian diproses"
-- dan tambahkan sample history

-- Contoh 1: Untuk SO pertama dengan status Sebagian diproses
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  invoice_number,
  created_by,
  created_at
)
SELECT 
  id,
  so_id,
  'Sebagian diproses',
  CONCAT('Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin'),
  'SI.2026.04.00652',
  'Nur gudang admin',
  DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM sales_orders 
WHERE status LIKE '%Sebagian%' 
LIMIT 1;

-- Contoh 2: History kedua untuk SO yang sama
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  invoice_number,
  created_by,
  created_at
)
SELECT 
  id,
  so_id,
  'Sebagian diproses',
  CONCAT('Buat Faktur Penjualan SI.2026.04.00653 oleh Admin Gudang'),
  'SI.2026.04.00653',
  'Admin Gudang',
  DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM sales_orders 
WHERE status LIKE '%Sebagian%' 
LIMIT 1;

-- Contoh 3: Untuk SO kedua
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  invoice_number,
  created_by,
  created_at
)
SELECT 
  id,
  so_id,
  'Sebagian diproses',
  CONCAT('Buat Faktur Penjualan SI.2026.04.00654 oleh Budi Warehouse'),
  'SI.2026.04.00654',
  'Budi Warehouse',
  NOW()
FROM sales_orders 
WHERE status LIKE '%Sebagian%' 
AND id NOT IN (SELECT DISTINCT sales_order_id FROM sales_order_history)
LIMIT 1;

-- Tampilkan hasil
SELECT 
  h.id,
  s.nomor_so,
  s.nama_pelanggan,
  s.status,
  h.invoice_number,
  h.description,
  h.created_by,
  h.created_at
FROM sales_order_history h
JOIN sales_orders s ON h.sales_order_id = s.id
ORDER BY h.created_at DESC
LIMIT 10;

-- =============================================
-- Catatan:
-- Script ini akan menambahkan sample history
-- untuk sales order yang sudah ada dengan status
-- "Sebagian diproses"
-- =============================================
