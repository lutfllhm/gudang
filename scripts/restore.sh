#!/bin/bash

# ================================
# Database Restore Script
# ================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide backup file${NC}"
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/iware_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}Restoring database from: ${BACKUP_FILE}${NC}"
echo -e "${RED}WARNING: This will overwrite the current database!${NC}"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    gunzip -c $BACKUP_FILE > /tmp/restore.sql
    RESTORE_FILE="/tmp/restore.sql"
else
    RESTORE_FILE=$BACKUP_FILE
fi

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
docker exec -i iware-mysql-prod mysql \
    -u ${DB_USER} \
    -p${DB_PASSWORD} \
    ${DB_NAME} < $RESTORE_FILE

# Cleanup
if [ -f "/tmp/restore.sql" ]; then
    rm /tmp/restore.sql
fi

echo -e "${GREEN}Database restored successfully!${NC}"
