# 📊 Perbandingan docker-compose.yml vs docker-compose.production.yml

## 🎯 Ringkasan Singkat

| Aspek | docker-compose.yml | docker-compose.production.yml |
|-------|-------------------|-------------------------------|
| **Arsitektur** | Simple (3 services) | Production (4 services) |
| **Nginx** | Di dalam frontend container | Service terpisah (reverse proxy) |
| **Port Exposure** | Backend & Frontend exposed | Hanya Nginx exposed |
| **Kompleksitas** | ⭐⭐ Simple | ⭐⭐⭐ Medium |
| **Use Case** | Development, Small Scale | Production, Scalable |
| **Security** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Better |
| **Performance** | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Better |

---

## 📁 Struktur Services

### docker-compose.yml (Simple)
```
┌─────────────────────────────────────┐
│  Browser                            │
└──────────┬──────────────────────────┘
           │
           ├─→ Frontend Container (port 80/443)
           │   └─ Nginx + React Build
           │
           └─→ Backend Container (port 5000)
               └─ Node.js API
                  ├─→ MySQL (port 3306)
                  └─→ Redis (port 6379)
```

**Total Services: 4**
- MySQL
- Redis
- Backend
- Frontend (dengan Nginx built-in)

### docker-compose.production.yml (Production)
```
┌─────────────────────────────────────┐
│  Browser                            │
└──────────┬──────────────────────────┘
           │
           ▼
    Nginx Reverse Proxy (port 80/443)
           │
           ├─→ Frontend Container (internal)
           │   └─ Nginx + React Build
           │
           └─→ Backend Container (internal)
               └─ Node.js API
                  ├─→ MySQL (internal)
                  └─→ Redis (internal)
```

**Total Services: 5**
- MySQL
- Redis
- Backend
- Frontend
- **Nginx (Reverse Proxy)** ← TAMBAHAN

---

## 🔍 Perbedaan Detail

### 1. Port Exposure

#### docker-compose.yml
```yaml
backend:
  ports:
    - "5000:5000"  # ✅ EXPOSED ke host

frontend:
  ports:
    - "80:80"      # ✅ EXPOSED ke host
    - "443:443"    # ✅ EXPOSED ke host

mysql:
  ports:
    - "3306:3306"  # ✅ EXPOSED ke host

redis:
  ports:
    - "6379:6379"  # ✅ EXPOSED ke host
```

**Akses:**
- Frontend: http://localhost
- Backend: http://localhost:5000
- MySQL: localhost:3306
- Redis: localhost:6379

**Risiko:**
- ⚠️ Backend API bisa diakses langsung dari luar
- ⚠️ Database exposed (bisa diakses dari luar)
- ⚠️ Redis exposed

#### docker-compose.production.yml
```yaml
backend:
  expose:
    - "5000"       # ❌ TIDAK exposed ke host (hanya internal network)

frontend:
  expose:
    - "80"         # ❌ TIDAK exposed ke host

mysql:
  # NO ports       # ❌ TIDAK exposed ke host

redis:
  # NO ports       # ❌ TIDAK exposed ke host

nginx:
  ports:
    - "80:80"      # ✅ HANYA Nginx yang exposed
    - "443:443"
```

**Akses:**
- Frontend: http://localhost (via Nginx)
- Backend: http://localhost/api (via Nginx)
- MySQL: ❌ Tidak bisa diakses dari luar
- Redis: ❌ Tidak bisa diakses dari luar

**Keamanan:**
- ✅ Backend API hanya bisa diakses via Nginx
- ✅ Database tidak bisa diakses dari luar
- ✅ Redis tidak bisa diakses dari luar
- ✅ Single entry point (Nginx)

---

### 2. Nginx Configuration

#### docker-compose.yml
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile  # Nginx config di dalam Dockerfile
```

**Nginx Config Location:**
- `frontend/nginx.conf` (built into container)
- Tidak bisa diubah tanpa rebuild container

**Fitur:**
- ✅ Basic SPA routing
- ✅ Static file serving
- ✅ Gzip compression
- ❌ No reverse proxy
- ❌ No rate limiting
- ❌ No load balancing

#### docker-compose.production.yml
```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro  # External config
```

**Nginx Config Location:**
- `nginx/nginx.conf` (external file)
- Bisa diubah tanpa rebuild (reload saja)

**Fitur:**
- ✅ Reverse proxy untuk backend & frontend
- ✅ Rate limiting (API & login)
- ✅ Load balancing ready
- ✅ Advanced caching
- ✅ Better logging
- ✅ SSL/TLS termination
- ✅ Security headers
- ✅ Connection pooling

---

### 3. API URL Configuration

#### docker-compose.yml
```yaml
frontend:
  build:
    args:
      - VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}
```

**Frontend mengakses:**
```
http://localhost:5000/api/items
```

**Flow:**
```
Browser → Frontend (localhost:80)
Browser → Backend (localhost:5000) ← Direct access
```

#### docker-compose.production.yml
```yaml
frontend:
  build:
    args:
      - VITE_API_URL=${VITE_API_URL:-/api}  # Relative URL
```

**Frontend mengakses:**
```
/api/items  (same origin)
```

**Flow:**
```
Browser → Nginx (localhost:80)
         ├→ /api/* → Backend (internal)
         └→ /* → Frontend (internal)
```

**Keuntungan:**
- ✅ No CORS issues (same origin)
- ✅ Backend tidak exposed
- ✅ Easier SSL setup

---

### 4. Security Features

#### docker-compose.yml

**Security:**
- ✅ Basic security (Helmet.js di backend)
- ✅ CORS configuration
- ⚠️ Backend exposed (bisa diakses langsung)
- ⚠️ Database exposed
- ⚠️ No centralized rate limiting
- ⚠️ No request filtering

**Security Score: 6/10**

#### docker-compose.production.yml

**Security:**
- ✅ All services internal (tidak exposed)
- ✅ Single entry point (Nginx)
- ✅ Rate limiting di Nginx
  - API: 10 req/sec
  - Login: 5 req/min
- ✅ Security headers (X-Frame-Options, CSP, dll)
- ✅ Request filtering
- ✅ DDoS protection (rate limiting)
- ✅ SSL/TLS ready

**Security Score: 9/10**

---

### 5. Performance & Scalability

#### docker-compose.yml

**Performance:**
- ✅ Good untuk small scale
- ⚠️ No connection pooling
- ⚠️ No load balancing
- ⚠️ Sulit untuk scale

**Scalability:**
```bash
# Tidak bisa scale dengan mudah
docker-compose up --scale backend=3  # ❌ Port conflict
```

#### docker-compose.production.yml

**Performance:**
- ✅ Connection pooling (keepalive)
- ✅ Load balancing ready
- ✅ Better caching
- ✅ Request buffering

**Scalability:**
```bash
# Bisa scale dengan mudah
docker-compose -f docker-compose.production.yml up --scale backend=3
```

Nginx akan otomatis load balance ke 3 backend instances.

---

### 6. Logging & Monitoring

#### docker-compose.yml

**Logs:**
```bash
# Backend logs
docker-compose logs backend

# Frontend logs (Nginx)
docker-compose logs frontend
```

**Monitoring:**
- ⚠️ Logs tersebar di 2 tempat
- ⚠️ Sulit untuk centralized monitoring

#### docker-compose.production.yml

**Logs:**
```bash
# Nginx access logs (semua request)
docker-compose -f docker-compose.production.yml logs nginx

# Backend logs
docker-compose -f docker-compose.production.yml logs backend

# Nginx logs di host
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

**Monitoring:**
- ✅ Centralized logging di Nginx
- ✅ Request timing (upstream response time)
- ✅ Easier untuk integrate dengan monitoring tools
- ✅ Better analytics

---

### 7. SSL/HTTPS Setup

#### docker-compose.yml

**SSL Setup:**
```
❌ Sulit - harus modify frontend/nginx.conf
❌ Harus rebuild container
❌ Certificate management di dalam container
```

**Steps:**
1. Edit `frontend/nginx.conf`
2. Copy certificates ke container
3. Rebuild frontend container
4. Restart

#### docker-compose.production.yml

**SSL Setup:**
```
✅ Mudah - edit nginx/nginx.conf
✅ No rebuild needed
✅ Certificate management di host
```

**Steps:**
1. Copy certificates ke `nginx/ssl/`
2. Uncomment HTTPS server di `nginx/nginx.conf`
3. Reload Nginx: `docker-compose exec nginx nginx -s reload`

---

### 8. Development Workflow

#### docker-compose.yml

**Development:**
```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Stop
docker-compose down
```

**Pros:**
- ✅ Simple commands
- ✅ Faster startup
- ✅ Easy debugging (direct access)

**Cons:**
- ⚠️ Tidak sama dengan production
- ⚠️ Security issues di development

#### docker-compose.production.yml

**Production:**
```bash
# Start
docker-compose -f docker-compose.production.yml up -d

# Logs
docker-compose -f docker-compose.production.yml logs -f

# Reload Nginx config (no downtime)
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

# Stop
docker-compose -f docker-compose.production.yml down
```

**Pros:**
- ✅ Production-like environment
- ✅ Better security
- ✅ Easier to scale

**Cons:**
- ⚠️ Sedikit lebih kompleks
- ⚠️ Extra container (Nginx)

---

## 🎯 Kapan Menggunakan Masing-Masing?

### Gunakan docker-compose.yml Jika:

✅ Development/Testing lokal
✅ Small scale deployment (< 100 users)
✅ Tidak perlu high security
✅ Ingin setup yang simple
✅ Tidak perlu load balancing
✅ Budget terbatas (fewer resources)

**Contoh Use Case:**
- Development environment
- Demo/POC
- Internal tools
- Small business (<50 users)

### Gunakan docker-compose.production.yml Jika:

✅ Production deployment
✅ Medium to large scale (100+ users)
✅ Perlu high security
✅ Perlu load balancing
✅ Perlu SSL/HTTPS
✅ Perlu centralized logging
✅ Perlu scalability

**Contoh Use Case:**
- Production website
- SaaS application
- E-commerce
- Enterprise application
- Public-facing API

---

## 📊 Comparison Table

| Feature | docker-compose.yml | docker-compose.production.yml |
|---------|-------------------|-------------------------------|
| **Services** | 4 | 5 (+Nginx) |
| **Complexity** | Low | Medium |
| **Security** | Medium | High |
| **Performance** | Good | Better |
| **Scalability** | Limited | Good |
| **SSL Setup** | Hard | Easy |
| **Rate Limiting** | Backend only | Nginx + Backend |
| **Load Balancing** | No | Yes |
| **Monitoring** | Basic | Advanced |
| **Port Exposure** | All exposed | Only Nginx |
| **CORS Issues** | Possible | No (same origin) |
| **Config Changes** | Rebuild needed | Reload only |
| **Resource Usage** | Lower | Slightly higher |
| **Startup Time** | Faster | Slightly slower |

---

## 🚀 Rekomendasi

### Untuk Development:
```bash
# Gunakan docker-compose.yml
docker-compose up -d
```

### Untuk Staging/Testing:
```bash
# Gunakan docker-compose.production.yml
docker-compose -f docker-compose.production.yml up -d
```

### Untuk Production:
```bash
# Gunakan docker-compose.production.yml + SSL
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔄 Migration Path

### Dari Simple ke Production:

1. **Test di development:**
   ```bash
   docker-compose up -d
   ```

2. **Test production config di local:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Setup SSL certificates:**
   ```bash
   # Generate atau copy certificates
   cp cert.pem nginx/ssl/
   cp key.pem nginx/ssl/
   ```

4. **Deploy ke production:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

5. **Monitor & optimize:**
   ```bash
   docker-compose -f docker-compose.production.yml logs -f nginx
   ```

---

## ✅ Kesimpulan

**docker-compose.yml:**
- 👍 Simple, cepat, mudah untuk development
- 👎 Kurang secure, sulit scale, tidak production-ready

**docker-compose.production.yml:**
- 👍 Secure, scalable, production-ready, better performance
- 👎 Sedikit lebih kompleks, butuh extra container

**Rekomendasi Final:**
- Development: `docker-compose.yml`
- Production: `docker-compose.production.yml`

Mulai dengan `docker-compose.yml` untuk development, lalu migrate ke `docker-compose.production.yml` saat siap production! 🚀
