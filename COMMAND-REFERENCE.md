# 📖 Command Reference - iWare Warehouse

Quick reference untuk command-command yang sering digunakan.

---

## 🚀 Docker Commands

### Start/Stop Services

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart nginx
```

### View Logs

```bash
# All logs
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# Specific service
docker compose logs backend
docker compose logs nginx

# Last 100 lines
docker compose logs --tail=100 backend
```

### Check Status

```bash
# List all containers
docker compose ps

# Docker stats (CPU, Memory)
docker stats

# Check health
docker compose ps | grep healthy
```

### Execute Commands in Container

```bash
# Backend shell
docker compose exec backend sh

# MySQL shell
docker compose exec mysql mysql -u accurate_user -p iware_warehouse

# Nginx shell
docker compose exec nginx sh

# Run script
docker compose exec backend node src/scripts/test-accurate-connection.js
```

---

## 🔧 Application Management

### Create Admin User

```bash
docker compose exec backend node src/scripts/create-admin-auto.js
```

### Test Health

```bash
# Backend health
curl http://localhost:5000/health

# Nginx health
curl http://localhost/health

# Or with domain
curl https://your-domain.com/health
```

### Test Accurate Connection

```bash
docker compose exec backend npm run test:accurate
```

### Manual Sync

```bash
# Get JWT token first
TOKEN="your_jwt_token"

# Sync items
curl -X POST http://localhost:5000/api/sync/items \
  -H "Authorization: Bearer $TOKEN"

# Sync sales orders
curl -X POST http://localhost:5000/api/sync/sales-orders \
  -H "Authorization: Bearer $TOKEN"

# Sync all
curl -X POST http://localhost:5000/api/sync/all \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ Database Management

### Connect to MySQL

```bash
# Connect
docker compose exec mysql mysql -u accurate_user -p iware_warehouse

# Or as root
docker compose exec mysql mysql -u root -p
```

### Common SQL Queries

```sql
-- Check items count
SELECT COUNT(*) FROM items;

-- Check sales orders count
SELECT COUNT(*) FROM sales_orders;

-- View recent items
SELECT * FROM items ORDER BY created_at DESC LIMIT 10;

-- View recent sales orders
SELECT * FROM sales_orders ORDER BY tanggal_so DESC LIMIT 10;

-- Check sync status
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 10;

-- Check active tokens
SELECT user_id, expires_at, is_active FROM accurate_tokens WHERE is_active = 1;

-- Exit
exit
```

### Backup Database

```bash
# Backup
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup-$(date +%Y%m%d).sql

# Restore
docker compose exec -T mysql mysql -u root -p iware_warehouse < backup-20260311.sql
```

---

## 🔒 SSL/HTTPS Management

### Generate Let's Encrypt Certificate

```bash
# Stop Nginx
docker compose stop nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Set permissions
sudo chmod 600 nginx/ssl/*.pem

# Start Nginx
docker compose up -d nginx
```

### Renew Certificate

```bash
# Test renewal
sudo certbot renew --dry-run

# Renew
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Reload Nginx
docker compose exec nginx nginx -s reload
```

### Check Certificate

```bash
# View certificate details
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check expiry date
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

---

## 🔄 Nginx Management

### Test Configuration

```bash
docker compose exec nginx nginx -t
```

### Reload Configuration

```bash
# Reload without downtime
docker compose exec nginx nginx -s reload

# Or restart
docker compose restart nginx
```

### View Nginx Logs

```bash
# Access logs
docker compose exec nginx tail -f /var/log/nginx/access.log

# Error logs
docker compose exec nginx tail -f /var/log/nginx/error.log

# Logs on host
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

---

## 📊 Monitoring

### Check Resources

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h

# Docker disk usage
docker system df

# Check specific container
docker stats iware-backend
```

### Check Logs

```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Nginx logs
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log

# Docker logs
docker compose logs -f backend
docker compose logs -f nginx
```

### Check Processes

```bash
# All Docker containers
docker ps

# Processes in container
docker compose exec backend ps aux
docker compose exec nginx ps aux
```

---

## 🧹 Cleanup

### Clean Docker

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# Clean build cache
docker builder prune
```

### Clean Logs

```bash
# Truncate logs
truncate -s 0 nginx/logs/*.log
truncate -s 0 backend/logs/*.log

# Or delete old logs
find nginx/logs -name "*.log" -mtime +7 -delete
find backend/logs -name "*.log" -mtime +7 -delete
```

---

## 🔄 Update Application

### Pull Latest Code

```bash
cd /home/iware/apps/iware-warehouse

# Pull from git
git pull

# Or upload via SCP
scp -r ./iware-warehouse user@vps:/home/iware/apps/
```

### Rebuild & Restart

```bash
# Rebuild images
docker compose build

# Restart services
docker compose up -d

# Check logs
docker compose logs -f
```

### Update Specific Service

```bash
# Rebuild backend only
docker compose build backend

# Restart backend only
docker compose up -d backend

# Check logs
docker compose logs -f backend
```

---

## 🐛 Troubleshooting

### Backend Issues

```bash
# Check logs
docker compose logs backend

# Check environment
docker compose exec backend env | grep ACCURATE

# Restart
docker compose restart backend

# Rebuild
docker compose build backend
docker compose up -d backend
```

### Database Issues

```bash
# Check MySQL status
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Connect to MySQL
docker compose exec mysql mysql -u root -p

# Restart MySQL
docker compose restart mysql
```

### Nginx Issues

```bash
# Test config
docker compose exec nginx nginx -t

# Check logs
docker compose logs nginx

# Reload config
docker compose exec nginx nginx -s reload

# Restart
docker compose restart nginx
```

### Network Issues

```bash
# Check network
docker network ls

# Inspect network
docker network inspect iware-warehouse_iware-network

# Test connectivity
docker compose exec backend ping mysql
docker compose exec backend ping redis
docker compose exec nginx ping backend
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R $USER:$USER .
chmod 755 nginx/ssl nginx/logs backend/logs
chmod 600 nginx/ssl/*.pem
```

---

## 🔐 Security

### Change Passwords

```bash
# Edit .env
nano .env

# Edit backend/.env
nano backend/.env

# Restart services
docker compose restart
```

### Check Open Ports

```bash
# UFW status
sudo ufw status

# Netstat
netstat -tulpn | grep LISTEN

# Docker ports
docker compose ps
```

### Update System

```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io
```

---

## 📦 Backup & Restore

### Full Backup

```bash
# Create backup directory
mkdir -p /home/iware/backups

# Backup database
docker compose exec mysql mysqldump -u root -p iware_warehouse > /home/iware/backups/db-$(date +%Y%m%d).sql

# Backup files
tar -czf /home/iware/backups/files-$(date +%Y%m%d).tar.gz \
  backend/.env \
  .env \
  nginx/nginx.conf \
  nginx/ssl

# Backup to remote
scp /home/iware/backups/* user@backup-server:/backups/
```

### Restore

```bash
# Restore database
docker compose exec -T mysql mysql -u root -p iware_warehouse < /home/iware/backups/db-20260311.sql

# Restore files
tar -xzf /home/iware/backups/files-20260311.tar.gz
```

---

## 🎯 Quick Commands

### One-Line Commands

```bash
# Restart everything
docker compose restart

# View all logs
docker compose logs -f

# Check all health
docker compose ps | grep healthy

# Clean everything
docker system prune -a && docker volume prune

# Backup database
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup.sql

# Test Accurate
docker compose exec backend npm run test:accurate

# Create admin
docker compose exec backend node src/scripts/create-admin-auto.js
```

---

## 📞 Help

### Get Help

```bash
# Docker Compose help
docker compose --help

# Docker help
docker --help

# Nginx help
docker compose exec nginx nginx -h

# Node.js version
docker compose exec backend node --version
```

### Check Versions

```bash
# Docker version
docker --version

# Docker Compose version
docker compose version

# Node.js version
docker compose exec backend node --version

# MySQL version
docker compose exec mysql mysql --version

# Nginx version
docker compose exec nginx nginx -v
```

---

**Simpan file ini untuk referensi cepat!** 📖
