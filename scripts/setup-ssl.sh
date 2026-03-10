#!/bin/bash

#################################################################
# Setup SSL dengan Let's Encrypt & Certbot
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

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log_info "======================================"
log_info "Setup SSL dengan Let's Encrypt"
log_info "======================================"
echo ""

# Ask for domain
read -p "Masukkan domain Anda (contoh: example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    log_error "Domain tidak boleh kosong"
    exit 1
fi

read -p "Masukkan email untuk notifikasi SSL: " EMAIL
if [ -z "$EMAIL" ]; then
    log_error "Email tidak boleh kosong"
    exit 1
fi

log_info "Domain: $DOMAIN"
log_info "Email: $EMAIL"
echo ""

# Install Certbot
log_info "Step 1: Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx
log_success "Certbot installed"

# Create SSL directory
log_info "Step 2: Creating SSL directory..."
mkdir -p $PROJECT_DIR/ssl
chmod 755 $PROJECT_DIR/ssl
log_success "SSL directory created"

# Generate certificate
log_info "Step 3: Generating SSL certificate..."
log_warning "Pastikan port 80 dan 443 terbuka di firewall!"
log_warning "Pastikan domain sudah pointing ke IP VPS Anda!"

certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive

if [ $? -eq 0 ]; then
    log_success "SSL certificate generated"
else
    log_error "Failed to generate SSL certificate"
    exit 1
fi

# Copy certificates to project directory
log_info "Step 4: Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROJECT_DIR/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $PROJECT_DIR/ssl/
chmod 644 $PROJECT_DIR/ssl/*.pem
log_success "Certificates copied"

# Update Nginx config
log_info "Step 5: Updating Nginx configuration..."

# Backup existing config
cp $PROJECT_DIR/nginx/conf.d/default.conf $PROJECT_DIR/nginx/conf.d/default.conf.bak

# Create new Nginx config with SSL
cat > $PROJECT_DIR/nginx/conf.d/ssl.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    # Health check endpoint (no redirect)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!3DES;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # HSTS Header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

log_success "Nginx configuration updated"

# Reload Docker Compose to apply new config
log_info "Step 6: Reloading Nginx..."
cd $PROJECT_DIR
docker-compose restart nginx
log_success "Nginx reloaded"

# Setup auto-renewal
log_info "Step 7: Setting up certificate auto-renewal..."
cat > /etc/cron.d/certbot << 'EOF'
0 12 * * * /usr/bin/certbot renew --quiet
5 12 * * * cd /path/to/project && docker-compose exec -T nginx nginx -s reload
EOF
sed -i "s|/path/to/project|$PROJECT_DIR|g" /etc/cron.d/certbot
chmod 644 /etc/cron.d/certbot
log_success "Auto-renewal setup complete"

echo ""
log_success "======================================"
log_success "SSL Setup Complete!"
log_success "======================================"
echo ""

log_info "SSL Certificate Details:"
certbot certificates -d $DOMAIN || true

echo ""
log_warning "IMPORTANT:"
log_warning "1. Certificate akan auto-renew setiap hari"
log_warning "2. Test renewal: sudo certbot renew --dry-run"
log_warning "3. Check status: sudo certbot certificates"
log_warning "4. Your domain should now be accessible via HTTPS"
echo ""

log_success "SSL setup ready! 🔒"
