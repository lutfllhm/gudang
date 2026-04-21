#!/bin/bash

# ============================================
# Script untuk memperbaiki WebSocket + Nginx di VPS
# ============================================

echo "🔧 Memulai perbaikan WebSocket + Nginx di VPS..."
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Cek apakah di direktori yang benar
if [ ! -d "/var/www/gudang" ]; then
    echo -e "${RED}❌ Direktori /var/www/gudang tidak ditemukan!${NC}"
    echo "Pastikan aplikasi sudah di-deploy di /var/www/gudang"
    exit 1
fi

cd /var/www/gudang

# 2. Backup file penting
echo -e "${YELLOW}📦 Backup file penting...${NC}"
mkdir -p backups
cp -f frontend/src/hooks/useWebSocket.js backups/useWebSocket.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null
cp -f backend/src/services/WebSocketService.js backups/WebSocketService.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null
cp -f /etc/nginx/sites-available/iwareid.com backups/nginx-iwareid.com.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null
echo -e "${GREEN}✅ Backup selesai${NC}"
echo ""

# 3. Cek dan perbaiki Nginx config
echo -e "${YELLOW}🔧 Memeriksa konfigurasi Nginx...${NC}"

# Cek apakah file Nginx config ada
if [ ! -f "/etc/nginx/sites-available/iwareid.com" ]; then
    echo -e "${RED}❌ File Nginx config tidak ditemukan!${NC}"
    echo "Membuat konfigurasi Nginx baru..."
    
    # Buat konfigurasi Nginx baru
    cat > /etc/nginx/sites-available/iwareid.com << 'NGINXEOF'
# Upstream untuk backend
upstream backend_server {
    server 127.0.0.1:5000;
    keepalive 64;
}

# Upstream untuk frontend
upstream frontend_server {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name iwareid.com www.iwareid.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name iwareid.com www.iwareid.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/iwareid.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iwareid.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/iwareid.com-access.log;
    error_log /var/log/nginx/iwareid.com-error.log;

    # Max upload size
    client_max_body_size 10M;

    # Backend API
    location /api {
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Socket.IO WebSocket - PENTING!
    location /socket.io/ {
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        proxy_buffering off;
    }

    # Frontend
    location / {
        proxy_pass http://frontend_server;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

    # Enable site
    ln -sf /etc/nginx/sites-available/iwareid.com /etc/nginx/sites-enabled/
    
    echo -e "${GREEN}✅ Konfigurasi Nginx dibuat${NC}"
else
    echo -e "${GREEN}✅ File Nginx config sudah ada${NC}"
fi

# Test Nginx config
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx config error! Restore backup...${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Nginx config valid${NC}"
echo ""

# 4. Reload Nginx
echo -e "${YELLOW}🔄 Reload Nginx...${NC}"
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx reload failed${NC}"
    systemctl restart nginx
fi
echo ""

# 5. Cek status containers
echo -e "${YELLOW}📊 Cek status Docker containers...${NC}"
docker-compose ps
echo ""

# 6. Cek apakah backend running
BACKEND_RUNNING=$(docker-compose ps | grep backend | grep Up)
if [ -z "$BACKEND_RUNNING" ]; then
    echo -e "${RED}❌ Backend container tidak running!${NC}"
    echo "Restart containers..."
    docker-compose restart
    sleep 10
fi

# 7. Cek logs backend untuk error
echo -e "${YELLOW}📋 Cek logs backend (20 baris terakhir)...${NC}"
docker-compose logs --tail=20 backend
echo ""

# 8. Test koneksi ke backend
echo -e "${YELLOW}🧪 Test koneksi ke backend...${NC}"
BACKEND_HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if [ -z "$BACKEND_HEALTH" ]; then
    echo -e "${RED}❌ Backend tidak merespon!${NC}"
    echo "Coba restart backend..."
    docker-compose restart backend
    sleep 10
else
    echo -e "${GREEN}✅ Backend merespon: $BACKEND_HEALTH${NC}"
fi
echo ""

# 9. Test WebSocket endpoint
echo -e "${YELLOW}🧪 Test WebSocket endpoint...${NC}"
WS_TEST=$(curl -s -I http://localhost:5000/socket.io/ 2>/dev/null | head -n 1)
if [ -z "$WS_TEST" ]; then
    echo -e "${RED}❌ WebSocket endpoint tidak merespon!${NC}"
else
    echo -e "${GREEN}✅ WebSocket endpoint merespon: $WS_TEST${NC}"
fi
echo ""

# 10. Cek port yang listening
echo -e "${YELLOW}📊 Cek port yang listening...${NC}"
echo "Port 5000 (Backend):"
netstat -tlnp | grep :5000 || echo "  Tidak ada"
echo "Port 3000 (Frontend):"
netstat -tlnp | grep :3000 || echo "  Tidak ada"
echo "Port 443 (HTTPS):"
netstat -tlnp | grep :443 || echo "  Tidak ada"
echo ""

# 11. Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Perbaikan selesai!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📝 Yang sudah dilakukan:"
echo "  ✅ Backup file penting"
echo "  ✅ Cek/perbaiki konfigurasi Nginx"
echo "  ✅ Reload Nginx"
echo "  ✅ Cek status containers"
echo "  ✅ Test koneksi backend"
echo "  ✅ Test WebSocket endpoint"
echo ""
echo "🔍 Langkah selanjutnya:"
echo "  1. Buka browser: https://iwareid.com"
echo "  2. Buka Console (F12)"
echo "  3. Cek apakah ada error WebSocket"
echo "  4. Lihat status di Sales Orders page"
echo ""
echo "📋 Command untuk monitoring:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo "  tail -f /var/log/nginx/iwareid.com-error.log"
echo ""
echo "🔄 Jika masih error, jalankan:"
echo "  cd /var/www/gudang && docker-compose down && docker-compose up -d"
echo ""
