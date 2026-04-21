# 🔧 Cara Memperbaiki WebSocket di VPS

## Masalah yang Diperbaiki
- WebSocket terus disconnect/reconnect
- Status "Offline" di halaman Sales Orders
- Pesan "Connected to iWare Warehouse" berulang-ulang

## Langkah-Langkah Perbaikan

### 1️⃣ Upload Script ke VPS

Buka terminal di komputer Anda dan jalankan:

```bash
scp fix-websocket-vps.sh root@212.85.26.166:/root/
```

**Masukkan password VPS Anda saat diminta**

---

### 2️⃣ Login ke VPS

```bash
ssh root@212.85.26.166
```

**Masukkan password VPS Anda**

---

### 3️⃣ Jalankan Script Perbaikan

Setelah login ke VPS, jalankan:

```bash
cd /root
chmod +x fix-websocket-vps.sh
./fix-websocket-vps.sh
```

Script akan otomatis:
- ✅ Backup file penting
- ✅ Perbaiki konfigurasi WebSocket di frontend
- ✅ Perbaiki konfigurasi WebSocket di backend
- ✅ Rebuild Docker containers
- ✅ Restart aplikasi
- ✅ Cek status dan logs

**Proses ini memakan waktu sekitar 3-5 menit**

---

### 4️⃣ Verifikasi Perbaikan

Setelah script selesai, buka browser dan akses:

```
https://iwareid.com
```

Cek di halaman Sales Orders:
- Status harus berubah dari "Offline" menjadi "Live" (dengan icon Wifi hijau)
- Tidak ada lagi pesan disconnect/reconnect berulang di console browser

---

## 🔍 Monitoring (Opsional)

Jika ingin melihat logs real-time:

```bash
# Logs backend
docker-compose logs -f backend

# Logs frontend
docker-compose logs -f frontend

# Tekan Ctrl+C untuk keluar
```

---

## 🔄 Jika Masih Ada Masalah

### Restart Manual

```bash
cd /root/werehousegudang
docker-compose restart
```

### Rebuild Ulang

```bash
cd /root/werehousegudang
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Restore Backup (jika ada masalah)

```bash
cd /root/werehousegudang
mv frontend/src/hooks/useWebSocket.js.backup frontend/src/hooks/useWebSocket.js
mv backend/src/services/WebSocketService.js.backup backend/src/services/WebSocketService.js
docker-compose restart
```

---

## 📞 Perubahan yang Dilakukan

### Frontend (useWebSocket.js)
- Meningkatkan `reconnectionDelay` dari 1000ms ke 2000ms
- Menambah `reconnectionDelayMax: 10000` untuk mencegah reconnect terlalu cepat
- Meningkatkan `reconnectionAttempts` dari 5 ke 10
- Menambah `timeout: 20000` untuk koneksi yang lebih stabil
- Menambah `multiplex: true` untuk reuse koneksi

### Backend (WebSocketService.js)
- Menambah `pingTimeout: 60000` untuk keep-alive lebih lama
- Menambah `pingInterval: 25000` untuk cek koneksi berkala
- Menambah `upgradeTimeout: 30000` untuk upgrade websocket
- Menambah handler `ping/pong` untuk keep-alive manual
- Menambah logging reason saat disconnect

---

## ✅ Hasil yang Diharapkan

Setelah perbaikan:
- ✅ WebSocket tetap connected stabil
- ✅ Status "Live" dengan icon Wifi hijau
- ✅ Tidak ada disconnect/reconnect berulang
- ✅ Real-time update sales orders berjalan lancar
- ✅ Notifikasi toast muncul saat ada order baru

---

## 💡 Tips

1. **Jangan tutup terminal** saat script berjalan
2. **Tunggu sampai selesai** - proses rebuild memakan waktu
3. **Clear cache browser** setelah perbaikan (Ctrl+Shift+R)
4. **Cek di browser incognito** untuk memastikan tidak ada cache issue

---

## 🆘 Butuh Bantuan?

Jika masih ada masalah, kirim screenshot dari:
1. Console browser (F12 > Console tab)
2. Output dari: `docker-compose logs backend | tail -50`
3. Output dari: `docker-compose ps`
