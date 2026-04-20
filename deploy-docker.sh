#!/bin/bash

# ============================================
# Deploy Sales Order History dengan Docker
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}=========================================="
echo "Deploy Sales Order History (Docker)"
echo "==========================================${NC}"
echo ""

# Configuration
read -p "App Path [/var/www/iware]: " APP_PATH
APP_PATH=${APP_PATH:-/var/www/iware}

read -p "MySQL Root Password: " -s MYSQL_PASSWORD
echo ""

read -p "Database Name [iware_warehouse]: " DB_NAME
DB_NAME=${DB_NAME:-iware_warehouse}

echo ""
echo "${YELLOW}Configuration:${NC}"
echo "  Path: $APP_PATH"
echo "  Database: $DB_NAME"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "${RED}Deployment cancelled.${NC}"
    exit 0
fi

cd $APP_PATH

echo ""
echo "${GREEN}Step 1: Backing up database...${NC}"
docker-compose exec -T mysql mysqldump -u root -p"$MYSQL_PASSWORD" $DB_NAME > backup-$(date +%Y%m%d-%H%M%S).sql || {
    echo "${RED}Backup failed!${NC}"
    exit 1
}
echo "${GREEN}✓ Backup created${NC}"

echo ""
echo "${GREEN}Step 2: Pulling latest code...${NC}"
git pull origin main || {
    echo "${RED}Git pull failed!${NC}"
    exit 1
}
echo "${GREEN}✓ Code updated${NC}"

echo ""
echo "${GREEN}Step 3: Setting up database...${NC}"
cat backend/database/add-sales-order-history.sql | docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" $DB_NAME || {
    echo "${RED}Database setup failed!${NC}"
    exit 1
}
echo "${GREEN}✓ Database updated${NC}"

echo ""
echo "${GREEN}Step 4: Rebuilding images...${NC}"
docker-compose build backend frontend || {
    echo "${RED}Build failed!${NC}"
    exit 1
}
echo "${GREEN}✓ Images rebuilt${NC}"

echo ""
echo "${GREEN}Step 5: Restarting containers...${NC}"
docker-compose restart backend frontend || {
    echo "${RED}Restart failed!${NC}"
    exit 1
}
echo "${GREEN}✓ Containers restarted${NC}"

echo ""
echo "${GREEN}Step 6: Verifying deployment...${NC}"
sleep 5

# Check containers
echo ""
echo "${BLUE}Container Status:${NC}"
docker-compose ps

# Check logs
echo ""
echo "${BLUE}Recent Backend Logs:${NC}"
docker-compose logs --tail=20 backend

# Check database
echo ""
echo "${BLUE}Database Verification:${NC}"
docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" $DB_NAME -e "SHOW TABLES LIKE 'sales_order_history';" || {
    echo "${RED}Table not found!${NC}"
    exit 1
}
echo "${GREEN}✓ Table exists${NC}"

docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" $DB_NAME -e "SHOW TRIGGERS LIKE 'sales_orders';" || {
    echo "${YELLOW}Warning: Trigger check failed${NC}"
}

echo ""
echo "${GREEN}=========================================="
echo "✓ Deployment Successful!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test the application: http://your-domain.com"
echo "2. Monitor logs: docker-compose logs -f backend"
echo "3. Check status: docker-compose ps"
echo ""
echo "Backup location: backup-*.sql"
echo ""
