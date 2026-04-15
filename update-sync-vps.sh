#!/bin/bash

# Script untuk update sync interval di VPS
# Usage: ./update-sync-vps.sh

set -e

echo "=========================================="
echo "Update Sync Interval to 1 Minute"
echo "=========================================="
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fungsi untuk print dengan warna
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Deteksi environment
print_info "Detecting environment..."

# Cek apakah menggunakan Docker
if command -v docker &> /dev/null && docker ps | grep -q mysql; then
    USING_DOCKER=true
    print_success "Docker detected"
    
    # Cari container MySQL
    MYSQL_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i mysql | head -n 1)
    if [ -z "$MYSQL_CONTAINER" ]; then
        print_error "MySQL container not found"
        exit 1
    fi
    print_info "MySQL container: $MYSQL_CONTAINER"
else
    USING_DOCKER=false
    print_success "Standalone MySQL detected"
fi

# Cek apakah file SQL ada
SQL_FILE="backend/database/update-sync-interval.sql"
if [ ! -f "$SQL_FILE" ]; then
    print_error "SQL file not found: $SQL_FILE"
    print_info "Creating SQL file..."
    
    mkdir -p backend/database
    cat > "$SQL_FILE" << 'EOF'
-- Update sync interval menjadi 1 menit (60 detik)
UPDATE sync_config 
SET sync_interval_seconds = 60,
    auto_sync_enabled = TRUE
WHERE id = 1;

-- Verifikasi perubahan
SELECT 
    id,
    auto_sync_enabled,
    sync_interval_seconds,
    CONCAT(FLOOR(sync_interval_seconds / 60), ' menit ', MOD(sync_interval_seconds, 60), ' detik') as interval_readable,
    last_sync_items,
    last_sync_sales_orders,
    last_sync_status
FROM sync_config 
WHERE id = 1;
EOF
    print_success "SQL file created"
fi

# Minta input database credentials
echo ""
print_info "Database Configuration"
read -p "Database name [iware_warehouse]: " DB_NAME
DB_NAME=${DB_NAME:-iware_warehouse}

read -p "Database user [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Database password: " DB_PASSWORD
echo ""

# Backup konfigurasi lama (optional)
echo ""
print_info "Backing up current configuration..."

if [ "$USING_DOCKER" = true ]; then
    docker exec "$MYSQL_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT * FROM sync_config WHERE id = 1;" > sync_config_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true
else
    mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT * FROM sync_config WHERE id = 1;" > sync_config_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true
fi

print_success "Backup created (if table exists)"

# Jalankan SQL script
echo ""
print_info "Updating sync interval..."

if [ "$USING_DOCKER" = true ]; then
    cat "$SQL_FILE" | docker exec -i "$MYSQL_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
else
    mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"
fi

if [ $? -eq 0 ]; then
    print_success "Sync interval updated successfully!"
else
    print_error "Failed to update sync interval"
    exit 1
fi

# Restart backend
echo ""
print_info "Restarting backend service..."

# Deteksi service manager
if command -v pm2 &> /dev/null; then
    print_info "Using PM2..."
    pm2 restart backend 2>/dev/null || pm2 restart all
    print_success "Backend restarted via PM2"
elif [ "$USING_DOCKER" = true ]; then
    print_info "Using Docker Compose..."
    if [ -f "docker-compose.yml" ]; then
        docker-compose restart backend
        print_success "Backend restarted via Docker Compose"
    else
        docker restart $(docker ps -qf "name=backend")
        print_success "Backend container restarted"
    fi
elif systemctl list-units --type=service | grep -q iware; then
    print_info "Using systemd..."
    sudo systemctl restart iware-backend
    print_success "Backend restarted via systemd"
else
    print_error "Could not detect service manager"
    print_info "Please restart backend manually"
fi

# Verifikasi
echo ""
print_info "Verifying changes..."
sleep 2

if [ "$USING_DOCKER" = true ]; then
    docker exec "$MYSQL_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT auto_sync_enabled, sync_interval_seconds, CONCAT(FLOOR(sync_interval_seconds / 60), ' menit') as interval FROM sync_config WHERE id = 1;"
else
    mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT auto_sync_enabled, sync_interval_seconds, CONCAT(FLOOR(sync_interval_seconds / 60), ' menit') as interval FROM sync_config WHERE id = 1;"
fi

echo ""
print_success "Update completed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Monitor logs: tail -f backend/logs/all-*.log | grep -i sync"
echo "  2. Check auto sync is running every 1 minute"
echo "  3. Verify schedule TV updates faster"
echo ""
print_info "Auto sync will now run every 1 minute instead of 5 minutes"
print_info "Changes in Accurate will be reflected in max 1.5 minutes"
echo ""
