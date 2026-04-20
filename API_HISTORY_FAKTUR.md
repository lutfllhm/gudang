# API Reference: Sales Invoice History

Quick reference untuk API endpoints Sales Invoice History.

## Base URL

```
http://localhost:5000/api/sales-invoice-history
```

## Authentication

Semua endpoint memerlukan JWT token:

```http
Authorization: Bearer {your_jwt_token}
```

## Endpoints

### 1. Get History by Sales Order ID

Mengambil history berdasarkan ID sales order internal.

```http
GET /order/:orderId
```

**Parameters:**
- `orderId` (path, required): ID sales order di database internal

**Example:**
```bash
curl http://localhost:5000/api/sales-invoice-history/order/123 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    {
      "id": 1,
      "sales_order_id": 123,
      "so_id": "12345",
      "invoice_number": "SI.2026.04.00674",
      "invoice_date": "2026-04-10",
      "action_type": "status_changed",
      "status": "Sebagian diproses",
      "modified_by": "Nur gudang admin",
      "modified_by_id": "456",
      "description": "Buat Faktur Penjualan SI.2026.04.00674 oleh Nur gudang admin",
      "created_at": "2026-04-10T14:15:00.000Z",
      "nomor_so": "SO.2026.04.001",
      "nama_pelanggan": "PT. Example",
      "current_status": "Sebagian diproses",
      "accurate_data": {
        "id": 12345,
        "number": "SI.2026.04.00674",
        "transDate": "10/04/2026",
        "modifiedBy": "Nur gudang admin",
        "documentStatus": {
          "name": "Sebagian diproses"
        }
      }
    }
  ]
}
```

---

### 2. Get History by SO ID (Accurate ID)

Mengambil history berdasarkan SO ID dari Accurate.

```http
GET /so/:soId
```

**Parameters:**
- `soId` (path, required): SO ID dari Accurate Online

**Example:**
```bash
curl http://localhost:5000/api/sales-invoice-history/so/12345 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:** Same as endpoint #1

---

### 3. Get Recent History

Mengambil history terbaru (untuk monitoring/dashboard).

```http
GET /recent?limit={limit}
```

**Query Parameters:**
- `limit` (optional, default: 50): Jumlah record yang diambil

**Example:**
```bash
curl "http://localhost:5000/api/sales-invoice-history/recent?limit=10" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    {
      "id": 5,
      "invoice_number": "SI.2026.04.00680",
      "modified_by": "Admin Warehouse",
      "created_at": "2026-04-20T10:30:00.000Z",
      ...
    },
    {
      "id": 4,
      "invoice_number": "SI.2026.04.00679",
      "modified_by": "Nur gudang admin",
      "created_at": "2026-04-20T09:15:00.000Z",
      ...
    }
  ]
}
```

---

### 4. Get History by Status

Mengambil history berdasarkan status sales order.

```http
GET /status/:status?limit={limit}
```

**Parameters:**
- `status` (path, required): Status sales order (URL encoded)
- `limit` (query, optional, default: 100): Jumlah record

**Example:**
```bash
# Status "Sebagian diproses"
curl "http://localhost:5000/api/sales-invoice-history/status/Sebagian%20diproses?limit=50" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:** Same as endpoint #3

---

### 5. Sync History from Accurate

Melakukan sync history dari Accurate Online.

```http
POST /sync
Content-Type: application/json
```

**Request Body:**
```json
{
  "startDate": "2026-03-01",
  "endDate": "2026-04-20",
  "pageSize": 100
}
```

**Parameters:**
- `startDate` (optional): Tanggal mulai sync (format: YYYY-MM-DD)
- `endDate` (optional): Tanggal akhir sync (format: YYYY-MM-DD)
- `pageSize` (optional, default: 100): Jumlah record per page dari Accurate

**Example:**
```bash
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-04-20",
    "pageSize": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice history sync completed",
  "data": {
    "success": true,
    "synced": 45
  }
}
```

**Notes:**
- Proses sync bisa memakan waktu lama tergantung jumlah data
- Timeout default: 5 menit
- Rate limit: Mengikuti rate limit Accurate (8 req/sec, 8 parallel)

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": "startDate must be in YYYY-MM-DD format"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Sales order not found",
  "error": "No sales order with ID 999"
}
```

### 412 Precondition Failed (Accurate not connected)
```json
{
  "success": false,
  "message": "Accurate Online belum terkoneksi",
  "error": {
    "provider": "accurate",
    "needsReconnect": true
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to sync invoice history",
  "error": "Connection timeout to Accurate API"
}
```

---

## Rate Limiting

API mengikuti rate limit Accurate Online:
- **Max 8 requests per second**
- **Max 8 parallel processes**

Jika rate limit tercapai, request akan di-queue dan diproses secara otomatis.

---

## Testing

### Using cURL

```bash
# 1. Login first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Get recent history
curl "http://localhost:5000/api/sales-invoice-history/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# 3. Get history by status
curl "http://localhost:5000/api/sales-invoice-history/status/Sebagian%20diproses" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# 4. Sync history
curl -X POST http://localhost:5000/api/sales-invoice-history/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-01","endDate":"2026-04-20"}' \
  | jq
```

### Using Node.js Script

```bash
cd backend
node src/scripts/test-invoice-history.js
```

### Using Postman

1. Import collection dari `postman/` folder (jika ada)
2. Set environment variable `token` dengan JWT token
3. Run requests

---

## Integration Example

### Frontend (React)

```javascript
import api from '../utils/api'

// Get history for a sales order
const fetchHistory = async (soId) => {
  try {
    const response = await api.get(`/sales-invoice-history/so/${soId}`)
    if (response.data.success) {
      return response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch history:', error)
    return []
  }
}

// Sync history
const syncHistory = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await api.post('/sales-invoice-history/sync', {
      startDate: '2026-03-01',
      endDate: today,
      pageSize: 100
    })
    
    if (response.data.success) {
      console.log('Synced:', response.data.data.synced, 'records')
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}
```

### Backend (Node.js)

```javascript
const SalesInvoiceHistory = require('./models/SalesInvoiceHistory')

// Get history
const history = await SalesInvoiceHistory.getBySoId('12345')

// Create history entry
await SalesInvoiceHistory.create({
  sales_order_id: 123,
  so_id: '12345',
  invoice_number: 'SI.2026.04.00674',
  invoice_date: '2026-04-10',
  action_type: 'status_changed',
  status: 'Sebagian diproses',
  modified_by: 'Nur gudang admin',
  modified_by_id: '456',
  description: 'Buat Faktur Penjualan SI.2026.04.00674 oleh Nur gudang admin',
  accurate_data: { /* full response from Accurate */ }
})
```

---

## Changelog

### v1.0.0 (2026-04-20)
- Initial release
- 5 endpoints: get by order ID, get by SO ID, get recent, get by status, sync
- Integration dengan Accurate API
- Support untuk status "Sebagian diproses"

---

## Support

- Documentation: [FITUR_HISTORY_FAKTUR.md](./FITUR_HISTORY_FAKTUR.md)
- Deployment: [DEPLOY_HISTORY_FAKTUR_UPDATE.md](./DEPLOY_HISTORY_FAKTUR_UPDATE.md)
- Issues: Contact development team
