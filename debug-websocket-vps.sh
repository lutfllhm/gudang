#!/bin/bash

# ============================================
# Script untuk debugging WebSocket di VPS
# Path: /var/www/gudang
# ============================================

echo "🔍 Debugging WebSocket di VPS..."
echo ""

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Cek direktori aplikasi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📁 Cek direktori aplikasi${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ -d "/var/www/gudang" ]; then
    echo -e "${GREEN}✅ Direktori /var/www/gudang ditemukan${NC}"
    cd /var/www/gudang
else
    echo -e "${RED}❌ Direktori /var/www/gudang tidak ditemukan!${NC}"
    exit 1
fi
echo ""

# 2. Cek Docker containers
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🐳 Status Docker Containers${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
docker-compose ps
echo ""

# 3. Cek port yang listening
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔌 Port yang Listening${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "Port 5000 (Backend):"
netstat -tlnp | grep :5000 || echo -e "${RED}  ❌ Tidak ada${NC}"
echo ""
echo "Port 3000 (Frontend):"
netstat -tlnp | grep :3000 || echo -e "${RED}  ❌ Tidak ada${NC}"
echo ""
echo "Port 443 (HTTPS):"
netstat -tlnp | grep :443 || echo -e "${RED}  ❌ Tidak ada${NC}"
echo ""
echo "Port 80 (HTTP):"
netstat -tlnp | grep :80 || echo -e "${RED}  ❌ Tidak ada${NC}"
echo ""

# 4. Test koneksi backend
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🧪 Test Koneksi Backend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "Test http://localhost:5000/api/health"
HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if [ -z "$HEALTH" ]; then
    echo -e "${RED}❌ Backend tidak merespon!${NC}"
else
    echo -e "${GREEN}✅ Backend merespon:${NC}"
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
fi
echo ""

# 5. Test WebSocket endpoint
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🧪 Test WebSocket Endpoint${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "Test http://localhost:5000/socket.io/"
WS_RESPONSE=$(curl -s -I http://localhost:5000/socket.io/ 2>/dev/null)
if [ -z "$WS_RESPONSE" ]; then
    echo -e "${RED}❌ WebSocket endpoint tidak merespon!${NC}"
else
    echo -e "${GREEN}✅ WebSocket endpoint merespon:${NC}"
    echo "$WS_RESPONSE" | head -n 5
fi
echo ""

# 6. Cek Nginx config
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚙️  Nginx Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ -f "/etc/nginx/sites-available/iwareid.com" ]; then
    echo -e "${GREEN}✅ File config ditemukan: /etc/nginx/sites-available/iwareid.com${NC}"
    echo ""
    echo "Cek location /socket.io/ :"
    grep -A 10 "location /socket.io/" /etc/nginx/sites-available/iwareid.com || echo -e "${RED}❌ Location /socket.io/ tidak ditemukan!${NC}"
else
    echo -e "${RED}❌ File Nginx config tidak ditemukan!${NC}"
fi
echo ""

# 7. Test Nginx config
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🧪 Test Nginx Config${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
nginx -t
echo ""

# 8. Cek Nginx error log
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Nginx Error Log (10 baris terakhir)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ -f "/var/log/nginx/iwareid.com-error.log" ]; then
    tail -10 /var/log/nginx/iwareid.com-error.log
else
    echo -e "${YELLOW}⚠️  File log tidak ditemukan${NC}"
fi
echo ""

# 9. Cek backend logs
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Backend Logs (20 baris terakhir)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
docker-compose logs --tail=20 backend
echo ""

# 10. Cek environment variables
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔐 Environment Variables (Backend Container)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "CORS_ORIGIN:"
docker-compose exec -T backend printenv CORS_ORIGIN 2>/dev/null || echo -e "${RED}❌ Tidak bisa diakses${NC}"
echo ""
echo "PORT:"
docker-compose exec -T backend printenv PORT 2>/dev/null || echo -e "${RED}❌ Tidak bisa diakses${NC}"
echo ""

# 11. Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Debugging selesai!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "📝 Checklist:"
echo "  [ ] Direktori /var/www/gudang ada"
echo "  [ ] Backend container running"
echo "  [ ] Port 5000 listening"
echo "  [ ] Backend /api/health merespon"
echo "  [ ] WebSocket /socket.io/ merespon"
echo "  [ ] Nginx config valid"
echo "  [ ] Nginx config punya location /socket.io/"
echo "  [ ] Tidak ada error di Nginx log"
echo "  [ ] Tidak ada error di backend log"
echo ""
echo "🔧 Jika ada yang tidak OK, jalankan:"
echo "  /tmp/fix-websocket-nginx-vps.sh"
echo ""
