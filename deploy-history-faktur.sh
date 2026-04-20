#!/bin/bash

# ============================================
# Deploy History Faktur Update
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "${GREEN}=========================================="
echo "Deploy History Faktur Penjualan Update"
echo "==========================================${NC}"
echo ""

# Configuration
read -p "App Path [/var/www/iware]: " APP_PATH
APP_PATH=${APP_PATH:-/var/www/iware}

read -p "Deploy method (docker/pm2): " METHOD
METHOD=${METHOD:-docker}

read -p "Add sample data? (y/n) [n]: " ADD_SAMPLE
ADD_SAMPLE=${ADD_SAMPLE:-n}

if [ "$METHOD" = "docker" ]; then
    read -p "MySQL Password: " -s MYSQL_PASSWORD
    echo ""
fi

cd $APP_PATH

echo ""
echo "${GREEN}Step 1: Pulling latest code...${NC}"
git pull origin main
echo "${GREEN}✓ Code updated${NC}"

if [ "$ADD_SAMPLE" = "y" ]; then
    echo ""
    echo "${GREEN}Step 2: Adding sample data...${NC}"
    if [ "$METHOD" = "docker" ]; then
        cat backend/database/add-sample-history.sql | docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" iware_warehouse
    else
        mysql -u root -p iware_warehouse < backend/database/add-sample-history.sql
    fi
    echo "${GREEN}✓ Sample data added${NC}"
fi

echo ""
echo "${GREEN}Step 3: Building frontend...${NC}"
if [ "$METHOD" = "docker" ]; then
    docker-compose build frontend
else
    cd frontend
    npm run build
    cd ..
fi
echo "${GREEN}✓ Frontend built${NC}"

echo ""
echo "${GREEN}Step 4: Restarting frontend...${NC}"
if [ "$METHOD" = "docker" ]; then
    docker-compose restart frontend
else
    pm2 restart frontend
fi
echo "${GREEN}✓ Frontend restarted${NC}"

echo ""
echo "${GREEN}Step 5: Verifying...${NC}"
sleep 3

if [ "$METHOD" = "docker" ]; then
    docker-compose ps
    docker-compose logs --tail=20 frontend
else
    pm2 status
    pm2 logs frontend --lines 20
fi

echo ""
echo "${GREEN}=========================================="
echo "✓ Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl + Shift + Delete)"
echo "2. Refresh page (Ctrl + F5)"
echo "3. Check 'History Faktur Penjualan' column"
echo "4. Verify nama pembuat muncul"
echo ""
