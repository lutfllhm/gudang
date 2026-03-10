# Panduan Testing Accurate Integration dengan Postman

## Setup

### 1. Import Collection & Environment
1. Buka Postman
2. Import file `iWare-Accurate-Integration.postman_collection.json`
3. Import file `Production.postman_environment.json`
4. Pilih environment "iWare Production"

### 2. Konfigurasi Environment
Edit environment variables:
- `base_url`: https://iwaraid.com (sudah diset)
- `username`: Email admin Anda
- `password`: Password admin Anda

## Cara Testing

### Step 1: Login
1. Buka folder "1. Authentication"
2. Jalankan request "Login"
3. Token akan otomatis tersimpan di environment variable `auth_token`

### Step 2: Cek Status Accurate
1. Buka folder "2. Accurate Connection"
2. Jalankan "Get Accurate Status"
3. Cek apakah sudah connected atau belum

### Step 3: Authorize Accurate (Jika Belum Connected)
1. Jalankan "Get Authorization URL"
2. Copy URL dari response
3. Buka URL di browser
4. Login dengan akun Accurate Online
5. Authorize aplikasi
6. Setelah redirect, cek status lagi

### Step 4: Sync Data
1. Buka folder "3. Sync Operations"
2. Jalankan "Sync Items" - tunggu sampai selesai
3. Jalankan "Sync Sales Orders" - tunggu sampai selesai
4. Jalankan "Get Sync Status" untuk cek progress

### Step 5: Verifikasi Data
1. Buka folder "4. Data Verification"
2. Jalankan "Get Items" - harus ada data
3. Jalankan "Get Sales Orders" - harus ada data
4. Jalankan "Get Dashboard Stats" - lihat statistik

## Troubleshooting

### Error: Unauthorized (401)
- Jalankan ulang request "Login"
- Pastikan username dan password benar

### Error: Accurate not connected
- Jalankan "Get Authorization URL"
- Authorize di browser
- Cek status lagi

### Error: Failed to sync
- Cek logs di VPS: `docker logs iware-backend --tail 50`
- Pastikan ACCURATE_API_HOST dan ACCURATE_DATABASE_ID sudah diset
- Restart backend: `docker-compose restart backend`

### Data masih kosong setelah sync
- Cek apakah ada data di Accurate Online
- Cek error logs
- Jalankan sync ulang

## Testing Checklist

- [ ] Login berhasil dan dapat token
- [ ] Status Accurate = Connected
- [ ] Sync Items berhasil
- [ ] Sync Sales Orders berhasil
- [ ] Data Items muncul (> 0)
- [ ] Data Sales Orders muncul (> 0)
- [ ] Dashboard stats menampilkan angka yang benar

## Notes

- Semua request (kecuali Login) memerlukan authentication token
- Token akan otomatis digunakan dari environment variable
- Jika token expired, login ulang
- Sync bisa memakan waktu tergantung jumlah data di Accurate
