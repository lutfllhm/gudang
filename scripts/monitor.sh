#!/bin/bash

# =================================
# iWare Warehouse Monitor Script
# =================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Clear screen
clear

echo "=========================================="
echo "iWare Warehouse - Real-time Monitor"
echo "=========================================="
echo "Press Ctrl+C to exit"
echo ""

while true; do
    # Move cursor to top
    tput cup 4 0
    
    # Container status
    echo "Container Status:"
    echo "----------------------------------------"
    docker compose ps
    
    echo ""
    echo "Resource Usage:"
    echo "----------------------------------------"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    
    echo ""
    echo "Disk Usage:"
    echo "----------------------------------------"
    docker system df
    
    echo ""
    echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Wait 5 seconds
    sleep 5
done
