# 🔧 Troubleshooting WebSocket "Offline"

## ❌ Masalah: Indikator "Offline" di Sales Orders

Jika Anda melihat indikator **"Offline"** di samping "Sales Orders", berarti WebSocket tidak terkoneksi.

## 🔍 Penyebab & Solusi

### 1. Backend Belum Di-Restart ⚠️

**Penyebab:** Kode WebSocket baru ditambahkan, tapi backend belum di-restart.

**Solusi:**

```bash
# Jika pakai PM2
pm2 restart backend

# Jika pakai Docker
docker-compose restart backend

# Jika manual (Node.js)
# Stop dulu (Ctrl+C), lalu:
cd backend
npm start
```

**Cek apakah berhasil:**
```bash
# Lihat log backend
pm2 logs backend

# Atau jika Docker
docker-compose logs -f backend

# Cari baris ini di log:
# ✅ WebSocket service initialized
```

### 2. Port 5000 Tidak Terbuka 🔒

**Penyebab:** Firewall atau security group block port 5000.

**Solusi:**

```bash
# Cek apakah port 5000 terbuka
netstat -tulpn | grep 5000

# Atau
ss -tulpn | grep 5000

# Jika tidak ada output, backend tidak running
```

**Buka port di firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 5000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### 3. CORS Configuration Salah ❌

**Penyebab:** Frontend URL tidak ada di CORS whitelist.

**Cek file `.env`:**
```env
CORS_ORIGIN=https://iwareid.com,https://www.iwareid.com
```

**Pastikan:**
- URL frontend ada di list
- Tidak ada trailing slash (`/`)
- Pisahkan dengan koma (`,`)

**Contoh yang BENAR:**
```env
CORS_ORIGIN=https://iwareid.com,https://www.iwareid.com
```

**Contoh yang SALAH:**
```env
CORS_ORIGIN=https://iwareid.com/    # ❌ Ada trailing slash
CORS_ORIGIN=https://iwareid.com https://www.iwareid.com  # ❌ Pakai spasi
```

### 4. Frontend API URL Salah 🔗

**Cek file `.env` di root project:**
```env
VITE_API_URL=https://iwareid.com/api
```

**Pastikan:**
- URL benar (sesuai domain Anda)
- Ada `/api` di akhir
- Tidak ada trailing slash setelah `/api`

**Rebuild frontend setelah ubah:**
```bash
cd frontend
npm run build
```

### 5. Nginx Tidak Support WebSocket 🌐

**Penyebab:** Nginx config tidak support WebSocket upgrade.

**Solusi - Edit Nginx config:**

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    
    # WebSocket support untuk backend
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Restart Nginx:**
```bash
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

### 6. SSL/HTTPS Issue 🔐

**Penyebab:** Frontend HTTPS tapi backend HTTP (mixed content).

**Solusi:** Pastikan backend juga HTTPS atau gunakan proxy.

**Cek di browser console (F12):**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but attempted to connect to the insecure WebSocket endpoint 'ws://...'
```

**Fix:** Pastikan WebSocket menggunakan `wss://` bukan `ws://`

## 🧪 Cara Test WebSocket

### Test 1: Cek dari Browser Console

1. Buka aplikasi di browser
2. Tekan **F12** (Developer Tools)
3. Buka tab **Console**
4. Lihat log:

**Jika BERHASIL:**
```
✅ WebSocket connected
WebSocket server message: Connected to iWare Warehouse
```

**Jika GAGAL:**
```
❌ WebSocket connection error: ...
```

### Test 2: Cek Backend Log

```bash
# PM2
pm2 logs backend --lines 50

# Docker
docker-compose logs -f backend | tail -50
```

**Cari baris:**
```
✅ WebSocket service initialized
Client connected { socketId: 'abc123' }
```

### Test 3: Test Manual dengan curl

```bash
# Test backend health
curl https://iwareid.com/api/health

# Harus return:
# {"success":true,"message":"API is healthy",...}
```

### Test 4: Test WebSocket Connection

Buka browser console dan jalankan:

```javascript
const socket = io('https://iwareid.com', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected!', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Error:', err.message);
});
```

## 📋 Checklist Lengkap

Ikuti checklist ini step-by-step:

- [ ] 1. Backend sudah di-restart
- [ ] 2. Port 5000 terbuka di firewall
- [ ] 3. CORS_ORIGIN sudah benar di `.env`
- [ ] 4. VITE_API_URL sudah benar di `.env`
- [ ] 5. Frontend sudah di-rebuild (`npm run build`)
- [ ] 6. Nginx config support WebSocket
- [ ] 7. Nginx sudah di-restart
- [ ] 8. Browser console tidak ada error
- [ ] 9. Backend log menunjukkan "WebSocket service initialized"
- [ ] 10. Indikator berubah dari "Offline" ke "Live" 🟢

## 🚀 Quick Fix (Paling Sering Berhasil)

Jalankan perintah ini secara berurutan:

```bash
# 1. Restart backend
pm2 restart backend

# 2. Tunggu 5 detik
sleep 5

# 3. Cek log
pm2 logs backend --lines 20

# 4. Refresh browser (Ctrl+F5)
```

**Jika masih "Offline":**

```bash
# 1. Stop semua
pm2 stop backend

# 2. Rebuild frontend
cd frontend
npm run build

# 3. Start backend lagi
pm2 start backend

# 4. Restart Nginx
sudo systemctl restart nginx

# 5. Hard refresh browser (Ctrl+Shift+R)
```

## 📞 Masih Bermasalah?

Kirim informasi berikut:

1. **Backend log:**
   ```bash
   pm2 logs backend --lines 50 > backend-log.txt
   ```

2. **Browser console error:**
   - Buka F12 → Console
   - Screenshot semua error merah

3. **Nginx config:**
   ```bash
   cat /etc/nginx/sites-available/iwareid.com
   ```

4. **Environment variables:**
   ```bash
   # Backend
   cat backend/.env | grep -E "CORS|PORT|VITE"
   
   # Root
   cat .env | grep VITE_API_URL
   ```

---

**Dibuat untuk troubleshooting WebSocket "Offline" di iWare Warehouse**
