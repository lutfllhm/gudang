# 🚀 Panduan Deployment iWare Warehouse

Panduan lengkap untuk deployment aplikasi iWare Warehouse menggunakan Docker.

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Konfigurasi](#konfigurasi)
3. [Deployment](#deployment)
4. [Verifikasi](#verifikasi)
5. [Maintenance](#maintenance)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Persiapan

### Requirement Sistem

- **OS**: Linux (Ubuntu 20.04+), Windows Server, atau macOS
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: Minimal 2GB (Rekomendasi 4GB+)
- **Storage**: Minimal 10GB free space
- **Port**: 80, 443, 3306, 6379, 5000

### Install Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Windows:**
Download dan install [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Verifikasi instalasi:**
```bash
docker --version
docker-compose --version
```

---

## ⚙️ Konfigurasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd iware-warehouse
```

### 2. Setup Environment Variables

Copy file environment production:
```bash
cp .env.production .env
```

Edit file `.env` dan sesuaikan konfigurasi:

```bash
nano .env
# atau
vim .env
```

**Konfigurasi Wajib Diubah:**

```env
# Database Passwords (WAJIB GANTI!)
DB_PASSWORD=password_database_yang_kuat_minimal_16_karakter
DB_ROOT_PASSWORD=root_password_yang_sangat_kuat_minimal_16_karakter

# Redis Password (WAJIB GANTI!)
REDIS_PASSWORD=redis_password_yang_kuat_minimal_16_karakter

# JWT Secrets (WAJIB GANTI!)
JWT_SECRET=jwt_secret_64_karakter_atau_lebih_gunakan_random_string
JWT_REFRESH_SECRET=refresh_secret_64_karakter_atau_lebih_gunakan_random_string

# Webhook Secret (WAJIB GANTI!)
WEBHOOK_SECRET=webhook_secret_yang_kuat_minimal_32_karakter

# Domain (Sesuaikan dengan domain Anda)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://yourdomain.com/api

# Accurate Online API (Dapatkan dari Accurate Developer Portal)
ACCURATE_APP_KEY=your_accurate_app_key
ACCURATE_CLIENT_ID=your_accurate_client_id
ACCURATE_CLIENT_SECRET=your_accurate_client_secret
ACCURATE_REDIRECT_URI=https://yourdomain.com/api/accurate/callback
ACCURATE_SIGNATURE_SECRET=your_accurate_signature_secret
```

**Generate Secret Keys:**
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Konfigurasi Accurate Online

1. Login ke [Accurate Developer Portal](https://account.accurate.id/developer)
2. Buat aplikasi baru atau gunakan yang sudah ada
3. Catat:
   - App Key
   - Client ID
   - Client Secret
   - Signature Secret
4. Set Redirect URI: `https://yourdomain.com/api/accurate/callback`
5. Masukkan ke file `.env`

---

## 🚀 Deployment

### Opsi 1: Deployment Sederhana (Tanpa Nginx)

Untuk testing atau development:

```bash
# Build dan start semua services
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop services
docker-compose down
```

Akses aplikasi:
- Frontend: http://localhost
- Backend API: http://localhost:5000/api

### Opsi 2: Deployment Production (Dengan Nginx)

Untuk production dengan reverse proxy:

```bash
# Berikan permission untuk script
chmod +x scripts/deploy.sh

# Jalankan deployment
./scripts/deploy.sh
```

Script akan otomatis:
1. ✅ Stop container yang sedang berjalan
2. ✅ Pull latest images
3. ✅ Build images baru
4. ✅ Start semua services
5. ✅ Verifikasi health status

### Manual Deployment Production

Jika ingin manual:

```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build images
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

---

## ✅ Verifikasi

### 1. Cek Status Container

```bash
# Lihat semua container
docker ps

# Atau dengan docker-compose
docker-compose -f docker-compose.prod.yml ps
```

Semua container harus status `Up` dan `healthy`.

### 2. Cek Logs

```bash
# Semua logs
docker-compose -f docker-compose.prod.yml logs -f

# Logs specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mysql
docker-compose -f docker-compose.prod.yml logs -f redis
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 3. Test Endpoints

```bash
# Health check
curl http://localhost/health

# Backend API health
curl http://localhost/api/health

# Frontend
curl http://localhost/
```

### 4. Test Database Connection

```bash
# Masuk ke MySQL container
docker exec -it iware-mysql-prod mysql -u iware_user -p

# Di MySQL prompt:
USE iware_warehouse;
SHOW TABLES;
EXIT;
```

### 5. Test Redis Connection

```bash
# Masuk ke Redis container
docker exec -it iware-redis-prod redis-cli -a your_redis_password

# Di Redis prompt:
PING
# Harus return: PONG
EXIT
```

### 6. Buat Admin User

```bash
# Masuk ke backend container
docker exec -it iware-backend-prod sh

# Jalankan script create admin
node src/scripts/create-admin-auto.js

# Keluar dari container
exit
```

---

## 🔄 Maintenance

### Backup Database

**Otomatis dengan script:**
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Backup akan disimpan di folder `./backups/`

**Manual backup:**
```bash
# Backup database
docker exec iware-mysql-prod mysqldump \
  -u iware_user \
  -p \
  iware_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql
```

### Restore Database

```bash
chmod +x scripts/restore.sh
./scripts/restore.sh ./backups/iware_backup_20260422_120000.sql.gz
```

### Update Aplikasi

```bash
# Pull latest code
git pull origin main

# Rebuild dan restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring

**Lihat resource usage:**
```bash
docker stats
```

**Lihat logs real-time:**
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Lihat disk usage:**
```bash
docker system df
```

### Cleanup

**Hapus unused images:**
```bash
docker image prune -a
```

**Hapus unused volumes:**
```bash
docker volume prune
```

**Hapus semua unused resources:**
```bash
docker system prune -a --volumes
```

---

## 🔒 SSL/HTTPS Setup

### Menggunakan Let's Encrypt (Certbot)

1. **Install Certbot:**
```bash
sudo apt-get update
sudo apt-get install certbot
```

2. **Generate SSL Certificate:**
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

3. **Copy certificates ke nginx folder:**
```bash
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

4. **Edit nginx config:**
```bash
nano nginx/conf.d/default.conf
```

Uncomment bagian HTTPS server dan sesuaikan `server_name`.

5. **Restart nginx:**
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

6. **Auto-renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job
sudo crontab -e

# Tambahkan line ini:
0 0 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.prod.yml restart nginx
```

---

## 🐛 Troubleshooting

### Container Tidak Start

```bash
# Cek logs
docker-compose -f docker-compose.prod.yml logs

# Cek specific container
docker logs iware-backend-prod
docker logs iware-mysql-prod
```

### Database Connection Error

```bash
# Cek MySQL status
docker exec iware-mysql-prod mysqladmin ping -h localhost -u root -p

# Cek MySQL logs
docker logs iware-mysql-prod

# Restart MySQL
docker-compose -f docker-compose.prod.yml restart mysql
```

### Redis Connection Error

```bash
# Test Redis
docker exec iware-redis-prod redis-cli -a your_password PING

# Cek Redis logs
docker logs iware-redis-prod

# Restart Redis
docker-compose -f docker-compose.prod.yml restart redis
```

### Port Already in Use

```bash
# Cek port yang digunakan
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :3306

# Stop service yang menggunakan port
sudo systemctl stop apache2  # Jika ada Apache
sudo systemctl stop nginx    # Jika ada Nginx lokal
```

### Out of Memory

```bash
# Cek memory usage
docker stats

# Tambah swap space (Linux)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Rebuild dari Awal

```bash
# Stop dan hapus semua
docker-compose -f docker-compose.prod.yml down -v

# Hapus images
docker rmi $(docker images -q iware*)

# Build ulang
docker-compose -f docker-compose.prod.yml build --no-cache

# Start
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoring & Logs

### Log Locations

- **Backend logs**: `./backend/logs/`
- **Nginx logs**: Docker volume `iware-nginx-logs`
- **MySQL logs**: Di dalam container
- **Redis logs**: Di dalam container

### View Logs

```bash
# Backend logs (dari host)
tail -f backend/logs/all-$(date +%Y-%m-%d).log

# Nginx logs
docker exec iware-nginx-prod tail -f /var/log/nginx/access.log
docker exec iware-nginx-prod tail -f /var/log/nginx/error.log

# MySQL logs
docker logs iware-mysql-prod --tail 100 -f

# Redis logs
docker logs iware-redis-prod --tail 100 -f
```

---

## 🔐 Security Checklist

- [ ] Ganti semua default passwords
- [ ] Generate strong JWT secrets
- [ ] Setup firewall (UFW/iptables)
- [ ] Enable SSL/HTTPS
- [ ] Restrict database access
- [ ] Setup regular backups
- [ ] Enable rate limiting
- [ ] Update CORS origins
- [ ] Secure Redis with password
- [ ] Regular security updates

---

## 📞 Support

Jika mengalami masalah:

1. Cek logs terlebih dahulu
2. Verifikasi konfigurasi `.env`
3. Pastikan semua services healthy
4. Cek dokumentasi Accurate Online API
5. Contact support team

---

## 📝 Catatan Penting

1. **Backup Rutin**: Selalu backup database sebelum update
2. **Environment Variables**: Jangan commit file `.env` ke git
3. **SSL Certificate**: Renew setiap 90 hari (Let's Encrypt)
4. **Monitoring**: Setup monitoring untuk production
5. **Updates**: Update dependencies secara berkala
6. **Security**: Audit security secara berkala

---

**Deployment berhasil! 🎉**

Aplikasi sekarang berjalan di:
- Frontend: http://yourdomain.com
- Backend API: http://yourdomain.com/api
- WebSocket: ws://yourdomain.com/socket.io

---

## 🔗 Integrasi Accurate Online

**PENTING**: Setelah deployment, Anda perlu setup integrasi dengan Accurate Online.

Lihat panduan lengkap: [ACCURATE-INTEGRATION.md](./ACCURATE-INTEGRATION.md)

Quick setup:
```bash
# Linux/Mac
./scripts/setup-accurate.sh

# Windows
.\scripts\setup-accurate.ps1
```
