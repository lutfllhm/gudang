#!/bin/bash

# =================================
# iWare Warehouse Deployment Script
# =================================

set -e

echo "=========================================="
echo "iWare Warehouse - Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please create .env.production file with your configuration."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p backend/logs

echo -e "${GREEN}✓ Directories created${NC}"

# Pull latest changes (if using git)
if [ -d .git ]; then
    echo "Pulling latest changes from git..."
    git pull origin main || git pull origin master
    echo -e "${GREEN}✓ Git pull completed${NC}"
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

echo -e "${GREEN}✓ Containers stopped${NC}"

# Remove old images (optional - uncomment if needed)
# echo "Removing old images..."
# docker-compose down --rmi all

# Build and start containers
echo "Building and starting containers..."
docker-compose --env-file .env.production up -d --build

echo -e "${GREEN}✓ Containers started${NC}"

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check container status
echo ""
echo "=========================================="
echo "Container Status:"
echo "=========================================="
docker-compose ps

# Check logs for errors
echo ""
echo "=========================================="
echo "Recent Logs:"
echo "=========================================="
docker-compose logs --tail=50

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment completed!${NC}"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f [service_name]"
echo "  - Restart service: docker-compose restart [service_name]"
echo "  - Stop all: docker-compose down"
echo "  - Check status: docker-compose ps"
echo ""
