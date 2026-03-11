# 🚀 Panduan Lengkap Deploy di VPS Hostinger KVM 2

Panduan step-by-step deployment aplikasi iWare Warehouse di VPS Hostinger KVM 2 dari nol hingga terhubung ke Accurate Online.

---

## 📋 Spesifikasi VPS Hostinger KVM 2

- **CPU**: 2 vCPU Cores
- **RAM**: 4 GB
- **Storage**: 50 GB NVMe
- **Bandwidth**: 2 TB
- **OS**: Ubuntu 20.04/22.04 LTS (recommended)

---

## 🎯 Tahapan Deployment

1. [Setup VPS & Domain](#1-setup-vps--domain)
2. [Install Dependencies](#2-install-dependencies)
3. [Setup Firewall & Security](#3-setup-firewall--security)
4. [Clone & Configure Project](#4-clone--configure-project)
5. [Setup Accurate Online](#5-setup-accurate-online)
6. [Deploy dengan Docker](#6-deploy-dengan-docker)
7. [Setup SSL/HTTPS](#7-setup-sslhttps)
8. [Testing & Verification](#8-testing--verification)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)

---

## 1️⃣ Setup VPS & Domain

### 1.1 Login ke VPS

Setelah VPS aktif, Anda akan menerima email dengan:
- IP Address: `xxx.xxx.xxx.xxx`
- Username: `root`
- Password: `xxxxxxxxxx`

Login via SSH:

```bash
# Dari komputer lokal
ssh root@xxx.xxx.xxx.xxx

# Masukkan password saat diminta
```

### 1.2 Update System

```bash
# Update package list
apt update

# Upgrade packages
apt upgrade -y

# Install basic tools
apt install -y curl wget git vim nano htop net-tools
```

### 1.3 Setup Domain (Opsional tapi Recommended)

**Opsi A: Pakai Domain Sendiri**

1. Login ke domain registrar (Namecheap, GoDaddy, dll)
2. Tambahkan A Record:
   ```
   Type: A
   Name: @
   Value: xxx.xxx.xxx.xxx (IP VPS)
   TTL: 3600
   ```
3. Tambahkan A Record untuk www:
   ```
   Type: A
   Name: www
   Value: xxx.xxx.xxx.xxx
   TTL: 3600
   ```

**Opsi B: Pakai IP Address**

Jika tidak punya domain, bisa pakai IP address langsung:
```
http://xxx.xxx.xxx.xxx
```

**Tunggu DNS Propagation (5-30 menit)**

Test dengan:
```bash
ping your-domain.com
```

---

## 2️⃣ Install Dependencies

### 2.1 Install Docker

```bash
# Remove old versions (jika ada)
apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### 2.2 Start Docker Service

```bash
# Start Docker
systemctl start docker

# Enable Docker on boot
systemctl enable docker

# Check status
systemctl status docker
```

### 2.3 Test Docker

```bash
# Run test container
docker run hello-world
```

Jika muncul "Hello from Docker!", instalasi berhasil! ✅

---

## 3️⃣ Setup Firewall & Security

### 3.1 Setup UFW Firewall

```bash
# Install UFW
apt install -y ufw

# Allow SSH (PENTING! Jangan lupa ini)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

Output:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 3.2 Setup Fail2Ban (Protection dari Brute Force)

```bash
# Install Fail2Ban
apt install -y fail2ban

# Start service
systemctl start fail2ban
systemctl enable fail2ban

# Check status
systemctl status fail2ban
```

### 3.3 Create Non-Root User (Recommended)

```bash
# Create user
adduser iware

# Add to sudo group
usermod -aG sudo iware

# Add to docker group
usermod -aG docker iware

# Switch to new user
su - iware
```

**Untuk langkah selanjutnya, gunakan user `iware` (bukan root)**

---

## 4️⃣ Clone & Configure Project

### 4.1 Setup Project Directory

```bash
# Create directory
mkdir -p /home/iware/apps
cd /home/iware/apps

# Clone repository (ganti dengan repo Anda)
git clone https://github.com/your-username/iware-warehouse.git

# Atau upload via SFTP/SCP
# scp -r ./iware-warehouse iware@xxx.xxx.xxx.xxx:/home/iware/apps/

cd iware-warehouse
```

### 4.2 Create Required Directories

```bash
# Create directories
mkdir -p nginx/ssl nginx/logs backend/logs

# Set permissions
chmod 755 nginx/ssl nginx/logs backend/logs
```

### 4.3 Configure Environment Variables

#### Edit Root .env

```bash
nano .env
```

Isi dengan:
```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=SuperStrongPassword123!@#
DB_NAME=iware_warehouse
DB_USER=accurate_user
DB_PASSWORD=AccurateUserPassword456!@#

# Redis Configuration
REDIS_PASSWORD=RedisPassword789!@#

# Frontend API URL
# Ganti dengan domain Anda atau IP VPS
VITE_API_URL=https://your-domain.com/api
# Atau jika pakai IP: VITE_API_URL=http://xxx.xxx.xxx.xxx/api
```

**Simpan:** Ctrl+O, Enter, Ctrl+X

#### Edit backend/.env

```bash
nano backend/.env
```

Isi dengan (contoh lengkap):
```env
# =================================
# SERVER CONFIGURATION
# =================================
NODE_ENV=production
PORT=5000
APP_NAME=iWare Warehouse

# =================================
# DATABASE CONFIGURATION
# =================================
DB_HOST=mysql
DB_PORT=3306
DB_USER=accurate_user
DB_PASSWORD=AccurateUserPassword456!@#
DB_NAME=iware_warehouse
DB_CONNECTION_LIMIT=10

# =================================
# JWT CONFIGURATION
# =================================
# Generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
JWT_REFRESH_EXPIRE=30d

# =================================
# ACCURATE ONLINE API CONFIGURATION
# =================================
ACCURATE_ACCOUNT_URL=https://account.accurate.id
ACCURATE_API_URL=https://public-api.accurate.id/api

# Kredensial dari Accurate Developer Portal
ACCURATE_APP_KEY=your_app_key_here
ACCURATE_CLIENT_ID=your_client_id_here
ACCURATE_CLIENT_SECRET=your_client_secret_here
ACCURATE_SIGNATURE_SECRET=your_signature_secret_here

# Redirect URI - HARUS SAMA dengan yang di Developer Portal
ACCURATE_REDIRECT_URI=https://your-domain.com/api/accurate/callback
# Atau jika pakai IP: http://xxx.xxx.xxx.xxx/api/accurate/callback

# Token (akan diisi otomatis setelah OAuth)
ACCURATE_ACCESS_TOKEN=
ACCURATE_DATABASE_ID=

# =================================
# REDIS CONFIGURATION
# =================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=RedisPassword789!@#
REDIS_DB=0

# =================================
# CORS CONFIGURATION
# =================================
# Sesuaikan dengan domain frontend
CORS_ORIGIN=https://your-domain.com
# Atau jika pakai IP: http://xxx.xxx.xxx.xxx
CORS_CREDENTIALS=true

# =================================
# RATE LIMITING
# =================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =================================
# LOGGING
# =================================
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d

# =================================
# SYNC CONFIGURATION
# =================================
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=300
SYNC_BATCH_SIZE=100

# =================================
# WEBHOOK CONFIGURATION
# =================================
WEBHOOK_SECRET=webhook_secret_generate_dengan_crypto
```

**Generate Secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy hasil generate dan paste ke file .env

**Simpan:** Ctrl+O, Enter, Ctrl+X

### 4.4 Update Nginx Configuration

```bash
nano nginx/nginx.conf
```

Cari dan ganti `server_name _;` dengan domain Anda:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # ...
}
```

Jika pakai IP, biarkan `server_name _;`

**Simpan:** Ctrl+O, Enter, Ctrl+X

---

## 5️⃣ Setup Accurate Online

### 5.1 Registrasi Aplikasi di Accurate Developer Portal

1. **Buka browser** dan akses: https://account.accurate.id/developer/application

2. **Login** dengan akun Accurate Online Anda

3. **Klik "Create New Application"**

4. **Isi form:**
   ```
   Application Name: iWare Warehouse
   Description: Warehouse management system
   
   Redirect URI: https://your-domain.com/api/accurate/callback
   (atau: http://xxx.xxx.xxx.xxx/api/accurate/callback)
   
   Webhook URL: https://your-domain.com/api/webhook/accurate
   (opsional)
   ```

5. **Klik "Save"**

6. **Catat kredensial:**
   ```
   APP_KEY: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   CLIENT_ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLIENT_SECRET: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SIGNATURE_SECRET: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

7. **Centang Scopes:**
   - ✅ item_view
   - ✅ sales_order_view
   - ✅ sales_invoice_view
   - ✅ customer_view
   - ✅ warehouse_view

8. **Save Changes**

### 5.2 Update backend/.env dengan Kredensial

```bash
nano backend/.env
```

Update bagian Accurate:
```env
ACCURATE_APP_KEY=paste_app_key_disini
ACCURATE_CLIENT_ID=paste_client_id_disini
ACCURATE_CLIENT_SECRET=paste_client_secret_disini
ACCURATE_SIGNATURE_SECRET=paste_signature_secret_disini
ACCURATE_REDIRECT_URI=https://your-domain.com/api/accurate/callback
```

**Simpan:** Ctrl+O, Enter, Ctrl+X

---

## 6️⃣ Deploy dengan Docker

### 6.1 Build Images

```bash
cd /home/iware/apps/iware-warehouse

# Build semua images
docker compose build

# Proses ini akan memakan waktu 5-10 menit
# Tunggu sampai selesai
```

### 6.2 Start Services

```bash
# Start semua services
docker compose up -d

# Check status
docker compose ps
```

Expected output:
```
NAME                IMAGE                    STATUS
iware-backend       iware-warehouse-backend  Up (healthy)
iware-frontend      iware-warehouse-frontend Up (healthy)
iware-mysql         mysql:8.0                Up (healthy)
iware-nginx         nginx:alpine             Up (healthy)
iware-redis         redis:7-alpine           Up (healthy)
```

### 6.3 Check Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs nginx

# Follow logs
docker compose logs -f backend
```

### 6.4 Wait for Services to be Ready

```bash
# Wait for MySQL to be ready (30-60 seconds)
docker compose logs mysql | grep "ready for connections"

# Check backend health
curl http://localhost:5000/health

# Should return: {"success":true,"message":"Server is healthy",...}
```

---

## 7️⃣ Setup SSL/HTTPS

### Opsi A: Menggunakan Let's Encrypt (Recommended - GRATIS)

#### 7.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot

# Stop Nginx temporarily
docker compose stop nginx
```

#### 7.2 Generate Certificate

```bash
# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to share email
```

#### 7.3 Copy Certificates

```bash
# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem \
     /home/iware/apps/iware-warehouse/nginx/ssl/cert.pem

sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem \
     /home/iware/apps/iware-warehouse/nginx/ssl/key.pem

# Set permissions
sudo chown iware:iware /home/iware/apps/iware-warehouse/nginx/ssl/*.pem
sudo chmod 600 /home/iware/apps/iware-warehouse/nginx/ssl/*.pem
```

#### 7.4 Enable HTTPS in Nginx

```bash
cd /home/iware/apps/iware-warehouse
nano nginx/nginx.conf
```

Uncomment bagian HTTPS server (hapus tanda `#`):
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of config (copy dari HTTP server)
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**Simpan:** Ctrl+O, Enter, Ctrl+X

#### 7.5 Restart Nginx

```bash
# Start Nginx
docker compose up -d nginx

# Test configuration
docker compose exec nginx nginx -t

# Reload if needed
docker compose exec nginx nginx -s reload
```

#### 7.6 Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job for auto-renewal
sudo crontab -e

# Add this line (renew every day at 3 AM):
0 3 * * * certbot renew --quiet --post-hook "cd /home/iware/apps/iware-warehouse && docker compose exec nginx nginx -s reload"
```

### Opsi B: Self-Signed Certificate (Development Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=iWare/CN=your-domain.com"

# Set permissions
chmod 600 nginx/ssl/*.pem

# Enable HTTPS in nginx.conf (same as above)
# Restart Nginx
docker compose restart nginx
```

---

## 8️⃣ Testing & Verification

### 8.1 Create Admin User

```bash
cd /home/iware/apps/iware-warehouse

# Create admin
docker compose exec backend node src/scripts/create-admin-auto.js
```

Output:
```
✅ Admin user created successfully!

Email: superadmin@iware.id
Password: admin123

⚠️  Please change the password after first login!
```

**Catat kredensial ini!**

### 8.2 Test Health Endpoints

```bash
# Backend health
curl http://localhost:5000/health

# Nginx health
curl http://localhost/health

# Or with domain
curl https://your-domain.com/health
```

### 8.3 Test Accurate Connection

```bash
# Test Accurate credentials
docker compose exec backend npm run test:accurate
```

Expected output:
```
🔍 Testing Accurate Online API Connection
✅ All credentials configured
✅ Timestamp generated
✅ Signature generated
✅ Authorization URL generated
✅ All tests passed!
```

### 8.4 Access Application

**Buka browser:**
```
https://your-domain.com
atau
http://xxx.xxx.xxx.xxx
```

**Login dengan:**
- Email: `superadmin@iware.id`
- Password: `admin123`

### 8.5 Connect to Accurate Online

1. **Login ke aplikasi**
2. **Klik menu "Settings"** atau **"Accurate Integration"**
3. **Klik "Connect to Accurate Online"**
4. **Anda akan diarahkan ke halaman login Accurate**
5. **Login dengan akun Accurate Online**
6. **Review permissions dan klik "Authorize"**
7. **Anda akan diredirect kembali ke aplikasi**
8. **Status akan berubah menjadi "Connected"** ✅

### 8.6 Test Data Sync

```bash
# Login via API untuk dapat token
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}'

# Simpan token dari response
TOKEN="paste_token_here"

# Test sync items
curl -X POST https://your-domain.com/api/sync/items \
  -H "Authorization: Bearer $TOKEN"

# Test sync sales orders
curl -X POST https://your-domain.com/api/sync/sales-orders \
  -H "Authorization: Bearer $TOKEN"
```

### 8.7 Verify Data in Database

```bash
# Connect to MySQL
docker compose exec mysql mysql -u accurate_user -p iware_warehouse

# Enter password: AccurateUserPassword456!@#

# Check items
SELECT COUNT(*) FROM items;

# Check sales orders
SELECT COUNT(*) FROM sales_orders;

# Exit
exit
```

---

## 9️⃣ Monitoring & Maintenance

### 9.1 View Logs

```bash
cd /home/iware/apps/iware-warehouse

# All logs
docker compose logs -f

# Backend logs
docker compose logs -f backend

# Nginx logs
docker compose logs -f nginx

# Nginx access logs (on host)
tail -f nginx/logs/access.log

# Backend logs (on host)
tail -f backend/logs/combined.log
```

### 9.2 Monitor Resources

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h

# Docker disk usage
docker system df
```

### 9.3 Backup Database

```bash
# Create backup directory
mkdir -p /home/iware/backups

# Backup database
docker compose exec mysql mysqldump -u root -p iware_warehouse > /home/iware/backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Enter MySQL root password when prompted
```

**Setup Automatic Backup:**

```bash
# Create backup script
nano /home/iware/backup-db.sh
```

Isi dengan:
```bash
#!/bin/bash
cd /home/iware/apps/iware-warehouse
docker compose exec -T mysql mysqldump -u root -pSuperStrongPassword123!@# iware_warehouse > /home/iware/backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Keep only last 7 days
find /home/iware/backups -name "backup-*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /home/iware/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /home/iware/backup-db.sh
```

### 9.4 Update Application

```bash
cd /home/iware/apps/iware-warehouse

# Pull latest code
git pull

# Rebuild images
docker compose build

# Restart services
docker compose up -d

# Check logs
docker compose logs -f
```

### 9.5 Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart nginx

# Stop all
docker compose down

# Start all
docker compose up -d
```

---

## 🔧 Troubleshooting

### Backend tidak start

```bash
# Check logs
docker compose logs backend

# Check environment
docker compose exec backend env | grep ACCURATE

# Restart
docker compose restart backend
```

### MySQL connection error

```bash
# Check MySQL status
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Restart MySQL
docker compose restart mysql
```

### Nginx 502 Bad Gateway

```bash
# Check backend status
docker compose ps backend

# Check backend health
curl http://localhost:5000/health

# Check Nginx config
docker compose exec nginx nginx -t

# Restart Nginx
docker compose restart nginx
```

### Accurate connection failed

```bash
# Test credentials
docker compose exec backend npm run test:accurate

# Check .env
cat backend/.env | grep ACCURATE

# Check logs
docker compose logs backend | grep -i accurate
```

### SSL Certificate Error

```bash
# Check certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renew certificate
sudo certbot renew

# Copy new certificate
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Restart Nginx
docker compose restart nginx
```

### Out of Memory

```bash
# Check memory
free -h

# Check Docker memory
docker stats

# Restart services one by one
docker compose restart mysql
docker compose restart redis
docker compose restart backend
docker compose restart frontend
docker compose restart nginx
```

### Disk Full

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Clean logs
truncate -s 0 nginx/logs/*.log
truncate -s 0 backend/logs/*.log
```

---

## ✅ Post-Deployment Checklist

- [ ] VPS setup dan accessible
- [ ] Domain pointing ke VPS (jika pakai domain)
- [ ] Docker & Docker Compose terinstall
- [ ] Firewall configured (UFW)
- [ ] Project cloned dan configured
- [ ] Environment variables configured
- [ ] Accurate Online credentials configured
- [ ] Docker containers running
- [ ] SSL/HTTPS configured
- [ ] Admin user created
- [ ] Application accessible via browser
- [ ] Connected to Accurate Online
- [ ] Data sync working
- [ ] Backup script configured
- [ ] Monitoring setup

---

## 📞 Support & Resources

- **Accurate API Docs**: https://accurate.id/api-docs
- **Developer Portal**: https://account.accurate.id/developer
- **Docker Docs**: https://docs.docker.com
- **Hostinger Support**: https://www.hostinger.com/tutorials

---

## 🎉 Selesai!

Aplikasi iWare Warehouse sudah berhasil di-deploy di VPS Hostinger dan terhubung ke Accurate Online!

**Akses aplikasi:**
- URL: https://your-domain.com
- Email: superadmin@iware.id
- Password: admin123

**Jangan lupa:**
1. Ganti password admin setelah login pertama
2. Setup backup otomatis
3. Monitor logs secara berkala
4. Update aplikasi secara berkala

**Selamat menggunakan! 🚀**
