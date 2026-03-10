#!/bin/bash

#################################################################
# Setup Systemd service untuk auto-restart containers
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

if [ "$EUID" -ne 0 ]; then 
    log_error "Script harus dijalankan dengan sudo"
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log_info "======================================"
log_info "Setup Systemd Service"
log_info "======================================"
echo ""

# Create systemd service file
log_info "Step 1: Creating systemd service file..."
cat > /etc/systemd/system/iware.service << EOF
[Unit]
Description=iWare Warehouse Management System
Documentation=https://github.com/yourorg/iware
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
WorkingDirectory=$PROJECT_DIR

# Start containers
ExecStart=/usr/bin/docker-compose -f docker-compose.yml up -d

# Stop containers
ExecStop=/usr/bin/docker-compose -f docker-compose.yml down

# Restart policy
RemainAfterExit=yes
RestartForceExitStatus=1
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

log_success "Systemd service file created"

# Set correct permissions
chmod 644 /etc/systemd/system/iware.service

# Reload systemd
log_info "Step 2: Reloading systemd daemon..."
systemctl daemon-reload
log_success "Systemd daemon reloaded"

# Enable service
log_info "Step 3: Enabling iware service..."
systemctl enable iware.service
log_success "iware service enabled at boot"

# Test service
log_info "Step 4: Testing service configuration..."
systemctl start iware.service || {
    log_error "Failed to start service"
    systemctl status iware.service || true
    exit 1
}
log_success "Service started successfully"

# Check service status
sleep 2
systemctl status iware.service || true

echo ""
log_success "======================================"
log_success "Systemd Setup Complete!"
log_success "======================================"
echo ""

log_info "Useful Commands:"
log_info "  Start service: sudo systemctl start iware"
log_info "  Stop service: sudo systemctl stop iware"
log_info "  Restart service: sudo systemctl restart iware"
log_info "  Check status: sudo systemctl status iware"
log_info "  View logs: sudo journalctl -u iware -f"
log_info "  Disable auto-start: sudo systemctl disable iware"
echo ""

log_warning "NOTES:"
log_warning "1. Service will auto-start when VPS reboots"
log_warning "2. Check logs with: sudo journalctl -u iware -f"
log_warning "3. To troubleshoot: sudo systemctl status iware -l"
echo ""

log_success "Auto-restart setup ready! 🚀"
