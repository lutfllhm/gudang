#!/bin/bash

# =================================
# iWare Warehouse Debug Script
# =================================

echo "=========================================="
echo "iWare Warehouse - Debug Information"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if service name is provided
SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo -e "${RED}Usage: ./debug.sh <service_name>${NC}"
    echo "Available services: mysql, redis, backend, frontend, nginx"
    exit 1
fi

echo -e "${BLUE}Debugging service: $SERVICE${NC}"
echo ""

# Container status
echo "=========================================="
echo "Container Status:"
echo "=========================================="
docker compose ps $SERVICE

# Container logs (last 100 lines)
echo ""
echo "=========================================="
echo "Recent Logs (last 100 lines):"
echo "=========================================="
docker compose logs --tail=100 $SERVICE

# Container inspect
echo ""
echo "=========================================="
echo "Container Details:"
echo "=========================================="
docker compose exec $SERVICE env 2>/dev/null || echo "Cannot access container environment"

# Health check
echo ""
echo "=========================================="
echo "Health Check:"
echo "=========================================="
case $SERVICE in
    mysql)
        docker compose exec $SERVICE mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} 2>&1
        ;;
    redis)
        docker compose exec $SERVICE redis-cli -a ${REDIS_PASSWORD} ping 2>&1
        ;;
    backend)
        docker compose exec $SERVICE wget -O- http://localhost:5000/health 2>&1
        ;;
    frontend)
        docker compose exec $SERVICE curl -f http://localhost:80/health 2>&1
        ;;
    nginx)
        docker compose exec $SERVICE nginx -t 2>&1
        ;;
esac

# Resource usage
echo ""
echo "=========================================="
echo "Resource Usage:"
echo "=========================================="
docker stats --no-stream $SERVICE

echo ""
echo "=========================================="
echo "Debug completed"
echo "=========================================="
