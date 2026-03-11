# 📊 Perbandingan Nginx Configuration Files

## 🎯 Ringkasan Singkat

| Aspek | frontend/nginx.conf | nginx/nginx.conf |
|-------|-------------------|------------------|
| **Lokasi** | Di dalam frontend container | Di Nginx reverse proxy container |
| **Fungsi** | Serve static files (React build) | Reverse proxy untuk semua services |
| **Scope** | Hanya frontend | Frontend + Backend + API routing |
| **Port** | Listen 80 (internal) | Listen 80/443 (exposed) |
| **SSL** | Tidak handle SSL | Handle SSL/TLS termination |
| **Proxy** | Tidak ada proxy | Proxy ke backend & frontend |
| **Rate Limiting** | Tidak ada | Ada (API & login) |
| **Load Balancing** | Tidak ada | Ada (upstream) |

---

## 📁 Lokasi & Penggunaan

### frontend/nginx.conf
```
Location: frontend/nginx.conf
Used by: Frontend container (built into Docker image)
Mounted: Built into container via Dockerfile
```

**Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf  ← File ini
COPY --from=builder /app/dist /usr/share/nginx/html
```

### nginx/nginx.conf
```
Location: nginx/nginx.conf
Used by: Nginx reverse proxy container
Mounted: Volume mount (external file)
```

**docker-compose.yml:**
```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro  ← File ini
```

---

## 🔍 Perbedaan Detail

### 1. Fungsi Utama

#### frontend/nginx.conf
**Fungsi:** Serve static files React (SPA)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;  ← Serve static files
    index index.html;

    # SPA routing - semua request ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Tugas:**
- ✅ Serve HTML, CSS, JS, images
- ✅ Handle SPA routing (React Router)
- ✅ Cache static assets
- ✅ Gzip compression

**TIDAK handle:**
- ❌ Backend API requests
- ❌ SSL/TLS
- ❌ Rate limiting
- ❌ Load balancing

#### nginx/nginx.conf
**Fungsi:** Reverse proxy untuk semua services

```nginx
# Upstream backend
upstream backend_api {
    least_conn;
    server backend:5000;  ← Proxy ke backend
    keepalive 32;
}

# Upstream frontend
upstream frontend_app {
    least_conn;
    server frontend:80;  ← Proxy ke frontend
    keepalive 32;
}

server {
    listen 80;
    
    # Backend API
    location /api/ {
        proxy_pass http://backend_api;  ← Route API ke backend
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend_app;  ← Route frontend
    }
}
```

**Tugas:**
- ✅ Route requests ke backend atau frontend
- ✅ SSL/TLS termination
- ✅ Rate limiting
- ✅ Load balancing
- ✅ Security headers
- ✅ Connection pooling

---

### 2. Request Flow

#### Dengan frontend/nginx.conf (Built-in)
```
Browser → Frontend Container (Nginx)
          ↓
          Serve static files (HTML, CSS, JS)
          
Browser → Backend Container (Direct)
          ↓
          API requests
```

**Masalah:**
- ⚠️ Backend exposed langsung
- ⚠️ CORS issues (different origins)
- ⚠️ No centralized security

#### Dengan nginx/nginx.conf (Reverse Proxy)
```
Browser → Nginx Reverse Proxy
          ↓
          ├─ /api/* → Backend Container
          └─ /* → Frontend Container (Nginx) → Static files
```

**Keuntungan:**
- ✅ Single entry point
- ✅ Backend tidak exposed
- ✅ Same origin (no CORS)
- ✅ Centralized security

---

### 3. Configuration Details

#### frontend/nginx.conf

```nginx
user nginx;
worker_processes auto;

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

**Fitur:**
- ✅ SPA routing (try_files)
- ✅ Static file caching
- ✅ Gzip compression
- ✅ Basic security headers
- ✅ MIME types

**Tidak ada:**
- ❌ Upstream definitions
- ❌ Proxy settings
- ❌ Rate limiting
- ❌ SSL configuration
- ❌ Load balancing

#### nginx/nginx.conf

```nginx
user nginx;
worker_processes auto;

http {
    include /etc/nginx/mime.types;
    
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Upstream backend
    upstream backend_api {
        least_conn;
        server backend:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # Upstream frontend
    upstream frontend_app {
        least_conn;
        server frontend:80 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Backend API with rate limiting
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Login with stricter rate limit
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            proxy_pass http://backend_api;
        }

        # Frontend
        location / {
            proxy_pass http://frontend_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        
        # Same locations as HTTP server
    }
}
```

**Fitur:**
- ✅ Upstream definitions (backend & frontend)
- ✅ Proxy settings (headers, timeouts)
- ✅ Rate limiting (API & login)
- ✅ SSL/TLS configuration
- ✅ Load balancing (least_conn)
- ✅ Connection pooling (keepalive)
- ✅ Health checks (max_fails)
- ✅ Advanced security headers

---

### 4. Kapan Digunakan

#### frontend/nginx.conf Digunakan Ketika:

```
Frontend Container Start
↓
Dockerfile: COPY nginx.conf /etc/nginx/nginx.conf
↓
Nginx di dalam container menggunakan config ini
↓
Serve static files dari /usr/share/nginx/html
```

**Selalu aktif** di dalam frontend container untuk serve React build.

#### nginx/nginx.conf Digunakan Ketika:

```
Nginx Reverse Proxy Container Start
↓
docker-compose.yml: volumes: ./nginx/nginx.conf:/etc/nginx/nginx.conf
↓
Nginx reverse proxy menggunakan config ini
↓
Route requests ke backend atau frontend
```

**Hanya aktif** jika menggunakan Nginx reverse proxy (production setup).

---

## 🔄 Request Flow Comparison

### Tanpa Reverse Proxy (Hanya frontend/nginx.conf)

```
Browser Request: http://localhost/
↓
Frontend Container (port 80)
├─ Nginx (frontend/nginx.conf)
└─ Serve index.html

Browser Request: http://localhost:5000/api/items
↓
Backend Container (port 5000)
└─ Node.js API
```

**Masalah:**
- 2 different origins (localhost:80 vs localhost:5000)
- CORS issues
- Backend exposed

### Dengan Reverse Proxy (nginx/nginx.conf)

```
Browser Request: http://localhost/
↓
Nginx Reverse Proxy (port 80)
├─ nginx/nginx.conf
├─ location / → proxy_pass http://frontend_app
└─ Frontend Container
    ├─ Nginx (frontend/nginx.conf)
    └─ Serve index.html

Browser Request: http://localhost/api/items
↓
Nginx Reverse Proxy (port 80)
├─ nginx/nginx.conf
├─ location /api/ → proxy_pass http://backend_api
└─ Backend Container
    └─ Node.js API
```

**Keuntungan:**
- Same origin (localhost:80)
- No CORS issues
- Backend tidak exposed
- Centralized security

---

## 📊 Feature Comparison Table

| Feature | frontend/nginx.conf | nginx/nginx.conf |
|---------|-------------------|------------------|
| **Serve Static Files** | ✅ Yes | ❌ No (proxy to frontend) |
| **SPA Routing** | ✅ Yes | ❌ No (handled by frontend) |
| **Reverse Proxy** | ❌ No | ✅ Yes |
| **Backend Routing** | ❌ No | ✅ Yes (/api/*) |
| **Rate Limiting** | ❌ No | ✅ Yes (API & login) |
| **SSL/TLS** | ❌ No | ✅ Yes |
| **Load Balancing** | ❌ No | ✅ Yes (upstream) |
| **Connection Pooling** | ❌ No | ✅ Yes (keepalive) |
| **Health Checks** | ❌ No | ✅ Yes (max_fails) |
| **Security Headers** | ✅ Basic | ✅ Advanced |
| **Gzip Compression** | ✅ Yes | ✅ Yes |
| **Static Caching** | ✅ Yes | ✅ Yes (proxy) |
| **Custom Domain** | ⚠️ Limited | ✅ Yes |
| **Multiple Backends** | ❌ No | ✅ Yes |

---

## 🎯 Kesimpulan

### frontend/nginx.conf
**Fungsi:** Nginx di dalam frontend container untuk serve React build

**Karakteristik:**
- Built into Docker image
- Tidak bisa diubah tanpa rebuild
- Hanya handle static files
- Simple configuration
- Selalu digunakan

**Analogi:** Seperti pelayan di restoran yang hanya serve makanan yang sudah jadi.

### nginx/nginx.conf
**Fungsi:** Nginx reverse proxy terpisah untuk route semua requests

**Karakteristik:**
- External file (volume mount)
- Bisa diubah tanpa rebuild (reload saja)
- Handle routing, security, SSL
- Advanced configuration
- Opsional (tapi recommended untuk production)

**Analogi:** Seperti resepsionis di hotel yang mengarahkan tamu ke kamar yang tepat (frontend atau backend).

---

## 🔄 Apakah Keduanya Digunakan Bersamaan?

**Ya!** Dalam production setup dengan reverse proxy:

```
Browser
   ↓
Nginx Reverse Proxy (nginx/nginx.conf)
   ├─ Route /api/* → Backend
   └─ Route /* → Frontend Container
                    ↓
                    Nginx (frontend/nginx.conf)
                    ↓
                    Serve static files
```

**Kedua file digunakan:**
1. `nginx/nginx.conf` - Routing & security (entry point)
2. `frontend/nginx.conf` - Serve static files (internal)

---

## 💡 Rekomendasi

### Development
- Cukup pakai `frontend/nginx.conf` (built-in)
- Simple dan cepat

### Production
- Pakai keduanya:
  - `nginx/nginx.conf` - Reverse proxy
  - `frontend/nginx.conf` - Static file server
- Better security & performance

---

## 🔧 Cara Mengubah

### frontend/nginx.conf
```bash
# Edit file
nano frontend/nginx.conf

# Rebuild frontend container
docker compose build frontend

# Restart
docker compose up -d frontend
```

### nginx/nginx.conf
```bash
# Edit file
nano nginx/nginx.conf

# Test configuration
docker compose exec nginx nginx -t

# Reload (no rebuild needed!)
docker compose exec nginx nginx -s reload
```

**Keuntungan nginx/nginx.conf:** Bisa diubah tanpa rebuild! 🚀

---

**Kesimpulan:** Kedua file punya fungsi berbeda dan saling melengkapi dalam production setup!
