# 🚀 Deploy Update History Faktur Penjualan

## 📋 Update Terbaru

Pembaruan ini menampilkan **nama pembuat faktur** di kolom "History Faktur Penjualan" dengan format yang lebih jelas:

**Tampilan baru:**
```
SI.2026.04.00652
Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin
oleh Nur gudang admin
06 Apr 2026 11:10
```

## 🔧 Yang Berubah

**File Modified:**
- `frontend/src/pages/SalesOrdersPage.jsx`
  - Tampilan history lebih detail
  - Menampilkan nama pembuat (created_by)
  - Menampilkan tanggal dan waktu
  - Border biru untuk setiap history entry
  - Button "+X lainnya" untuk lihat semua

**File New:**
- `backend/database/add-sample-history.sql` - Sample data untuk testing

## 🚀 Deploy ke VPS

### Opsi 1: Deploy dengan Docker

```bash
# 1. SSH ke VPS
ssh root@your-vps-ip
cd /var/www/iware

# 2. Pull code terbaru
git pull origin main

# 3. (Opsional) Tambah sample data untuk testing
cat backend/database/add-sample-history.sql | docker-compose exec -T mysql mysql -u root -p'password' iware_warehouse

# 4. Rebuild frontend
docker-compose build frontend

# 5. Restart frontend
docker-compose restart frontend

# 6. Verify
docker-compose ps
docker-compose logs --tail=20 frontend
```

### Opsi 2: Deploy dengan PM2

```bash
# 1. SSH ke VPS
ssh root@your-vps-ip
cd /var/www/iware

# 2. Pull code terbaru
git pull origin main

# 3. (Opsional) Tambah sample data untuk testing
mysql -u root -p iware_warehouse < backend/database/add-sample-history.sql

# 4. Build frontend
cd frontend
npm run build

# 5. Restart frontend
pm2 restart frontend

# 6. Verify
pm2 status
pm2 logs frontend --lines 20
```

### Opsi 3: One-Liner

**Docker:**
```bash
ssh root@your-vps-ip "cd /var/www/iware && git pull && docker-compose build frontend && docker-compose restart frontend"
```

**PM2:**
```bash
ssh root@your-vps-ip "cd /var/www/iware && git pull && cd frontend && npm run build && pm2 restart frontend"
```

## 🧪 Testing & Verifikasi

### 1. Cek Data History Ada

```bash
# Docker
docker-compose exec mysql mysql -u root -p'password' iware_warehouse -e "SELECT COUNT(*) as total FROM sales_order_history;"

# Direct MySQL
mysql -u root -p iware_warehouse -e "SELECT COUNT(*) as total FROM sales_order_history;"
```

**Jika tidak ada data (total = 0), tambahkan sample data:**

```bash
# Docker
cat backend/database/add-sample-history.sql | docker-compose exec -T mysql mysql -u root -p'password' iware_warehouse

# Direct MySQL
mysql -u root -p iware_warehouse < backend/database/add-sample-history.sql
```

### 2. Cek Data History Detail

```bash
# Docker
docker-compose exec mysql mysql -u root -p'password' iware_warehouse -e "
SELECT 
  h.id,
  s.nomor_so,
  s.status,
  h.invoice_number,
  h.created_by,
  h.created_at
FROM sales_order_history h
JOIN sales_orders s ON h.sales_order_id = s.id
ORDER BY h.created_at DESC
LIMIT 5;
"

# Direct MySQL
mysql -u root -p iware_warehouse -e "
SELECT 
  h.id,
  s.nomor_so,
  s.status,
  h.invoice_number,
  h.created_by,
  h.created_at
FROM sales_order_history h
JOIN sales_orders s ON h.sales_order_id = s.id
ORDER BY h.created_at DESC
LIMIT 5;
"
```

### 3. Test di Browser

1. **Buka aplikasi:** `http://your-domain.com`
2. **Login** ke aplikasi
3. **Buka halaman Sales Orders**
4. **Clear browser cache:** Ctrl + Shift + Delete atau Ctrl + F5
5. **Cek kolom "History Faktur Penjualan":**
   - Harus ada kolom baru
   - Untuk order dengan status "Sebagian diproses"
   - Harus muncul:
     - ✅ Nomor faktur (bold, biru)
     - ✅ Deskripsi lengkap
     - ✅ **Nama pembuat (oleh ...)**
     - ✅ Tanggal dan waktu
     - ✅ Border biru di kiri
6. **Klik tombol "History"** untuk lihat detail lengkap

### 4. Cek Browser Console

Buka Developer Tools (F12) → Console:
- Tidak boleh ada error merah
- Cek network tab untuk API calls ke `/api/sales-orders/:id/history`

## 🔍 Troubleshooting

### Kolom tidak muncul

**Solusi 1: Clear cache browser**
```
1. Tekan Ctrl + Shift + Delete
2. Pilih "Cached images and files"
3. Clear data
4. Refresh halaman (Ctrl + F5)
```

**Solusi 2: Rebuild frontend tanpa cache**

Docker:
```bash
cd /var/www/iware
docker-compose stop frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

PM2:
```bash
cd /var/www/iware/frontend
rm -rf dist/ node_modules/.cache/
npm run build
pm2 restart frontend
```

### Data history tidak muncul

**Cek 1: Apakah ada sales order dengan status "Sebagian diproses"?**
```bash
mysql -u root -p iware_warehouse -e "SELECT nomor_so, status FROM sales_orders WHERE status LIKE '%Sebagian%' LIMIT 5;"
```

**Cek 2: Apakah ada data history?**
```bash
mysql -u root -p iware_warehouse -e "SELECT COUNT(*) FROM sales_order_history;"
```

**Solusi: Tambah sample data**
```bash
# Docker
cat backend/database/add-sample-history.sql | docker-compose exec -T mysql mysql -u root -p'password' iware_warehouse

# Direct MySQL
mysql -u root -p iware_warehouse < backend/database/add-sample-history.sql
```

### Nama pembuat tidak muncul

**Cek data di database:**
```bash
mysql -u root -p iware_warehouse -e "
SELECT 
  id,
  invoice_number,
  description,
  created_by,
  created_at
FROM sales_order_history
LIMIT 5;
"
```

**Jika created_by NULL atau 'system', update manual:**
```sql
UPDATE sales_order_history 
SET created_by = 'Admin Gudang' 
WHERE created_by IS NULL OR created_by = 'system';
```

### API tidak return data

**Cek API endpoint:**
```bash
# Ganti :id dengan ID sales order yang ada
curl -X GET http://localhost:5000/api/sales-orders/1/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Cek backend logs:**
```bash
# Docker
docker-compose logs backend --tail=50

# PM2
pm2 logs backend --lines 50
```

## 📊 Cara Menambah History Manual

### Via Browser (Recommended)

1. Buka Sales Orders page
2. Klik tombol "History" pada order
3. Klik "Tambah Schedule"
4. Isi form:
   - **Status:** Sebagian diproses
   - **Deskripsi:** Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin
   - **Nomor Faktur:** SI.2026.04.00652
5. Klik "Simpan"

### Via Database

```sql
-- Ganti sales_order_id dan so_id sesuai data Anda
INSERT INTO sales_order_history (
  sales_order_id,
  so_id,
  status,
  description,
  invoice_number,
  created_by,
  created_at
) VALUES (
  1,  -- ID sales order
  'SO.2026.04.00496',  -- Nomor SO
  'Sebagian diproses',
  'Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin',
  'SI.2026.04.00652',
  'Nur gudang admin',
  NOW()
);
```

### Via API (curl)

```bash
curl -X POST http://your-domain.com/api/sales-orders/1/history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Sebagian diproses",
    "description": "Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin",
    "invoiceNumber": "SI.2026.04.00652"
  }'
```

## ✅ Checklist Deploy

- [ ] Pull code terbaru
- [ ] (Opsional) Tambah sample data history
- [ ] Build frontend
- [ ] Restart frontend
- [ ] Clear browser cache
- [ ] Cek kolom "History Faktur Penjualan" muncul
- [ ] Cek nama pembuat muncul (oleh ...)
- [ ] Cek tanggal dan waktu muncul
- [ ] Cek border biru muncul
- [ ] Test klik tombol "History"
- [ ] Test tambah history baru via modal

## 📝 Format Tampilan

### Kolom History Faktur Penjualan:

```
┌─────────────────────────────────────────┐
│ SI.2026.04.00652                        │ ← Nomor faktur (bold, biru)
│ Buat Faktur Penjualan SI.2026.04.00652 │ ← Deskripsi
│ oleh Nur gudang admin                   │ ← Nama pembuat
│ oleh Nur gudang admin                   │ ← Nama pembuat (lagi)
│ 06 Apr 2026 11:10                       │ ← Tanggal & waktu
├─────────────────────────────────────────┤
│ SI.2026.04.00653                        │
│ Buat Faktur Penjualan SI.2026.04.00653 │
│ oleh Admin Gudang                       │
│ oleh Admin Gudang                       │
│ 07 Apr 2026 14:30                       │
├─────────────────────────────────────────┤
│ +2 lainnya →                            │ ← Link ke modal
└─────────────────────────────────────────┘
```

## 🎯 Estimasi Waktu

| Step | Waktu |
|------|-------|
| Pull code | 30 detik |
| Tambah sample data | 30 detik |
| Build frontend | 2-3 menit |
| Restart | 10 detik |
| Clear cache | 10 detik |
| Test | 2 menit |
| **TOTAL** | **5-7 menit** |

**Downtime:** ~10 detik

## 🎉 Selesai!

Setelah deploy, kolom "History Faktur Penjualan" akan menampilkan:
- ✅ Nomor faktur
- ✅ Deskripsi lengkap
- ✅ **Nama pembuat faktur**
- ✅ Tanggal dan waktu
- ✅ Border biru untuk setiap entry
- ✅ Button untuk lihat semua history

---

**Catatan Penting:**
- Pastikan ada data di tabel `sales_order_history`
- Pastikan ada sales order dengan status "Sebagian diproses"
- Clear browser cache setelah deploy
- Gunakan sample data untuk testing jika belum ada data real
