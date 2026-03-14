# Panduan Deploy ke VPS (Docker Compose) — iwareid.com

Panduan ini menjelaskan cara hosting aplikasi ini di VPS menggunakan **Docker Compose** (MySQL + Redis + Backend + Frontend) dan mengaktifkan **SSL** (Let's Encrypt) via Nginx di host. Di bagian akhir ada checklist khusus agar **integrasi Accurate Online sukses**.

---

## 1) Gambaran arsitektur (biar tidak salah arah)

- **Nginx di host VPS**: menerima trafik `80/443`, handle SSL, lalu proxy ke container frontend.
- **Container `frontend` (Nginx)**: serve file React build dan **proxy `/api/`** ke container `backend`.

Alur request:

```
Internet (80/443)
  → Nginx host (SSL termination)
    → http://127.0.0.1:3000  (container frontend)
      → /api/* diproxy ke http://backend:5000 (container backend)
```

Catatan penting:
- **Public hanya 80/443**. Port aplikasi internal (`3000`, `5000`, `3306`, `6379`) sebaiknya tidak dibuka ke internet.
- Endpoint OAuth Accurate yang dipakai aplikasi ini adalah **`GET /api/accurate/callback`**.

---

## 2) Yang perlu kamu siapkan sebelum deploy

### 2.1 Domain & DNS

Di DNS manager domain:
- **A record**
  - `@` → `IP_VPS_ANDA`
  - `www` → `IP_VPS_ANDA` (atau CNAME ke `iwareid.com`)

Tunggu propagasi, lalu cek dari lokal / dari VPS:

```bash
nslookup iwareid.com
nslookup www.iwareid.com
```

### 2.2 Kebutuhan VPS (rekomendasi)
- **OS**: Ubuntu 22.04/24.04 atau Debian 11/12
- **RAM**: minimal 2GB (lebih nyaman 4GB)
- **Storage**: SSD (DB + logs)

### 2.3 Kredensial Accurate Online (wajib jika ingin integrasi sukses)
Siapkan dari Accurate Developer Portal:
- **App Key**
- **Client ID**
- **Client Secret**
- **Signature Secret**
- Dan set **Callback/Redirect URL** ke **`https://iwareid.com/api/accurate/callback`**

Kamu akan mengisi nilai-nilai ini di file `.env` saat langkah deploy.

---

## 3) Validasi config penting (biar deploy mulus)

### 3.1 `frontend/nginx.conf` vs `docker-compose.yml`

- **Port**: `listen 3000` ↔ `frontend: "3000:3000"` ✅
- **Proxy API**: `proxy_pass http://backend:5000` ↔ service `backend` di network yang sama ✅
- **Static root**: `/usr/share/nginx/html` ↔ `frontend/Dockerfile` copy build ke path itu ✅
- **Domain**: `server_name iwareid.com www.iwareid.com` ✅

---

## 4) Persiapan VPS (Ubuntu/Debian)

Login SSH:

```bash
ssh root@IP_VPS_ANDA
```

Update & tools:

```bash
apt update && apt upgrade -y
apt install -y curl git ufw
```

Firewall:

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
ufw status
```

---

## 5) Install Docker + Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

docker --version
docker compose version
```

---

## 6) Deploy aplikasi (Docker Compose) — langkah yang paling penting

### 6.1 Clone repo

```bash
cd /opt
git clone <URL_REPO_ANDA> werehouse
cd werehouse
```

### 6.2 Siapkan `.env` production (di root project: `/opt/werehouse/.env`)

File `.env` **di root project** akan dipakai oleh `docker-compose.yml` untuk mengisi environment container.

```bash
cp .env.example .env
nano .env
```

Minimal yang **wajib** kamu ubah untuk production (jangan pakai default):

#### A) Security secrets
- **`JWT_SECRET`**: minimal 32 karakter (lebih panjang lebih baik)
- **`JWT_REFRESH_SECRET`**: minimal 32 karakter
- **`WEBHOOK_SECRET`**: secret internal aplikasi (untuk validasi webhook jika dipakai)

Cara generate cepat (jalankan di VPS):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### B) Database
- **`DB_PASSWORD`**: password kuat
- **`DB_USER` / `DB_NAME`**: sesuaikan jika perlu

#### C) Redis (disarankan set password)
- **`REDIS_PASSWORD`**: set password kuat (jangan kosong untuk production)

#### D) CORS (wajib untuk frontend domain kamu)
- **`CORS_ORIGIN`**: set ke domain production kamu, contoh:
  - `CORS_ORIGIN=https://iwareid.com,https://www.iwareid.com`

#### E) Accurate Online (wajib untuk integrasi)
- **`ACCURATE_APP_KEY`**
- **`ACCURATE_CLIENT_ID`**
- **`ACCURATE_CLIENT_SECRET`**
- **`ACCURATE_SIGNATURE_SECRET`**
- **`ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback`**

---

## 6.3 (Opsional) Aktifkan Webhook Accurate untuk near-realtime

Agar perubahan di Accurate (buat/ubah/hapus) bisa cepat tercermin di aplikasi tanpa klik sync manual, aplikasi menyediakan endpoint webhook publik:

- **URL**: `https://iwareid.com/api/accurate/webhook`
- **Method**: `POST`
- **Header (disarankan)**: `x-webhook-secret: <WEBHOOK_SECRET>`

Catatan:
- Endpoint ini **tidak butuh login** (karena dipanggil oleh Accurate), jadi **wajib** kamu pasang `WEBHOOK_SECRET` yang kuat.
- Server akan mencatat event ke tabel `webhook_logs` dan melakukan sync entity terkait (mis. `sales_order.updated` → `syncSingleOrder`).

Kalau provider webhook kamu tidak bisa mengirim header custom, kamu masih bisa mengirim secret via query string:
- `https://iwareid.com/api/accurate/webhook?secret=<WEBHOOK_SECRET>`

Penting:
- Nilai **`ACCURATE_REDIRECT_URI` harus sama persis** dengan yang kamu daftarkan di Accurate Developer Portal.
- Callback endpoint yang digunakan aplikasi ini adalah **`GET /api/accurate/callback`** (bukan `/auth/callback`).

### 6.3 Build & run

Jalankan stack:

```bash
docker compose up -d --build
docker compose ps
```

Troubleshoot cepat:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### 6.4 (Opsional) Migrasi status Sales Order agar sama dengan Accurate

Agar status pesanan penjualan di aplikasi mengikuti Accurate Online (Dipesan, Diproses, Selesai), jika database sudah berjalan dengan schema lama, jalankan sekali:

```bash
docker compose exec db mysql -u"${DB_USER:-iware}" -p"${DB_PASSWORD}" "${DB_NAME:-iware_warehouse}" < backend/database/migrate-sales-order-status.sql
```

(Catatan: service database di `docker-compose.yml` ini bernama **`db`**, bukan `mysql`.)

Atau dari host (sesuaikan user/password/database):

```bash
mysql -u root -p iware_warehouse < backend/database/migrate-sales-order-status.sql
```

Setelah itu jalankan sync Sales Order dari aplikasi agar data ter-update dari Accurate.

---

## 7) Nginx di host + SSL (Let's Encrypt)

Kenapa pakai Nginx di host?
- Biar TLS/SSL (Let's Encrypt) mudah
- Akses publik cuma lewat 80/443
- Container tetap simpel (frontend di port 3000 internal VPS)

### 7.1 Install Nginx + Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 7.2 Konfigurasi Nginx (reverse proxy ke container)

Buat file `/etc/nginx/sites-available/iwareid.com`:

```nginx
server {
    listen 80;
    server_name iwareid.com www.iwareid.com;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name iwareid.com www.iwareid.com;

    ssl_certificate /etc/letsencrypt/live/iwareid.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iwareid.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan dan reload:

```bash
ln -sf /etc/nginx/sites-available/iwareid.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 7.3 Generate sertifikat SSL

```bash
certbot --nginx -d iwareid.com -d www.iwareid.com
```

Test auto-renew:

```bash
certbot renew --dry-run
```

---

## 8) Verifikasi setelah deploy (wajib dilakukan)

- **Frontend**: `https://iwareid.com`
- **Backend health**: `https://iwareid.com/api/health`

Tes dari VPS:

```bash
curl -I https://iwareid.com
curl -fsS https://iwareid.com/api/health
```

Kalau `/api/health` gagal:
- cek container up: `docker compose ps`
- cek logs: `docker compose logs -f backend`
- cek Nginx host: `nginx -t` dan `systemctl status nginx`

---

## 9) Checklist integrasi Accurate Online (biar “sukses” benar)

### 9.1 Pastikan konfigurasi Accurate di `.env` sudah benar
Wajib terisi:
- `ACCURATE_APP_KEY`
- `ACCURATE_CLIENT_ID`
- `ACCURATE_CLIENT_SECRET`
- `ACCURATE_SIGNATURE_SECRET`
- `ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback`

Di Accurate Developer Portal, pastikan:
- **OAuth Callback / Redirect URL**: `https://iwareid.com/api/accurate/callback`
- **Website URL**: `https://iwareid.com`

Setelah mengubah `.env`, apply:

```bash
cd /opt/werehouse
docker compose up -d --build
```

### 9.2 Test endpoint OAuth Accurate (dari browser / curl)
- Ambil URL authorize:
  - `GET https://iwareid.com/api/accurate/auth-url`
- Setelah login & approve di Accurate, Accurate akan redirect balik ke:
  - `https://iwareid.com/api/accurate/callback?...`

Status koneksi:
- `GET https://iwareid.com/api/accurate/status`

Kalau callback gagal, penyebab paling umum:
- **Redirect URI mismatch** (yang di portal beda dengan yang di `.env`)
- **Belum HTTPS / sertifikat belum aktif**
- **DNS belum mengarah ke VPS**

---

## 10) Operasional (update & restart)

Update code:

```bash
cd /opt/werehouse
git pull
docker compose up -d --build
```

Restart service tertentu:

```bash
docker compose restart backend
docker compose restart frontend
```

Melihat log yang paling sering dipakai:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
docker compose logs -f redis
```

