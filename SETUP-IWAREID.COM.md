# 🚀 Setup Guide untuk iwareid.com

Panduan lengkap deployment iWare Warehouse ke domain **iwareid.com**.

## 📋 Checklist Persiapan

### 1. Domain & DNS
- [ ] Domain iwareid.com sudah terdaftar
- [ ] Akses ke DNS management (Cloudflare/Namecheap/dll)
- [ ] Server/VPS sudah siap dengan IP public

### 2. Server Requirements
- [ ] Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- [ ] RAM minimal 2GB (rekomendasi 4GB)
- [ ] Storage minimal 20GB
- [ ] Docker & Docker Compose terinstall

### 3. Credentials
- [ ] Accurate Developer Portal credentials
- [ ] SSL Certificate (Let's Encrypt)
- [ ] Strong passwords untuk database & Redis

---

## 🌐 Step 1: Setup DNS

### A. Point Domain ke Server

Login ke DNS provider (Cloudflare/Namecheap/dll) dan tambahkan:

```
Type    Name    Value               TTL
A       @       YOUR_SERVER_IP      Auto
A       www     YOUR_SERVER_IP      Auto
```

**Contoh:**
```
A       @       103.123.45.67       Auto
A       www     103.123.45.67       Auto
```

### B. Verifikasi DNS

```bash
# Cek DNS sudah propagate
nslookup iwareid.com
nslookup www.iwareid.com

# Atau pakai dig
dig iwareid.com
dig www.iwareid.com
```

Tunggu 5-30 menit untuk DNS propagation.

---

## 🔧 Step 2: Setup Server

### A. Login ke Server

```bash
ssh root@YOUR_SERVER_IP
# atau
ssh username@YOUR_SERVER_IP
```

### B. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### C. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### D. Setup Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📦 Step 3: Deploy Aplikasi

### A. Clone Repository

```bash
# Buat directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone YOUR_REPOSITORY_URL iware
cd iware
```

### B. Setup Environment

```bash
# Copy template untuk iwareid.com
cp .env.iwareid.com .env

# Edit file
nano .env
```

**Edit nilai berikut:**

```env
# Database Passwords (WAJIB GANTI!)
DB_PASSWORD=IniPasswordKuatDatabase123!@#
DB_ROOT_PASSWORD=IniRootPasswordKuat456!@#

# Redis Password (WAJIB GANTI!)
REDIS_PASSWORD=IniRedisPasswordKuat789!@#

# JWT Secrets (Generate dengan command di bawah)
JWT_SECRET=hasil_generate_64_karakter
JWT_REFRESH_SECRET=hasil_generate_64_karakter_berbeda

# Webhook Secret
WEBHOOK_SECRET=hasil_generate_32_karakter

# Accurate Credentials (dari Developer Portal)
ACCURATE_APP_KEY=your_app_key
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_SIGNATURE_SECRET=your_signature_secret
```

**Generate Secrets:**

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### C. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot -y

# Stop any service on port 80
docker-compose -f docker-compose.prod.yml down

# Generate certificate
sudo certbot certonly --standalone -d iwareid.com -d www.iwareid.com

# Certificate akan disimpan di:
# /etc/letsencrypt/live/iwareid.com/fullchain.pem
# /etc/letsencrypt/live/iwareid.com/privkey.pem
```

### D. Copy SSL Certificate

```bash
# Buat directory SSL
mkdir -p nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/iwareid.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/iwareid.com/privkey.pem nginx/ssl/

# Set permissions
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem
```

### E. Update Nginx Configuration

```bash
# Copy konfigurasi iwareid.com
cp nginx/conf.d/iwareid.com.conf nginx/conf.d/default.conf

# Atau edit manual
nano nginx/conf.d/default.conf
```

Pastikan SSL certificate path sudah benar:
```nginx
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

### F. Deploy!

```bash
# Build dan start semua services
docker-compose -f docker-compose.prod.yml up -d --build

# Tunggu beberapa saat (30-60 detik)

# Cek status
docker-compose -f docker-compose.prod.yml ps

# Cek logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ✅ Step 4: Verifikasi

### A. Cek Containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

Semua harus status **Up (healthy)**:
```
iware-nginx-prod        Up (healthy)
iware-frontend-prod     Up (healthy)
iware-backend-prod      Up (healthy)
iware-mysql-prod        Up (healthy)
iware-redis-prod        Up (healthy)
```

### B. Test Endpoints

```bash
# Test HTTPS
curl https://iwareid.com/health

# Test API
curl https://iwareid.com/api/health

# Test redirect HTTP -> HTTPS
curl -I http://iwareid.com
# Should return: 301 Moved Permanently
```

### C. Test di Browser

Buka browser dan akses:
- https://iwareid.com
- https://www.iwareid.com

Harus muncul halaman login iWare.

---

## 👤 Step 5: Setup Admin User

```bash
# Masuk ke backend container
docker exec -it iware-backend-prod sh

# Buat admin user
node src/scripts/create-admin-auto.js

# Keluar
exit
```

Default admin sudah ada di database:
- Email: `superadmin@iware.id`
- Password: `admin123`

**WAJIB ganti password setelah login pertama!**

---

## 🔗 Step 6: Setup Accurate Integration

### A. Daftar Aplikasi di Accurate

1. Buka: https://account.accurate.id/developer
2. Login dengan akun Accurate Online
3. Klik **"Create New Application"**
4. Isi form:
   - **Application Name**: iWare Warehouse
   - **Description**: Warehouse Management System
   - **Redirect URI**: `https://iwareid.com/api/accurate/callback`
5. Save dan catat credentials

### B. Update Environment

```bash
# Edit .env
nano .env
```

Update dengan credentials dari Accurate:
```env
ACCURATE_APP_KEY=dari_developer_portal
ACCURATE_CLIENT_ID=dari_developer_portal
ACCURATE_CLIENT_SECRET=dari_developer_portal
ACCURATE_SIGNATURE_SECRET=dari_developer_portal
ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback
```

### C. Restart Backend

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### D. OAuth Authorization

1. Login ke aplikasi: https://iwareid.com
2. Buka menu **Settings** atau **Integrasi**
3. Klik **"Connect to Accurate"**
4. Login dan authorize di Accurate
5. Pilih database yang akan diintegrasikan
6. Selesai!

---

## 🔄 Step 7: Setup Auto Renewal SSL

```bash
# Edit crontab
sudo crontab -e

# Tambahkan line ini (renew setiap hari jam 2 pagi)
0 2 * * * certbot renew --quiet --post-hook "cd /var/www/iware && docker-compose -f docker-compose.prod.yml restart nginx"
```

---

## 📊 Step 8: Setup Monitoring & Backup

### A. Setup Backup Otomatis

```bash
# Edit crontab
crontab -e

# Backup database setiap hari jam 3 pagi
0 3 * * * cd /var/www/iware && ./scripts/backup.sh
```

### B. Setup Monitoring

```bash
# Install monitoring script
chmod +x scripts/monitor.sh

# Jalankan monitoring
./scripts/monitor.sh
```

---

## 🔒 Step 9: Security Hardening

### A. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### B. Install Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### C. Setup Cloudflare (Optional)

Untuk extra security, gunakan Cloudflare:
1. Tambahkan domain ke Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full Strict)
4. Enable DDoS protection
5. Enable WAF rules

---

## ✅ Checklist Final

### Pre-Production
- [ ] DNS pointing ke server
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Passwords diganti semua
- [ ] Firewall configured

### Deployment
- [ ] All containers running & healthy
- [ ] HTTPS working (https://iwareid.com)
- [ ] HTTP redirect to HTTPS working
- [ ] API accessible (https://iwareid.com/api/health)
- [ ] Admin user created

### Integration
- [ ] Accurate app registered
- [ ] Credentials configured
- [ ] OAuth authorization done
- [ ] Data sync working

### Security
- [ ] SSL auto-renewal configured
- [ ] Backup scheduled
- [ ] Monitoring setup
- [ ] Firewall enabled
- [ ] Root login disabled

### Post-Deployment
- [ ] Change default admin password
- [ ] Test all features
- [ ] Train users
- [ ] Document custom configurations

---

## 🆘 Troubleshooting

### Issue: SSL Certificate Error

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Copy to nginx
sudo cp /etc/letsencrypt/live/iwareid.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/iwareid.com/privkey.pem nginx/ssl/

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Issue: Can't Access Website

```bash
# Check DNS
nslookup iwareid.com

# Check firewall
sudo ufw status

# Check containers
docker-compose -f docker-compose.prod.yml ps

# Check nginx logs
docker logs iware-nginx-prod
```

### Issue: Database Connection Failed

```bash
# Check MySQL
docker exec iware-mysql-prod mysqladmin ping -h localhost -u root -p

# Check logs
docker logs iware-mysql-prod

# Restart
docker-compose -f docker-compose.prod.yml restart mysql
```

---

## 📞 Support

**Domain**: https://iwareid.com
**API**: https://iwareid.com/api
**Admin**: https://iwareid.com/admin

**Dokumentasi:**
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ACCURATE-INTEGRATION.md](./ACCURATE-INTEGRATION.md)
- [ENV-GUIDE.md](./ENV-GUIDE.md)

---

## 🎉 Selesai!

Aplikasi iWare Warehouse sudah live di **https://iwareid.com**!

**Next Steps:**
1. Login dan ganti password admin
2. Setup Accurate integration
3. Train users
4. Monitor performance
5. Regular backups

**Selamat! Deployment berhasil!** 🚀
