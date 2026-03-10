#!/bin/bash

#################################################################
# Backup Script - Database dan Important Files
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

BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log_info "======================================"
log_info "Backup Script"
log_info "======================================"
log_info "Time: $(date)"
log_info "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"

# Backup database
log_info "Backing up MySQL database..."
if docker-compose ps mysql | grep -q "healthy\|running"; then
    BACKUP_FILE="$BACKUP_DIR/mysql_backup_$TIMESTAMP.sql.gz"
    docker-compose exec -T mysql mysqldump -u root -p$(grep DB_ROOT_PASSWORD .env.production | cut -d= -f2) iware_warehouse | gzip > "$BACKUP_FILE"
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Database backup created: $BACKUP_FILE ($SIZE)"
    fi
else
    log_warning "MySQL not running, skipping database backup"
fi

# Backup environment file
log_info "Backing up environment file..."
ENV_BACKUP="$BACKUP_DIR/.env.production_$TIMESTAMP"
cp .env.production "$ENV_BACKUP"
chmod 600 "$ENV_BACKUP"
log_success "Environment backup created: $ENV_BACKUP"

# Backup docker volumes
log_info "Backing up Redis data..."
if docker-compose ps redis | grep -q "healthy\|running"; then
    REDIS_BACKUP="$BACKUP_DIR/redis_backup_$TIMESTAMP.tar.gz"
    docker run --rm -v iware_redis_data:/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/redis_backup_$TIMESTAMP.tar.gz" -C / data 2>/dev/null || true
    if [ -f "$REDIS_BACKUP" ]; then
        log_success "Redis backup created: $REDIS_BACKUP"
    fi
fi

# Cleanup old backups (keep only last 7 days)
log_info "Cleaning up old backups..."
find "$BACKUP_DIR" -type f -mtime +7 -delete
log_success "Old backups cleaned"

# List recent backups
echo ""
log_info "Recent backups:"
ls -lah "$BACKUP_DIR" | tail -10

echo ""
log_success "======================================"
log_success "Backup Complete!"
log_success "======================================"
