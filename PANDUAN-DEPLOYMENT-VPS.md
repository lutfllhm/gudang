# 🚀 PANDUAN LENGKAP DEPLOYMENT iWare ke VPS HOSTINGER

Panduan step-by-step untuk deploy aplikasi iWare Warehouse ke VPS Ubuntu menggunakan Docker.

---

## 📋 PERSIAPAN

### Yang Anda Butuhkan:
- ✅ VPS Hostinger (Ubuntu 20.04+, minimal 2GB RAM)
- ✅ Domain (contoh: iwareid.com) sudah pointing ke IP VPS
- ✅ Akses SSH ke VPS
- ✅ Kredensial Accurate Online API

### Cek Domain Sudah Pointing:
```bash
# Dari komputer lokal
nslookup iwareid.com
# Harus menunjuk ke IP VPS Anda
```

---

## 🎯 LANGKAH 1: LOGIN DAN UPDATE VPS

### 1.1 Login ke VPS
```bash
ssh root@IP_VPS_ANDA
# Masukkan password yang diberikan Hostinger
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Install Tools Dasar
```bash
apt install -y curl git wget nano ufw net-tools
```

---

## 🔥 LANGKAH 2: SETUP FIREWALL

```bash
# Enable firewall
ufw --force enable

# Allow SSH (PENTING! Jangan sampai terkunci)
ufw allow OpenSSH

# Allow HTTP dan HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Cek status
ufw status
```

Output yang benar:
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 🐳 LANGKAH 3: INSTALL DOCKER

### 3.1 Install Docker
```bash
# Download dan install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

# Verifikasi
docker --version
```

Output: `Docker version 24.x.x, build xxxxx`

### 3.2 Install Docker Compose
```bash
# Download Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Buat executable
chmod +x /usr/local/bin/docker-compose

# Verifikasi
docker-compose --version
```

Output: `Docker Compose version v2.x.x`

### 3.3 Test Docker
```bash
docker run hello-world
```

Jika muncul "Hello from Docker!" berarti berhasil.

---

## 💾 LANGKAH 4: SETUP SWAP (OPSIONAL TAPI DIREKOMENDASIKAN)

Jika RAM VPS Anda hanya 2GB, tambahkan swap:

```bash
# Cek swap saat ini
free -h

# Buat swap 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Permanent swap
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verifikasi
free -h
```

---

## 📁 LANGKAH 5: CLONE PROJECT

### 5.1 Masuk ke Directory Root
```bash
cd /root
```

### 5.2 Clone Repository

**Jika menggunakan Git:**
```bash
git clone https://github.com/username/iware-warehouse.git
cd iware-warehouse
```

**Jika upload manual via SFTP:**
1. Upload folder project ke `/root/iware-warehouse`
2. Lalu:
```bash
cd /root/iware-warehouse
```

### 5.3 Verifikasi Struktur
```bash
ls -la
```

Harus ada:
- `backend/`
- `frontend/`
- `docker-compose.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `nginx/`

---

## 🔧 LANGKAH 6: KONFIGURASI ENVIRONMENT

### 6.1 Generate Secrets
```bash
# Generate JWT Secret (copy hasilnya)
openssl rand -base64 32

# Generate JWT Refresh Secret (copy hasilnya)
openssl rand -base64 32

# Generate MySQL Root Password (copy hasilnya)
openssl rand -base64 24

# Generate MySQL User Password (copy hasilnya)
openssl rand -base64 24
```

**SIMPAN SEMUA OUTPUT DI NOTEPAD!**

### 6.2 Copy Template Environment
```bash
cp .env.production.example .env.production
```

### 6.3 Edit Environment File
```bash
nano .env.production
```

### 6.4 Isi dengan Data Anda

Ganti nilai berikut (gunakan secrets yang sudah di-generate):

```env
# ================================
# DATABASE CONFIGURATION
# ================================
MYSQL_ROOT_PASSWORD=hasil_generate_mysql_root_password
DB_NAME=iware_db
DB_USER=iware_user
DB_PASSWORD=hasil_generate_mysql_user_password
DB_HOST=mysql
DB_PORT=3306
DB_CONNECTION_LIMIT=10

# ================================
# JWT CONFIGURATION
# ================================
JWT_SECRET=hasil_generate_jwt_secret
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=hasil_generate_jwt_refresh_secret
JWT_REFRESH_EXPIRE=7d

# ================================
# ACCURATE ONLINE API
# ================================
ACCURATE_ACCOUNT_URL=https://account.accurate.id
ACCURATE_API_URL=https://public-api.accurate.id/api
ACCURATE_APP_KEY=isi_dari_accurate
ACCURATE_CLIENT_ID=isi_dari_accurate
ACCURATE_CLIENT_SECRET=isi_dari_accurate
ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback
ACCURATE_SIGNATURE_SECRET=isi_dari_accurate
ACCURATE_ACCESS_TOKEN=isi_dari_accurate
ACCURATE_DATABASE_ID=isi_dari_accurate

# ================================
# REDIS CONFIGURATION
# ================================
REDIS_HOST=redis
REDIS_PORT=6379

# ================================
# CORS CONFIGURATION
# ================================
CORS_ORIGIN=https://iwareid.com
CORS_CREDENTIALS=true

# ================================
# AUTO SYNC CONFIGURATION
# ================================
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=300

# ================================
# APPLICATION CONFIGURATION
# ================================
NODE_ENV=production
PORT=5000

# ================================
# DOMAIN CONFIGURATION
# ================================
DOMAIN=iwareid.com
EMAIL=admin@iwareid.com
```

**PENTING:** Ganti `iwareid.com` dengan domain Anda!

### 6.5 Simpan File
- Tekan `Ctrl + X`
- Tekan `Y`
- Tekan `Enter`

---

## 📂 LANGKAH 7: BUAT DIREKTORI YANG DIPERLUKAN

```bash
# Buat direktori
mkdir -p certbot/conf certbot/www nginx/logs backend/logs

# Set permissions
chmod -R 755 certbot nginx backend/logs
```

---

## 🌐 LANGKAH 8: KONFIGURASI NGINX UNTUK HTTP (SEMENTARA)

Kita perlu deploy HTTP dulu sebelum mendapatkan SSL certificate.

### 8.1 Edit Nginx Config
```bash
nano nginx/conf.d/default.conf
```

### 8.2 Ganti Semua Isi dengan Config HTTP Ini:

```nginx
# HTTP Only - Temporary for SSL Setup
server {
    listen 80;
    listen [::]:80;
    server_name iwareid.com www.iwareid.com;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://backend:5000/health;
        access_log off;
    }

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**GANTI `iwareid.com` dengan domain Anda!**

### 8.3 Simpan
- Tekan `Ctrl + X`
- Tekan `Y`
- Tekan `Enter`

---

## 🚀 LANGKAH 9: BUILD DAN START APLIKASI (HTTP)

### 9.1 Build Images
```bash
docker-compose build --no-cache
```

Proses ini memakan waktu 5-10 menit. Tunggu sampai selesai.

### 9.2 Start Services
```bash
docker-compose --env-file .env.production up -d
```

### 9.3 Cek Status
```bash
docker-compose ps
```

Semua container harus status `Up`:
```
NAME                STATUS
iware-backend       Up (healthy)
iware-frontend      Up (healthy)
iware-mysql         Up (healthy)
iware-redis         Up (healthy)
iware-nginx         Up (healthy)
```

### 9.4 Cek Logs (Jika Ada Error)
```bash
# Lihat semua logs
docker-compose logs

# Lihat logs backend
docker-compose logs backend

# Lihat logs mysql
docker-compose logs mysql
```

### 9.5 Test HTTP
```bash
# Test dari VPS
curl http://localhost:5000/health

# Test dari browser
# Buka: http://iwareid.com
```

Jika muncul website, lanjut ke langkah berikutnya.

---

## 🔒 LANGKAH 10: SETUP SSL CERTIFICATE

### 10.1 Request SSL Certificate
```bash
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@iwareid.com \
  --agree-tos \
  --no-eff-email \
  -d iwareid.com \
  -d www.iwareid.com
```

**GANTI email dan domain dengan milik Anda!**

### 10.2 Verifikasi Certificate
```bash
ls -la certbot/conf/live/iwareid.com/
```

Harus ada file:
- `fullchain.pem`
- `privkey.pem`
- `cert.pem`
- `chain.pem`

Jika ada, berarti SSL berhasil!

---

## 🔐 LANGKAH 11: ENABLE HTTPS

### 11.1 Edit Nginx Config Lagi
```bash
nano nginx/conf.d/default.conf
```

### 11.2 Ganti Semua Isi dengan Config HTTPS Lengkap:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name iwareid.com www.iwareid.com;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - Main Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name iwareid.com www.iwareid.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/iwareid.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iwareid.com/privkey.pem;
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

    # Logging
    access_log /var/log/nginx/iware_access.log;
    error_log /var/log/nginx/iware_error.log;

    # Backend API
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend:5000/health;
        access_log off;
    }

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend:80;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**GANTI `iwareid.com` dengan domain Anda di 3 tempat!**

### 11.3 Simpan
- Tekan `Ctrl + X`
- Tekan `Y`
- Tekan `Enter`

### 11.4 Restart Nginx
```bash
docker-compose restart nginx
```

### 11.5 Test HTTPS
```bash
# Test dari VPS
curl -I https://iwareid.com

# Buka di browser
# https://iwareid.com
```

Harus muncul gembok hijau di browser!

---

## 👤 LANGKAH 12: BUAT ADMIN USER

### 12.1 Masuk ke Backend Container
```bash
docker-compose exec backend sh
```

### 12.2 Jalankan Script Create Admin
```bash
node src/scripts/create-admin-auto.js
```

Atau jika ingin input manual:
```bash
node src/scripts/create-admin.js
```

### 12.3 Catat Username dan Password

### 12.4 Keluar dari Container
```bash
exit
```

---

## ✅ LANGKAH 13: VERIFIKASI DEPLOYMENT

### 13.1 Cek Status Container
```bash
docker-compose ps
```

Semua harus `Up (healthy)`.

### 13.2 Cek Health Endpoint
```bash
curl https://iwareid.com/health
```

Output:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-03-10T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 13.3 Test Login

1. Buka browser: `https://iwareid.com`
2. Login dengan username dan password admin
3. Cek dashboard berfungsi
4. Test fitur Items, Sales Orders, dll

### 13.4 Test Accurate Integration

1. Masuk ke Settings
2. Cek koneksi Accurate
3. Test sync data

---

## 📊 LANGKAH 14: MONITORING

### 14.1 Lihat Logs Real-time
```bash
# Semua services
docker-compose logs -f

# Backend saja
docker-compose logs -f backend

# Nginx saja
docker-compose logs -f nginx
```

Tekan `Ctrl + C` untuk keluar.

### 14.2 Cek Resource Usage
```bash
docker stats
```

### 14.3 Cek Disk Space
```bash
df -h
```

---

## 💾 LANGKAH 15: SETUP BACKUP OTOMATIS

### 15.1 Buat Script Backup
```bash
nano /root/backup-iware.sh
```

### 15.2 Isi Script:
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cd /root/iware-warehouse

# Load environment
export $(cat .env.production | grep -v '^#' | xargs)

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > ${BACKUP_DIR}/iware_${DATE}.sql

# Compress
gzip ${BACKUP_DIR}/iware_${DATE}.sql

# Delete backups older than 7 days
find ${BACKUP_DIR} -name "iware_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_DIR}/iware_${DATE}.sql.gz"
```

### 15.3 Buat Executable
```bash
chmod +x /root/backup-iware.sh
```

### 15.4 Test Backup
```bash
/root/backup-iware.sh
```

### 15.5 Setup Cron untuk Backup Harian
```bash
crontab -e
```

Pilih editor (pilih nano, biasanya nomor 1).

Tambahkan di baris paling bawah:
```
0 2 * * * /root/backup-iware.sh >> /root/backup.log 2>&1
```

Ini akan backup setiap hari jam 2 pagi.

Simpan: `Ctrl + X`, `Y`, `Enter`

---

## 🔄 MAINTENANCE

### Restart Aplikasi
```bash
cd /root/iware-warehouse
docker-compose restart
```

### Restart Service Tertentu
```bash
docker-compose restart backend
docker-compose restart nginx
```

### Stop Aplikasi
```bash
docker-compose down
```

### Start Aplikasi
```bash
docker-compose --env-file .env.production up -d
```

### Update Aplikasi
```bash
cd /root/iware-warehouse
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose --env-file .env.production up -d
```

### Lihat Logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f nginx
```

### Clean Up Docker
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## 🆘 TROUBLESHOOTING

### Problem: Container tidak start

**Solusi:**
```bash
# Lihat logs
docker-compose logs backend

# Restart
docker-compose restart backend

# Rebuild jika perlu
docker-compose up -d --build backend
```

### Problem: Database connection error

**Solusi:**
```bash
# Cek MySQL running
docker-compose ps mysql

# Lihat logs MySQL
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Cek environment variables
docker-compose exec backend env | grep DB_
```

### Problem: SSL certificate error

**Solusi:**
```bash
# Cek certificate files
ls -la certbot/conf/live/iwareid.com/

# Request ulang certificate
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@iwareid.com \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d iwareid.com \
  -d www.iwareid.com

# Restart nginx
docker-compose restart nginx
```

### Problem: Website tidak bisa diakses

**Solusi:**
```bash
# Cek firewall
ufw status

# Cek nginx
docker-compose logs nginx
docker-compose restart nginx

# Cek DNS
nslookup iwareid.com

# Test dari VPS
curl http://localhost:5000/health
curl http://localhost:80
```

### Problem: Port sudah digunakan

**Solusi:**
```bash
# Cek port 80
netstat -tulpn | grep :80

# Cek port 443
netstat -tulpn | grep :443

# Kill process jika ada
kill -9 <PID>

# Atau stop Apache jika terinstall
systemctl stop apache2
systemctl disable apache2
```

### Problem: Out of memory

**Solusi:**
```bash
# Cek memory
free -h

# Tambah swap jika belum
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Restart containers
docker-compose restart
```

### Problem: Disk penuh

**Solusi:**
```bash
# Cek disk
df -h

# Clean Docker
docker system prune -a --volumes

# Clean logs
truncate -s 0 /var/log/nginx/*.log
docker-compose exec backend sh -c "truncate -s 0 logs/*.log"

# Delete old backups
find /root/backups -name "*.sql.gz" -mtime +7 -delete
```

---

## 📞 PERINTAH PENTING

```bash
# Masuk ke VPS
ssh root@IP_VPS

# Masuk ke project directory
cd /root/iware-warehouse

# Lihat status
docker-compose ps

# Lihat logs
docker-compose logs -f

# Restart semua
docker-compose restart

# Stop semua
docker-compose down

# Start semua
docker-compose up -d

# Backup database
/root/backup-iware.sh

# Cek resource
docker stats

# Cek disk
df -h

# Cek firewall
ufw status
```

---

## ✅ CHECKLIST DEPLOYMENT

- [ ] VPS sudah login
- [ ] System sudah update
- [ ] Firewall sudah setup (port 80, 443, SSH)
- [ ] Docker sudah terinstall
- [ ] Docker Compose sudah terinstall
- [ ] Swap sudah dibuat (jika RAM < 4GB)
- [ ] Project sudah di-clone
- [ ] .env.production sudah dikonfigurasi
- [ ] Secrets sudah di-generate
- [ ] Domain sudah pointing ke VPS
- [ ] Direktori certbot, nginx, logs sudah dibuat
- [ ] Nginx config HTTP sudah dibuat
- [ ] Docker images sudah di-build
- [ ] Containers sudah running (HTTP)
- [ ] Website bisa diakses via HTTP
- [ ] SSL certificate sudah didapat
- [ ] Nginx config HTTPS sudah diupdate
- [ ] Website bisa diakses via HTTPS dengan gembok hijau
- [ ] Admin user sudah dibuat
- [ ] Login berhasil
- [ ] Dashboard berfungsi
- [ ] Accurate integration berfungsi
- [ ] Backup script sudah dibuat
- [ ] Cron backup sudah disetup

---

## 🎉 SELESAI!

Aplikasi iWare Anda sekarang sudah live di:
**https://iwareid.com**

### Kredensial Admin:
- URL: https://iwareid.com
- Username: (yang dibuat di langkah 12)
- Password: (yang dibuat di langkah 12)

### Monitoring:
- Health: https://iwareid.com/health
- API Health: https://iwareid.com/api/health

### Backup:
- Lokasi: /root/backups/
- Otomatis: Setiap hari jam 2 pagi
- Manual: `/root/backup-iware.sh`

---

**Dibuat:** Maret 2024  
**Versi:** 2.0.0  
**Support:** iWare Team

Jika ada pertanyaan atau masalah, cek bagian Troubleshooting di atas.
