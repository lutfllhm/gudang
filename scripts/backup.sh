#!/bin/bash

# =================================
# iWare Warehouse Backup Script
# =================================

set -e

echo "=========================================="
echo "iWare Warehouse - Backup Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Creating backup in $BACKUP_DIR...${NC}"

# Backup MySQL database
echo "Backing up MySQL database..."
docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > $BACKUP_DIR/database.sql
echo -e "${GREEN}✓ Database backup completed${NC}"

# Backup Redis data
echo "Backing up Redis data..."
docker-compose exec -T redis redis-cli -a ${REDIS_PASSWORD} --rdb $BACKUP_DIR/redis.rdb BGSAVE
echo -e "${GREEN}✓ Redis backup completed${NC}"

# Backup environment files
echo "Backing up configuration files..."
cp .env.production $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/
echo -e "${GREEN}✓ Configuration backup completed${NC}"

# Compress backup
echo "Compressing backup..."
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
echo -e "${GREEN}✓ Backup compressed: $BACKUP_DIR.tar.gz${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Backup completed successfully!${NC}"
echo "=========================================="
