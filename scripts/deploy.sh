#!/bin/bash

# ================================
# iWare Deployment Script
# ================================

set -e

echo "================================"
echo "iWare Warehouse Deployment"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.production to .env and configure it first."
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}Step 1: Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo ""
echo -e "${YELLOW}Step 2: Pulling latest images...${NC}"
docker-compose -f docker-compose.prod.yml pull

echo ""
echo -e "${YELLOW}Step 3: Building images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo -e "${YELLOW}Step 4: Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${YELLOW}Step 5: Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo ""
echo -e "${YELLOW}Checking service status...${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Services:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost/api"
echo "  - MySQL: localhost:3306"
echo "  - Redis: localhost:6379"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
