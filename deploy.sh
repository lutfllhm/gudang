#!/bin/bash

#################################################################
# iWare Deployment Script
# Automated deployment dengan Docker & Docker Compose
# Author: iWare Team
# Version: 1.0.0
#################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Script harus dijalankan dengan sudo. Gunakan: sudo bash deploy.sh"
    exit 1
fi

# Get the directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

log_info "================================"
log_info "    iWare Deployment Script"
log_info "================================"
log_info "Direktori: $SCRIPT_DIR"
log_info ""

# Step 1: Check if .env.production exists
log_info "Step 1: Checking environment files..."
if [ ! -f ".env.production" ]; then
    log_error ".env.production tidak ditemukan!"
    log_info "Membuat .env.production dari .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        log_warning "File .env.production telah dibuat. Silakan edit dengan nilai production Anda!"
        log_warning "Lokasi: $SCRIPT_DIR/.env.production"
        exit 1
    else
        log_error ".env.example tidak ditemukan. Download dari repository."
        exit 1
    fi
fi
log_success ".env.production ditemukan"

# Step 2: Verify Docker & Docker Compose
log_info "Step 2: Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    log_error "Docker tidak terinstall. Jalankan install-docker.sh terlebih dahulu."
    exit 1
fi
log_success "Docker terinstall: $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose tidak terinstall. Jalankan install-docker.sh terlebih dahulu."
    exit 1
fi
log_success "Docker Compose terinstall: $(docker-compose --version)"

# Step 3: Stop existing containers
log_info "Step 3: Menghentikan container yang sedang berjalan..."
docker-compose down --remove-orphans || log_warning "Tidak ada container yang berjalan"
log_success "Container dihentikan"

# Step 4: Remove old images (optional)
log_info "Step 4: Cleaning up old images..."
docker image prune -f --filter "label!=keep" || true
log_success "Cleanup selesai"

# Step 5: Create required directories
log_info "Step 5: Membuat direktori yang diperlukan..."
mkdir -p backend/logs
mkdir -p nginx/logs
mkdir -p ssl
chmod 755 backend/logs nginx/logs ssl
log_success "Direktori sudah dibuat"

# Step 6: Build images
log_info "Step 6: Building Docker images..."
log_warning "Proses ini mungkin memakan waktu beberapa menit..."
docker-compose build --no-cache || {
    log_error "Build image gagal!"
    exit 1
}
log_success "Image berhasil dibangun"

# Step 7: Start containers
log_info "Step 7: Starting containers..."
docker-compose up -d || {
    log_error "Container gagal dijalankan!"
    exit 1
}
log_success "Containers telah dijalankan"

# Step 8: Wait for services to be healthy
log_info "Step 8: Waiting for services to be ready..."
RETRIES=30
WAIT_INTERVAL=2

for service in mysql redis backend frontend nginx; do
    log_info "Checking $service..."
    COUNTER=0
    while [ $COUNTER -lt $RETRIES ]; do
        if docker-compose ps $service | grep -q "healthy\|running"; then
            log_success "$service is ready"
            break
        fi
        
        COUNTER=$((COUNTER + 1))
        if [ $COUNTER -eq $RETRIES ]; then
            log_error "$service tidak siap setelah $((RETRIES * WAIT_INTERVAL)) detik"
            docker-compose logs $service | tail -20
            exit 1
        fi
        
        sleep $WAIT_INTERVAL
    done
done

# Step 9: Initialize database (if needed)
log_info "Step 9: Initializing database..."
sleep 5  # Give MySQL time to fully start
if docker-compose exec -T mysql mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME -e "SELECT 1" &> /dev/null; then
    log_success "Database sudah terinitialisasi"
else
    log_warning "Database initialization mungkin diperlukan"
fi

# Step 10: Display status
log_info "Step 10: Displaying container status..."
docker-compose ps

# Final status
echo ""
log_success "================================"
log_success "Deployment Berhasil!"
log_success "================================"
echo ""

log_info "Service Status:"
log_info "  Frontend: http://localhost (atau domain Anda)"
log_info "  Backend API: http://localhost/api"
log_info "  MySQL: localhost:3306"
log_info "  Redis: localhost:6379"
echo ""

log_info "Useful Commands:"
log_info "  View logs: docker-compose logs -f [service_name]"
log_info "  Stop services: docker-compose down"
log_info "  Restart services: docker-compose restart"
log_info "  Enter backend shell: docker exec -it iware-backend sh"
log_info "  Enter mysql shell: docker exec -it iware-mysql mysql -u root -p"
echo ""

log_warning "NEXT STEPS:"
log_warning "1. Setup SSL dengan Let's Encrypt: sudo bash scripts/setup-ssl.sh"
log_warning "2. Setup auto-restart: sudo bash scripts/setup-systemd.sh"
log_warning "3. Cek health: curl http://localhost/health"
log_warning "4. Monitor logs: docker-compose logs -f"
echo ""

log_success "Deployment selesai! 🎉"
