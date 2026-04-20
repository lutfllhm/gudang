# 🚀 Quick Deploy Guide - Sales Invoice History

## Ringkasan Singkat untuk Deploy ke VPS Docker

---

## ⚡ Quick Steps (5 Menit)

```bash
# 1. SSH ke VPS
ssh user@your-vps-ip

# 2. Masuk ke direktori project
cd /path/to/iware-warehouse

# 3. Backup database
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup_$(date +%Y%m%d).sql

# 4. Pull latest code
git pull origin main

# 5. Database migration
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/
docker exec -it iware-mysql mysql -u root -p iware_warehouse -e "source /tmp/add-sales-invoice-history.sql"

# 6. Rebuild & restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 7. Verify
docker-compose ps
docker-compose logs -f backend

# 8. Test
curl http://localhost:5000/health
```

---

## 📋 Detailed Commands

### 1. Backup Database
```bash
# Backup full database
docker exec iware-mysql mysqldump -u root -p[PASSWORD] iware_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### 2. Pull Code
```bash
# Pull latest
git pull origin main

# Jika ada conflict
git stash
git pull origin main
git stash pop
```

### 3. Database Migration
```bash
# Copy SQL file ke container
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/

# Run migration
docker exec -i iware-mysql mysql -u root -p[PASSWORD] iware_warehouse < /tmp/add-sales-invoice-history.sql

# Verify
docker exec -it iware-mysql mysql -u root -p[PASSWORD] -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';"
```

### 4. Rebuild Containers
```bash
# Stop
docker-compose down

# Rebuild (no cache)
docker-compose build --no-cache

# Start
docker-compose up -d

# Check status
docker-compose ps
```

### 5. Check Logs
```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50 backend
```

### 6. Test API
```bash
# Health check
curl http://localhost:5000/health

# Login & get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}' \
  | jq -r '.data.token')

# Test new endpoint
curl "http://localhost:5000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Troubleshooting Quick Fix

### Backend tidak start?
```bash
docker-compose logs backend
docker-compose restart backend
```

### Migration error?
```bash
# Drop table & retry
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; DROP TABLE IF EXISTS sales_invoice_history;"
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backend/database/add-sales-invoice-history.sql
```

### Frontend tidak update?
```bash
docker-compose build --no-cache frontend
docker-compose restart frontend
```

### Database connection error?
```bash
docker-compose restart mysql
docker-compose restart backend
```

---

## 🔄 Rollback (Jika Ada Masalah)

```bash
# 1. Stop containers
docker-compose down

# 2. Restore database
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup_20260420.sql

# 3. Revert code
git revert HEAD

# 4. Rebuild
docker-compose build
docker-compose up -d
```

---

## ✅ Verification Checklist

```bash
# 1. Containers running?
docker-compose ps
# Expected: All containers "Up"

# 2. Backend healthy?
curl http://localhost:5000/health
# Expected: {"success":true,...}

# 3. Database table exists?
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';"
# Expected: sales_invoice_history

# 4. API endpoint works?
curl "http://localhost:5000/api/sales-invoice-history/recent" -H "Authorization: Bearer $TOKEN"
# Expected: {"success":true,"data":[...]}

# 5. Frontend accessible?
curl http://localhost:3000
# Expected: HTML response
```

---

## 📞 Emergency Contacts

**Jika ada masalah:**
1. Cek logs: `docker-compose logs -f backend`
2. Restart: `docker-compose restart backend`
3. Rollback: Lihat section "Rollback" di atas
4. Contact: Tim development

---

## 📚 Full Documentation

- **Deployment Detail**: `DEPLOY_DOCKER_VPS.md`
- **Fitur Documentation**: `FITUR_HISTORY_FAKTUR.md`
- **API Reference**: `API_HISTORY_FAKTUR.md`

---

**Print this page and keep it handy! 📄**
