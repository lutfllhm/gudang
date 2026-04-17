-- Fix: Normalisasi status "Sebagian" agar konsisten dengan label aplikasi
-- Jalankan: mysql -u user -p iware_warehouse < fix-status-sebagian.sql

-- Lihat dulu status apa saja yang ada di DB
SELECT status, COUNT(*) as jumlah 
FROM sales_orders 
WHERE is_active = 1 
GROUP BY status 
ORDER BY jumlah DESC;

-- Normalisasi semua varian "sebagian" ke "Sebagian diproses"
UPDATE sales_orders 
SET status = 'Sebagian diproses', updated_at = CURRENT_TIMESTAMP
WHERE LOWER(TRIM(status)) IN (
  'sebagian terproses',
  'sebagian diproses', 
  'sebagian_terproses',
  'sebagian_diproses',
  'diproses',
  'partial',
  'partially',
  'in progress',
  'in_progress',
  'processing',
  'partially processed'
)
AND status != 'Sebagian diproses';

-- Normalisasi semua varian "menunggu" ke "Menunggu diproses"
UPDATE sales_orders 
SET status = 'Menunggu diproses', updated_at = CURRENT_TIMESTAMP
WHERE LOWER(TRIM(status)) IN (
  'menunggu diproses',
  'menunggu proses',
  'menunggu_diproses',
  'dipesan',
  'open',
  'opened',
  'pending',
  'new',
  'draft',
  'waiting',
  'queue'
)
AND status != 'Menunggu diproses';

-- Normalisasi semua varian "terproses" ke "Terproses"
UPDATE sales_orders 
SET status = 'Terproses', updated_at = CURRENT_TIMESTAMP
WHERE LOWER(TRIM(status)) IN (
  'terproses',
  'selesai',
  'closed',
  'close',
  'completed',
  'finished',
  'done',
  'fully processed'
)
AND status != 'Terproses';

-- Cek hasil setelah normalisasi
SELECT status, COUNT(*) as jumlah 
FROM sales_orders 
WHERE is_active = 1 
GROUP BY status 
ORDER BY jumlah DESC;
