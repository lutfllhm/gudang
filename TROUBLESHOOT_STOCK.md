# Troubleshooting: Stok Item Tidak Muncul (Menampilkan 0)

## Masalah
Item di aplikasi menampilkan stok 0, padahal di Accurate ada stoknya (contoh: item 102025 di Accurate punya stok 1 PCS, tapi di aplikasi menampilkan 0).

## Penyebab Kemungkinan
1. **Field stok yang salah** - Accurate API menggunakan nama field berbeda untuk stok
2. **Response structure berbeda** - Struktur response dari Accurate berbeda dari yang diharapkan
3. **Warehouse-specific stock** - Stok mungkin per gudang, bukan total
4. **Data belum di-sync** - Data di database belum di-update dari Accurate

## Langkah Troubleshooting

### 1. Debug Raw Response dari Accurate API

Jalankan script debug untuk melihat struktur response sebenarnya dari Accurate:

```bash
cd backend
node src/scripts/debug-item-stock.js 102025
```

Script ini akan menampilkan:
- Raw response dari `/item/list.do`
- Raw response dari `/item/detail.do`
- Raw response dari `/item/get-stock.do`
- Semua field yang tersedia
- Field mana yang berisi nilai stok

### 2. Cek Endpoint Debug di Browser

Setelah backend running, buka di browser (dengan login):

```
GET http://localhost:5000/api/items/debug/accurate-raw?itemNo=102025
```

Response akan menampilkan:
```json
{
  "success": true,
  "data": {
    "listSample": { ... },
    "detailSample": { ... },
    "stockSample": { ... },
    "warehouseStockSample": { ... },
    "allFieldsFromDetail": ["id", "no", "name", ...],
    "allFieldsFromList": ["id", "no", "name", ...]
  }
}
```

### 3. Cek Log Accurate

Lihat log Accurate untuk melihat request/response:

```bash
# Windows
type backend\logs\accurate-2026-04-17.log

# Linux/Mac
cat backend/logs/accurate-2026-04-17.log
```

Cari baris yang berisi `Accurate API Response` untuk melihat response dari Accurate.

### 4. Update Field Stok di Code

Setelah tahu field yang benar dari step 1-3, update file `backend/src/services/ItemService.js`:

Di function `transformAccurateItem`, tambahkan field stok yang benar:

```javascript
const stock = pickNumber(
  accurateItem.availableQty,        // ← field yang sudah ada
  accurateItem.availableQuantity,   // ← field yang sudah ada
  accurateItem.FIELD_BARU_DARI_DEBUG, // ← tambahkan field baru di sini
  accurateItem.onHand,
  // ... dst
);
```

### 5. Restart Backend dan Sync Ulang

```bash
# Restart backend (jika pakai Docker)
docker-compose restart backend

# Atau restart manual
cd backend
npm start
```

Kemudian di aplikasi, klik tombol **"Sync dari Accurate"** di halaman Items.

### 6. Verifikasi Database

Cek langsung di database apakah stok sudah ter-update:

```sql
SELECT id, kode_item, nama_item, stok_tersedia, last_sync 
FROM items 
WHERE kode_item = '102025';
```

## Perbaikan yang Sudah Dilakukan

1. ✅ Menambahkan lebih banyak field kandidat untuk stok:
   - `availableQty`, `availableQuantity`, `qtyAvailable`
   - `onHand`, `qtyOnHand`
   - `stock`, `quantity`, `qty`

2. ✅ Memperbaiki merge order data (list.do sebagai base, detail.do override)

3. ✅ Menambahkan fallback ke endpoint `/item/get-stock.do`

4. ✅ Menambahkan logging detail untuk debug

5. ✅ Menambahkan endpoint debug `/api/items/debug/accurate-raw`

6. ✅ Membuat script debug `debug-item-stock.js`

## Solusi Cepat (Jika Tahu Field yang Benar)

Jika dari debug kamu sudah tahu field stok yang benar (misalnya `stockAvailable`), langsung update di `backend/src/services/ItemService.js`:

```javascript
// Di function transformAccurateItem, line ~240
const stock = pickNumber(
  accurateItem.stockAvailable,  // ← field yang benar
  accurateItem.availableQty,
  // ... field lainnya
);
```

Kemudian restart backend dan sync ulang.

## Kontak

Jika masih ada masalah setelah mengikuti langkah di atas, share hasil dari:
1. Output script `debug-item-stock.js`
2. Response dari endpoint `/api/items/debug/accurate-raw`
3. Log dari `backend/logs/accurate-*.log`
