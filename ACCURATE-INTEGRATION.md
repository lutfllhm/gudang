# 🔗 Panduan Integrasi Accurate Online

Panduan lengkap untuk mengintegrasikan aplikasi iWare dengan Accurate Online setelah deployment.

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Setup Accurate Developer Portal](#setup-accurate-developer-portal)
3. [Konfigurasi Aplikasi](#konfigurasi-aplikasi)
4. [OAuth Authorization](#oauth-authorization)
5. [Verifikasi Integrasi](#verifikasi-integrasi)
6. [Troubleshooting](#troubleshooting)

---

## ⚠️ Status Integrasi Saat Deploy

**PENTING**: Aplikasi **BELUM** otomatis terintegrasi dengan Accurate saat deploy!

Setelah deployment, Anda perlu:
1. ✅ Setup aplikasi di Accurate Developer Portal
2. ✅ Konfigurasi credentials di `.env`
3. ✅ Lakukan OAuth authorization
4. ✅ Verifikasi koneksi

---

## 🔧 Persiapan

### Requirement

- Akun Accurate Online aktif
- Database Accurate Online yang sudah ada
- Aplikasi sudah berhasil di-deploy
- Domain/URL aplikasi sudah bisa diakses

### Informasi yang Dibutuhkan

Catat informasi berikut:
- **Domain aplikasi**: `https://yourdomain.com` atau `http://localhost`
- **Redirect URI**: `https://yourdomain.com/api/accurate/callback`

---

## 🏢 Setup Accurate Developer Portal

### 1. Login ke Developer Portal

Buka: [https://account.accurate.id/developer](https://account.accurate.id/developer)

Login dengan akun Accurate Online Anda.

### 2. Buat Aplikasi Baru

1. Klik **"Create New Application"** atau **"Buat Aplikasi Baru"**
2. Isi form:
   - **Application Name**: `iWare Warehouse` (atau nama lain)
   - **Description**: `Warehouse Management System`
   - **Application Type**: `Web Application`
   - **Redirect URI**: `https://yourdomain.com/api/accurate/callback`
     - Untuk testing lokal: `http://localhost/api/accurate/callback`
     - Untuk production: `https://yourdomain.com/api/accurate/callback`

3. Klik **"Save"** atau **"Simpan"**

### 3. Dapatkan Credentials

Setelah aplikasi dibuat, Anda akan mendapatkan:

```
App Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Signature Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ PENTING**: Simpan credentials ini dengan aman!

### 4. Setup Webhook (Opsional)

Jika ingin real-time sync:

1. Di Developer Portal, buka tab **"Webhooks"**
2. Tambah webhook URL: `https://yourdomain.com/api/webhook/accurate`
3. Pilih events yang ingin di-subscribe:
   - `sales_order.created`
   - `sales_order.updated`
   - `item.created`
   - `item.updated`
   - `customer.created`
   - `customer.updated`

---

## ⚙️ Konfigurasi Aplikasi

### 1. Update File `.env`

Edit file `.env` di server:

```bash
# Di server
nano .env
# atau
vim .env
```

Update bagian Accurate Online:

```env
# =================================
# ACCURATE ONLINE API
# =================================
ACCURATE_APP_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ACCURATE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ACCURATE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ACCURATE_REDIRECT_URI=https://yourdomain.com/api/accurate/callback
ACCURATE_SIGNATURE_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Kosongkan dulu, akan diisi otomatis setelah OAuth
ACCURATE_ACCESS_TOKEN=
ACCURATE_DATABASE_ID=
```

**Sesuaikan `ACCURATE_REDIRECT_URI`:**
- Development: `http://localhost/api/accurate/callback`
- Production: `https://yourdomain.com/api/accurate/callback`

### 2. Restart Backend

Setelah update `.env`, restart backend:

```bash
# Restart backend container
docker-compose -f docker-compose.prod.yml restart backend

# Atau restart semua
docker-compose -f docker-compose.prod.yml restart
```

### 3. Verifikasi Konfigurasi

```bash
# Masuk ke backend container
docker exec -it iware-backend-prod sh

# Test konfigurasi
node src/scripts/test-accurate-connection.js

# Keluar
exit
```

---

## 🔐 OAuth Authorization

### Cara 1: Melalui Frontend (Recommended)

1. **Login ke aplikasi iWare**
   - Buka: `https://yourdomain.com`
   - Login dengan akun admin

2. **Buka halaman Settings/Integrasi**
   - Cari menu **"Accurate Integration"** atau **"Integrasi Accurate"**
   - Klik tombol **"Connect to Accurate"** atau **"Hubungkan ke Accurate"**

3. **Authorize di Accurate**
   - Anda akan diarahkan ke halaman login Accurate
   - Login dengan akun Accurate Online
   - Pilih database yang ingin diintegrasikan
   - Klik **"Authorize"** atau **"Izinkan"**

4. **Redirect kembali**
   - Setelah authorize, akan redirect ke aplikasi
   - Access token dan Database ID akan tersimpan otomatis

### Cara 2: Manual via API (Alternative)

Jika frontend belum ada halaman integrasi:

1. **Dapatkan Authorization URL**

```bash
# Request ke backend
curl http://localhost/api/accurate/auth-url
```

Response:
```json
{
  "authUrl": "https://account.accurate.id/oauth/authorize?client_id=xxx&redirect_uri=xxx&response_type=code"
}
```

2. **Buka URL di browser**

Copy URL dari response dan buka di browser. Login dan authorize.

3. **Setelah authorize**

Anda akan di-redirect ke:
```
https://yourdomain.com/api/accurate/callback?code=AUTHORIZATION_CODE
```

Backend akan otomatis:
- Exchange code untuk access token
- Simpan access token ke database
- Update `.env` file (jika configured)

### Cara 3: Manual Setup (Advanced)

Jika ingin setup manual tanpa OAuth flow:

1. **Dapatkan Access Token manual** dari Accurate Developer Portal

2. **Update database langsung**

```bash
# Masuk ke MySQL
docker exec -it iware-mysql-prod mysql -u iware_user -p

# Update settings
USE iware_warehouse;

INSERT INTO settings (setting_key, setting_value) 
VALUES 
  ('accurate_access_token', 'YOUR_ACCESS_TOKEN'),
  ('accurate_database_id', 'YOUR_DATABASE_ID')
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value);

EXIT;
```

3. **Restart backend**

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

---

## ✅ Verifikasi Integrasi

### 1. Cek Status Koneksi

```bash
# Masuk ke backend container
docker exec -it iware-backend-prod sh

# Test koneksi
node src/scripts/test-accurate-connection.js
```

Output yang diharapkan:
```
✓ Accurate configuration loaded
✓ Access token found
✓ Database ID found
✓ Connection successful
✓ Database info retrieved
```

### 2. Test API Endpoints

**Test Get Database Info:**
```bash
curl -X GET http://localhost/api/accurate/database-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Test Get Items:**
```bash
curl -X GET http://localhost/api/accurate/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Test Get Sales Orders:**
```bash
curl -X GET http://localhost/api/accurate/sales-orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Cek Logs

```bash
# Lihat backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Atau dari file
tail -f backend/logs/accurate-$(date +%Y-%m-%d).log
```

### 4. Test Sync

Di aplikasi frontend:
1. Buka halaman **Dashboard** atau **Sync**
2. Klik tombol **"Sync Now"** atau **"Sinkronisasi Sekarang"**
3. Tunggu proses sync selesai
4. Verifikasi data sudah masuk

---

## 🔄 Auto Sync Configuration

Setelah integrasi berhasil, configure auto sync:

### 1. Enable Auto Sync

Edit `.env`:
```env
# Auto sync dengan Accurate Online
AUTO_SYNC_ENABLED=true

# Interval sync dalam detik (300 = 5 menit)
SYNC_INTERVAL_SECONDS=300

# Jumlah data per batch sync
SYNC_BATCH_SIZE=100
```

### 2. Restart Backend

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### 3. Verifikasi Auto Sync

```bash
# Cek logs untuk melihat auto sync berjalan
docker-compose -f docker-compose.prod.yml logs -f backend | grep "Auto sync"
```

Output yang diharapkan setiap 5 menit:
```
[INFO] Auto sync started
[INFO] Syncing items from Accurate...
[INFO] Synced 50 items
[INFO] Syncing sales orders from Accurate...
[INFO] Synced 20 sales orders
[INFO] Auto sync completed
```

---

## 🐛 Troubleshooting

### Error: "Invalid Client ID"

**Penyebab**: Client ID salah atau tidak sesuai

**Solusi**:
1. Cek kembali Client ID di Developer Portal
2. Pastikan tidak ada spasi atau karakter tambahan
3. Update `.env` dengan Client ID yang benar
4. Restart backend

### Error: "Redirect URI Mismatch"

**Penyebab**: Redirect URI tidak sesuai dengan yang didaftarkan

**Solusi**:
1. Cek Redirect URI di Developer Portal
2. Pastikan sama persis dengan `ACCURATE_REDIRECT_URI` di `.env`
3. Perhatikan:
   - HTTP vs HTTPS
   - Trailing slash (/)
   - Port number

**Contoh yang benar**:
```
Developer Portal: https://yourdomain.com/api/accurate/callback
.env: ACCURATE_REDIRECT_URI=https://yourdomain.com/api/accurate/callback
```

### Error: "Access Token Expired"

**Penyebab**: Access token sudah kadaluarsa

**Solusi**:
1. Lakukan OAuth authorization ulang
2. Atau implement refresh token mechanism
3. Atau dapatkan access token baru dari Developer Portal

### Error: "Database Not Found"

**Penyebab**: Database ID salah atau tidak ada akses

**Solusi**:
1. Verifikasi Database ID di Accurate Online
2. Pastikan akun memiliki akses ke database tersebut
3. Update Database ID di aplikasi

### Error: "Rate Limit Exceeded"

**Penyebab**: Terlalu banyak request ke Accurate API

**Solusi**:
1. Kurangi frekuensi sync
2. Tingkatkan `SYNC_INTERVAL_SECONDS` di `.env`
3. Kurangi `SYNC_BATCH_SIZE`
4. Tunggu beberapa menit sebelum retry

### Koneksi Berhasil tapi Data Tidak Sync

**Cek**:
1. Apakah auto sync enabled?
2. Apakah ada error di logs?
3. Apakah database Accurate memiliki data?
4. Apakah mapping field sudah benar?

**Debug**:
```bash
# Cek logs detail
docker-compose -f docker-compose.prod.yml logs backend | grep -i "sync\|accurate\|error"

# Manual sync test
docker exec -it iware-backend-prod node src/scripts/test-sync.js
```

---

## 📊 Monitoring Integrasi

### 1. Cek Status Integrasi

```bash
# Via API
curl http://localhost/api/accurate/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "connected": true,
  "database": "PT Example Company",
  "lastSync": "2026-04-22T10:30:00Z",
  "syncStatus": "success"
}
```

### 2. Monitor Sync Logs

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f backend | grep "sync"

# Atau dari file
tail -f backend/logs/accurate-$(date +%Y-%m-%d).log
```

### 3. Dashboard Monitoring

Di aplikasi frontend, buka halaman **Dashboard** untuk melihat:
- Status koneksi Accurate
- Last sync time
- Sync statistics
- Error logs (jika ada)

---

## 🔒 Security Best Practices

1. **Jangan commit credentials ke Git**
   ```bash
   # Pastikan .env di .gitignore
   echo ".env" >> .gitignore
   ```

2. **Gunakan HTTPS untuk production**
   - Setup SSL certificate
   - Redirect HTTP ke HTTPS

3. **Rotate secrets secara berkala**
   - Regenerate Client Secret setiap 6 bulan
   - Update Signature Secret jika ada kebocoran

4. **Limit API access**
   - Enable rate limiting
   - Monitor unusual activity

5. **Backup access token**
   - Simpan access token di tempat aman
   - Jangan share ke orang lain

---

## 📞 Support

### Accurate Online Support

- **Developer Portal**: https://account.accurate.id/developer
- **API Documentation**: https://accurate.id/api-documentation
- **Support Email**: support@accurate.id
- **Forum**: https://community.accurate.id

### Cek Status API

- **Status Page**: https://status.accurate.id
- **API Health**: https://public-api.accurate.id/health

---

## ✅ Checklist Integrasi

Gunakan checklist ini untuk memastikan integrasi berhasil:

- [ ] Aplikasi sudah di-deploy dan berjalan
- [ ] Akun Accurate Online aktif
- [ ] Aplikasi dibuat di Developer Portal
- [ ] Credentials (App Key, Client ID, etc.) sudah didapat
- [ ] File `.env` sudah di-update dengan credentials
- [ ] Backend sudah di-restart
- [ ] OAuth authorization sudah dilakukan
- [ ] Access token dan Database ID tersimpan
- [ ] Test koneksi berhasil
- [ ] Test API endpoints berhasil
- [ ] Data sync berhasil
- [ ] Auto sync enabled dan berjalan
- [ ] Webhook configured (opsional)
- [ ] Monitoring setup

---

## 🎉 Selesai!

Setelah semua langkah di atas, aplikasi iWare sudah terintegrasi penuh dengan Accurate Online!

**Next Steps:**
1. Setup webhook untuk real-time sync
2. Configure auto sync interval
3. Setup monitoring dan alerting
4. Train user untuk menggunakan sistem

**Dokumentasi Terkait:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Panduan deployment
- [QUICK-START.md](./QUICK-START.md) - Quick start guide
- Backend API docs - `/api/docs` (jika ada Swagger)
