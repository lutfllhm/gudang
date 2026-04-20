# Deployment Checklist - Histori Faktur Penjualan

## Pre-Deployment ✅

- [ ] Backup database sudah dibuat
- [ ] Semua file sudah di-commit ke git
- [ ] VPS accessible (ssh root@212.85.26.166)
- [ ] Docker dan docker-compose running di VPS

## Deployment Steps

### 1. Database Migration
- [ ] File `add-sales-invoice-history.sql` uploaded ke VPS
- [ ] Migration berhasil dijalankan
- [ ] Tabel `sales_invoice_history` sudah ada
- [ ] View `v_sales_invoice_history` sudah ada

**Verify:**
```bash
docker-compose exec db mysql -u root -p accurate_sync -e "SHOW TABLES LIKE '%invoice%';"
```

### 2. Backend Files Upload
- [ ] `SalesInvoiceHistoryController.js` uploaded
- [ ] `SalesInvoiceHistory.js` (model) uploaded
- [ ] `CustomerService.js` uploaded
- [ ] `SyncService.js` uploaded
- [ ] `salesInvoiceHistory.js` (routes) uploaded

**Verify:**
```bash
ls -la /root/accurate-sync/backend/src/controllers/SalesInvoiceHistoryController.js
ls -la /root/accurate-sync/backend/src/models/SalesInvoiceHistory.js
ls -la /root/accurate-sync/backend/src/services/CustomerService.js
ls -la /root/accurate-sync/backend/src/services/SyncService.js
ls -la /root/accurate-sync/backend/src/routes/salesInvoiceHistory.js
```

### 3. Backend Restart
- [ ] Backend container restarted
- [ ] Backend container status: Up
- [ ] No errors in logs

**Verify:**
```bash
docker-compose ps | grep backend
docker-compose logs --tail=50 backend
```

## Post-Deployment Testing

### 4. Database Verification
- [ ] Table structure correct
- [ ] View accessible
- [ ] Can insert test record

**Verify:**
```bash
docker-compose exec db mysql -u root -p accurate_sync -e "DESCRIBE sales_invoice_history;"
docker-compose exec db mysql -u root -p accurate_sync -e "SELECT * FROM v_sales_invoice_history LIMIT 1;"
```

### 5. API Testing
- [ ] Health endpoint working
- [ ] Login endpoint working
- [ ] Token obtained successfully

**Verify:**
```bash
curl http://212.85.26.166:3000/health
curl -X POST http://212.85.26.166:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### 6. Invoice History Endpoints
- [ ] GET /api/sales-invoice-history/recent - Working
- [ ] GET /api/sales-invoice-history/order/:orderId - Working
- [ ] GET /api/sales-invoice-history/so/:soId - Working
- [ ] GET /api/sales-invoice-history/status/:status - Working
- [ ] POST /api/sales-invoice-history/sync - Working

**Verify:**
```bash
# Get recent (replace YOUR_TOKEN)
curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Manual sync
curl -X POST http://212.85.26.166:3000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-01-01","endDate":"2026-12-31","pageSize":100}'
```

### 7. Auto Sync Integration
- [ ] Auto sync enabled in config
- [ ] Invoice history sync runs with auto sync
- [ ] No errors in sync logs

**Verify:**
```bash
# Check sync config
curl -X GET http://212.85.26.166:3000/api/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trigger manual sync and check logs
docker-compose logs -f backend | grep -i "invoice\|history"
```

## Monitoring Setup

### 8. Logging
- [ ] Invoice history logs visible
- [ ] Error logs configured
- [ ] Log rotation working

**Verify:**
```bash
cd /root/accurate-sync/backend/logs
ls -lh | grep invoice
tail -f all-*.log | grep -i invoice
```

### 9. Performance
- [ ] API response time < 2s
- [ ] Database queries optimized
- [ ] No memory leaks

**Verify:**
```bash
# Check response time
time curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check container resources
docker stats --no-stream
```

## Rollback Plan (If Needed)

### If Something Goes Wrong:

1. **Restore Database:**
```bash
cd /root/accurate-sync/backend
docker-compose exec -T db mysql -u root -p accurate_sync < backup_YYYYMMDD.sql
```

2. **Revert Files:**
```bash
cd /root/accurate-sync
git checkout HEAD~1 backend/src/
```

3. **Restart Backend:**
```bash
docker-compose restart backend
```

## Success Criteria

✅ All checklist items completed
✅ All API endpoints responding correctly
✅ No errors in logs
✅ Database records being created
✅ Auto sync working
✅ Performance acceptable

## Sign-off

- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] All tests passed: Yes / No
- [ ] Issues found: ________________
- [ ] Notes: ________________

## Next Steps

After successful deployment:

1. **Monitor for 24 hours:**
   - Check logs regularly
   - Monitor API usage
   - Check database growth

2. **User Acceptance Testing:**
   - Test with real data
   - Verify accuracy of history
   - Check user permissions

3. **Documentation:**
   - Update API documentation
   - Train users if needed
   - Document any issues found

4. **Optimization:**
   - Add indexes if needed
   - Optimize slow queries
   - Adjust sync frequency

## Support

**Documentation:**
- Full docs: `INVOICE_HISTORY_INTEGRATION.md`
- Quick start: `QUICK_START_INVOICE_HISTORY.md`
- Windows guide: `DEPLOY_WINDOWS.md`
- Summary: `SUMMARY_INVOICE_HISTORY.md`

**Scripts:**
- Deploy: `./deploy-invoice-history.sh`
- Verify: `./verify-invoice-history.sh`
- Test: `./test-invoice-history-api.sh`

**Logs Location:**
- Backend: `/root/accurate-sync/backend/logs/`
- Docker: `docker-compose logs backend`

**Database:**
- Host: localhost (in container)
- Database: accurate_sync
- Table: sales_invoice_history
- View: v_sales_invoice_history
