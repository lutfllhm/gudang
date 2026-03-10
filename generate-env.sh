#!/bin/bash

# ================================
# Generate Production Environment Variables
# ================================

echo "🔐 Generating secure environment variables..."
echo ""

# Generate secure random strings
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)

echo "✅ Generated secure passwords and secrets"
echo ""
echo "📝 Creating .env.production file..."
echo ""

cat > .env.production << EOF
# ================================
# PRODUCTION ENVIRONMENT VARIABLES
# ================================
# Auto-generated on $(date)

# MySQL Configuration
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
DB_NAME=iware_warehouse
DB_USER=iware_user
DB_PASSWORD=${DB_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRE=30d

# Accurate Online API
ACCURATE_ACCOUNT_URL=https://account.accurate.id
ACCURATE_API_URL=https://public-api.accurate.id/api
ACCURATE_APP_KEY=GANTI_DENGAN_ACCURATE_APP_KEY
ACCURATE_CLIENT_ID=GANTI_DENGAN_ACCURATE_CLIENT_ID
ACCURATE_CLIENT_SECRET=GANTI_DENGAN_ACCURATE_CLIENT_SECRET
ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback
ACCURATE_SIGNATURE_SECRET=GANTI_DENGAN_ACCURATE_SIGNATURE_SECRET
ACCURATE_ACCESS_TOKEN=GANTI_SETELAH_OAUTH_FLOW
ACCURATE_DATABASE_ID=GANTI_DENGAN_DATABASE_ID

# Auto Sync Configuration
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=300

# CORS Configuration
CORS_ORIGIN=https://iwareid.com
CORS_CREDENTIALS=true

# Domain
DOMAIN=iwareid.com
EMAIL=admin@iwareid.com

# Frontend Build Configuration
VITE_APP_NAME=iWare Warehouse
VITE_APP_VERSION=2.0.0
EOF

echo "✅ .env.production created successfully!"
echo ""
echo "⚠️  IMPORTANT: You still need to fill in Accurate API credentials:"
echo "   - ACCURATE_APP_KEY"
echo "   - ACCURATE_CLIENT_ID"
echo "   - ACCURATE_CLIENT_SECRET"
echo "   - ACCURATE_SIGNATURE_SECRET"
echo "   - ACCURATE_ACCESS_TOKEN (after OAuth flow)"
echo "   - ACCURATE_DATABASE_ID"
echo ""
echo "📋 Generated credentials (SAVE THESE SECURELY):"
echo "   MySQL Root Password: ${MYSQL_ROOT_PASSWORD}"
echo "   Database Password: ${DB_PASSWORD}"
echo ""
echo "🔒 JWT secrets have been generated and saved to .env.production"
echo ""
