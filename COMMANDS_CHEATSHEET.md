# 🎯 Commands Cheatsheet - Quick Reference

## 🚀 Deployment Commands

### Auto Deploy (Recommended)
```bash
# Linux/Mac
chmod +x deploy.sh && ./deploy.sh

# Windows
deploy.bat
```

### Manual Deploy
```bash
# 1. Backup
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup_$(date +%Y%m%d).sql

# 2. Pull
git pull origin main

# 3. Migrate
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/
docker exec -it iware-mysql mysql -u root -p iware_warehouse -e "source /tmp/add-sales-invoice-history.sql"

# 4. Rebuild
docker-compose down && docker-compose build --no-cache && docker-compose up -d

# 5. Verify
docker-compose ps && curl http://localhost:5000/health
```

---

## 🐳 Docker Commands

### Container Management
```bash
# Start all
docker-compose up -d

# Stop all
docker-compose down

# Restart specific
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql

# Rebuild specific
docker-compose build backend
docker-compose build frontend

# Rebuild all (no cache)
docker-compose build --no-cache

# View status
docker-compose ps

# View stats
docker stats
```

### Logs
```bash
# All logs (follow)
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50 backend

# Last 100 lines all services
docker-compose logs --tail=100

# Since 1 hour ago
docker-compose logs --since 1h backend
```

### Execute Commands in Container
```bash
# Backend shell
docker exec -it iware-backend bash

# MySQL shell
docker exec -it iware-mysql mysql -u root -p

# Run Node script
docker exec -it iware-backend node src/scripts/test-invoice-history.js
```

---

## 🗄️ Database Commands

### Backup & Restore
```bash
# Backup
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup.sql

# Backup with timestamp
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup.sql

# Backup all databases
docker exec iware-mysql mysqldump -u root -p --all-databases > backup_all.sql
```

### Migration
```bash
# Copy SQL file
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/

# Run migration
docker exec -it iware-mysql mysql -u root -p iware_warehouse -e "source /tmp/add-sales-invoice-history.sql"

# Or interactive
docker exec -it iware-mysql mysql -u root -p iware_warehouse
mysql> source /tmp/add-sales-invoice-history.sql;
mysql> exit;
```

### Query Database
```bash
# Show tables
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SHOW TABLES;"

# Describe table
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; DESCRIBE sales_invoice_history;"

# Count records
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SELECT COUNT(*) FROM sales_invoice_history;"

# Show recent history
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SELECT * FROM sales_invoice_history ORDER BY created_at DESC LIMIT 10;"

# Check table exists
docker exec -it iware-mysql mysql -u root -p -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';"
```

### Database Size
```bash
docker exec -it iware-mysql mysql -u root -p -e "
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'iware_warehouse'
ORDER BY (data_length + index_length) DESC;
"
```

---

## 🔍 Verification Commands

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# API health
curl http://localhost:5000/api/health

# Frontend (should return HTML)
curl http://localhost:3000

# With formatted output (requires jq)
curl -s http://localhost:5000/health | jq
```

### Test API Endpoints
```bash
# Login & get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}' \
  | jq -r '.data.token')

# Test recent history
curl -s "http://localhost:5000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test by status
curl -s "http://localhost:5000/api/sales-invoice-history/status/Sebagian%20diproses" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test sync
curl -s -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-01","endDate":"2026-04-20"}' | jq
```

### Check Container Status
```bash
# All containers
docker-compose ps

# Specific container
docker ps | grep iware-backend
docker ps | grep iware-frontend
docker ps | grep iware-mysql

# Container health
docker inspect iware-backend | grep -A 10 Health
```

---

## 🔧 Troubleshooting Commands

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend

# Full restart (down + up)
docker-compose down && docker-compose up -d
```

### Clear & Rebuild
```bash
# Remove containers
docker-compose down

# Remove containers + volumes (CAREFUL!)
docker-compose down -v

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

### Check Errors
```bash
# Backend errors
docker-compose logs backend | grep -i error

# MySQL errors
docker-compose logs mysql | grep -i error

# All errors
docker-compose logs | grep -i error

# Count errors
docker-compose logs backend | grep -ic error
```

### Network Issues
```bash
# List networks
docker network ls

# Inspect network
docker network inspect iware-network

# Test connectivity
docker exec iware-backend ping iware-mysql
docker exec iware-backend ping iware-frontend
```

---

## 📊 Monitoring Commands

### Resource Usage
```bash
# Real-time stats
docker stats

# One-time stats
docker stats --no-stream

# Specific container
docker stats iware-backend --no-stream
```

### Disk Usage
```bash
# Docker disk usage
docker system df

# Detailed
docker system df -v

# Container sizes
docker ps -s
```

### Process List
```bash
# Processes in backend
docker exec iware-backend ps aux

# Top processes
docker exec iware-backend top -bn1
```

---

## 🔄 Git Commands

### Pull & Update
```bash
# Pull latest
git pull origin main

# Pull with stash
git stash
git pull origin main
git stash pop

# Check status
git status

# View changes
git diff

# View commit history
git log --oneline -10
```

### Rollback
```bash
# Revert last commit
git revert HEAD

# Reset to specific commit (CAREFUL!)
git reset --hard [commit-hash]

# View commit to rollback to
git log --oneline
```

---

## 🧪 Testing Commands

### Run Test Script
```bash
# From host
cd backend
node src/scripts/test-invoice-history.js

# From container
docker exec -it iware-backend node src/scripts/test-invoice-history.js

# With specific SO ID
docker exec -it iware-backend node src/scripts/test-invoice-history.js 12345
```

### Manual API Tests
```bash
# Test with curl (see "Test API Endpoints" section above)

# Test with Postman
# Import collection and set token variable

# Load test (requires apache bench)
ab -n 100 -c 10 http://localhost:5000/health
```

---

## 📁 File Operations

### Copy Files
```bash
# Copy to container
docker cp local-file.txt iware-backend:/app/

# Copy from container
docker cp iware-backend:/app/file.txt ./

# Copy SQL file
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/
```

### View Files
```bash
# View file in container
docker exec iware-backend cat /app/package.json

# View logs
docker exec iware-backend cat /app/logs/all-2026-04-20.log

# Tail logs
docker exec iware-backend tail -f /app/logs/all-2026-04-20.log
```

---

## 🔐 Security Commands

### Check Environment
```bash
# View env in container
docker exec iware-backend env

# View specific env
docker exec iware-backend env | grep DB_

# Check .env file
cat .env

# Verify no .env in git
git ls-files | grep .env
```

### Generate Secrets
```bash
# Random password
openssl rand -base64 32

# JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# UUID
uuidgen
```

---

## 📝 Maintenance Commands

### Cleanup Old Data
```bash
# Delete old history (90 days)
docker exec -it iware-mysql mysql -u root -p -e "
USE iware_warehouse;
DELETE FROM sales_invoice_history 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
"

# Delete old logs
find backend/logs -name "*.log" -mtime +30 -delete

# Cleanup Docker
docker system prune -a
```

### Backup Rotation
```bash
# Keep only last 7 backups
ls -t backup_*.sql | tail -n +8 | xargs rm -f

# Compress old backups
gzip backup_*.sql

# Move to archive
mv backup_*.sql.gz /path/to/archive/
```

---

## 🎯 One-Liners

```bash
# Full deploy in one line
git pull && docker-compose down && docker-compose build --no-cache && docker-compose up -d

# Backup + restart
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup_$(date +%Y%m%d).sql && docker-compose restart

# Check all services healthy
docker-compose ps && curl -s http://localhost:5000/health | jq

# View all errors today
docker-compose logs --since $(date +%Y-%m-%d) | grep -i error

# Quick rollback
docker-compose down && git revert HEAD && docker-compose up -d
```

---

## 💡 Tips

### Aliases (add to ~/.bashrc or ~/.zshrc)
```bash
alias dc='docker-compose'
alias dcl='docker-compose logs -f'
alias dcp='docker-compose ps'
alias dcr='docker-compose restart'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'

# Usage: dc ps, dcl backend, etc.
```

### Watch Commands
```bash
# Watch container status
watch -n 2 docker-compose ps

# Watch logs
watch -n 1 'docker-compose logs --tail=20 backend'

# Watch disk usage
watch -n 5 docker system df
```

---

## 📞 Emergency Commands

### If Everything Breaks
```bash
# 1. Stop everything
docker-compose down

# 2. Restore database
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup_latest.sql

# 3. Revert code
git reset --hard HEAD~1

# 4. Rebuild
docker-compose build --no-cache

# 5. Start
docker-compose up -d

# 6. Check
docker-compose ps && docker-compose logs -f
```

### If Database Corrupted
```bash
# Stop MySQL
docker-compose stop mysql

# Backup current state
docker cp iware-mysql:/var/lib/mysql ./mysql-backup-corrupted

# Restore from backup
docker exec -i iware-mysql mysql -u root -p iware_warehouse < backup_good.sql

# Start MySQL
docker-compose start mysql
```

---

**Print this page for quick reference! 📄**

**Tip:** Use `Ctrl+F` to search for specific commands.
