#!/bin/bash

# Script untuk deploy histori faktur penjualan ke VPS
# Usage: ./deploy-invoice-history.sh

set -e

echo "=========================================="
echo "Deploy Histori Faktur Penjualan"
echo "=========================================="

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_HOST="212.85.26.166"
VPS_USER="root"
VPS_APP_DIR="/root/accurate-sync"
VPS_BACKEND_DIR="$VPS_APP_DIR/backend"

echo -e "${YELLOW}Connecting to VPS: $VPS_HOST${NC}"

# Function to run command on VPS
run_on_vps() {
    ssh $VPS_USER@$VPS_HOST "$1"
}

# 1. Check VPS connection
echo -e "\n${YELLOW}[1/7] Checking VPS connection...${NC}"
if run_on_vps "echo 'Connected successfully'"; then
    echo -e "${GREEN}✓ VPS connection OK${NC}"
else
    echo -e "${RED}✗ Failed to connect to VPS${NC}"
    exit 1
fi

# 2. Backup database
echo -e "\n${YELLOW}[2/7] Creating database backup...${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysqldump -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync > backup_before_invoice_history_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${GREEN}✓ Database backup created${NC}"

# 3. Upload migration file
echo -e "\n${YELLOW}[3/7] Uploading migration file...${NC}"
scp backend/database/add-sales-invoice-history.sql $VPS_USER@$VPS_HOST:$VPS_BACKEND_DIR/database/
echo -e "${GREEN}✓ Migration file uploaded${NC}"

# 4. Run migration
echo -e "\n${YELLOW}[4/7] Running database migration...${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync < database/add-sales-invoice-history.sql"
echo -e "${GREEN}✓ Database migration completed${NC}"

# 5. Upload updated backend files
echo -e "\n${YELLOW}[5/7] Uploading updated backend files...${NC}"
scp backend/src/controllers/SalesInvoiceHistoryController.js $VPS_USER@$VPS_HOST:$VPS_BACKEND_DIR/src/controllers/
scp backend/src/models/SalesInvoiceHistory.js $VPS_USER@$VPS_HOST:$VPS_BACKEND_DIR/src/models/
scp backend/src/services/CustomerService.js $VPS_USER@$VPS_HOST:$VPS_BACKEND_DIR/src/services/
scp backend/src/routes/salesInvoiceHistory.js $VPS_USER@$VPS_HOST:$VPS_BACKEND_DIR/src/routes/
echo -e "${GREEN}✓ Backend files uploaded${NC}"

# 6. Restart backend service
echo -e "\n${YELLOW}[6/7] Restarting backend service...${NC}"
run_on_vps "cd $VPS_APP_DIR && docker-compose restart backend"
echo -e "${GREEN}✓ Backend service restarted${NC}"

# 7. Verify deployment
echo -e "\n${YELLOW}[7/7] Verifying deployment...${NC}"
sleep 5
if run_on_vps "cd $VPS_APP_DIR && docker-compose ps | grep backend | grep Up"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running properly${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    run_on_vps "cd $VPS_APP_DIR && docker-compose logs --tail=50 backend"
    exit 1
fi

# Check database table
echo -e "\n${YELLOW}Checking database table...${NC}"
run_on_vps "cd $VPS_BACKEND_DIR && docker-compose exec -T db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SHOW TABLES LIKE \"sales_invoice_history\";'"

echo -e "\n${GREEN}=========================================="
echo "✓ Deployment completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Endpoints yang tersedia:"
echo "  GET  /api/sales-invoice-history/recent"
echo "  GET  /api/sales-invoice-history/order/:orderId"
echo "  GET  /api/sales-invoice-history/so/:soId"
echo "  GET  /api/sales-invoice-history/status/:status"
echo "  POST /api/sales-invoice-history/sync"
echo ""
echo "Untuk test sync manual:"
echo "  curl -X POST http://$VPS_HOST:3000/api/sales-invoice-history/sync \\"
echo "       -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\"}'"
