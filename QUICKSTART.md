# Quick Start Guide - iWare Deployment

## 🚀 Quick Start (5 Menit)

### Prerequisites
- Ubuntu 20.04+ di VPS Hostinger
- Domain sudah pointing ke IP VPS
- SSH access ke VPS

### Step 1: Koneksi ke VPS
```bash
ssh root@your_vps_ip
```

### Step 2: Download & Setup
```bash
cd /home
git clone https://github.com/yourorg/iware.git
cd iware

# Copy dan edit environment
cp .env.example .env.production
nano .env.production
```

### Step 3: Install Docker
```bash
sudo bash scripts/install-docker.sh
```

### Step 4: Deploy
```bash
sudo bash deploy.sh
```

### Step 5: Setup SSL (Optional)
```bash
sudo bash scripts/setup-ssl.sh
```

### Step 6: Check Status
```bash
docker-compose ps
curl http://localhost/health
```

---

## 📋 Detailed Checklist

### Pre-Deployment
- [ ] VPS owner login berhasil
- [ ] Domain pointing ke VPS
- [ ] Firewall ports 22, 80, 443 terbuka

### Installation
- [ ] Docker & Docker Compose installed
- [ ] Project cloned
- [ ] .env.production configured (DB, JWT, API keys)
- [ ] Directories created (logs, ssl)

### Deployment
- [ ] Run deploy.sh
- [ ] All containers healthy
- [ ] API responding
- [ ] Frontend accessible

### Security
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] Systemd service running
- [ ] Firewall configured

### Monitoring
- [ ] Health check script working
- [ ] Logs accessible
- [ ] Backup configured
- [ ] Auto-renewal enabled

---

## 🆘 Quick Troubleshooting

```bash
# Check everything
bash scripts/health-check.sh

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Full reset
docker-compose down -v
docker-compose up -d --build
```

---

## 📚 Full Guide
Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk dokumentasi lengkap.
