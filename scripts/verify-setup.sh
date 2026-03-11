#!/bin/bash

# =================================
# Setup Verification Script
# =================================

echo "=========================================="
echo "iWare Warehouse - Setup Verification"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ - MISSING"
        ((ERRORS++))
    fi
}

# Function to check script is executable
check_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 (executable)"
    else
        echo -e "${YELLOW}⚠${NC} $1 (not executable - run: chmod +x $1)"
        ((WARNINGS++))
    fi
}

echo ""
echo "Checking Documentation Files..."
echo "----------------------------------------"
check_file "README.md"
check_file "DEPLOYMENT.md"
check_file "QUICK-START.md"
check_file "STRUCTURE.md"
check_file "COMMANDS.md"
check_file "TROUBLESHOOTING.md"
check_file "CHECKLIST.md"
check_file "PRODUCTION-TIPS.md"
check_file "WINDOWS-GUIDE.md"
check_file "SUMMARY.md"
check_file "INDEX.md"

echo ""
echo "Checking Docker Files..."
echo "----------------------------------------"
check_file "docker-compose.yml"
check_file ".dockerignore"
check_file "backend/Dockerfile"
check_file "frontend/Dockerfile"

echo ""
echo "Checking Configuration Files..."
echo "----------------------------------------"
check_file ".env.production"
check_file ".gitignore"
check_file ".gitattributes"

echo ""
echo "Checking Nginx Configuration..."
echo "----------------------------------------"
check_dir "nginx"
check_file "nginx/nginx.conf"
check_dir "nginx/conf.d"
check_file "nginx/conf.d/default.conf"

echo ""
echo "Checking Scripts Directory..."
echo "----------------------------------------"
check_dir "scripts"
check_file "scripts/deploy.sh"
check_file "scripts/setup-vps.sh"
check_file "scripts/restart.sh"
check_file "scripts/update.sh"
check_file "scripts/backup.sh"
check_file "scripts/clean.sh"
check_file "scripts/init-database.sh"
check_file "scripts/health-check.sh"
check_file "scripts/logs.sh"
check_file "scripts/monitor.sh"
check_file "scripts/debug.sh"
check_file "scripts/test-connection.sh"
check_file "scripts/setup-ssl.sh"
check_file "scripts/verify-setup.sh"

echo ""
echo "Checking Script Permissions..."
echo "----------------------------------------"
if [ -d "scripts" ]; then
    for script in scripts/*.sh; do
        check_executable "$script"
    done
fi

echo ""
echo "Checking Backend Structure..."
echo "----------------------------------------"
check_dir "backend"
check_dir "backend/src"
check_dir "backend/database"
check_file "backend/package.json"
check_file "backend/server.js"
check_file "backend/.env.example"

echo ""
echo "Checking Frontend Structure..."
echo "----------------------------------------"
check_dir "frontend"
check_dir "frontend/src"
check_file "frontend/package.json"
check_file "frontend/index.html"

echo ""
echo "Checking Environment Variables..."
echo "----------------------------------------"
if [ -f ".env.production" ]; then
    echo -e "${BLUE}Checking .env.production content...${NC}"
    
    # Check critical variables
    if grep -q "MYSQL_ROOT_PASSWORD=your_strong_root_password_change_me" .env.production; then
        echo -e "${RED}✗${NC} MYSQL_ROOT_PASSWORD still has default value"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} MYSQL_ROOT_PASSWORD configured"
    fi
    
    if grep -q "JWT_SECRET=your_jwt_secret" .env.production; then
        echo -e "${RED}✗${NC} JWT_SECRET still has default value"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} JWT_SECRET configured"
    fi
    
    if grep -q "REDIS_PASSWORD=your_strong_redis_password_change_me" .env.production; then
        echo -e "${RED}✗${NC} REDIS_PASSWORD still has default value"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} REDIS_PASSWORD configured"
    fi
fi

echo ""
echo "Checking Docker Compose Configuration..."
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    docker --version
    
    if command -v docker compose &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker Compose is installed"
        docker compose version
        
        # Validate docker-compose.yml
        if docker compose config > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} docker-compose.yml is valid"
        else
            echo -e "${RED}✗${NC} docker-compose.yml has errors"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠${NC} Docker Compose not found"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker not installed (OK if running on Windows)"
    ((WARNINGS++))
fi

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your setup is complete and ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Review and configure .env.production"
    echo "2. Upload files to VPS"
    echo "3. Run ./scripts/deploy.sh on VPS"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Your setup is mostly complete."
    echo "Review warnings above and fix if needed."
    echo ""
else
    echo -e "${RED}✗ Setup incomplete with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before deployment."
    echo ""
fi

echo "For detailed guides, see:"
echo "  - INDEX.md for documentation index"
echo "  - QUICK-START.md for quick deployment"
echo "  - DEPLOYMENT.md for detailed deployment"
echo "  - WINDOWS-GUIDE.md if using Windows"
echo ""

exit $ERRORS
