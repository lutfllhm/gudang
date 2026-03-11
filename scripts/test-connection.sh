#!/bin/bash

# =================================
# Connection Test Script
# =================================

echo "=========================================="
echo "Testing Connections"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo ""
echo "Testing MySQL Connection..."
echo "----------------------------------------"
if docker compose exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} 2>&1 | grep -q "mysqld is alive"; then
    echo -e "${GREEN}✓ MySQL connection successful${NC}"
    
    # Test database
    if docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${DB_NAME};" 2>&1 | grep -q "Database changed"; then
        echo -e "${GREEN}✓ Database '${DB_NAME}' exists${NC}"
    else
        echo -e "${RED}✗ Database '${DB_NAME}' not found${NC}"
    fi
else
    echo -e "${RED}✗ MySQL connection failed${NC}"
fi

echo ""
echo "Testing Redis Connection..."
echo "----------------------------------------"
if docker compose exec -T redis redis-cli -a ${REDIS_PASSWORD} ping 2>&1 | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis connection successful${NC}"
else
    echo -e "${RED}✗ Redis connection failed${NC}"
fi

echo ""
echo "Testing Backend API..."
echo "----------------------------------------"
BACKEND_RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$BACKEND_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
    echo "$BACKEND_RESPONSE" | jq '.' 2>/dev/null || echo "$BACKEND_RESPONSE"
else
    echo -e "${RED}✗ Backend API is not responding${NC}"
fi

echo ""
echo "Testing Frontend..."
echo "----------------------------------------"
if curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
fi

echo ""
echo "Testing Nginx..."
echo "----------------------------------------"
if curl -s http://localhost:80/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Nginx is responding${NC}"
else
    echo -e "${RED}✗ Nginx is not responding${NC}"
fi

echo ""
echo "Testing Backend through Nginx..."
echo "----------------------------------------"
NGINX_BACKEND=$(curl -s http://localhost:80/api/health)
if echo "$NGINX_BACKEND" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend accessible through Nginx${NC}"
else
    echo -e "${RED}✗ Backend not accessible through Nginx${NC}"
fi

echo ""
echo "=========================================="
echo "Connection Test Completed"
echo "=========================================="
