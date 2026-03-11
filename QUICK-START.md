# ⚡ Quick Start Guide - iWare Warehouse

## 🚀 Deploy dalam 5 Menit

### 1️⃣ Setup VPS (First Time Only)
```bash
# Login ke VPS
ssh root@your_vps_ip

# Run setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/iware-warehouse/main/scripts/setup-vps.sh | bash
```

### 2️⃣ Clone Project
```bash
cd /var/www
git clone https://github.com/your-username/iware-warehouse.git
cd iware-warehouse
```

### 3️⃣ Configure Environment
```bash
# Copy template
cp .env.production .env.production.local

# Generate secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # JWT_REFRESH_SECRET
openssl rand -hex 32  # WEBHOOK_SECRET

# Edit configuration
nano .env.production
```

**Minimal Configuration:**
```env
# Database
MYSQL_ROOT_PASSWORD=your_strong_password
DB_PASSWORD=your_strong_password

# Redis
REDIS_PASSWORD=your_strong_password

# JWT
JWT_SECRET=hasil_generate_di_atas
JWT_REFRESH_SECRET=hasil_generate_di_atas

# Accurate (dari developer portal)
ACCURATE_APP_KEY=your_app_key
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
```

### 4️⃣ Deploy
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
```

### 5️⃣ Verify
```bash
# Check health
./scripts/health-check.sh

# View logs
./scripts/logs.sh
```

**⏱️ Tunggu 2-3 menit** untuk semua container menjadi healthy.

Status yang diharapkan:
```
NAME              STATUS
iware-mysql       Up (healthy)
iware-redis       Up (healthy)
iware-backend     Up (healthy)
iware-frontend    Up (healthy)
iware-nginx       Up (healthy)
```

---

## 📋 Common Commands

### Deployment
```bash
./scripts/deploy.sh          # Deploy/redeploy aplikasi
./scripts/update.sh          # Update aplikasi
./scripts/restart.sh         # Restart semua services
./scripts/restart.sh backend # Restart specific service
```

### Monitoring
```bash
./scripts/health-check.sh    # Check health semua services
./scripts/logs.sh            # View logs semua services
./scripts/logs.sh backend    # View logs specific service
./scripts/monitor.sh         # Real-time monitoring
./scripts/debug.sh backend   # Debug specific service
```

### Maintenance
```bash
./scripts/backup.sh          # Backup database
./scripts/clean.sh           # Clean unused resources
```

### Docker Commands
```bash
docker compose ps            # Status containers
docker compose logs -f       # Follow logs
docker compose restart       # Restart all
docker compose down          # Stop all
docker compose up -d         # Start all
```

---

## 🔍 Troubleshooting Quick Fix

### Container Unhealthy?
```bash
# 1. Check logs
./scripts/debug.sh <service_name>

# 2. Restart service
docker compose restart <service_name>

# 3. Check health
./scripts/health-check.sh
```

### Database Connection Failed?
```bash
# Check MySQL
docker compose exec mysql mysqladmin ping -h localhost -u root -p

# Restart MySQL
docker compose restart mysql

# Wait and check backend
sleep 10
docker compose restart backend
```

### Port Already in Use?
```bash
# Check what's using the port
netstat -tulpn | grep :80

# Kill the process
kill -9 <PID>

# Restart
docker compose up -d
```

---

## 🎯 Access Points

- **Frontend**: http://your-domain.com
- **Backend API**: http://your-domain.com/api
- **Health Check**: http://your-domain.com/health

---

## 📞 Need Help?

1. Check logs: `./scripts/logs.sh`
2. Run debug: `./scripts/debug.sh <service>`
3. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide
4. Check [Troubleshooting section](DEPLOYMENT.md#troubleshooting)
