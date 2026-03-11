#!/bin/bash

# Complete VPS Deployment Script
# Usage: ./scripts/deploy-vps.sh

set -e

echo "🚀 Starting VPS deployment..."

# Configuration
VPS_HOST="148.230.100.44"
VPS_USER="root"
VPS_PATH="/var/www/gudang"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📤 Step 1: Pulling latest code on VPS...${NC}"
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
git pull origin main
ENDSSH

echo -e "${GREEN}✅ Code updated${NC}"

echo -e "${YELLOW}🔨 Step 2: Stopping containers...${NC}"
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
docker compose --env-file .env.production down
ENDSSH

echo -e "${GREEN}✅ Containers stopped${NC}"

echo -e "${YELLOW}🏗️  Step 3: Building images...${NC}"
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
docker compose --env-file .env.production build --no-cache
ENDSSH

echo -e "${GREEN}✅ Images built${NC}"

echo -e "${YELLOW}🚀 Step 4: Starting containers...${NC}"
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
docker compose --env-file .env.production up -d
ENDSSH

echo -e "${GREEN}✅ Containers started${NC}"

echo -e "${YELLOW}⏳ Step 5: Waiting for services to be healthy (2 minutes)...${NC}"
sleep 120

echo -e "${YELLOW}🔍 Step 6: Checking service status...${NC}"
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
echo "=== Container Status ==="
docker compose --env-file .env.production ps
echo ""
echo "=== Backend Logs (last 30 lines) ==="
docker compose --env-file .env.production logs --tail=30 backend
echo ""
echo "=== Health Check ==="
curl -f http://localhost:5000/health || echo "Backend health check failed"
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${YELLOW}🌐 Check your application at: https://iwareid.com${NC}"
echo ""
echo "Useful commands:"
echo "  - View logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker compose --env-file .env.production logs -f'"
echo "  - Restart: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker compose --env-file .env.production restart'"
echo "  - Status: ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && docker compose --env-file .env.production ps'"
