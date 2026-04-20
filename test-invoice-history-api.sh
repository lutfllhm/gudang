#!/bin/bash

# Script untuk test API histori faktur penjualan
# Usage: ./test-invoice-history-api.sh [token]

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_HOST="212.85.26.166"
API_URL="http://$VPS_HOST:3000"

# Check if token provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Token not provided. Getting token first...${NC}"
    echo -e "${BLUE}Please enter admin username:${NC}"
    read -r USERNAME
    echo -e "${BLUE}Please enter admin password:${NC}"
    read -rs PASSWORD
    
    # Login to get token
    echo -e "\n${YELLOW}Logging in...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ Failed to get token${NC}"
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Token obtained${NC}"
else
    TOKEN=$1
    echo -e "${GREEN}Using provided token${NC}"
fi

echo ""
echo "=========================================="
echo "Testing Invoice History API"
echo "=========================================="

# Test 1: Health check
echo -e "\n${YELLOW}[1/5] Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if echo $HEALTH_RESPONSE | grep -q "ok"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 2: Get recent history
echo -e "\n${YELLOW}[2/5] Testing GET /api/sales-invoice-history/recent...${NC}"
RECENT_RESPONSE=$(curl -s -X GET "$API_URL/api/sales-invoice-history/recent?limit=5" \
    -H "Authorization: Bearer $TOKEN")

if echo $RECENT_RESPONSE | grep -q "success"; then
    echo -e "${GREEN}✓ Get recent history successful${NC}"
    echo "Response:"
    echo $RECENT_RESPONSE | python3 -m json.tool 2>/dev/null || echo $RECENT_RESPONSE
else
    echo -e "${RED}✗ Get recent history failed${NC}"
    echo "Response: $RECENT_RESPONSE"
fi

# Test 3: Get history by status
echo -e "\n${YELLOW}[3/5] Testing GET /api/sales-invoice-history/status/...${NC}"
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/sales-invoice-history/status/Sebagian%20diproses?limit=5" \
    -H "Authorization: Bearer $TOKEN")

if echo $STATUS_RESPONSE | grep -q "success"; then
    echo -e "${GREEN}✓ Get history by status successful${NC}"
    echo "Response:"
    echo $STATUS_RESPONSE | python3 -m json.tool 2>/dev/null || echo $STATUS_RESPONSE
else
    echo -e "${RED}✗ Get history by status failed${NC}"
    echo "Response: $STATUS_RESPONSE"
fi

# Test 4: Manual sync (optional - commented out by default)
echo -e "\n${YELLOW}[4/5] Testing POST /api/sales-invoice-history/sync...${NC}"
echo -e "${BLUE}Do you want to trigger manual sync? (y/n)${NC}"
read -r SYNC_CONFIRM

if [ "$SYNC_CONFIRM" = "y" ] || [ "$SYNC_CONFIRM" = "Y" ]; then
    SYNC_RESPONSE=$(curl -s -X POST "$API_URL/api/sales-invoice-history/sync" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "startDate": "2026-01-01",
            "endDate": "2026-12-31",
            "pageSize": 100
        }')
    
    if echo $SYNC_RESPONSE | grep -q "success"; then
        echo -e "${GREEN}✓ Manual sync successful${NC}"
        echo "Response:"
        echo $SYNC_RESPONSE | python3 -m json.tool 2>/dev/null || echo $SYNC_RESPONSE
    else
        echo -e "${RED}✗ Manual sync failed${NC}"
        echo "Response: $SYNC_RESPONSE"
    fi
else
    echo -e "${YELLOW}Skipped manual sync${NC}"
fi

# Test 5: Get history by order ID (if available)
echo -e "\n${YELLOW}[5/5] Testing GET /api/sales-invoice-history/order/:orderId...${NC}"
echo -e "${BLUE}Enter order ID to test (or press Enter to skip):${NC}"
read -r ORDER_ID

if [ ! -z "$ORDER_ID" ]; then
    ORDER_RESPONSE=$(curl -s -X GET "$API_URL/api/sales-invoice-history/order/$ORDER_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo $ORDER_RESPONSE | grep -q "success"; then
        echo -e "${GREEN}✓ Get history by order ID successful${NC}"
        echo "Response:"
        echo $ORDER_RESPONSE | python3 -m json.tool 2>/dev/null || echo $ORDER_RESPONSE
    else
        echo -e "${RED}✗ Get history by order ID failed${NC}"
        echo "Response: $ORDER_RESPONSE"
    fi
else
    echo -e "${YELLOW}Skipped order ID test${NC}"
fi

echo -e "\n${GREEN}=========================================="
echo "✓ API Testing completed!"
echo "==========================================${NC}"
echo ""
echo "Your token (save for future use):"
echo "$TOKEN"
