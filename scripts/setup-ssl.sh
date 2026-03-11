#!/bin/bash

# =================================
# SSL Certificate Setup Script
# =================================

set -e

echo "=========================================="
echo "SSL Certificate Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Get domain
read -p "Enter your domain (e.g., iwareid.com): " DOMAIN
read -p "Enter your email: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Domain and email are required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Installing Certbot...${NC}"
apt update
apt install -y certbot python3-certbot-nginx

echo ""
echo -e "${YELLOW}Stopping Nginx container...${NC}"
cd /var/www/iware-warehouse
docker compose stop nginx

echo ""
echo -e "${YELLOW}Generating SSL certificate...${NC}"
certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

echo ""
echo -e "${YELLOW}Copying certificates...${NC}"
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
chmod 644 nginx/ssl/*.pem

echo ""
echo -e "${YELLOW}Setting up auto-renewal...${NC}"

# Create renewal script
cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
DOMAIN=$(ls /etc/letsencrypt/live/ | head -n 1)
cp /etc/letsencrypt/live/$DOMAIN/*.pem /var/www/iware-warehouse/nginx/ssl/
cd /var/www/iware-warehouse
docker compose restart nginx
EOF

chmod +x /usr/local/bin/renew-ssl.sh

# Add cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/renew-ssl.sh") | crontab -

echo ""
echo -e "${YELLOW}Updating Nginx configuration...${NC}"
echo -e "${YELLOW}Please uncomment HTTPS server block in nginx/conf.d/default.conf${NC}"
echo -e "${YELLOW}Then run: docker compose up -d nginx${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}SSL Setup Completed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit nginx/conf.d/default.conf"
echo "2. Uncomment HTTPS server block"
echo "3. Run: docker compose up -d nginx"
echo ""
echo "Certificate location: nginx/ssl/"
echo "Auto-renewal: Daily at 2 AM"
echo ""
