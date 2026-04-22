#!/bin/bash

# ================================
# Accurate Integration Setup Script
# ================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Accurate Integration Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}Panduan Setup Integrasi Accurate Online${NC}"
echo ""
echo "Anda perlu mendapatkan credentials dari Accurate Developer Portal:"
echo "https://account.accurate.id/developer"
echo ""

# Prompt for credentials
read -p "Apakah Anda sudah membuat aplikasi di Developer Portal? (y/n): " has_app

if [ "$has_app" != "y" ]; then
    echo ""
    echo -e "${YELLOW}Silakan buat aplikasi terlebih dahulu:${NC}"
    echo "1. Buka: https://account.accurate.id/developer"
    echo "2. Login dengan akun Accurate Online"
    echo "3. Klik 'Create New Application'"
    echo "4. Isi form dan simpan"
    echo "5. Catat credentials yang diberikan"
    echo ""
    exit 0
fi

echo ""
echo -e "${GREEN}Masukkan credentials dari Developer Portal:${NC}"
echo ""

read -p "App Key: " app_key
read -p "Client ID: " client_id
read -p "Client Secret: " client_secret
read -p "Signature Secret: " signature_secret
read -p "Redirect URI (contoh: https://yourdomain.com/api/accurate/callback): " redirect_uri

# Update .env file
echo ""
echo -e "${YELLOW}Updating .env file...${NC}"

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update Accurate credentials
sed -i "s|ACCURATE_APP_KEY=.*|ACCURATE_APP_KEY=$app_key|g" .env
sed -i "s|ACCURATE_CLIENT_ID=.*|ACCURATE_CLIENT_ID=$client_id|g" .env
sed -i "s|ACCURATE_CLIENT_SECRET=.*|ACCURATE_CLIENT_SECRET=$client_secret|g" .env
sed -i "s|ACCURATE_SIGNATURE_SECRET=.*|ACCURATE_SIGNATURE_SECRET=$signature_secret|g" .env
sed -i "s|ACCURATE_REDIRECT_URI=.*|ACCURATE_REDIRECT_URI=$redirect_uri|g" .env

echo -e "${GREEN}✓ .env file updated${NC}"

# Restart backend
echo ""
echo -e "${YELLOW}Restarting backend...${NC}"
docker-compose -f docker-compose.prod.yml restart backend

echo -e "${GREEN}✓ Backend restarted${NC}"

# Wait for backend to be ready
echo ""
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 5

# Test configuration
echo ""
echo -e "${YELLOW}Testing Accurate configuration...${NC}"
docker exec iware-backend-prod node src/scripts/test-accurate-connection.js || true

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Buka aplikasi: http://localhost"
echo "2. Login dengan akun admin"
echo "3. Buka halaman Settings/Integrasi"
echo "4. Klik 'Connect to Accurate'"
echo "5. Authorize aplikasi di Accurate Online"
echo ""
echo "Atau dapatkan authorization URL:"
echo "  curl http://localhost/api/accurate/auth-url"
echo ""
echo "Dokumentasi lengkap: ACCURATE-INTEGRATION.md"
echo ""
