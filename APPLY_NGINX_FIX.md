# 🔧 Cara Apply Nginx Configuration untuk WebSocket

## ⚠️ Masalah yang Anda Alami:

```
WebSocket connection to 'wss://iwareid.com/socket.io/?EIO=4&transport=websocket' failed
```

Ini berarti Nginx **belum dikonfigurasi** untuk meneruskan koneksi WebSocket ke backend.

## ✅ Solusi Step-by-Step:

### Step 1: Backup Config Lama

```bash
sudo cp /etc/nginx/sites-available/iwareid.com /etc/nginx/sites-available/iwareid.com.backup
```

### Step 2: Edit Nginx Config

```bash
sudo nano /etc/nginx/sites-available/iwareid.com
```

### Step 3: Tambahkan Block Ini

**PENTING:** Tambahkan block ini **SEBELUM** location `/` (frontend):

```nginx
# Socket.IO WebSocket Endpoint
location /socket.io/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    
    # WebSocket Support - WAJIB!
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts untuk WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
    
    # Disable buffering
    proxy_buffering off;
}
```

### Step 4: Update Location `/api` (Jika Belum Ada)

Pastikan location `/api` juga support WebSocket:

```nginx
location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    
    # WebSocket Support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### Step 5: Test Config

```bash
sudo nginx -t
```

**Output yang diharapkan:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Jika ada error:**
- Cek syntax (kurung kurawal, semicolon)
- Cek path SSL certificate
- Cek port backend (5000)

### Step 6: Restart Nginx

```bash
sudo systemctl restart nginx
```

### Step 7: Restart Backend

```bash
pm2 restart backend
```

### Step 8: Test WebSocket

1. Buka browser
2. Hard refresh (Ctrl+Shift+R)
3. Buka Console (F12)
4. Lihat log:

**Jika BERHASIL:**
```
✅ WebSocket connected
```

**Indikator berubah dari "Offline" ke "Live" 🟢**

## 🔍 Troubleshooting

### Error: "nginx: [emerg] unknown directive"

**Penyebab:** Syntax error di config

**Solusi:**
```bash
# Restore backup
sudo cp /etc/nginx/sites-available/iwareid.com.backup /etc/nginx/sites-available/iwareid.com

# Edit lagi dengan hati-hati
sudo nano /etc/nginx/sites-available/iwareid.com
```

### Error: "Connection refused"

**Penyebab:** Backend tidak running di port 5000

**Solusi:**
```bash
# Cek apakah backend running
pm2 list

# Cek port 5000
netstat -tuln | grep 5000

# Restart backend
pm2 restart backend
```

### Masih "Offline" setelah restart

**Solusi:**
```bash
# 1. Cek Nginx error log
sudo tail -f /var/log/nginx/error.log

# 2. Cek backend log
pm2 logs backend

# 3. Test manual
curl -I https://iwareid.com/socket.io/

# Harus return HTTP 400 (bukan 404 atau 502)
```

## 📋 Contoh Config Lengkap

Lihat file: `nginx-websocket-config.conf` untuk contoh lengkap.

## ✅ Checklist

- [ ] Backup config lama
- [ ] Tambah location `/socket.io/`
- [ ] Update location `/api` dengan WebSocket support
- [ ] Test config: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Restart backend: `pm2 restart backend`
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Cek console: harus ada "✅ WebSocket connected"
- [ ] Indikator berubah ke "Live" 🟢

## 🎯 Quick Command

Copy-paste semua command ini:

```bash
# Backup
sudo cp /etc/nginx/sites-available/iwareid.com /etc/nginx/sites-available/iwareid.com.backup

# Edit (tambahkan location /socket.io/ seperti di atas)
sudo nano /etc/nginx/sites-available/iwareid.com

# Test
sudo nginx -t

# Restart
sudo systemctl restart nginx
pm2 restart backend

# Cek log
pm2 logs backend --lines 20
```

Setelah itu, refresh browser dan cek apakah indikator berubah ke "Live" 🟢

---

**Jika masih bermasalah, kirim:**
1. Output dari: `sudo nginx -t`
2. Output dari: `pm2 logs backend --lines 50`
3. Screenshot browser console (F12)
