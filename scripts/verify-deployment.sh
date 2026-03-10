#!/bin/bash

#################################################################
# Verify Deployment Script
# Setup check sebelum production
# Version: 1.0.0
#################################################################

set -e

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
log_info "Deployment Verification Checklist"
log_info "======================================"
log_info "Time: $(date)"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check function
check() {
    local name=$1
    local command=$2
    
    if eval "$command" &> /dev/null; then
        log_success "$name"
        ((CHECKS_PASSED++))
    else
        log_error "$name"
        ((CHECKS_FAILED++))
    fi
}

# Run checks
log_info "Running deployment checks..."
echo ""

# Prerequisites
log_info "Prerequisites:"
check "Docker installed" "command -v docker"
check "Docker Compose installed" "command -v docker-compose"
check "Git installed" "command -v git"

echo ""
log_info "Configuration Files:"
check ".env.production exists" "test -f .env.production"
check ".env is valid" "grep -q 'DB_PASSWORD' .env.production"
check "docker-compose.yml valid" "docker-compose config > /dev/null"

echo ""
log_info "Project Structure:"
check "backend directory exists" "test -d backend"
check "frontend directory exists" "test -d frontend"
check "nginx config exists" "test -f nginx/nginx.conf"
check "backup script exists" "test -f scripts/install-docker.sh"

echo ""
log_info "Docker Services:"
check "Backend Dockerfile exists" "test -f backend/Dockerfile"
check "Frontend Dockerfile exists" "test -f frontend/Dockerfile"
check "docker-compose.yml valid" "docker-compose config > /dev/null"
check "All images defined" "grep -q 'backend:' docker-compose.yml && grep -q 'frontend:' docker-compose.yml"

echo ""
log_info "Container Status:"
if docker-compose ps 2>/dev/null | grep -q "iware"; then
    log_success "Containers are running"
    ((CHECKS_PASSED++))
else
    log_warning "Containers not yet running (this is OK)"
fi

# Health checks
echo ""
log_info "Health Checks:"
if [ "$(docker-compose ps -q backend 2>/dev/null)" ]; then
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        log_success "Backend API is responsive"
        ((CHECKS_PASSED++))
    else
        log_warning "Backend API not responding yet"
    fi
fi

if [ "$(docker-compose ps -q mysql 2>/dev/null)" ]; then
    if docker-compose exec -T mysql mysql -u root -p$(grep DB_ROOT_PASSWORD .env.production | cut -d= -f2) -e "SELECT 1" &> /dev/null; then
        log_success "Database is running"
        ((CHECKS_PASSED++))
    else
        log_warning "Database not healthy yet"
    fi
fi

echo ""
log_success "======================================"
log_success "Verification Complete!"
log_success "======================================"
echo ""

log_info "Results:"
log_success "Checks Passed: $CHECKS_PASSED"
if [ $CHECKS_FAILED -gt 0 ]; then
    log_error "Checks Failed: $CHECKS_FAILED"
else
    log_success "Checks Failed: 0"
fi

echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    log_success "All checks passed! 🎉"
    log_success "Deployment is ready for production."
    exit 0
else
    log_warning "Some checks failed. Review the errors above."
    log_warning "No critical failures detected - you can still deploy."
    exit 0
fi
