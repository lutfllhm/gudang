#!/bin/bash

# ============================================
# Simple Docker Deploy Script
# Edit konfigurasi di bawah sebelum dijalankan
# ============================================

# EDIT KONFIGURASI INI
APP_PATH="/var/www/iware"
MYSQL_PASSWORD="your-mysql-password"
DB_NAME="iware_warehouse"

echo "Deploying Sales Order History with Docker..."

cd $APP_PATH

# Backup
echo "1. Backing up database..."
docker-compose exec -T mysql mysqldump -u root -p"$MYSQL_PASSWORD" $DB_NAME > backup-$(date +%Y%m%d-%H%M%S).sql

# Pull code
echo "2. Pulling latest code..."
git pull origin main

# Setup database
echo "3. Setting up database..."
cat backend/database/add-sales-order-history.sql | docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" $DB_NAME

# Rebuild images
echo "4. Rebuilding images..."
docker-compose build backend frontend

# Restart containers
echo "5. Restarting containers..."
docker-compose restart backend frontend

# Verify
echo "6. Verifying deployment..."
sleep 5
docker-compose ps
docker-compose logs --tail=20 backend

echo ""
echo "✓ Deployment complete!"
echo "Check: docker-compose ps"
echo "Logs: docker-compose logs -f backend"
echo ""
