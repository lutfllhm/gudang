#!/bin/bash

# Script untuk verifikasi histori faktur penjualan di VPS
# Usage: ./verify-invoice-history.sh

set -e

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_HOST="212.85.26.166"
VPS_USER="root"
VPS_APP_DIR="/root/accurate-sync"
VPS_BACKEND_DIR="$VPS_APP_DIR/backend"

echo "=========================================="
echo "Verifikasi Histori Faktur Penjualan"
echo "=========================================="

# Function to run command on VPS
run_on_vps() {
    ssh $VPS_USER@$VPS_HOST "$1"
}

# 1. Check database table
echo -e "\n${YELLOW}[1/5] Checking database table...${NC}"
echo -e "${BLUE}Tables:${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SHOW TABLES LIKE \"%invoice%\";'"

echo -e "\n${BLUE}Table structure:${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'DESCRIBE sales_invoice_history;'"

echo -e "\n${BLUE}View structure:${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SHOW CREATE VIEW v_sales_invoice_history\\G'"

# 2. Check record count
echo -e "\n${YELLOW}[2/5] Checking record count...${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SELECT COUNT(*) as total_records FROM sales_invoice_history;'"

# 3. Check recent records
echo -e "\n${YELLOW}[3/5] Checking recent records...${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SELECT * FROM v_sales_invoice_history ORDER BY created_at DESC LIMIT 5;'"

# 4. Check backend logs
echo -e "\n${YELLOW}[4/5] Checking backend logs...${NC}"
echo -e "${BLUE}Recent logs:${NC}"
run_on_vps "cd $VPS_APP_DIR && docker-compose logs --tail=20 backend | grep -i 'invoice\|history' || echo 'No invoice/history logs found'"

# 5. Test API endpoints
echo -e "\n${YELLOW}[5/5] Testing API endpoints...${NC}"

# Get backend URL
BACKEND_URL="http://$VPS_HOST:3000"

echo -e "${BLUE}Testing health endpoint:${NC}"
curl -s "$BACKEND_URL/health" | head -n 5

echo -e "\n${BLUE}Available endpoints:${NC}"
echo "  GET  $BACKEND_URL/api/sales-invoice-history/recent"
echo "  GET  $BACKEND_URL/api/sales-invoice-history/order/:orderId"
echo "  GET  $BACKEND_URL/api/sales-invoice-history/so/:soId"
echo "  GET  $BACKEND_URL/api/sales-invoice-history/status/:status"
echo "  POST $BACKEND_URL/api/sales-invoice-history/sync"

echo -e "\n${GREEN}=========================================="
echo "✓ Verification completed!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} Untuk test endpoint, Anda perlu token autentikasi."
echo "Gunakan endpoint /api/auth/login untuk mendapatkan token."
