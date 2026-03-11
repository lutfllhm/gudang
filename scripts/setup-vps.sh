#!/bin/bash

# =================================
# iWare Warehouse VPS Setup Script
# =================================

set -e

echo "=========================================="
echo "iWare Warehouse - VPS Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"

echo ""
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
apt install -y curl wget git nano ufw ca-certificates gnupg lsb-release
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Setting up firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${YELLOW}Step 4: Installing Docker...${NC}"

# Remove old versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

echo -e "${GREEN}✓ Docker installed${NC}"

echo ""
echo -e "${YELLOW}Step 5: Verifying installation...${NC}"
docker --version
docker compose version
echo -e "${GREEN}✓ Verification completed${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}VPS Setup Completed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/"
echo "2. Configure .env.production"
echo "3. Run ./scripts/deploy.sh"
echo ""
