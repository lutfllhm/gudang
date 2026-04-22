#!/bin/bash

# ================================
# Monitoring Script
# ================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "================================"
echo "iWare System Monitor"
echo "================================"
echo ""

# Container Status
echo -e "${YELLOW}Container Status:${NC}"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Resource Usage
echo -e "${YELLOW}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# Disk Usage
echo -e "${YELLOW}Disk Usage:${NC}"
docker system df
echo ""

# Health Checks
echo -e "${YELLOW}Health Checks:${NC}"

# Backend
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "Backend API: ${GREEN}✓ Healthy${NC}"
else
    echo -e "Backend API: ${RED}✗ Unhealthy${NC}"
fi

# Frontend
if curl -f -s http://localhost/ > /dev/null; then
    echo -e "Frontend: ${GREEN}✓ Healthy${NC}"
else
    echo -e "Frontend: ${RED}✗ Unhealthy${NC}"
fi

# MySQL
if docker exec iware-mysql-prod mysqladmin ping -h localhost --silent > /dev/null 2>&1; then
    echo -e "MySQL: ${GREEN}✓ Healthy${NC}"
else
    echo -e "MySQL: ${RED}✗ Unhealthy${NC}"
fi

# Redis
if docker exec iware-redis-prod redis-cli ping > /dev/null 2>&1; then
    echo -e "Redis: ${GREEN}✓ Healthy${NC}"
else
    echo -e "Redis: ${RED}✗ Unhealthy${NC}"
fi

echo ""
echo "================================"
