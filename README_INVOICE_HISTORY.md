# 📋 Histori Faktur Penjualan - Integrasi Accurate

## 🎯 Status

✅ **SUDAH TERINTEGRASI SEPENUHNYA DENGAN ACCURATE**

Sistem histori faktur penjualan sudah siap untuk di-deploy ke VPS Anda.

---

## 📚 Dokumentasi

### 🚀 Quick Start
**Baru mulai? Mulai di sini:**
- [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md) - Panduan cepat 3 langkah

### 📖 Dokumentasi Lengkap
**Butuh detail teknis?**
- [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md) - Dokumentasi lengkap arsitektur, API, dan cara kerja

### 📝 Summary
**Butuh overview cepat?**
- [`SUMMARY_INVOICE_HISTORY.md`](SUMMARY_INVOICE_HISTORY.md) - Ringkasan fitur dan status

### 💻 Windows Users
**Menggunakan Windows?**
- [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md) - Panduan deployment untuk Windows (tanpa bash)

### ✅ Deployment Checklist
**Mau pastikan semuanya beres?**
- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Checklist lengkap pre/post deployment

---

## 🚀 Deployment (Pilih Salah Satu)

### Opsi 1: Otomatis (Linux/Mac/Git Bash)
```bash
chmod +x deploy-invoice-history.sh
./deploy-invoice-history.sh
```

### Opsi 2: Manual (Windows/Semua Platform)
Ikuti panduan di [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md)

---

## 🔍 Verifikasi

### Setelah Deployment
```bash
chmod +x verify-invoice-history.sh
./verify-invoice-history.sh
```

### Test API
```bash
chmod +x test-invoice-history-api.sh
./test-invoice-history-api.sh
```

---

## 📡 API Endpoints

Setelah deployment, endpoint berikut tersedia:

```
Base URL: http://212.85.26.166:3000

GET  /api/sales-invoice-history/recent?limit=50
GET  /api/sales-invoice-history/order/:orderId
GET  /api/sales-invoice-history/so/:soId
GET  /api/sales-invoice-history/status/:status
POST /api/sales-invoice-history/sync
```

**Authentication:** Semua endpoint memerlukan Bearer token

---

## 🎯 Fitur

### ✅ Yang Sudah Ada

1. **Database**
   - Tabel `sales_invoice_history`
   - View `v_sales_invoice_history`
   - Migration script ready

2. **Backend API**
   - 5 REST endpoints
   - Authentication & authorization
   - Error handling
   - Logging

3. **Integrasi Accurate**
   - Sync manual via API
   - Auto sync terintegrasi
   - Tracking user yang mengubah
   - Menyimpan data lengkap (JSON)

4. **Monitoring**
   - Logging lengkap
   - Error tracking
   - Performance monitoring

### 🔄 Auto Sync

Histori faktur **otomatis di-sync** setiap kali sistem melakukan sync:
- Items → Sales Orders → **Invoice History**
- Tidak perlu trigger manual
- Error handling yang baik

---

## 📂 File Structure

```
.
├── backend/
│   ├── database/
│   │   └── add-sales-invoice-history.sql      # Migration
│   ├── src/
│   │   ├── controllers/
│   │   │   └── SalesInvoiceHistoryController.js
│   │   ├── models/
│   │   │   └── SalesInvoiceHistory.js
│   │   ├── services/
│   │   │   ├── CustomerService.js             # Sync logic
│   │   │   └── SyncService.js                 # Auto sync
│   │   └── routes/
│   │       └── salesInvoiceHistory.js
│
├── deploy-invoice-history.sh                   # Deploy script
├── verify-invoice-history.sh                   # Verify script
├── test-invoice-history-api.sh                 # Test script
│
├── README_INVOICE_HISTORY.md                   # This file
├── QUICK_START_INVOICE_HISTORY.md              # Quick start
├── INVOICE_HISTORY_INTEGRATION.md              # Full docs
├── SUMMARY_INVOICE_HISTORY.md                  # Summary
├── DEPLOY_WINDOWS.md                           # Windows guide
└── DEPLOYMENT_CHECKLIST.md                     # Checklist
```

---

## 🧪 Testing

### 1. Get Token
```bash
curl -X POST http://212.85.26.166:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### 2. Get Recent History
```bash
curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Manual Sync
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

---

## 📊 Monitoring

### Check Logs
```bash
ssh root@212.85.26.166
cd /root/accurate-sync
docker-compose logs -f backend | grep -i "invoice\|history"
```

### Database Queries
```sql
-- Total records
SELECT COUNT(*) FROM sales_invoice_history;

-- Recent history
SELECT * FROM v_sales_invoice_history 
ORDER BY created_at DESC LIMIT 10;

-- By status
SELECT status, COUNT(*) 
FROM sales_invoice_history 
GROUP BY status;
```

---

## 🔧 Troubleshooting

### Backend tidak running
```bash
cd /root/accurate-sync
docker-compose restart backend
docker-compose logs --tail=50 backend
```

### Database error
```bash
# Check table exists
docker-compose exec db mysql -u root -p accurate_sync \
  -e "SHOW TABLES LIKE 'sales_invoice_history';"

# Check records
docker-compose exec db mysql -u root -p accurate_sync \
  -e "SELECT COUNT(*) FROM sales_invoice_history;"
```

### API error
```bash
# Check backend logs
docker-compose logs backend | grep -i error

# Check health
curl http://212.85.26.166:3000/health
```

---

## 🎓 Cara Kerja

### Sync Process

1. **Manual Sync** (via API):
   ```
   POST /api/sales-invoice-history/sync
   → CustomerService.syncInvoiceHistory()
   → Fetch customers from Accurate
   → Get related sales orders
   → Extract invoice changes
   → Save to database
   ```

2. **Auto Sync** (scheduled):
   ```
   Cron Job
   → SyncService.performSync()
   → Sync Items
   → Sync Sales Orders
   → Sync Invoice History (new!)
   → Update logs
   ```

### Data Flow

```
Accurate API
    ↓
CustomerService.syncInvoiceHistory()
    ↓
Extract: invoice_number, status, modified_by, etc.
    ↓
SalesInvoiceHistory.create()
    ↓
Database (sales_invoice_history table)
    ↓
API Endpoints
    ↓
Frontend / Client
```

---

## 📋 Deployment Checklist

- [ ] Backup database
- [ ] Upload migration file
- [ ] Run migration
- [ ] Upload backend files
- [ ] Restart backend
- [ ] Verify table created
- [ ] Test API endpoints
- [ ] Check logs
- [ ] Monitor for 24h

**Full checklist:** [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)

---

## 🆘 Support

### Dokumentasi
- **Full Documentation:** [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md)
- **Quick Start:** [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md)
- **Windows Guide:** [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md)

### Scripts
- **Deploy:** `./deploy-invoice-history.sh`
- **Verify:** `./verify-invoice-history.sh`
- **Test:** `./test-invoice-history-api.sh`

### VPS Info
- **Host:** 212.85.26.166
- **User:** root
- **App Dir:** /root/accurate-sync
- **Backend Port:** 3000

---

## ✨ Next Steps

1. **Deploy ke VPS**
   ```bash
   ./deploy-invoice-history.sh
   ```

2. **Verifikasi**
   ```bash
   ./verify-invoice-history.sh
   ```

3. **Test API**
   ```bash
   ./test-invoice-history-api.sh
   ```

4. **Monitor**
   - Check logs regularly
   - Monitor API usage
   - Verify data accuracy

5. **Integrate Frontend**
   - Use API endpoints
   - Display history timeline
   - Show user tracking

---

## 📄 License

Part of Accurate Sync Integration System

---

## 👨‍💻 Developer Notes

### Database Schema
- Table: `sales_invoice_history`
- View: `v_sales_invoice_history`
- Indexes: id, sales_order_id, so_id, created_at

### API Response Format
```json
{
  "success": true,
  "data": [...],
  "message": "Optional message"
}
```

### Error Handling
- All errors logged
- User-friendly error messages
- Proper HTTP status codes

### Performance
- Pagination support
- Indexed queries
- Efficient JSON storage

---

**Ready to deploy? Start with:** [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md)
