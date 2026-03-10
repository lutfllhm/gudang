# 🚀 Panduan Deployment Production iWare ke VPS Hostinger (Ubuntu)

> Dokumentasi lengkap deployment iWare Warehouse Management System menggunakan Docker & Docker Compose

**Terakhir diupdate:** Maret 2026  
**Versi:** 1.0.0  
**Status:** Production Ready ✅

---

## 📋 Daftar Isi

1. [Overview Arsitektur](#overview-arsitektur)
2. [Persiapan VPS](#persiapan-vps)
3. [Install Docker & Docker Compose](#install-docker--docker-compose)
4. [Setup Project](#setup-project)
5. [Deployment Langkah Demi Langkah](#deployment-langkah-demi-langkah)
6. [Setup SSL/HTTPS](#setup-sslhttps)
7. [Auto Restart & Monitoring](#auto-restart--monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## 🏗️ Overview Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX Reverse Proxy                   │
│              (Port 80, 443) SSL/TLS Termination         │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┴──────┬────────────┐
    │             │            │
┌───▼──┐      ┌──▼──┐     ┌──▼───┐
│React │      │Node │     │MySQL │
│ App  │      │ API │     │  DB  │
└────┬─┘      └──┬──┘     └──┬───┘
     │ Port 80   │ Port 3000 │ Port 3306
     │           │           │
     └────────┬──┴─────┬─────┘
              │        │
         ┌────▼────┐ ┌─▼────┐
         │ Redis   │ │Logs  │
         │ Cache   │ │      │
         └────┬────┘ └──────┘
              │ Port 6379
              │
         (Container Network)
```

### Stack Teknologi:
- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Express.js (Node.js 18)
- **Database:** MySQL 8.0
- **Cache:** Redis 7
- **Reverse Proxy:** Nginx + SSL
- **Orchestration:** Docker Compose
- **Logging:** Winston + Docker Compose logs

---

## 📦 Persiapan VPS

### 1. Pilih VPS di Hostinger

**Spesifikasi Minimum:**
- CPU: 2 cores
- RAM: 2GB (untuk development), 4GB+ (untuk production)
- Storage: 30GB SSD
- OS: Ubuntu 20.04 LTS atau 22.04 LTS
- Bandwidth: Unlimited atau sesuai kebutuhan

**Link:** [Hostinger VPS](https://hostinger.co.id)

### 2. Akses VPS via SSH

```bash
ssh -i /path/to/private_key root@your_vps_ip
# atau
ssh root@your_vps_ip
# masukkan password yang diberikan Hostinger
```

### 3. Update System

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# (Optional) Install basic utilities
sudo apt install -y curl wget git htop nano
```

### 4. Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### 5. Setup Domain & DNS

1. Pointing domain ke IP VPS:
   - A record: `yourdomain.com` → VPS_IP
   - A record: `www.yourdomain.com` → VPS_IP
   - (Optional) A record: `api.yourdomain.com` → VPS_IP

2. Tunggu 15-30 menit untuk DNS propagation

2. Verifikasi pointing. jika belum berhasil Anda akan melihat pesan seperti ini:

```bash
$ nslookup yourdomain.com
Server:         127.0.0.53
Address:        127.0.0.53#53

Non-authoritative answer:
*** Can't find yourdomain.com: No answer
```

Artinya DNS belum terpropagasi atau rekam DNS belum disetel. Pastikan Anda telah membuat **A record** pada panel registrar/domain dengan nilai IP VPS Anda dan tunggu 15–30 menit (kadang sampai 24 jam) sebelum mencoba lagi.

```bash
nslookup yourdomain.com
# Seharusnya menampilkan IP VPS Anda seperti:
# Name: yourdomain.com
# Address: 203.0.113.45
```

---

## 🐳 Install Docker & Docker Compose

### Metode 1: Menggunakan Script Otomatis (Recommended)

```bash
# Download repository project
cd /home && git clone https://github.com/yourorg/iware.git
cd iware

# Buat script executable
chmod +x scripts/install-docker.sh

# Run installation script (sebagai root)
sudo bash scripts/install-docker.sh

> 📝 *Catatan:* jika Anda menjalankan ulang skrip dan melihat prompt
> `File '/usr/share/keyrings/docker-archive-keyring.gpg' exists. Overwrite? (y/N)`
> cukup ketik `y` lalu tekan Enter. Skrip telah diperbarui agar prompt ini
> tidak muncul pada versi terbaru.
```

### Metode 2: Manual Installation

```bash
# Update system
sudo apt update

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker

> ⚠️ **PENTING:** Sebelum menjalankan perintah `apt install` di bawah ini pastikan Anda sudah:
> 1. Menambahkan **Docker GPG key** dan **repository** (lihat langkah sebelumnya).
> 2. Menjalankan `sudo apt update` setelah menambahkan repository.
>
> Jika tidak, apt tidak akan menemukan paket dan Anda akan melihat pesan seperti:
>
> ```text
> Package docker-ce has no installation candidate
> Unable to locate package docker-ce-cli
> Unable to locate package containerd.io
> Unable to locate package docker-compose-plugin
> ```
> (sama seperti screenshot yang Anda tunjukkan).
> Langkah-langkah di atas juga dicontohkan di `scripts/install-docker.sh`.

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose standalone
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Verify Installation

```bash
# Test Docker
docker run --rm hello-world

# Check versions
docker --version
docker-compose --version
```

---

## 📁 Setup Project

### 1. Clone Repository

```bash
cd /home
git clone https://github.com/yourorg/iware.git
cd iware

# atau jika sudah ada, update
git pull origin main
```

### 2. Setup Environment Files

```bash
# Copy template environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

**Edit `.env.production` - Ganti nilai berikut:**

```env
# DATABASE
DB_NAME=iware_warehouse
DB_USER=iware_user
DB_PASSWORD=GenerateSecurePassword123!@#    # HARUS DIGANTI
DB_ROOT_PASSWORD=RootPassword123!@#         # HARUS DIGANTI

# JWT (Generate dengan: openssl rand -hex 32)
JWT_SECRET=your_generated_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_generated_refresh_secret_32_chars_minimum

# CORS & DOMAIN (Sesuaikan domain Anda)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
API_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# ACCURATE API (dari Accurate Online dashboard)
ACCURATE_CLIENT_ID=your_client_id_from_accurate
ACCURATE_CLIENT_SECRET=your_client_secret_from_accurate
ACCURATE_REDIRECT_URI=https://yourdomain.com/api/auth/accurate/callback
```

**Generate Secret Values:**

```bash
# Generate JWT secrets
openssl rand -hex 32     # Copy output untuk JWT_SECRET
openssl rand -hex 32     # Copy output untuk JWT_REFRESH_SECRET

# atau menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Prepare Directory Structure

```bash
# Ensure directories exist
mkdir -p backend/logs
mkdir -p nginx/logs
mkdir -p ssl

# Set permissions
chmod 755 backend/logs nginx/logs ssl
```

---

## 🚀 Deployment Langkah Demi Langkah

### Step 1: Build dan Start Containers

```bash
cd /home/iware

# Build Docker images
docker-compose build

# Start containers
docker-compose up -d

# Check status
docker-compose ps
```

**Expected output:**
```
NAME                COMMAND             STATUS              PORTS
iware-mysql         docker-entrypoint   Up 2 minutes        3306/tcp
iware-redis         redis-server        Up 2 minutes        6379/tcp
iware-backend       node server.js      Up 1 minute         3000/tcp
iware-frontend      nginx -g daemon     Up 1 minute         80/tcp
iware-nginx         nginx -g daemon     Up 1 minute         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 2: Verify Services

```bash
# Check logs
docker-compose logs backend

# Test API endpoint
curl http://localhost/api/health

# Test Frontend
curl http://localhost/health
```

### Step 3: Backup pada Deployment Script

```bash
# Buat script executable
chmod +x deploy.sh

# Run deployment (recommended)
sudo bash deploy.sh
```

Script ini akan:
- ✅ Check Docker installation
- ✅ Stop existing containers
- ✅ Clean up old images
- ✅ Build new images
- ✅ Start all services
- ✅ Wait for health checks
- ✅ Display final status

---

## 🔒 Setup SSL/HTTPS

### Step 1: Install Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Run SSL Setup Script

```bash
cd /home/iware
chmod +x scripts/setup-ssl.sh

# Run script
sudo bash scripts/setup-ssl.sh
```

**Input yang diperlukan:**
- Domain: yourdomain.com
- Email: admin@yourdomain.com

### Step 3: Manual SSL Setup (Alternative)

```bash
# Generate SSL certificate
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email admin@yourdomain.com \
    --agree-tos \
    --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/iware/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/iware/ssl/
sudo chown -R 1000:1000 /home/iware/ssl/
```

### Step 4: Configure Nginx untuk SSL

Update `/home/iware/nginx/conf.d/default.conf`:

```nginx
# HTTP Redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Certificates
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL Security Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy configuration (sama seperti sebelumnya)
    location / {
        proxy_pass http://frontend:80;
        # ... rest of proxy headers ...
    }
    
    location /api/ {
        proxy_pass http://backend:3000/api/;
        # ... rest of proxy headers ...
    }
}
```

### Step 5: Auto-Renewal SSL

```bash
# Check auto-renewal cron
sudo crontab -e

# Tambahkan (jika belum ada)
0 12 * * * /usr/bin/certbot renew --quiet
5 12 * * * cd /home/iware && docker-compose exec -T nginx nginx -s reload

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

### Step 6: Verify HTTPS

```bash
# Test certificate
curl -I https://yourdomain.com

# Check certificate expiry
sudo certbot certificates

# SSL test (via online tool)
# https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

---

## 🔄 Auto Restart & Monitoring

### Option 1: Systemd Service (Recommended)

```bash
cd /home/iware
chmod +x scripts/setup-systemd.sh

# Setup systemd auto-start
sudo bash scripts/setup-systemd.sh
```

**Verify:**
```bash
# Check service status
sudo systemctl status iware

# View service logs
sudo journalctl -u iware -f

# Check if enabled at boot
sudo systemctl is-enabled iware
```

### Option 2: Docker Compose Restart Policy

File `/home/iware/docker-compose.yml` sudah memiliki:
```yaml
restart: always
```

Ini akan auto-restart container jika crash.

### Health Checking

```bash
# Run health check script
chmod +x scripts/health-check.sh
bash scripts/health-check.sh

# Check container health
docker-compose ps

# Manual health check
curl http://localhost/api/health
curl http://yourdomain.com/health
```

### Monitoring & Logging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend     # API logs
docker-compose logs -f frontend    # Frontend logs
docker-compose logs -f mysql       # Database logs
docker-compose logs -f redis       # Cache logs
docker-compose logs -f nginx       # Proxy logs

# View logs dengan tail
docker-compose logs --tail 100 backend

# Save logs to file
docker-compose logs > all_logs.txt
```

---

## 🐛 Troubleshooting

### Problem 1: Container tidak jalan

```bash
# Check status
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs mysql

# Restart containers
docker-compose restart

# Atau rebuild
docker-compose down
docker-compose up -d --build
```

### Problem 1b: Gagal install paket Docker ("no installation candidate")

Jika Anda menjalankan `sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin` dan mendapat error serupa:

```text
Package 'docker-ce' has no installation candidate
Unable to locate package docker-ce-cli
Unable to locate package containerd.io
Unable to locate package docker-compose-plugin
```

itu berarti repository Docker belum ditambahkan atau `apt update` belum dijalankan setelah penambahan. Kembali ke bagian **Install Docker & Docker Compose** dan ikuti langkah-langkah penambahan GPG key + repository; atau gunakan script otomatis `scripts/install-docker.sh` yang sudah menangani semua langkah tersebut.

```bash
# Contoh perbaikan singkat
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Setelah itu paket harus dapat diinstal tanpa masalah.


### Problem 2: Database connection error

```bash
# Verify MySQL running
docker-compose exec mysql mysql -u root -p$DB_ROOT_PASSWORD -e "SELECT 1"

# Check database exists
docker-compose exec mysql mysql -u root -p$DB_ROOT_PASSWORD -e "SHOW DATABASES"

# Check user privileges
docker-compose exec mysql mysql -u root -p$DB_ROOT_PASSWORD -e "SHOW GRANTS FOR 'iware_user'@'%';"

# Restart MySQL
docker-compose restart mysql

# Wait for MySQL to be ready
sleep 10
docker-compose exec -T backend npm run verify
```

### Problem 3: HTTPS/SSL error

```bash
# Check certificate
sudo certbot certificates

# Check Nginx config
docker-compose exec nginx nginx -t

# Verify domain DNS
nslookup yourdomain.com

# Check ports
sudo netstat -tulpn | grep LISTEN

# Test SSL
curl -I https://yourdomain.com
```

### Problem 4: Port sudah terpakai

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Kill process (jika perlu)
sudo kill -9 <PID>

# atau ubah port di docker-compose.yml
```

### Problem 5: Frontend blank page / 404

```bash
# Rebuild frontend
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d

# Check frontend logs
docker-compose logs frontend

# Verify SPA routing in Nginx
# pastikan catchall location dirujuk ke frontend
```

### Problem 6: Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a

# Remove old volumes
docker volume prune
```

---

## 🛠️ Maintenance

### Regular Backups

```bash
# Backup database
docker-compose exec -T mysql mysqldump -u root -p$DB_ROOT_PASSWORD iware_warehouse > backup_$(date +%Y%m%d).sql

# Backup environment files
tar -czf backup_env_$(date +%Y%m%d).tar.gz .env.production

# Backup docker volumes
docker run --rm -v iware_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup_$(date +%Y%m%d).tar.gz -C / data
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Check status
docker-compose ps
```

### Database Maintenance

```bash
# Optimize tables
docker-compose exec -T mysql mysql -u root -p$DB_ROOT_PASSWORD iware_warehouse -e "OPTIMIZE TABLE *;"

# Check database
docker-compose exec -T mysql mysql -u root -p$DB_ROOT_PASSWORD iware_warehouse -e "CHECK TABLE *;"

# Backup important data
docker-compose exec -T mysql mysqldump -u root -p$DB_ROOT_PASSWORD iware_warehouse | gzip > backup.sql.gz
```

### Monitor Resources

```bash
# Check CPU/Memory usage
docker stats

# Check disk space
df -h

# Check container sizes
docker ps -s
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Rebuild images with latest base images
docker-compose build --no-cache

# Verify SSL certificate
sudo certbot certificates
```

---

## 📚 Useful Commands Reference

### Docker Container Management

```bash
# List running containers
docker-compose ps

# Stop all containers
docker-compose stop

# Start all containers
docker-compose start

# Restart all containers
docker-compose restart

# Rebuild images
docker-compose build

# Remove containers and volumes
docker-compose down -v

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend npm run verify
```

### Database Commands

```bash
# MySQL shell
docker-compose exec mysql mysql -u root -p

# Run SQL file
docker-compose exec -T mysql mysql -u root -p$DB_ROOT_PASSWORD iware_warehouse < dump.sql

# Database backup
docker-compose exec -T mysql mysqldump -u root -p$DB_ROOT_PASSWORD iware_warehouse > backup.sql
```

### Network & Connectivity

```bash
# Test API
curl http://localhost/api/health

# Test HTTPS
curl -I https://yourdomain.com

# DNS check
nslookup yourdomain.com

# Ping container
docker-compose exec backend ping redis
```

---

## 🚨 Emergency Troubleshooting

### Container keeps crashing

```bash
# Check logs
docker-compose logs --tail 50 backend

# Get full error
docker-compose up -d backend 2>&1
docker-compose logs backend

# Check environment variables
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Out of memory

```bash
# Check memory usage
docker stats

# Limit memory in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Can't connect to database

```bash
# Wait for MySQL startup
sleep 30

# Check connection
docker-compose exec backend node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({...}).then(() => console.log('OK'))
"

# Reset database
docker-compose down mysql
docker volume rm iware_mysql_data
docker-compose up -d mysql
```

---

## 📞 Support & Resources

### Documentation
- [Accurate Online API](https://accurate.id)
- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org)

### Helpful Commands

```bash
# Verify setup
cd /home/iware && docker-compose exec -T backend npm run verify

# Test API
curl -X GET http://localhost/api/health

# Check all services
docker-compose ps -a

# Full system status
bash scripts/health-check.sh
```

---

## ✅ Deployment Checklist

- [ ] VPS tersiapkan (Ubuntu 20.04+, 2GB+ RAM)
- [ ] Domain sudah pointing ke IP VPS
- [ ] Docker & Docker Compose terinstall
- [ ] Repository diclone ke server
- [ ] `.env.production` sudah dikonfigurasi
- [ ] Containers berhasil build dan running
- [ ] API accessible di `http://yourdomain.com/api/health`
- [ ] Frontend accessible di `http://yourdomain.com`
- [ ] SSL certificate terinstall
- [ ] HTTPS redirect working
- [ ] Systemd service dikonfigurasi
- [ ] Health check script berjalan normal
- [ ] Backup database sudah dilakukan
- [ ] Monitoring setup sudah running

---

## 🎉 Conclusion

Selamat! Aplikasi Anda sudah siap untuk production. Pastikan untuk:

1. **Monitoring reguler** - Cek health check mingguan
2. **Backup rutin** - Backup database harian
3. **Update security** - Update packages secara berkala
4. **Monitoring logs** - Check logs untuk error/warning

Untuk pertanyaan lebih lanjut, silakan buka issue di repository atau hubungi tim support.

**Happy deploying! 🚀**

---

**Last Updated:** Maret 2026  
**Version:** 1.0.0  
**Maintained by:** iWare Team
