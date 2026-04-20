# Troubleshooting - Faktur Penjualan Tidak Muncul

## Masalah: Faktur tidak muncul di bawah SO "Sebagian diproses"

### Langkah Debugging:

#### 1. Cek Database
Pastikan tabel `sales_invoices` sudah dibuat:

```sql
USE iware_warehouse;
SHOW TABLES LIKE 'sales_invoices';
DESCRIBE sales_invoices;
```

#### 2. Cek Backend Service
Pastikan backend sudah restart setelah perubahan kode:

```bash
# Jika menggunakan PM2
pm2 restart backend

# Jika menggunakan npm
cd backend
npm restart

# Jika menggunakan Docker
docker-compose restart backend
```

#### 3. Test API Endpoint
Test endpoint API secara manual:

```bash
# Jalankan test script
node backend/src/scripts/test-invoice-api.js
```

Script ini akan:
- Cek koneksi ke Accurate API
- Ambil sample invoice dari Accurate
- Tampilkan struktur data yang diterima
- Test filter invoice berdasarkan SO ID

#### 4. Cek Browser Console
Buka browser console (F12) dan lihat:

```javascript
// Cek apakah fetch invoices dipanggil
[fetchInvoices] Fetching invoices for SO: xxx

// Cek response dari API
[fetchInvoices] Response: { success: true, data: [...] }

// Cek jumlah invoices
[fetchInvoices] Invoices received: 2
```

#### 5. Cek Network Tab
Di browser DevTools → Network tab:
- Cari request ke `/api/sales-orders/{soId}/invoices`
- Cek status code (harus 200)
- Cek response body

#### 6. Cek Backend Logs
Lihat log backend untuk error:

```bash
# Jika menggunakan PM2
pm2 logs backend

# Jika manual
tail -f backend/logs/all-*.log
```

Cari log:
```
[info]: Sales invoice detail received
[info]: Invoices synced for order
```

### Kemungkinan Penyebab:

#### A. Route Conflict
**Gejala**: API endpoint tidak terpanggil atau return 404

**Solusi**: Pastikan route `/:soId/invoices` ada SEBELUM route `/:id`

File: `backend/src/routes/salesOrderRoutes.js`
```javascript
router.get('/:soId/invoices', SalesOrderController.getInvoices);  // HARUS DI ATAS
router.get('/:id', SalesOrderController.getById);                 // INI
```

#### B. SO ID Tidak Cocok
**Gejala**: Request API berhasil tapi return empty array

**Solusi**: Cek format SO ID yang dikirim ke API

```javascript
// Di browser console
console.log('SO ID:', order.so_id || order.id)
```

Pastikan SO ID yang dikirim sama dengan yang ada di Accurate.

#### C. Accurate API Filter Tidak Bekerja
**Gejala**: API Accurate tidak return invoice meski ada di Accurate

**Solusi**: Coba tanpa filter dulu

```javascript
// Di SalesOrderService.js, comment filter
const response = await ApiClient.get(userId, '/sales-invoice/list.do', {
  'sp.page': 1,
  'sp.pageSize': 100,
  // filter: `salesOrderId=${soId}`  // COMMENT DULU
});
```

#### D. Field createdBy Tidak Ada
**Gejala**: Faktur muncul tapi tanpa nama user

**Solusi**: Cek struktur response Accurate dengan test script

```bash
node backend/src/scripts/test-invoice-api.js
```

Lihat output "Creator fields" untuk tahu field mana yang tersedia.

Kemudian update kode di `SalesOrderService.js`:
```javascript
let createdByName = null;
if (invoice.createdBy && typeof invoice.createdBy === 'object') {
  createdByName = invoice.createdBy.name || invoice.createdBy.displayName;
} else if (invoice.createdByName) {
  createdByName = invoice.createdByName;
}
// dst...
```

#### E. Frontend Tidak Fetch
**Gejala**: Tidak ada request ke API di Network tab

**Solusi**: Cek kondisi fetch di SchedulePage.jsx

```javascript
// Pastikan kondisi ini terpenuhi:
if (isProcessing && soId && !invoicesData[soId]) {
  fetchInvoices(soId)
}
```

Debug:
```javascript
console.log('isProcessing:', isProcessing)
console.log('soId:', soId)
console.log('invoicesData[soId]:', invoicesData[soId])
```

#### F. Status Tidak Terdeteksi Sebagai "Processing"
**Gejala**: SO dengan status "Sebagian diproses" tidak fetch invoice

**Solusi**: Cek mapping status

```javascript
// Di browser console
const order = { status: 'Sebagian diproses' }
const statusGroup = getOrderStatusGroup(order)
console.log('Status group:', statusGroup)  // Harus 'processing'
```

### Quick Fix Checklist:

- [ ] Tabel `sales_invoices` sudah dibuat
- [ ] Backend sudah restart
- [ ] Route order sudah benar (invoices sebelum :id)
- [ ] Browser console tidak ada error
- [ ] Network tab menunjukkan request ke `/invoices` endpoint
- [ ] Response API status 200
- [ ] Response API return array (bisa kosong)
- [ ] SO memiliki status "Sebagian diproses"
- [ ] SO memiliki invoice di Accurate Online

### Test Manual:

1. **Test API dengan curl:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/sales-orders/SO_ID/invoices
```

2. **Test langsung di browser:**
```
http://localhost:5000/api/sales-orders/SO_ID/invoices
```

3. **Test dengan Postman:**
- Method: GET
- URL: `http://localhost:5000/api/sales-orders/{soId}/invoices`
- Headers: `Authorization: Bearer YOUR_TOKEN`

### Jika Masih Belum Muncul:

1. Cek apakah SO tersebut benar-benar punya invoice di Accurate Online
2. Login ke Accurate Online → Sales → Sales Invoice
3. Filter by Sales Order number
4. Pastikan ada invoice yang terkait

Jika tidak ada invoice di Accurate, maka memang tidak akan muncul di aplikasi.
