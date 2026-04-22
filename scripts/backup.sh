#!/bin/bash

# ================================
# Database Backup Script
# ================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="iware_backup_${DATE}.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting database backup...${NC}"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
docker exec iware-mysql-prod mysqldump \
    -u ${DB_USER} \
    -p${DB_PASSWORD} \
    ${DB_NAME} > ${BACKUP_DIR}/${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

echo -e "${GREEN}Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz${NC}"

# Keep only last 7 backups
cd ${BACKUP_DIR}
ls -t iware_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo -e "${GREEN}Old backups cleaned up${NC}"
