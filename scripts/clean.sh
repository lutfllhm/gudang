#!/bin/bash

# =================================
# iWare Warehouse Cleanup Script
# =================================

echo "=========================================="
echo "iWare Warehouse - Cleanup Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}This will remove unused Docker resources${NC}"
echo -e "${RED}WARNING: This cannot be undone!${NC}"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Cleaning up...${NC}"

# Remove stopped containers
echo "Removing stopped containers..."
docker container prune -f

# Remove unused images
echo "Removing unused images..."
docker image prune -a -f

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Show disk usage
echo ""
echo "Current disk usage:"
docker system df

echo ""
echo -e "${GREEN}✓ Cleanup completed${NC}"
