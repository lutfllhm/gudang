# ⚡ Quick Deploy Checklist - VPS Hostinger

Print checklist ini dan centang setiap langkah yang sudah selesai.

---

## 📋 Pre-Deployment (5 menit)

- [ ] VPS Hostinger KVM 2 sudah aktif
- [ ] Catat IP VPS: `___.___.___. ___`
- [ ] Catat password root: `________________`
- [ ] Domain sudah pointing ke IP VPS (opsional)
- [ ] Domain: `________________.com`

---

## 🔧 Setup VPS (10 menit)

### Login & Update
```bash
ssh root@xxx.xxx.xxx.xxx
apt update && apt upgrade -y
```
- [ ] Login berhasil
- [ ] System updated

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
docker --version
```
- [ ] Docker terinstall
- [ ] Version: `________________`

### Setup Firewall
```bash
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```
- [ ] Firewall configured

---

## 📁 Setup Project (5 menit)

### Clone Project
```bash
mkdir -p /root/apps && cd /root/apps
git clone YOUR_REPO_URL iware-warehouse
cd iware-warehouse
```
- [ ] Project cloned

### Create Directories
```bash
mkdir -p nginx/ssl nginx/logs backend/logs
```
- [ ] Directories created

---

## ⚙️ Configuration (10 menit)

### Edit .env (Root)
```bash
nano .env
```
- [ ] MYSQL_ROOT_PASSWORD: `________________`
- [ ] DB_PASSWORD: `________________`
- [ ] REDIS_PASSWORD: `________________`
- [ ] VITE_API_URL: `https://________________.com/api`

### Generate Secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- [ ] JWT_SECRET: `________________`
- [ ] JWT_REFRESH_SECRET: `________________`
- [ ] WEBHOOK_SECRET: `________________`

### Edit backend/.env
```bash
nano backend/.env
```
- [ ] DB_PASSWORD (sama dengan .env)
- [ ] JWT_SECRET (dari generate)
- [ ] JWT_REFRESH_SECRET (dari generate)
- [ ] WEBHOOK_SECRET (dari generate)
- [ ] CORS_ORIGIN: `https://________________.com`

---

## 🔐 Accurate Online Setup (5 menit)

### Developer Portal
1. Buka: https://account.accurate.id/developer/application
2. Create New Application

- [ ] Application Name: `iWare Warehouse`
- [ ] Redirect URI: `https://________________.com/api/accurate/callback`
- [ ] Scopes: item_view, sales_order_view, customer_view, warehouse_view

### Catat Credentials
- [ ] APP_KEY: `________________`
- [ ] CLIENT_ID: `________________`
- [ ] CLIENT_SECRET: `________________`
- [ ] SIGNATURE_SECRET: `________________`

### Update backend/.env
```bash
nano backend/.env
```
- [ ] ACCURATE_APP_KEY
- [ ] ACCURATE_CLIENT_ID
- [ ] ACCURATE_CLIENT_SECRET
- [ ] ACCURATE_SIGNATURE_SECRET
- [ ] ACCURATE_REDIRECT_URI

---

## 🚀 Deploy (10 menit)

### Build & Start
```bash
docker compose build
docker compose up -d
```
- [ ] Build selesai (5-10 menit)
- [ ] All containers running

### Check Status
```bash
docker compose ps
```
- [ ] iware-mysql: Up (healthy)
- [ ] iware-redis: Up (healthy)
- [ ] iware-backend: Up (healthy)
- [ ] iware-frontend: Up (healthy)
- [ ] iware-nginx: Up (healthy)

### Create Admin
```bash
docker compose exec backend node src/scripts/create-admin-auto.js
```
- [ ] Admin created
- [ ] Email: `superadmin@iware.id`
- [ ] Password: `admin123`

---

## 🔒 SSL Setup (5 menit)

### Install Certbot
```bash
apt install -y certbot
docker compose stop nginx
```
- [ ] Certbot installed

### Generate Certificate
```bash
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```
- [ ] Certificate generated
- [ ] Email: `________________`

### Copy Certificates
```bash
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
chmod 600 nginx/ssl/*.pem
```
- [ ] Certificates copied

### Enable HTTPS
```bash
nano nginx/nginx.conf
# Uncomment HTTPS server block
docker compose up -d nginx
```
- [ ] HTTPS enabled
- [ ] Nginx restarted

---

## ✅ Testing (5 menit)

### Health Checks
```bash
curl https://your-domain.com/health
```
- [ ] Health check OK

### Test Accurate
```bash
docker compose exec backend npm run test:accurate
```
- [ ] All tests passed

### Access Application
- [ ] Open: `https://________________.com`
- [ ] Login successful
- [ ] Dashboard loads

### Connect Accurate
- [ ] Click "Connect to Accurate Online"
- [ ] Login to Accurate
- [ ] Authorize application
- [ ] Status: Connected ✅

### Test Sync
- [ ] Sync items successful
- [ ] Sync sales orders successful
- [ ] Data visible in dashboard

---

## 📊 Post-Deployment (5 menit)

### Setup Backup
```bash
nano /root/backup-db.sh
chmod +x /root/backup-db.sh
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```
- [ ] Backup script created
- [ ] Cron job added

### Setup Auto-Renewal
```bash
crontab -e
# Add: 0 3 * * * certbot renew --quiet
```
- [ ] Auto-renewal configured

### Change Admin Password
- [ ] Login to application
- [ ] Go to Settings
- [ ] Change password
- [ ] New password: `________________`

---

## 📝 Final Checklist

- [ ] Application accessible: `https://________________.com`
- [ ] SSL/HTTPS working
- [ ] Admin login working
- [ ] Accurate Online connected
- [ ] Data sync working
- [ ] Backup configured
- [ ] Auto-renewal configured
- [ ] Admin password changed
- [ ] Firewall enabled
- [ ] All services healthy

---

## 📞 Important Info

**VPS Details:**
- IP: `___.___.___. ___`
- Domain: `________________.com`
- SSH User: `root`
- SSH Password: `________________`

**Application:**
- URL: `https://________________.com`
- Admin Email: `superadmin@iware.id`
- Admin Password: `________________`

**Database:**
- MySQL Root Password: `________________`
- DB User: `accurate_user`
- DB Password: `________________`

**Accurate Online:**
- APP_KEY: `________________`
- CLIENT_ID: `________________`

---

## 🎉 Deployment Complete!

**Total Time:** ~60 menit

**Status:** ⬜ Success / ⬜ Failed

**Deployed by:** `________________`

**Date:** `________________`

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Next Steps:**
1. Monitor logs: `docker compose logs -f`
2. Setup monitoring (optional)
3. Configure auto-sync interval
4. Add more users
5. Customize settings

**Selamat! Aplikasi sudah live! 🚀**
