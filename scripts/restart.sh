#!/bin/bash

# =================================
# iWare Warehouse Restart Script
# =================================

set -e

echo "=========================================="
echo "iWare Warehouse - Restart Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if service name is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker-compose restart
else
    echo -e "${YELLOW}Restarting $1...${NC}"
    docker-compose restart $1
fi

echo -e "${GREEN}✓ Restart completed${NC}"

# Show status
echo ""
echo "Container Status:"
docker-compose ps

# Show recent logs
if [ ! -z "$1" ]; then
    echo ""
    echo "Recent logs for $1:"
    docker-compose logs --tail=30 $1
fi
