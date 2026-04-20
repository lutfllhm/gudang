# 🐳 Index Dokumentasi Deploy Docker

## Quick Start - Deploy dengan Docker

### Untuk yang Pakai Docker Compose

**Baca dokumentasi ini:**
1. **CARA_DEPLOY_DOCKER.txt** ⭐ **MULAI DARI SINI**
   - Panduan lengkap Bahasa Indonesia
   - 3 cara deploy Docker
   - Troubleshooting lengkap

2. **DEPLOY_DOCKER_GUIDE.md**
   - Dokumentasi teknis lengkap
   - Docker Compose configuration
   - Performance optimization

**Gunakan script ini:**
- `deploy-docker.sh` - Interactive script
- `deploy-docker-simple.sh` - Simple script (edit dulu)

### Quick Commands

```bash
# Deploy lengkap
cd /var/www/iware && \
docker-compose exec -T mysql mysqldump -u root -p'password' iware_warehouse > backup-$(date +%Y%m%d).sql && \
git pull && \
cat backend/database/add-sales-order-history.sql | docker-compose exec -T mysql mysql -u root -p'password' iware_warehouse && \
docker-compose build backend frontend && \
docker-compose restart backend frontend

# Verify
docker-compose ps
docker-compose logs --tail=20 backend
```

## Dokumentasi Lengkap

### Deploy ke VPS
- **PM2/Systemd**: `CARA_DEPLOY_KE_VPS.txt`
- **Docker**: `CARA_DEPLOY_DOCKER.txt` ⭐
- **Checklist**: `DEPLOY_CHECKLIST.md`

### Setup Lokal
- **Quick Start**: `QUICK_START_HISTORY.md`
- **Panduan Lengkap**: `CARA_SETUP_HISTORY.txt`

### Reference
- **Summary**: `HISTORY_FEATURE_SUMMARY.md`
- **Docker Guide**: `DEPLOY_DOCKER_GUIDE.md`
- **VPS Commands**: `VPS_QUICK_COMMANDS.txt`

## Estimasi Waktu

- **Backup**: 1-2 menit
- **Pull code**: 30 detik
- **Setup database**: 30 detik
- **Rebuild images**: 3-5 menit
- **Restart**: 30 detik
- **Verify**: 2 menit

**Total**: 10-15 menit  
**Downtime**: 1-2 menit

## Troubleshooting Cepat

```bash
# Container tidak start
docker-compose logs backend
docker-compose restart backend

# Database error
docker-compose logs mysql
docker-compose exec mysql mysql -u root -p

# Rebuild tanpa cache
docker-compose build --no-cache backend frontend

# Rollback
git reset --hard HEAD~1
docker-compose build backend frontend
docker-compose restart backend frontend
```

---

**Mulai deploy**: Buka `CARA_DEPLOY_DOCKER.txt` 🚀
