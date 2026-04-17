# Cara Test Status Accurate di VPS

## Langkah-langkah

### 1. Login ke VPS
```bash
ssh root@your-vps-ip
```

### 2. Masuk ke Direktori Backend
```bash
cd /var/www/gudang/backend
```

### 3. Pastikan Dependencies Ter-install
```bash
npm install
```

### 4. Jalankan Test Script
```bash
node test-status-simple.js
```

## Jika Masih Error "Cannot find module 'dotenv'"

### Opsi A: Install dotenv
```bash
npm install dotenv
```

### Opsi B: Jalankan dengan Environment Variables Manual
```bash
# Set environment variables
export DB_HOST=localhost
export DB_USER=your_db_user
export DB_PASSWORD=your_db_password
export DB_NAME=iware_warehouse
export TEST_USER_ID=1

# Jalankan script
node test-status-simple.js
```

### Opsi C: Gunakan PM2 Environment
Jika backend Anda sudah berjalan dengan PM2:

```bash
# Lihat environment PM2
pm2 env 0

# Jalankan dengan PM2 environment
pm2 exec test-status-simple.js
```

## Output yang Diharapkan

Script akan menampilkan:

```
============================================================
Testing Accurate Sales Order Status Mapping
============================================================

Fetching sales orders for user ID: 1
------------------------------------------------------------

✓ Found 10 sales orders
------------------------------------------------------------

Fetching details for first 5 orders...

📋 Order 1: SO.2026.04.00496
   Customer: BARANG DI KIRIM DARI JAKARTA..BANTU KIRIM
   Date: 2026-04-10
   Amount: 7100000

   Status Fields from Accurate:
   - documentStatus: {"name":"Sebagian Diproses","code":"PARTIAL"}
   - documentStatusName: Sebagian Diproses

   📊 Status Mapping:
   - Raw Status: "Sebagian Diproses"
   - Normalized: "SEBAGIAN DIPROSES"
   - Mapped Status: "Sebagian diproses"
   - Category: processing
   - Display Color: 🟡
------------------------------------------------------------
```

## Troubleshooting

### Error: "Cannot find module"
```bash
# Install semua dependencies
cd /var/www/gudang/backend
npm install
```

### Error: "Accurate token not found"
```bash
# Cek token di database
mysql -u root -p iware_warehouse -e "SELECT id, user_id, is_active, expires_at FROM accurate_tokens WHERE is_active = 1;"

# Jika tidak ada token, login ulang ke Accurate via aplikasi
```

### Error: "Connection refused" atau "ECONNREFUSED"
```bash
# Cek database connection
mysql -u root -p -e "SHOW DATABASES;"

# Cek .env file
cat .env | grep DB_
```

### Error: "Request failed with status code 401"
```bash
# Token Accurate expired, perlu refresh
# Login ulang ke aplikasi dan authorize Accurate lagi
```

## Setelah Test Berhasil

### 1. Sync Data dari Accurate
```bash
# Via curl (ganti YOUR_TOKEN dengan token JWT Anda)
curl -X POST http://localhost:5000/api/sync/sales-orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Cek Database
```bash
mysql -u root -p iware_warehouse -e "
SELECT nomor_so, nama_pelanggan, status, tanggal_so 
FROM sales_orders 
WHERE status LIKE '%Sebagian%' 
ORDER BY tanggal_so DESC 
LIMIT 10;
"
```

### 3. Restart Backend (jika perlu)
```bash
pm2 restart backend
pm2 logs backend --lines 50
```

### 4. Verifikasi di Frontend
- Buka browser: `http://your-domain/schedule`
- Lihat apakah status "Sebagian diproses" muncul dengan warna kuning 🟡
- Cek juga di halaman Sales Orders

## Catatan Penting

1. Script ini hanya mengambil 5 order pertama untuk testing
2. Tidak mengubah data di database
3. Hanya menampilkan bagaimana status di-mapping
4. Aman untuk dijalankan kapan saja

## Jika Masih Bermasalah

Hubungi developer dengan informasi:
1. Screenshot error lengkap
2. Output dari: `node --version`
3. Output dari: `npm list dotenv`
4. Isi file .env (tanpa password)
