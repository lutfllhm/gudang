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

### 1.1 Update sistem dan install dependencies

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
```

### 1.2 Buat direktori untuk GPG key Docker

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

### 1.3 Download dan simpan GPG key Docker

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

**Penjelasan:** Command ini mengunduh kunci keamanan Docker dan menyimpannya di sistem.

### 1.4 Tambahkan repository Docker ke APT sources

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**Penjelasan:** Command ini menambahkan repository resmi Docker ke daftar sumber paket Ubuntu.

**Catatan:** Pastikan command di atas dijalankan dalam **satu baris** (copy-paste sekaligus).

### 1.5 Update package list dan install Docker

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Penjelasan paket:**
- `docker-ce`: Docker Engine
- `docker-ce-cli`: Command line interface Docker
- `containerd.io`: Runtime container
- `docker-buildx-plugin`: Plugin untuk build image
- `docker-compose-plugin`: Plugin Docker Compose v2

### 1.6 Aktifkan dan jalankan Docker service

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.7 Tambahkan user ke group docker (agar tidak perlu sudo)

```bash
sudo usermod -aG docker $USER
```

**Penting:** Setelah command ini, **logout dari SSH** lalu **login lagi** agar perubahan group aktif.

```bash
exit
# Login SSH lagi
```

### 1.8 Verifikasi instalasi

```bash
docker --version
docker compose version
```

**Indikator berhasil:** 
- `docker --version` menampilkan versi Docker (contoh: `Docker version 24.0.7`)
- `docker compose version` menampilkan versi Docker Compose (contoh: `Docker Compose version v2.23.0`)

**Jika ada error "permission denied":** berarti belum logout-login lagi setelah langkah 1.7.

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

## 3) Generate JWT secret dan credential aman

**Tujuan langkah ini:** membuat secret key yang kuat untuk keamanan aplikasi.

### 3.1 Generate JWT_SECRET dan JWT_REFRESH_SECRET

Di VPS, jalankan command berikut untuk generate 2 secret yang berbeda:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Penjelasan:** Command ini menggunakan Node.js crypto module untuk generate random string hexadecimal 128 karakter yang sangat aman.

### 3.2 Generate WEBHOOK_SECRET

```bash
# Generate WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Generate password untuk Database dan Redis (opsional)

Jika ingin generate password baru yang aman:

```bash
# Generate random password
openssl rand -base64 32
```

Atau menggunakan Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

**Catatan penting:**
- Simpan semua secret yang di-generate dengan aman
- Jangan gunakan secret yang sama untuk JWT_SECRET dan JWT_REFRESH_SECRET
- Secret ini akan dimasukkan ke `.env.production` di langkah berikutnya

**Contoh output:**
```
JWT_SECRET: a1b2c3d4e5f6...128 karakter
JWT_REFRESH_SECRET: 9z8y7x6w5v4u...128 karakter berbeda
WEBHOOK_SECRET: f1e2d3c4b5a6...64 karakter
```

---

## 4) Isi `.env.production` (wajib)

**Tujuan langkah ini:** memberi semua rahasia dan konfigurasi production.

Edit file:

```bash
cd /opt/iware
nano .env.production
```

Pastikan nilai ini **sudah diganti**:

- Database: `DB_PASSWORD`, `DB_ROOT_PASSWORD`
- Redis: `REDIS_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET` (gunakan hasil generate dari langkah 3)
- Domain: `CORS_ORIGIN`, `VITE_API_URL`
- Accurate: `ACCURATE_APP_KEY`, `ACCURATE_CLIENT_ID`, `ACCURATE_CLIENT_SECRET`, `ACCURATE_SIGNATURE_SECRET`, `ACCURATE_REDIRECT_URI`
- Webhook: `WEBHOOK_SECRET` (gunakan hasil generate dari langkah 3)

Contoh pengisian JWT secret:

```bash
JWT_SECRET=a1b2c3d4e5f6789...hasil_generate_langkah_3
JWT_REFRESH_SECRET=9z8y7x6w5v4u321...hasil_generate_langkah_3
WEBHOOK_SECRET=f1e2d3c4b5a6...hasil_generate_langkah_3
```

Contoh domain:

- `VITE_API_URL=https://domainanda.com/api`
- `ACCURATE_REDIRECT_URI=https://domainanda.com/api/accurate/callback`
- `CORS_ORIGIN=https://domainanda.com,https://www.domainanda.com`

**Indikator berhasil:** tidak ada lagi placeholder seperti `GANTI_` atau `yourdomain`, dan semua JWT secret terisi dengan string random yang panjang.

---

## 5) Build dan jalankan semua container

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

## 6) Restore database backup (opsional)

**Tujuan langkah ini:** memasukkan data backup database ke MySQL container di VPS.

### 5.1 Upload file backup ke VPS

Dari komputer lokal, upload file SQL backup ke VPS:

```bash
scp /path/to/backup.sql user@ip-vps:/opt/iware/backup.sql
```

Atau gunakan SFTP/WinSCP jika di Windows.

### 6.2 Copy file backup ke dalam MySQL container

```bash
cd /opt/iware
docker cp backup.sql iware-mysql:/tmp/backup.sql
```

**Penjelasan:** Command ini meng-copy file backup dari host VPS ke dalam container MySQL.

### 6.3 Restore database dari backup

Masuk ke MySQL container dan restore:

```bash
docker exec -i iware-mysql mysql -uroot -p$DB_ROOT_PASSWORD iware_db < backup.sql
```

Atau jika ingin restore secara interaktif:

```bash
docker exec -it iware-mysql bash
mysql -uroot -p
# Masukkan password root MySQL
use iware_db;
source /tmp/backup.sql;
exit;
exit
```

### 6.4 Verifikasi data berhasil di-restore

```bash
docker exec -it iware-mysql mysql -uroot -p$DB_ROOT_PASSWORD -e "USE iware_db; SELECT COUNT(*) FROM users;"
```

**Indikator berhasil:** Query menampilkan jumlah records sesuai dengan data backup.

### 6.5 Hapus file backup (untuk keamanan)

```bash
docker exec iware-mysql rm /tmp/backup.sql
rm /opt/iware/backup.sql
```

**Catatan penting:**
- Pastikan container MySQL sudah running (`docker ps`)
- File backup harus compatible dengan schema database yang sama
- Jika terjadi error, cek log: `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs mysql`
- Backup harus dalam format SQL dump (`.sql`)

---

## 7) Verifikasi aplikasi

**Tujuan langkah ini:** memastikan endpoint utama normal.

### 7.1 Cek frontend lokal VPS

```bash
curl -I http://127.0.0.1
```

Harus mengembalikan status `200`.

### 7.2 Cek backend health

```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/api/health
```

Harus return JSON status sehat.

### 7.3 Jika ada error, baca log per service

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs mysql --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs redis --tail=200
```

---

## 8) Integrasi Accurate (wajib setelah deploy)

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

## 9) Arahkan domain ke VPS

**Tujuan langkah ini:** aplikasi bisa diakses publik.

Di DNS provider:

- `A record` domain utama -> IP VPS
- `A record` `www` -> IP VPS (opsional)

Karena frontend expose port `80`, domain langsung bisa resolve ke aplikasi.

---

## 10) SSL HTTPS (opsional, sangat disarankan)

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

## 11) Operasional harian

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

## 12) Checklist deploy berhasil

Deploy dianggap sukses jika:

- `docker compose ... ps` menampilkan semua service `Up`
- `http://domainanda.com` membuka frontend
- `http://domainanda.com/api/health` merespon sehat
- login aplikasi berhasil
- integrasi Accurate berhasil connect OAuth
- data item/sales order bisa sinkron

Selesai. Dengan urutan ini, aplikasi dan seluruh container siap jalan stabil di VPS KVM2.
