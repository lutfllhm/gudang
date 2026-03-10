#!/bin/bash

#################################################################
# Install Docker & Docker Compose on Ubuntu/Debian
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

log_info "======================================"
log_info "Install Docker & Docker Compose"
log_info "======================================"
log_info ""

# Update system
log_info "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y
log_success "System packages updated"

# Install required dependencies
log_info "Step 2: Installing dependencies..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    wget \
    git \
    htop \
    unzip
log_success "Dependencies installed"

# Add Docker GPG key
log_info "Step 3: Adding Docker GPG key..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --batch --yes --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
log_success "Docker GPG key added"

# Add Docker repository
log_info "Step 4: Adding Docker repository..."
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
log_success "Docker repository added"

# Install Docker
log_info "Step 5: Installing Docker..."
apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-compose-plugin
log_success "Docker installed: $(docker --version)"

# Install Docker Compose standalone
log_info "Step 6: Installing Docker Compose standalone..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
log_success "Docker Compose installed: $(docker-compose --version)"

# Add current user to docker group
log_info "Step 7: Configuring Docker permissions..."
usermod -aG docker $SUDO_USER || true
log_success "Docker permissions configured"

# Enable Docker service
log_info "Step 8: Enabling Docker service..."
systemctl enable docker
systemctl start docker
log_success "Docker service enabled and started"

# Verify installation
log_info "Step 9: Verifying installation..."
docker --version
docker-compose --version
log_success "Installation verified"

# Test Docker
log_info "Step 10: Testing Docker..."
docker run --rm hello-world > /dev/null 2>&1
log_success "Docker test passed"

echo ""
log_success "======================================"
log_success "Installation Complete!"
log_success "======================================"
echo ""

log_warning "IMPORTANT NOTES:"
log_warning "1. You may need to log out and log back in to use Docker without sudo"
log_warning "2. Or run: newgrp docker"
log_warning "3. To start deployment, run: sudo bash deploy.sh"
echo ""

log_success "Ready for deployment! 🚀"
