-- Update sync interval menjadi 1 menit (60 detik)
-- Jalankan script ini untuk mengubah interval sync yang sudah ada

UPDATE sync_config 
SET sync_interval_seconds = 60,
    auto_sync_enabled = TRUE
WHERE id = 1;

-- Verifikasi perubahan
SELECT 
    id,
    auto_sync_enabled,
    sync_interval_seconds,
    CONCAT(FLOOR(sync_interval_seconds / 60), ' menit ', MOD(sync_interval_seconds, 60), ' detik') as interval_readable,
    last_sync_items,
    last_sync_sales_orders,
    last_sync_status
FROM sync_config 
WHERE id = 1;
