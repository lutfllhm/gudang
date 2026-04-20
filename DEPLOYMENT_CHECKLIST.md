# 📋 Deployment Checklist - Sales Invoice History

## Pre-Deployment

### Persiapan
- [ ] Backup database sudah dibuat
- [ ] Code sudah di-pull dari repository
- [ ] Environment variables sudah dicek
- [ ] Team sudah diinformasikan tentang deployment
- [ ] Maintenance window sudah dijadwalkan (jika perlu)

### Verifikasi File
- [ ] `backend/database/add-sales-invoice-history.sql` ada
- [ ] `backend/src/models/SalesInvoiceHistory.js` ada
- [ ] `backend/src/services/CustomerService.js` ada
- [ ] `backend/src/controllers/SalesInvoiceHistoryController.js` ada
- [ ] `backend/src/routes/salesInvoiceHistory.js` ada
- [ ] `backend/server.js` sudah updated
- [ ] `frontend/src/components/SalesInvoiceHistory.jsx` ada
- [ ] `frontend/src/pages/SalesOrdersPage.jsx` sudah updated

---

## Deployment Steps

### 1. Backup (CRITICAL!)
```bash
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql
```
- [ ] Backup berhasil dibuat
- [ ] File backup sudah dicek (tidak 0 bytes)
- [ ] Backup disimpan di lokasi aman

### 2. Pull Code
```bash
git pull origin main
```
- [ ] Code berhasil di-pull
- [ ] Tidak ada conflict
- [ ] Semua file baru sudah ada

### 3. Database Migration
```bash
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/
docker exec -it iware-mysql mysql -u root -p iware_warehouse -e "source /tmp/add-sales-invoice-history.sql"
```
- [ ] File SQL berhasil di-copy ke container
- [ ] Migration berhasil dijalankan
- [ ] Tidak ada error message
- [ ] Tabel `sales_invoice_history` sudah dibuat
- [ ] View `v_sales_invoice_history` sudah dibuat

### 4. Verify Database
```bash
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';"
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; DESCRIBE sales_invoice_history;"
```
- [ ] Tabel ada di database
- [ ] Struktur tabel sesuai
- [ ] View bisa di-query

### 5. Rebuild Backend
```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```
- [ ] Build berhasil tanpa error
- [ ] Container backend running
- [ ] Tidak ada error di logs

### 6. Rebuild Frontend
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```
- [ ] Build berhasil tanpa error
- [ ] Container frontend running
- [ ] Tidak ada error di logs

### 7. Check Container Status
```bash
docker-compose ps
```
- [ ] Backend: Up
- [ ] Frontend: Up
- [ ] MySQL: Up
- [ ] Semua port sudah mapped

---

## Post-Deployment Verification

### Backend Health Check
```bash
curl http://localhost:5000/health
```
- [ ] Response: `{"success":true,...}`
- [ ] Status code: 200
- [ ] Uptime > 0

### API Endpoint Test
```bash
# Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}' \
  | jq -r '.data.token')

# Test endpoint
curl "http://localhost:5000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```
- [ ] Login berhasil, dapat token
- [ ] Endpoint `/sales-invoice-history/recent` accessible
- [ ] Response format benar
- [ ] Status code: 200

### Frontend Test
- [ ] Buka `http://your-vps-ip:3000` di browser
- [ ] Login berhasil
- [ ] Dashboard loading dengan benar
- [ ] Menu Sales Orders accessible
- [ ] Tabel sales orders tampil
- [ ] Tidak ada error di browser console

### Feature Test
- [ ] Cari sales order dengan status "Sebagian diproses"
- [ ] History muncul di bawah status badge
- [ ] Format history benar: "Buat Faktur Penjualan [nomor] oleh [nama]"
- [ ] Tanggal tampil dengan benar
- [ ] Styling sesuai (blue box dengan icon user)

### Logs Check
```bash
docker-compose logs --tail=100 backend
```
- [ ] Tidak ada error message
- [ ] Database connected successfully
- [ ] Server running message muncul
- [ ] Tidak ada warning kritis

---

## Optional: Sync History

```bash
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-01","endDate":"2026-04-20","pageSize":100}'
```
- [ ] Sync request berhasil
- [ ] Response: `{"success":true,...}`
- [ ] Data history masuk ke database
- [ ] History tampil di frontend

---

## Performance Check

### Resource Usage
```bash
docker stats --no-stream
```
- [ ] CPU usage normal (< 80%)
- [ ] Memory usage normal (< 80%)
- [ ] No memory leaks

### Response Time
- [ ] API response < 1 second
- [ ] Frontend load < 3 seconds
- [ ] Database query < 500ms

---

## Rollback Plan (If Needed)

### Jika Ada Masalah Kritis:

1. **Stop Containers**
   ```bash
   docker-compose down
   ```
   - [ ] Containers stopped

2. **Restore Database**
   ```bash
   docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup_20260420_143000.sql
   ```
   - [ ] Database restored
   - [ ] Data verified

3. **Revert Code**
   ```bash
   git revert HEAD
   ```
   - [ ] Code reverted
   - [ ] Commit pushed

4. **Rebuild & Restart**
   ```bash
   docker-compose build
   docker-compose up -d
   ```
   - [ ] Containers running
   - [ ] Application working

---

## Documentation

- [ ] Update CHANGELOG.md
- [ ] Update version number
- [ ] Document any issues encountered
- [ ] Update team wiki/documentation

---

## Communication

### Before Deployment
- [ ] Notify team about deployment schedule
- [ ] Inform users about potential downtime (if any)
- [ ] Prepare rollback plan

### After Deployment
- [ ] Notify team deployment is complete
- [ ] Share deployment summary
- [ ] Document any issues and solutions
- [ ] Update status page (if any)

---

## Final Checklist

- [ ] All containers running
- [ ] Database migration successful
- [ ] Backend API working
- [ ] Frontend accessible
- [ ] New feature working correctly
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Backup saved safely
- [ ] Team notified
- [ ] Documentation updated

---

## Sign-off

**Deployed by:** ___________________  
**Date:** ___________________  
**Time:** ___________________  
**Version:** 1.0.0  
**Status:** ⬜ Success  ⬜ Failed  ⬜ Rolled Back  

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Emergency Contacts

**Development Team:**
- Name: ___________________
- Phone: ___________________
- Email: ___________________

**DevOps/Infrastructure:**
- Name: ___________________
- Phone: ___________________
- Email: ___________________

---

**Keep this checklist for audit trail! 📋**

Print Date: ___________________  
Printed By: ___________________
