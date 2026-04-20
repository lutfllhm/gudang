#!/bin/bash

#############################################
# Auto Deploy Script - Sales Invoice History
# For Docker + VPS Environment
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please don't run as root"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

print_header "Sales Invoice History Deployment"
echo ""

# Confirmation
read -p "Are you sure you want to deploy? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    print_warning "Deployment cancelled"
    exit 0
fi

echo ""

#############################################
# Step 1: Backup Database
#############################################
print_header "Step 1: Backup Database"

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
print_info "Creating backup: $BACKUP_FILE"

# Get MySQL password
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

# Create backup
if docker exec iware-mysql mysqldump -u root -p"$MYSQL_PASSWORD" iware_warehouse > "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    print_error "Backup failed"
    exit 1
fi

echo ""

#############################################
# Step 2: Pull Latest Code
#############################################
print_header "Step 2: Pull Latest Code"

print_info "Pulling from Git..."
if git pull origin main; then
    print_success "Code updated"
else
    print_error "Git pull failed"
    exit 1
fi

echo ""

#############################################
# Step 3: Database Migration
#############################################
print_header "Step 3: Database Migration"

# Check if migration file exists
if [ ! -f "backend/database/add-sales-invoice-history.sql" ]; then
    print_error "Migration file not found: backend/database/add-sales-invoice-history.sql"
    exit 1
fi

print_info "Copying migration file to MySQL container..."
if docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/; then
    print_success "File copied"
else
    print_error "Failed to copy file"
    exit 1
fi

print_info "Running migration..."
if docker exec -i iware-mysql mysql -u root -p"$MYSQL_PASSWORD" iware_warehouse < backend/database/add-sales-invoice-history.sql 2>/dev/null; then
    print_success "Migration completed"
else
    print_error "Migration failed"
    print_warning "You may need to restore from backup: $BACKUP_FILE"
    exit 1
fi

# Verify migration
print_info "Verifying migration..."
TABLE_EXISTS=$(docker exec iware-mysql mysql -u root -p"$MYSQL_PASSWORD" -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';" 2>/dev/null | grep -c "sales_invoice_history" || true)

if [ "$TABLE_EXISTS" -eq 1 ]; then
    print_success "Table 'sales_invoice_history' created"
else
    print_error "Table verification failed"
    exit 1
fi

echo ""

#############################################
# Step 4: Rebuild Containers
#############################################
print_header "Step 4: Rebuild Containers"

print_info "Stopping containers..."
if docker-compose down; then
    print_success "Containers stopped"
else
    print_error "Failed to stop containers"
    exit 1
fi

print_info "Rebuilding images (this may take a few minutes)..."
if docker-compose build --no-cache; then
    print_success "Images rebuilt"
else
    print_error "Build failed"
    exit 1
fi

print_info "Starting containers..."
if docker-compose up -d; then
    print_success "Containers started"
else
    print_error "Failed to start containers"
    exit 1
fi

# Wait for containers to be ready
print_info "Waiting for containers to be ready..."
sleep 10

echo ""

#############################################
# Step 5: Verification
#############################################
print_header "Step 5: Verification"

# Check container status
print_info "Checking container status..."
BACKEND_STATUS=$(docker-compose ps backend | grep -c "Up" || true)
FRONTEND_STATUS=$(docker-compose ps frontend | grep -c "Up" || true)
MYSQL_STATUS=$(docker-compose ps mysql | grep -c "Up" || true)

if [ "$BACKEND_STATUS" -eq 1 ]; then
    print_success "Backend: Running"
else
    print_error "Backend: Not running"
fi

if [ "$FRONTEND_STATUS" -eq 1 ]; then
    print_success "Frontend: Running"
else
    print_error "Frontend: Not running"
fi

if [ "$MYSQL_STATUS" -eq 1 ]; then
    print_success "MySQL: Running"
else
    print_error "MySQL: Not running"
fi

# Check backend health
print_info "Checking backend health..."
sleep 5  # Wait a bit more for backend to be ready

HEALTH_CHECK=$(curl -s http://localhost:5000/health | grep -c "success" || true)
if [ "$HEALTH_CHECK" -eq 1 ]; then
    print_success "Backend health check: OK"
else
    print_warning "Backend health check: Failed (may need more time to start)"
fi

# Check logs for errors
print_info "Checking logs for errors..."
ERROR_COUNT=$(docker-compose logs --tail=50 backend | grep -ic "error" || true)
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_success "No errors in logs"
else
    print_warning "Found $ERROR_COUNT error(s) in logs"
    print_info "Run 'docker-compose logs backend' to see details"
fi

echo ""

#############################################
# Step 6: Summary
#############################################
print_header "Deployment Summary"

echo ""
echo "📦 Backup File: $BACKUP_FILE"
echo "🗄️  Database: Migration completed"
echo "🐳 Containers: Rebuilt and restarted"
echo "✅ Status: Deployment completed"
echo ""

print_info "Next steps:"
echo "  1. Test the application: http://your-vps-ip:3000"
echo "  2. Check logs: docker-compose logs -f backend"
echo "  3. Verify feature: Go to Sales Orders page"
echo "  4. Sync history (optional): POST /api/sales-invoice-history/sync"
echo ""

print_warning "Keep the backup file safe: $BACKUP_FILE"
echo ""

# Ask if user wants to see logs
read -p "Do you want to see backend logs? (yes/no): " show_logs
if [ "$show_logs" = "yes" ]; then
    echo ""
    print_info "Showing backend logs (Ctrl+C to exit)..."
    docker-compose logs -f backend
fi

print_success "Deployment script completed!"
