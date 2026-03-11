#!/bin/bash

# =================================
# iWare Warehouse Update Script
# =================================

set -e

echo "=========================================="
echo "iWare Warehouse - Update Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backup before update
echo -e "${YELLOW}Creating backup before update...${NC}"
./scripts/backup.sh

# Pull latest changes
echo ""
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull origin main || git pull origin master

# Rebuild containers
echo ""
echo -e "${YELLOW}Rebuilding containers...${NC}"
docker compose --env-file .env.production up -d --build

# Wait for services
echo ""
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 15

# Health check
echo ""
./scripts/health-check.sh

echo ""
echo "=========================================="
echo -e "${GREEN}Update completed!${NC}"
echo "=========================================="
