#!/bin/bash

# =================================
# iWare Warehouse Health Check
# =================================

echo "=========================================="
echo "iWare Warehouse - Health Check"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check container status
echo ""
echo "Container Status:"
echo "----------------------------------------"
docker-compose ps

# Check MySQL
echo ""
echo "MySQL Health:"
echo "----------------------------------------"
MYSQL_STATUS=$(docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} 2>&1)
if [[ $MYSQL_STATUS == *"mysqld is alive"* ]]; then
    echo -e "${GREEN}✓ MySQL is healthy${NC}"
else
    echo -e "${RED}✗ MySQL is unhealthy${NC}"
fi

# Check Redis
echo ""
echo "Redis Health:"
echo "----------------------------------------"
REDIS_STATUS=$(docker-compose exec -T redis redis-cli -a ${REDIS_PASSWORD} ping 2>&1)
if [[ $REDIS_STATUS == *"PONG"* ]]; then
    echo -e "${GREEN}✓ Redis is healthy${NC}"
else
    echo -e "${RED}✗ Redis is unhealthy${NC}"
fi

# Check Backend
echo ""
echo "Backend Health:"
echo "----------------------------------------"
BACKEND_STATUS=$(curl -s http://localhost:5000/health)
if [[ $BACKEND_STATUS == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    echo "$BACKEND_STATUS" | jq '.' 2>/dev/null || echo "$BACKEND_STATUS"
else
    echo -e "${RED}✗ Backend is unhealthy${NC}"
fi

# Check Frontend
echo ""
echo "Frontend Health:"
echo "----------------------------------------"
FRONTEND_STATUS=$(curl -s http://localhost:3000/health)
if [[ $FRONTEND_STATUS == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend is unhealthy${NC}"
fi

# Check Nginx
echo ""
echo "Nginx Health:"
echo "----------------------------------------"
NGINX_STATUS=$(curl -s http://localhost:80/health)
if [[ $NGINX_STATUS == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Nginx is healthy${NC}"
else
    echo -e "${RED}✗ Nginx is unhealthy${NC}"
fi

echo ""
echo "=========================================="
echo "Health Check Completed"
echo "=========================================="
