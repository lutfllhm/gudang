# Quick Start: Deploy Histori Faktur Penjualan

## Status
✅ **Histori faktur penjualan SUDAH TERINTEGRASI dengan Accurate**

## Deploy ke VPS (3 Langkah)

### 1. Deploy
```bash
chmod +x deploy-invoice-history.sh
./deploy-invoice-history.sh
```

### 2. Verifikasi
```bash
chmod +x verify-invoice-history.sh
./verify-invoice-history.sh
```

### 3. Test API
```bash
chmod +x test-invoice-history-api.sh
./test-invoice-history-api.sh
```

## API Endpoints

Setelah deploy, endpoint berikut tersedia:

```
GET  http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=50
GET  http://212.85.26.166:3000/api/sales-invoice-history/order/:orderId
GET  http://212.85.26.166:3000/api/sales-invoice-history/so/:soId
GET  http://212.85.26.166:3000/api/sales-invoice-history/status/:status
POST http://212.85.26.166:3000/api/sales-invoice-history/sync
```

## Manual Sync Example

```bash
curl -X POST http://212.85.26.166:3000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "pageSize": 100
  }'
```

## Troubleshooting

### Jika script tidak bisa dijalankan di Windows
Gunakan Git Bash atau WSL, atau deploy manual:

```bash
# Connect ke VPS
ssh root@212.85.26.166

# Backup database
cd /root/accurate-sync/backend
docker-compose exec db mysqldump -u root -p accurate_sync > backup_$(date +%Y%m%d).sql

# Upload files (dari local terminal)
scp backend/database/add-sales-invoice-history.sql root@212.85.26.166:/root/accurate-sync/backend/database/
scp backend/src/controllers/SalesInvoiceHistoryController.js root@212.85.26.166:/root/accurate-sync/backend/src/controllers/
scp backend/src/models/SalesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/models/
scp backend/src/services/CustomerService.js root@212.85.26.166:/root/accurate-sync/backend/src/services/
scp backend/src/routes/salesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/routes/

# Run migration (di VPS)
cd /root/accurate-sync/backend
docker-compose exec -T db mysql -u root -p accurate_sync < database/add-sales-invoice-history.sql

# Restart
cd /root/accurate-sync
docker-compose restart backend
```

## Dokumentasi Lengkap

Lihat `INVOICE_HISTORY_INTEGRATION.md` untuk dokumentasi lengkap.
