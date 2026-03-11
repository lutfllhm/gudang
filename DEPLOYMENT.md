# 🚀 iWare Warehouse - Deployment Guide

## 📋 Daftar Isi
1. [Persiapan VPS](#persiapan-vps)
2. [Instalasi Docker](#instalasi-docker)
3. [Setup Project](#setup-project)
4. [Konfigurasi Environment](#konfigurasi-environment)
5. [Deploy Aplikasi](#deploy-aplikasi)
6. [Verifikasi Deployment](#verifikasi-deployment)
7. [Setup SSL/HTTPS](#setup-ssl-https)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## 🖥️ Persiapan VPS

### Spesifikasi VPS
- Provider: Hostinger KVM 2
- OS: Ubuntu 22.04
- RAM: Minimal 2GB
- Storage: Minimal 20GB
- Domain: iwareid.com (sudah diarahkan ke IP VPS)

### 1. Login ke VPS
```bash
ssh root@your_vps_ip
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Dependencies
```bash
apt install -y curl wget git nano ufw
```

### 4. Setup Firewall
```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP & HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 🐳 Instalasi Docker

### 1. Install Docker
```bash
# Remove old versions
apt remove docker docker-engine docker.io containerd runc

# Install dependencies
apt install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Start Docker Service
```bash
systemctl start docker
systemctl enable docker
systemctl status docker
```

---

## 📦 Setup Project

### 1. Clone Repository
```bash
# Create project directory
mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/your-username/iware-warehouse.git
cd iware-warehouse

# Or upload files manually using SCP/SFTP
```

### 2. Set Permissions
```bash
chmod +x scripts/*.sh
```

---

## ⚙️ Konfigurasi Environment

### 1. Copy Environment Template
```bash
cp .env.production .env.production.local
```

### 2. Edit Environment Variables
```bash
nano .env.production
```

### 3. Generate Secure Secrets
```bash
# Generate JWT Secret (32+ characters)
openssl rand -hex 32

# Generate another secret for refresh token
openssl rand -hex 32

# Generate webhook secret
openssl rand -hex 32
```

### 4. Konfigurasi Wajib Diisi

```env
# Database passwords
MYSQL_ROOT_PASSWORD=your_strong_root_password
DB_PASSWORD=your_strong_db_password

# Redis password
REDIS_PASSWORD=your_strong_redis_password

# JWT secrets (gunakan hasil generate di atas)
JWT_SECRET=hasil_generate_openssl_rand_hex_32
JWT_REFRESH_SECRET=hasil_generate_openssl_rand_hex_32_lainnya

# Accurate Online API (dari developer portal)
ACCURATE_APP_KEY=your_app_key
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_SIGNATURE_SECRET=your_signature_secret

# Domain
CORS_ORIGIN=https://iwareid.com
VITE_API_URL=https://iwareid.com/api
```

---

## 🚀 Deploy Aplikasi

### 1. Build dan Start Containers
```bash
# Menggunakan script deploy
./scripts/deploy.sh

# Atau manual
docker compose --env-file .env.production up -d --build
```

### 2. Monitor Logs
```bash
# Semua services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### 3. Check Container Status
```bash
docker compose ps
```

**⏱️ PENTING: Tunggu 2-3 menit** untuk semua container menjadi healthy!

Output yang diharapkan:
```
NAME              STATUS                    PORTS
iware-mysql       Up (healthy)             0.0.0.0:3306->3306/tcp
iware-redis       Up (healthy)             0.0.0.0:6379->6379/tcp
iware-backend     Up (healthy)             0.0.0.0:5000->5000/tcp
iware-frontend    Up (healthy)             0.0.0.0:3000->80/tcp
iware-nginx       Up (healthy)             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

**Jika status masih "starting":**
- Tunggu beberapa menit lagi
- Check logs: `docker compose logs -f`
- Lihat [HEALTHCHECK-INFO.md](HEALTHCHECK-INFO.md) untuk detail

### 4. Initialize Database (First Time Only)
```bash
# Initialize database dan create admin user
./scripts/init-database.sh

# Atau manual:
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} < backend/database/schema.sql
docker compose exec backend node src/scripts/create-admin-auto.js
```

**Output yang diharapkan:**
```
✓ Database initialized successfully
✓ Admin user created
Username: admin
Password: [generated password]
```

**⚠️ SIMPAN PASSWORD ADMIN INI!**

---

## ✅ Verifikasi Deployment

### 1. Health Check Script
```bash
./scripts/health-check.sh
```

### 2. Manual Health Checks
```bash
# MySQL
docker compose exec mysql mysqladmin ping -h localhost -u root -p

# Redis
docker compose exec redis redis-cli -a your_redis_password ping

# Backend
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000/health

# Nginx
curl http://localhost:80/health
```

### 3. Test dari Browser
- Frontend: http://iwareid.com
- Backend API: http://iwareid.com/api/health
- Health Check: http://iwareid.com/health

### 4. Test Login ke Aplikasi
```bash
# Buka browser dan akses
http://iwareid.com

# Login dengan:
Username: admin
Password: [password dari init-database.sh]
```

**✅ Jika bisa login, deployment BERHASIL!**

### 5. Test API Endpoints
```bash
# Test backend API
curl http://iwareid.com/api/health

# Expected response:
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-03-11T10:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "2.0.0"
}
```

### 6. Verify All Services Working
```bash
# Run comprehensive health check
./scripts/health-check.sh

# Run connection test
./scripts/test-connection.sh
```

**Expected output:**
```
========================================
Container Status:
✓ MySQL is healthy
✓ Redis is healthy
✓ Backend is healthy
✓ Frontend is healthy
✓ Nginx is healthy
========================================
```

---

## 🎉 Deployment Berhasil!

Jika semua langkah di atas berhasil, aplikasi Anda sudah running dengan baik!

### Akses Aplikasi:
- **Frontend:** http://iwareid.com
- **Backend API:** http://iwareid.com/api
- **Health Check:** http://iwareid.com/health

### Next Steps:
1. ✅ Setup SSL/HTTPS (lihat section berikutnya)
2. ✅ Configure automated backups
3. ✅ Setup monitoring
4. ✅ Test all features
5. ✅ Document admin credentials securely

---

## 🔒 Setup SSL/HTTPS

### 1. Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Stop Nginx Container
```bash
docker compose stop nginx
```

### 3. Generate SSL Certificate
```bash
certbot certonly --standalone -d iwareid.com -d www.iwareid.com
```

### 4. Copy Certificates
```bash
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/iwareid.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/iwareid.com/privkey.pem nginx/ssl/
```

### 5. Enable HTTPS Configuration
Edit `nginx/conf.d/default.conf` dan uncomment bagian HTTPS server block.

### 6. Restart Nginx
```bash
docker compose up -d nginx
```

### 7. Auto-Renewal Setup
```bash
# Test renewal
certbot renew --dry-run

# Add cron job
crontab -e

# Add this line (renew every day at 2 AM)
0 2 * * * certbot renew --quiet && cp /etc/letsencrypt/live/iwareid.com/*.pem /var/www/iware-warehouse/nginx/ssl/ && docker compose -f /var/www/iware-warehouse/docker-compose.yml restart nginx
```

---

## 🔧 Troubleshooting

### Container Status "Unhealthy"

#### 1. Check Logs
```bash
# Lihat logs container yang unhealthy
docker compose logs backend
docker compose logs frontend
docker compose logs nginx
```

#### 2. Check Health Endpoint
```bash
# Test health endpoint langsung
docker compose exec backend wget -O- http://localhost:5000/health
docker compose exec frontend curl http://localhost:80/health
```

#### 3. Common Issues

**Backend Unhealthy:**
```bash
# Check database connection
docker compose exec backend node -e "require('./src/config/database').testConnection()"

# Check environment variables
docker compose exec backend env | grep DB_

# Restart backend
docker compose restart backend
```

**Frontend Unhealthy:**
```bash
# Check nginx config
docker compose exec frontend nginx -t

# Check if files exist
docker compose exec frontend ls -la /usr/share/nginx/html

# Restart frontend
docker compose restart frontend
```

**MySQL Unhealthy:**
```bash
# Check MySQL logs
docker compose logs mysql

# Check if MySQL is running
docker compose exec mysql mysqladmin ping -h localhost -u root -p

# Restart MySQL
docker compose restart mysql
```

**Redis Unhealthy:**
```bash
# Check Redis
docker compose exec redis redis-cli -a your_password ping

# Restart Redis
docker compose restart redis
```

#### 4. Network Issues
```bash
# Check network
docker network ls
docker network inspect iware-warehouse_iware-network

# Recreate network
docker compose down
docker compose up -d
```

#### 5. Port Conflicts
```bash
# Check if ports are already in use
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :3306
netstat -tulpn | grep :5000

# Kill process using the port
kill -9 <PID>
```

### Container Keeps Restarting

```bash
# Check restart count
docker compose ps

# Check logs for errors
docker compose logs --tail=100 <service_name>

# Check resource usage
docker stats

# Increase healthcheck start_period if needed
# Edit docker-compose.yml and increase start_period value
```

### Database Connection Failed

```bash
# Verify database credentials
docker compose exec mysql mysql -u root -p

# Check if database exists
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Recreate database
docker compose exec mysql mysql -u root -p -e "DROP DATABASE IF EXISTS iware_warehouse; CREATE DATABASE iware_warehouse;"

# Run schema
docker compose exec mysql mysql -u root -p iware_warehouse < backend/database/schema.sql
```

---

## 🛠️ Maintenance

### Restart Services
```bash
# Restart all
./scripts/restart.sh

# Restart specific service
./scripts/restart.sh backend
```

### View Logs
```bash
# All services
./scripts/logs.sh

# Specific service
./scripts/logs.sh nginx
```

### Backup Database
```bash
./scripts/backup.sh
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./scripts/deploy.sh
```

### Clean Up
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Complete cleanup
docker system prune -a --volumes
```

### Monitor Resources
```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Container resource limits
docker compose exec backend cat /sys/fs/cgroup/memory/memory.limit_in_bytes
```

---

## 📊 Useful Commands

### Docker Compose Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f [service]

# Execute command in container
docker compose exec [service] [command]

# Scale service
docker compose up -d --scale backend=3

# Update service
docker compose up -d --no-deps --build [service]
```

### Database Commands
```bash
# MySQL shell
docker compose exec mysql mysql -u root -p

# Import SQL
docker compose exec -T mysql mysql -u root -p iware_warehouse < backup.sql

# Export SQL
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup.sql
```

### Redis Commands
```bash
# Redis CLI
docker compose exec redis redis-cli -a your_password

# Check keys
docker compose exec redis redis-cli -a your_password KEYS '*'

# Flush all
docker compose exec redis redis-cli -a your_password FLUSHALL
```

---

## 🎯 Production Checklist

### Pre-Deployment
- [ ] VPS provisioned dan accessible
- [ ] Domain DNS configured
- [ ] Environment variables configured
- [ ] Strong passwords generated
- [ ] Accurate API credentials ready

### During Deployment
- [ ] Docker installed
- [ ] Firewall configured
- [ ] Project files uploaded
- [ ] Scripts executable (chmod +x)
- [ ] Containers started
- [ ] All containers healthy (tunggu 2-3 menit)
- [ ] Database initialized
- [ ] Admin user created

### Post-Deployment Verification
- [ ] Health checks passing
- [ ] Frontend accessible via domain
- [ ] Backend API responding
- [ ] Can login to application
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Logs monitoring setup
- [ ] No errors in logs

### Optional (Recommended)
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] Auto-renewal SSL configured
- [ ] Backup script scheduled
- [ ] Monitoring setup
- [ ] Admin credentials documented securely

---

## ✅ Verification Steps

### 1. Quick Verification
```bash
# All in one check
./scripts/health-check.sh && ./scripts/test-connection.sh
```

### 2. Manual Verification
```bash
# Check containers
docker compose ps | grep healthy

# Check frontend
curl -I http://iwareid.com

# Check backend
curl http://iwareid.com/api/health

# Check database
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Check Redis
docker compose exec redis redis-cli -a ${REDIS_PASSWORD} ping
```

### 3. Browser Verification
1. Open http://iwareid.com
2. Should see login page
3. Login with admin credentials
4. Should see dashboard
5. Check all menu items work

**✅ If all above pass, deployment is SUCCESSFUL!**

---

## 📞 Support

Jika mengalami masalah:
1. Check logs: `./scripts/logs.sh`
2. Run health check: `./scripts/health-check.sh`
3. Check container status: `docker compose ps`
4. Review troubleshooting section di atas

---

## 📝 Notes

- Semua password harus diganti dengan password yang kuat
- Backup database secara berkala
- Monitor logs untuk error
- Update aplikasi secara berkala
- Gunakan HTTPS di production
- Setup monitoring (optional: Prometheus, Grafana)

---

## 🚨 Common Deployment Issues

### Issue 1: Container Unhealthy After 5 Minutes
**Symptom:** Container status shows "unhealthy" setelah lama
**Solution:**
```bash
# Check logs
docker compose logs <service_name>

# Common causes:
# - Database connection failed
# - Port already in use
# - Environment variable missing

# Fix:
docker compose restart <service_name>
```

### Issue 2: Cannot Access Frontend
**Symptom:** Browser shows "Connection refused"
**Solution:**
```bash
# Check if nginx is running
docker compose ps nginx

# Check nginx logs
docker compose logs nginx

# Check if port 80 is open
ufw status | grep 80

# Restart nginx
docker compose restart nginx
```

### Issue 3: Backend API Not Responding
**Symptom:** API returns 502 Bad Gateway
**Solution:**
```bash
# Check backend status
docker compose ps backend

# Check backend logs
docker compose logs backend

# Check database connection
docker compose exec backend node -e "require('./src/config/database').testConnection()"

# Restart backend
docker compose restart backend
```

### Issue 4: Database Connection Failed
**Symptom:** Backend logs show "ECONNREFUSED mysql:3306"
**Solution:**
```bash
# Check MySQL is running
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Verify credentials
docker compose exec mysql mysql -u root -p

# Restart MySQL and backend
docker compose restart mysql
sleep 10
docker compose restart backend
```

### Issue 5: Redis Connection Failed
**Symptom:** Backend logs show "Redis connection error"
**Solution:**
```bash
# Check Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli -a ${REDIS_PASSWORD} ping

# Restart Redis and backend
docker compose restart redis
docker compose restart backend
```

---

## 📋 Deployment Summary

### Timeline
```
1. Persiapan VPS (10 menit)
   - Update system
   - Install Docker
   - Setup firewall

2. Setup Project (5 menit)
   - Clone repository
   - Configure environment
   - Set permissions

3. Deploy (5 menit)
   - Build containers
   - Start services
   - Wait for healthy

4. Verify (5 menit)
   - Health checks
   - Test access
   - Test login

Total: ~25-30 menit
```

### Success Criteria
✅ All containers status: "Up (healthy)"
✅ Frontend accessible via domain
✅ Backend API responding
✅ Can login to application
✅ No errors in logs

### If Deployment Fails
1. Check logs: `./scripts/logs.sh`
2. Run debug: `./scripts/debug.sh <service>`
3. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. Restart services: `./scripts/restart.sh`

---

## 🎓 Post-Deployment

### Immediate (Day 1)
- [ ] Verify all features working
- [ ] Test Accurate integration
- [ ] Setup SSL certificate
- [ ] Configure backups
- [ ] Document admin credentials

### Within Week 1
- [ ] Monitor logs daily
- [ ] Test backup/restore
- [ ] Setup monitoring alerts
- [ ] Performance testing
- [ ] Security audit

### Ongoing
- [ ] Daily: Check health status
- [ ] Weekly: Review logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security review

---

**Deployment guide complete! Follow step-by-step untuk hasil terbaik.** 🚀
