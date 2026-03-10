#!/bin/bash

#################################################################
# Monitoring & Health Check Script
# Version: 1.0.0
#################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

log_info "======================================"
log_info "iWare Health Check Monitor"
log_info "======================================"
log_info "Time: $(date)"
echo ""

# Check Docker containers
log_info "Checking Docker containers..."
docker-compose ps

echo ""
log_info "Container Health Status:"
CONTAINERS=$(docker-compose ps --quiet)
for container in $CONTAINERS; do
    NAME=$(docker inspect -f '{{.Name}}' $container | sed 's/^\///')
    STATE=$(docker inspect -f '{{.State.Status}}' $container)
    HEALTH=$(docker inspect -f '{{.State.Health.Status}}' $container 2>/dev/null || echo "N/A")
    
    if [ "$STATE" = "running" ]; then
        log_success "$NAME: $STATE (Health: $HEALTH)"
    else
        log_error "$NAME: $STATE (Health: $HEALTH)"
    fi
done

echo ""
log_info "Checking connectivity..."

# Check API health
if curl -s -f http://localhost/api/health > /dev/null 2>&1; then
    log_success "Backend API: Responsive ✓"
else
    log_error "Backend API: Not responsive ✗"
fi

# Check Frontend
if curl -s -f http://localhost/ > /dev/null 2>&1; then
    log_success "Frontend: Responsive ✓"
else
    log_error "Frontend: Not responsive ✗"
fi

# Check MySQL
if docker-compose exec -T mysql mysql -u root -p$(grep DB_ROOT_PASSWORD .env.production | cut -d= -f2) -e "SELECT 1" &> /dev/null; then
    log_success "MySQL: Running ✓"
else
    log_error "MySQL: Not responding ✗"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping &> /dev/null; then
    log_success "Redis: Running ✓"
else
    log_error "Redis: Not responding ✗"
fi

echo ""
log_info "Checking disk space..."
df -h | grep -E "Filesystem|/dev/"

echo ""
log_info "Recent error logs (if any)..."
docker-compose logs --tail=5 --timestamps 2>/dev/null | grep -i "error" || log_success "No recent errors found"

echo ""
log_success "======================================"
log_success "Health check complete"
log_success "======================================"
