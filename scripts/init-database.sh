#!/bin/bash

# =================================
# Database Initialization Script
# =================================

set -e

echo "=========================================="
echo "Database Initialization"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
sleep 5

echo ""
echo -e "${YELLOW}Creating database if not exists...${NC}"
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"

echo ""
echo -e "${YELLOW}Importing schema...${NC}"
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} < backend/database/schema.sql

echo ""
echo -e "${YELLOW}Verifying tables...${NC}"
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} -e "SHOW TABLES;"

echo ""
echo -e "${GREEN}✓ Database initialized successfully${NC}"

echo ""
echo "=========================================="
echo "Creating admin user..."
echo "=========================================="
docker compose exec backend node src/scripts/create-admin-auto.js

echo ""
echo -e "${GREEN}Database initialization completed!${NC}"
