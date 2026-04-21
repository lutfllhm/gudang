# Fitur Nama Pembuat Faktur di Schedule Board

## ✅ Status: SUDAH DIPERBAIKI

Modifikasi sudah selesai dan di-deploy ke VPS. Sekarang API akan mengembalikan nama pembuat faktur (seperti "Lucki Nata") untuk setiap sales order yang memiliki status "Sebagian diproses".

---

## Perubahan yang Dilakukan

### 1. Database Query (SalesOrder.js)

**File:** `backend/src/models/SalesOrder.js`

**Perubahan:**
- Method `findAll()` sekarang menggunakan LEFT JOIN dengan table `sales_invoice_history`
- Mengambil data pembuat faktur terbaru untuk setiap sales order
- Menambahkan 3 field baru di response API

**Query SQL yang digunakan:**
```sql
SELECT 
  so.*,
  sih.modified_by as invoice_created_by,
  sih.invoice_number as latest_invoice_number,
  sih.invoice_date as latest_invoice_date
FROM sales_orders so
LEFT JOIN (
  SELECT 
    sales_order_id,
    modified_by,
    invoice_number,
    invoice_date,
    created_at
  FROM sales_invoice_history
  WHERE (sales_order_id, created_at) IN (
    SELECT sales_order_id, MAX(created_at)
    FROM sales_invoice_history
    GROUP BY sales_order_id
  )
) sih ON so.id = sih.sales_order_id
WHERE so.is_active = 1
ORDER BY so.tanggal_so DESC
```

### 2. API Response Format

**Method:** `transformToApi()`

**Field baru yang ditambahkan:**
```javascript
{
  // ... field existing ...
  invoiceCreatedBy: "Lucki Nata",        // Nama pembuat faktur
  latestInvoiceNumber: "INV-2026-001",   // Nomor faktur terbaru
  latestInvoiceDate: "2026-04-20"        // Tanggal faktur terbaru
}
```

---

## API Response Example

### Request:
```
GET /api/sales-orders?status=Sebagian%20diproses&limit=10
Authorization: Bearer YOUR_TOKEN
```

### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "soId": 456789,
      "transNumber": "SO.2026.04.00899",
      "transDate": "2026-04-20",
      "customerId": 789,
      "customerName": "PT ILUMINDO PERKASA MAS",
      "description": "Pesanan Penjualan",
      "status": "Sebagian diproses",
      "totalAmount": 6680000,
      "currency": "IDR",
      "lastSync": "2026-04-20T10:30:00Z",
      "createdAt": "2026-04-20T08:00:00Z",
      "updatedAt": "2026-04-20T10:30:00Z",
      
      // ✨ Field baru untuk nama pembuat faktur
      "invoiceCreatedBy": "Lucki Nata",
      "latestInvoiceNumber": "SI.2026.04.01216",
      "latestInvoiceDate": "2026-04-20"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

---

## Cara Menggunakan di Frontend

### 1. Update Schedule Board Component

Di component Schedule Board, tambahkan display untuk `invoiceCreatedBy`:

```javascript
// Contoh di React/Vue
{orders.map(order => (
  <div key={order.id} className="order-card">
    <div className="order-number">{order.transNumber}</div>
    <div className="customer">{order.customerName}</div>
    <div className="status">{order.status}</div>
    
    {/* ✨ Tampilkan nama pembuat faktur jika ada */}
    {order.invoiceCreatedBy && (
      <div className="invoice-creator">
        <small>Dibuat oleh: {order.invoiceCreatedBy}</small>
      </div>
    )}
    
    {order.latestInvoiceNumber && (
      <div className="invoice-number">
        <small>Faktur: {order.latestInvoiceNumber}</small>
      </div>
    )}
  </div>
))}
```

### 2. Filter untuk Status "Sebagian diproses"

```javascript
// Fetch orders dengan status Sebagian diproses
const fetchPartialOrders = async () => {
  const response = await fetch(
    '/api/sales-orders?status=Sebagian%20diproses&limit=50',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  // Data sudah include invoiceCreatedBy
  console.log(data.data[0].invoiceCreatedBy); // "Lucki Nata"
};
```

### 3. Display di Bawah Status

```html
<!-- HTML Example -->
<div class="order-item">
  <div class="order-header">
    <span class="order-number">SO.2026.04.00899</span>
    <span class="order-date">20 Apr 2026</span>
  </div>
  
  <div class="order-customer">PT ILUMINDO PERKASA MAS</div>
  
  <div class="order-status">
    <span class="badge badge-warning">SEBAGIAN DIPROSES</span>
    
    <!-- ✨ Nama pembuat faktur di bawah status -->
    <div class="invoice-creator-info">
      <i class="icon-user"></i>
      <span>Lucki Nata</span>
    </div>
  </div>
  
  <div class="order-description">
    KIRIM MELALUI JAKARTA...
  </div>
</div>
```

---

## Testing

### 1. Test API Endpoint

```bash
# Login dulu
curl -X POST http://212.85.26.166:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iwareid.com","password":"jasad666"}'

# Simpan token dari response

# Test get orders dengan status Sebagian diproses
curl -X GET "http://212.85.26.166:5000/api/sales-orders?status=Sebagian%20diproses&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Cek Response

Response harus include field:
- `invoiceCreatedBy`: Nama pembuat faktur (contoh: "Lucki Nata")
- `latestInvoiceNumber`: Nomor faktur terbaru
- `latestInvoiceDate`: Tanggal faktur

### 3. Test di Browser/Postman

**URL:** `http://212.85.26.166:5000/api/sales-orders?status=Sebagian%20diproses`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      ...
      "status": "Sebagian diproses",
      "invoiceCreatedBy": "Lucki Nata",  // ✅ Field baru
      "latestInvoiceNumber": "SI.2026.04.01216",
      "latestInvoiceDate": "2026-04-20"
    }
  ]
}
```

---

## Verifikasi di Database

Untuk memastikan data sudah benar:

```sql
-- Cek sales orders dengan invoice history
SELECT 
  so.nomor_so,
  so.status,
  so.nama_pelanggan,
  sih.modified_by as pembuat_faktur,
  sih.invoice_number,
  sih.invoice_date
FROM sales_orders so
LEFT JOIN sales_invoice_history sih ON so.id = sih.sales_order_id
WHERE so.status = 'Sebagian diproses'
ORDER BY so.tanggal_so DESC
LIMIT 10;
```

---

## Troubleshooting

### Field `invoiceCreatedBy` null atau kosong

**Penyebab:**
- Sales order belum punya history di table `sales_invoice_history`
- Belum ada yang membuat faktur untuk SO tersebut

**Solusi:**
1. Pastikan sync invoice history sudah berjalan
2. Trigger manual sync:
```bash
curl -X POST http://212.85.26.166:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-01-01","endDate":"2026-12-31"}'
```

### Backend error setelah update

**Solusi:**
```bash
ssh root@212.85.26.166
cd /var/www/gudang
docker-compose logs --tail=50 backend
docker-compose restart backend
```

### Query terlalu lambat

**Solusi:** Tambahkan index di database
```sql
CREATE INDEX idx_sih_sales_order_created 
ON sales_invoice_history(sales_order_id, created_at);
```

---

## Files yang Dimodifikasi

1. ✅ `backend/src/models/SalesOrder.js`
   - Method `findAll()` - Added LEFT JOIN
   - Method `transformToApi()` - Added new fields

2. ✅ Backend sudah di-restart
3. ✅ API sudah berfungsi

---

## Next Steps untuk Frontend

1. **Update API call** di Schedule Board untuk fetch data
2. **Tambahkan display** untuk `invoiceCreatedBy` di UI
3. **Styling** untuk menampilkan nama pembuat faktur di bawah status
4. **Conditional rendering** - hanya tampilkan jika `invoiceCreatedBy` ada

---

## Summary

✅ **Backend sudah siap**
✅ **API sudah mengembalikan nama pembuat faktur**
✅ **Field baru:** `invoiceCreatedBy`, `latestInvoiceNumber`, `latestInvoiceDate`
✅ **Tinggal update frontend** untuk menampilkan data

**Endpoint:** `GET /api/sales-orders?status=Sebagian%20diproses`

**Response include:** Nama pembuat faktur (contoh: "Lucki Nata")

Silakan test API dan update frontend untuk menampilkan nama pembuat faktur di Schedule Board!
