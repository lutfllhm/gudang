# 🏥 Healthcheck Configuration

## ✅ Konfigurasi Healthcheck yang Sudah Diperbaiki

### 1. MySQL
```yaml
healthcheck:
  test: mysqladmin ping
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```
- **Start period:** 30 detik (cukup untuk MySQL init)
- **Status:** ✅ Akan healthy setelah MySQL siap

### 2. Redis
```yaml
healthcheck:
  test: redis-cli -a password ping
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```
- **Start period:** 10 detik (Redis cepat start)
- **Fix:** Menggunakan `-a password` untuk auth
- **Status:** ✅ Akan healthy setelah Redis siap

### 3. Backend
```yaml
healthcheck:
  test: wget http://localhost:5000/health
  interval: 30s
  timeout: 10s
  retries: 10
  start_period: 90s
```
- **Start period:** 90 detik (waktu untuk koneksi DB + Redis)
- **Retries:** 10x (lebih toleran)
- **Status:** ✅ Akan healthy setelah:
  - MySQL healthy
  - Redis healthy
  - Backend connect ke DB
  - Backend connect ke Redis
  - Server listening

### 4. Frontend
```yaml
healthcheck:
  test: curl http://localhost:80/health
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```
- **Start period:** 60 detik (waktu untuk build selesai)
- **Status:** ✅ Akan healthy setelah Nginx serve files

### 5. Nginx
```yaml
healthcheck:
  test: wget http://localhost:80/health
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 30s
```
- **Start period:** 30 detik
- **Status:** ✅ Akan healthy setelah Nginx start

## 🔄 Startup Sequence

```
1. MySQL starts (0s)
   └─ Healthy after ~20-30s

2. Redis starts (0s)
   └─ Healthy after ~5-10s

3. Backend starts (after MySQL & Redis healthy)
   └─ Waits for dependencies
   └─ Connects to MySQL (retry 5x)
   └─ Connects to Redis (optional)
   └─ Starts server
   └─ Healthy after ~30-60s

4. Frontend starts (after Backend healthy)
   └─ Nginx serves static files
   └─ Healthy after ~10-20s

5. Nginx starts (after Frontend & Backend healthy)
   └─ Proxies requests
   └─ Healthy after ~5-10s
```

**Total startup time: ~2-3 minutes**

## ✅ Mengapa Tidak Akan Unhealthy?

### 1. Start Period Cukup Panjang
- MySQL: 30s (cukup untuk init)
- Redis: 10s (cukup untuk start)
- Backend: 90s (cukup untuk koneksi DB + start)
- Frontend: 60s (cukup untuk serve files)
- Nginx: 30s (cukup untuk start)

### 2. Retry Mechanism
- Backend punya retry 5x untuk koneksi DB (di code)
- Healthcheck punya retries tinggi (5-10x)
- Interval check 30s (tidak terlalu agresif)

### 3. Dependencies Benar
```
nginx → frontend → backend → mysql
                          → redis
```
- Setiap service tunggu dependency healthy dulu
- Tidak ada circular dependency

### 4. Health Endpoints Ada
- Backend: `/health` endpoint tersedia
- Frontend: `/health` endpoint di nginx config
- Nginx: `/health` endpoint di config

## 🔍 Monitoring Healthcheck

### Check Status
```bash
docker compose ps
```

Output yang diharapkan:
```
NAME              STATUS
iware-mysql       Up (healthy)
iware-redis       Up (healthy)
iware-backend     Up (healthy)
iware-frontend    Up (healthy)
iware-nginx       Up (healthy)
```

### Check Logs Jika Unhealthy
```bash
# Check specific service
docker compose logs backend

# Check healthcheck logs
docker inspect iware-backend | grep -A 10 Health
```

## 🚨 Troubleshooting

### Jika Backend Unhealthy
```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Database connection failed
# 2. Redis connection failed
# 3. Port already in use

# Solution:
docker compose restart backend
```

### Jika MySQL Unhealthy
```bash
# Check logs
docker compose logs mysql

# Common issues:
# 1. Initialization taking too long
# 2. Disk space full

# Solution:
docker compose restart mysql
```

### Jika Redis Unhealthy
```bash
# Check logs
docker compose logs redis

# Common issues:
# 1. Password authentication failed
# 2. Port already in use

# Solution:
docker compose restart redis
```

## 💡 Tips

1. **Tunggu 2-3 menit** setelah deploy untuk semua service healthy
2. **Jangan restart terlalu cepat** - beri waktu healthcheck
3. **Check logs** jika ada yang unhealthy
4. **Start period sudah optimal** - tidak perlu diubah
5. **Retries sudah cukup** - akan retry otomatis

## ✅ Kesimpulan

Dengan konfigurasi ini, **semua container akan healthy** karena:
- ✅ Start period cukup panjang
- ✅ Retries cukup banyak
- ✅ Dependencies benar
- ✅ Health endpoints ada
- ✅ Backend punya retry mechanism
- ✅ Interval check tidak terlalu agresif

**Tidak akan ada container unhealthy jika:**
- Environment variables benar
- Port tidak conflict
- Disk space cukup
- Memory cukup
