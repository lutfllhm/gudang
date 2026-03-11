#!/bin/bash

# Deploy to Production VPS
# Usage: ./scripts/deploy-production.sh

set -e

echo "🚀 Starting deployment to production..."

# Configuration
VPS_HOST="148.230.100.44"
VPS_USER="root"
VPS_PATH="/var/www/gudang"
ENV_FILE=".env.production.local"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "Please create $ENV_FILE with your production configuration"
    exit 1
fi

echo "📦 Uploading environment file..."
scp "$ENV_FILE" "$VPS_USER@$VPS_HOST:$VPS_PATH/.env.production"

echo "📤 Pulling latest code on VPS..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
git pull origin main
ENDSSH

echo "🔨 Building and starting containers..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
docker-compose down
docker-compose build --no-cache
docker-compose up -d
ENDSSH

echo "⏳ Waiting for services to be healthy..."
sleep 30

echo "🔍 Checking service status..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/gudang
docker-compose ps
echo ""
echo "📋 Backend logs:"
docker-compose logs --tail=50 backend
ENDSSH

echo "✅ Deployment completed!"
echo "🌐 Check your application at: https://iwareid.com"
