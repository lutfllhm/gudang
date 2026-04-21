# Real-Time Updates dengan WebSocket

## 📡 Fitur Real-Time Updates

Aplikasi iWare Warehouse sekarang mendukung **real-time updates** menggunakan WebSocket (Socket.IO). Data sales order dan item akan otomatis muncul di halaman tanpa perlu refresh manual.

## ✨ Keuntungan

### Sebelum (Tanpa Real-Time):
- ❌ Harus refresh halaman manual untuk melihat data baru
- ❌ Delay 1-5 menit tergantung interval sync
- ❌ User tidak tahu kapan ada data baru

### Sesudah (Dengan Real-Time):
- ✅ Data baru langsung muncul otomatis (instant)
- ✅ Notifikasi toast saat ada sales order baru
- ✅ Indikator "Live" menunjukkan koneksi aktif
- ✅ Tidak perlu refresh halaman

## 🔧 Cara Kerja

### 1. **Webhook dari Accurate** (Paling Real-time)
```
Accurate → Webhook → Backend → WebSocket → Frontend (Instant)
```

Ketika ada sales order baru di Accurate:
1. Accurate mengirim webhook ke `/api/accurate/webhook`
2. Backend sync data dari Accurate
3. Backend broadcast via WebSocket ke semua client yang terhubung
4. Frontend otomatis update tampilan + tampilkan notifikasi

### 2. **Auto Sync Polling** (Fallback)
```
Backend Cron → Sync Accurate → WebSocket → Frontend (1-5 menit)
```

Jika webhook tidak tersedia, auto sync tetap berjalan setiap interval tertentu.

## 📦 Instalasi

### Backend
```bash
cd backend
npm install socket.io
```

### Frontend
```bash
cd frontend
npm install socket.io-client
```

## ⚙️ Konfigurasi

### 1. Aktifkan Auto Sync (Optional)

Edit file `.env`:
```env
# SYNC CONFIGURATION
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=60    # 1 menit
SYNC_BATCH_SIZE=100
```

### 2. Setup Webhook di Accurate Online

1. Login ke dashboard Accurate Online
2. Buka menu **Settings → Webhooks**
3. Tambah webhook baru:
   - **URL**: `https://yourdomain.com/api/accurate/webhook`
   - **Secret**: Sesuaikan dengan `WEBHOOK_SECRET` di `.env`
   - **Events**: Pilih:
     - `sales_order.created`
     - `sales_order.updated`
     - `sales_order.deleted`
     - `item.created`
     - `item.updated`

### 3. Restart Aplikasi

```bash
# Jika pakai PM2
pm2 restart backend

# Jika pakai Docker
docker-compose restart backend
```

## 🎯 Event yang Didukung

### Sales Order Events
- `sales_order:new` - Sales order baru dibuat
- `sales_order:updated` - Sales order diupdate
- `sales_order:deleted` - Sales order dihapus

### Item Events
- `item:new` - Item baru dibuat
- `item:updated` - Item diupdate

### Sync Events
- `sync:status` - Status sinkronisasi

## 💻 Cara Menggunakan di Frontend

### Contoh Implementasi

```jsx
import { useWebSocket } from '../hooks/useWebSocket'
import toast from 'react-hot-toast'

const MyComponent = () => {
  const { isConnected } = useWebSocket({
    onSalesOrderNew: (newOrder) => {
      console.log('New order:', newOrder)
      toast.success(`Sales Order baru: ${newOrder.nomor_so}`)
      
      // Update state atau refetch data
      setOrders(prev => [newOrder, ...prev])
    },
    
    onSalesOrderUpdated: (updatedOrder) => {
      console.log('Order updated:', updatedOrder)
      toast.success(`Order diupdate: ${updatedOrder.nomor_so}`)
      
      // Update order di list
      setOrders(prev => 
        prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      )
    },
    
    onSalesOrderDeleted: (deletedData) => {
      console.log('Order deleted:', deletedData)
      toast.error(`Order dihapus: ${deletedData.so_id}`)
      
      // Remove dari list
      setOrders(prev => 
        prev.filter(o => o.so_id !== deletedData.so_id)
      )
    }
  })

  return (
    <div>
      {isConnected ? (
        <span className="text-green-600">🟢 Live</span>
      ) : (
        <span className="text-gray-400">⚪ Offline</span>
      )}
    </div>
  )
}
```

## 🔍 Monitoring & Debugging

### 1. Cek Koneksi WebSocket

Buka browser console (F12), lihat log:
```
✅ WebSocket connected
📦 New sales order received: {...}
```

### 2. Cek Webhook Logs

```bash
# Via API (butuh auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/accurate/webhook/logs?limit=50
```

### 3. Cek Connected Clients

Di backend log, akan muncul:
```
Client connected { socketId: 'abc123' }
Client authenticated { socketId: 'abc123', userId: 1 }
```

## 🚀 Performance

### Bandwidth Usage
- **Idle**: ~1-2 KB/menit (heartbeat)
- **Per Event**: ~2-5 KB (tergantung ukuran data)
- **Sangat Efisien**: Hanya kirim data saat ada perubahan

### Scalability
- Mendukung **ratusan concurrent connections**
- Auto-reconnect jika koneksi terputus
- Fallback ke polling jika WebSocket gagal

## 🛠️ Troubleshooting

### WebSocket Tidak Connect

1. **Cek CORS Configuration**
   ```env
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   ```

2. **Cek Firewall/Proxy**
   - Pastikan port 5000 terbuka
   - Nginx harus support WebSocket upgrade

3. **Cek Browser Console**
   ```
   WebSocket connection error: ...
   ```

### Data Tidak Update Otomatis

1. **Cek Webhook Configuration**
   - Pastikan webhook URL benar
   - Pastikan secret match dengan `.env`

2. **Cek Webhook Logs**
   ```bash
   # Di backend
   tail -f backend/logs/all-*.log | grep webhook
   ```

3. **Test Webhook Manual**
   ```bash
   curl -X POST https://yourdomain.com/api/accurate/webhook \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: YOUR_SECRET" \
     -d '{
       "event": "sales_order.created",
       "data": {"id": "12345"}
     }'
   ```

## 📊 Perbandingan Metode

| Metode | Kecepatan | Beban Server | Kompleksitas | Rekomendasi |
|--------|-----------|--------------|--------------|-------------|
| **WebSocket + Webhook** | ⚡ Instant | 🟢 Rendah | 🟡 Medium | ✅ **Terbaik** |
| **Polling (Auto Sync)** | 🐌 1-5 menit | 🔴 Tinggi | 🟢 Mudah | ⚠️ Fallback |
| **Manual Refresh** | 🐌 Manual | 🟢 Rendah | 🟢 Mudah | ❌ Tidak efisien |

## 🎓 Best Practices

1. **Gunakan Webhook + WebSocket** untuk real-time terbaik
2. **Aktifkan Auto Sync** sebagai fallback (interval 1-5 menit)
3. **Monitor webhook logs** untuk debugging
4. **Tampilkan indikator koneksi** (Live/Offline) ke user
5. **Gunakan toast notification** untuk feedback visual

## 📝 Changelog

### v2.1.0 (2026-04-21)
- ✅ Implementasi WebSocket dengan Socket.IO
- ✅ Real-time updates untuk sales orders
- ✅ Real-time updates untuk items
- ✅ Integrasi dengan webhook Accurate
- ✅ Toast notifications untuk data baru
- ✅ Indikator koneksi Live/Offline
- ✅ Auto-reconnect jika koneksi terputus

## 🤝 Support

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi ini
2. Cek browser console untuk error
3. Cek backend logs: `backend/logs/all-*.log`
4. Test webhook manual dengan curl

---

**Dibuat dengan ❤️ untuk iWare Warehouse**
