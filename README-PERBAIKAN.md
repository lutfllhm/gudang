# 🔧 Perbaikan WebSocket iWare Warehouse

## 📋 Informasi VPS
- **SSH:** `root@212.85.26.166`
- **Path Aplikasi:** `/var/www/gudang`
- **Domain:** `https://iwareid.com`

## 🚨 Masalah
- WebSocket terus disconnect/reconnect
- Status "Offline" di halaman Sales Orders
- Error di Console: `WebSocket is closed before the connection is established`

## 🎯 Solusi
Masalah ada di **konfigurasi Nginx** - WebSocket upgrade headers belum dikonfigurasi dengan benar untuk endpoint `/socket.io/`

---

## 🚀 Cara Perbaikan (PILIH SALAH SATU)

### ✅ CARA 1: Satu Command (Paling Cepat)

Buka terminal Windows di folder `d:\werehousegudang`, lalu:

```bash
scp fix-websocket-nginx-vps.sh root@212.85.26.166:/tmp/ && ssh root@212.85.26.166 "chmod +x /tmp/fix-websocket-nginx-vps.sh && /tmp/fix-websocket-nginx-vps.sh"
```

**Masukkan password 2x** → Tunggu 1-2 menit → Selesai!

---

### ✅ CARA 2: Step by Step

#### Step 1: Upload Script
```bash
scp fix-websocket-nginx-vps.sh root@212.85.26.166:/tmp/
```
*Masukkan password*

#### Step 2: Login ke VPS
```bash
ssh root@212.85.26.166
```
*Masukkan password*

#### Step 3: Jalankan Perbaikan
```bash
chmod +x /tmp/fix-websocket-nginx-vps.sh && /tmp/fix-websocket-nginx-vps.sh
```

---

### ✅ CARA 3: Debug Dulu (Cek Masalah)

Upload dan jalankan script debug:

```bash
scp debug-websocket-vps.sh root@212.85.26.166:/tmp/
ssh root@212.85.26.166
chmod +x /tmp/debug-websocket-vps.sh && /tmp/debug-websocket-vps.sh
```

Script debug akan menampilkan:
- ✅ Status containers
- ✅ Port yang listening
- ✅ Test koneksi backend
- ✅ Test WebSocket endpoint
- ✅ Nginx config
- ✅ Error logs

---

## 📦 File yang Tersedia

| File | Deskripsi |
|------|-----------|
| `fix-websocket-nginx-vps.sh` | Script perbaikan otomatis |
| `debug-websocket-vps.sh` | Script untuk debugging |
| `COMMAND-FINAL.txt` | Panduan command lengkap |
| `JALANKAN-INI.txt` | Command cepat |
| `nginx-websocket-config.conf` | Contoh config Nginx |

---

## 🔍 Verifikasi Perbaikan

Setelah script selesai:

1. **Buka browser:** `https://iwareid.com`
2. **Buka Console:** Tekan `F12`
3. **Refresh:** Tekan `Ctrl+Shift+R`
4. **Cek Console:** Harus ada pesan:
   ```
   ✅ WebSocket connected
   WebSocket server message: Connected to iWare Warehouse
   ```
5. **Cek Status:** Di halaman Sales Orders harus ada badge **"Live"** (hijau dengan icon Wifi)

---

## 🛠️ Apa yang Dilakukan Script?

Script `fix-websocket-nginx-vps.sh` akan:

1. ✅ **Backup file penting** ke folder `backups/`
2. ✅ **Cek konfigurasi Nginx** di `/etc/nginx/sites-available/iwareid.com`
3. ✅ **Tambah/perbaiki location `/socket.io/`** dengan WebSocket headers:
   - `proxy_set_header Upgrade $http_upgrade;`
   - `proxy_set_header Connection "upgrade";`
   - `proxy_buffering off;`
   - Timeout 7 hari untuk keep-alive
4. ✅ **Test Nginx config** dengan `nginx -t`
5. ✅ **Reload Nginx** untuk apply config baru
6. ✅ **Cek status containers** dan restart jika perlu
7. ✅ **Test endpoint backend** dan WebSocket
8. ✅ **Tampilkan summary** hasil perbaikan

---

## 🆘 Troubleshooting

### Jika masih error setelah perbaikan:

#### 1. Restart Containers
```bash
cd /var/www/gudang
docker-compose restart
sleep 30
docker-compose logs --tail=50 backend
```

#### 2. Rebuild Containers
```bash
cd /var/www/gudang
docker-compose down
docker-compose up -d
sleep 30
docker-compose logs --tail=50 backend
```

#### 3. Cek Nginx Error Log
```bash
tail -50 /var/log/nginx/iwareid.com-error.log
```

#### 4. Cek Backend Logs
```bash
cd /var/www/gudang
docker-compose logs --tail=100 backend
```

#### 5. Cek Port Listening
```bash
netstat -tlnp | grep -E ':(5000|3000|443|80)'
```

---

## 📸 Jika Masih Bermasalah

Kirim screenshot/output dari:

1. **Console browser** (F12 → Console tab)
2. **Backend logs:**
   ```bash
   cd /var/www/gudang && docker-compose logs --tail=50 backend
   ```
3. **Nginx error log:**
   ```bash
   tail -50 /var/log/nginx/iwareid.com-error.log
   ```
4. **Container status:**
   ```bash
   cd /var/www/gudang && docker-compose ps
   ```
5. **Port listening:**
   ```bash
   netstat -tlnp | grep -E ':(5000|3000|443|80)'
   ```

---

## ✅ Hasil yang Diharapkan

Setelah perbaikan berhasil:

- ✅ WebSocket tetap connected stabil
- ✅ Status "Live" dengan icon Wifi hijau
- ✅ Tidak ada disconnect/reconnect berulang
- ✅ Real-time update sales orders berjalan lancar
- ✅ Notifikasi toast muncul saat ada order baru
- ✅ Console browser tidak ada error WebSocket

---

## 💡 Tips

1. **Jangan tutup terminal** saat script berjalan
2. **Tunggu sampai selesai** - proses memakan waktu 1-2 menit
3. **Clear cache browser** setelah perbaikan (`Ctrl+Shift+R`)
4. **Cek di browser incognito** untuk memastikan tidak ada cache issue
5. **Backup otomatis** tersimpan di `/var/www/gudang/backups/`

---

## 📞 Kontak

Jika masih ada masalah, kirim informasi di atas untuk analisis lebih lanjut.

---

**Dibuat:** 21 April 2026  
**Versi:** 1.0  
**Path:** `/var/www/gudang`
