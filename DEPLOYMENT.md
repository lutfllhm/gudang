# Panduan Deploy Lengkap ke VPS KVM2 (Docker Compose)

Dokumen ini adalah langkah tunggal dari awal sampai aplikasi jalan stabil di VPS.

Container yang akan aktif:

- `iware-frontend`
- `iware-backend`
- `iware-mysql`
- `iware-redis`

Target akhir:

- aplikasi bisa diakses dari domain,
- backend health normal,
- integrasi Accurate bisa connect OAuth.

---

## 0) Prasyarat VPS

**Tujuan langkah ini:** memastikan VPS cukup kuat dan port siap.

Spesifikasi minimum rekomendasi:

- CPU 2 vCore
- RAM 4 GB
- Disk 40 GB SSD
- Ubuntu 22.04/24.04 LTS
- Domain sudah mengarah ke IP VPS

Port wajib terbuka:

- `22` (SSH)
- `80` (HTTP)
- `443` (HTTPS, untuk SSL)

---

## 1) Install Docker dan Docker Compose

**Tujuan langkah ini:** menyiapkan engine container di VPS.

Jalankan:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Logout SSH lalu login lagi agar group `docker` aktif.

Verifikasi:

```bash
docker --version
docker compose version
```

**Indikator berhasil:** dua command di atas menampilkan versi, bukan error.

---

## 2) Upload source code ke VPS

**Tujuan langkah ini:** menaruh project di lokasi permanen.

Contoh:

```bash
cd /opt
sudo mkdir -p iware
sudo chown -R $USER:$USER /opt/iware
cd /opt/iware
git clone <URL_REPOSITORY_ANDA> .
```

Cek file penting ada:

- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `backend/database/schema.sql`
- `.env.production`

---

## 3) Isi `.env.production` (wajib)

**Tujuan langkah ini:** memberi semua rahasia dan konfigurasi production.

Edit file:

```bash
cd /opt/iware
nano .env.production
```

Pastikan nilai ini **sudah diganti**:

- Database: `DB_PASSWORD`, `DB_ROOT_PASSWORD`
- Redis: `REDIS_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Domain: `CORS_ORIGIN`, `VITE_API_URL`
- Accurate: `ACCURATE_APP_KEY`, `ACCURATE_CLIENT_ID`, `ACCURATE_CLIENT_SECRET`, `ACCURATE_SIGNATURE_SECRET`, `ACCURATE_REDIRECT_URI`
- Webhook: `WEBHOOK_SECRET`

Contoh domain:

- `VITE_API_URL=https://domainanda.com/api`
- `ACCURATE_REDIRECT_URI=https://domainanda.com/api/accurate/callback`
- `CORS_ORIGIN=https://domainanda.com,https://www.domainanda.com`

**Indikator berhasil:** tidak ada lagi placeholder seperti `GANTI_` atau `yourdomain`.

---

## 4) Build dan jalankan semua container

**Tujuan langkah ini:** start seluruh service aplikasi.

Jalankan:

```bash
cd /opt/iware
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Cek status:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

**Indikator berhasil:** service `frontend`, `backend`, `mysql`, `redis` status `Up` (idealnya `healthy`).

---

## 5) Verifikasi aplikasi

**Tujuan langkah ini:** memastikan endpoint utama normal.

### 5.1 Cek frontend lokal VPS

```bash
curl -I http://127.0.0.1
```

Harus mengembalikan status `200`.

### 5.2 Cek backend health

```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/api/health
```

Harus return JSON status sehat.

### 5.3 Jika ada error, baca log per service

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs mysql --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs redis --tail=200
```

---

## 6) Integrasi Accurate (wajib setelah deploy)

**Tujuan langkah ini:** mengaktifkan OAuth dan sinkron data Accurate.

1. Pastikan semua env Accurate di `.env.production` sudah valid.
2. Jika ada perubahan env, restart backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

3. Login ke aplikasi sebagai admin.
4. Buka menu integrasi Accurate, lalu klik connect/authorize.
5. Selesaikan proses OAuth.

**Hasil yang diharapkan:** token tersimpan ke tabel `accurate_tokens`.

Catatan penting:

- Jika akun Accurate punya lebih dari 1 database, isi `ACCURATE_DATABASE_ID`.
- `ACCURATE_REDIRECT_URI` harus sama persis dengan di Accurate Developer Portal.
- Aplikasi ini memakai scope read-only dan rate limit internal sesuai pedoman Accurate.

---

## 7) Arahkan domain ke VPS

**Tujuan langkah ini:** aplikasi bisa diakses publik.

Di DNS provider:

- `A record` domain utama -> IP VPS
- `A record` `www` -> IP VPS (opsional)

Karena frontend expose port `80`, domain langsung bisa resolve ke aplikasi.

---

## 8) SSL HTTPS (opsional, sangat disarankan)

**Tujuan langkah ini:** mengamankan akses dengan HTTPS.

Install Nginx + Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Aktifkan config:

```bash
sudo ln -s /opt/iware/nginx/conf.d/iwareid.com.conf /etc/nginx/sites-available/iwareid.com.conf
sudo ln -s /etc/nginx/sites-available/iwareid.com.conf /etc/nginx/sites-enabled/iwareid.com.conf
sudo nginx -t && sudo systemctl reload nginx
```

Pasang sertifikat:

```bash
sudo certbot --nginx -d domainanda.com -d www.domainanda.com
```

Jika mode ini dipakai, ubah mapping port frontend agar tidak bentrok dengan host nginx (misalnya `127.0.0.1:8080:80`).

---

## 9) Operasional harian

### Update aplikasi

```bash
cd /opt/iware
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Restart service

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend frontend
```

### Stop semua container

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---

## 10) Checklist deploy berhasil

Deploy dianggap sukses jika:

- `docker compose ... ps` menampilkan semua service `Up`
- `http://domainanda.com` membuka frontend
- `http://domainanda.com/api/health` merespon sehat
- login aplikasi berhasil
- integrasi Accurate berhasil connect OAuth
- data item/sales order bisa sinkron

Selesai. Dengan urutan ini, aplikasi dan seluruh container siap jalan stabil di VPS KVM2.
