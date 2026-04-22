# ================================
# PRODUCTION ENVIRONMENT
# Domain: iwareid.com
# ================================

# =================================
# APPLICATION
# =================================
NODE_ENV=production
PORT=5000
APP_NAME=iWare Warehouse

# =================================
# DATABASE - MySQL
# =================================
DB_HOST=mysql
DB_PORT=3306
DB_USER=iware_user
DB_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT_MINIMAL_16_KARAKTER
DB_NAME=iware_warehouse
DB_ROOT_PASSWORD=GANTI_DENGAN_ROOT_PASSWORD_KUAT_MINIMAL_16_KARAKTER
DB_CONNECTION_LIMIT=20

# =================================
# REDIS CACHE
# =================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=GANTI_DENGAN_REDIS_PASSWORD_KUAT_MINIMAL_16_KARAKTER
REDIS_DB=0

# =================================
# JWT SECRETS
# =================================
# Generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=GANTI_DENGAN_JWT_SECRET_64_KARAKTER_RANDOM
JWT_REFRESH_SECRET=GANTI_DENGAN_REFRESH_SECRET_64_KARAKTER_RANDOM
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# =================================
# ACCURATE ONLINE API
# =================================
# Dapatkan dari: https://account.accurate.id/developer
ACCURATE_APP_KEY=your_accurate_app_key_from_developer_portal
ACCURATE_CLIENT_ID=your_accurate_client_id_from_developer_portal
ACCURATE_CLIENT_SECRET=your_accurate_client_secret_from_developer_portal

# PENTING: Redirect URI untuk domain iwareid.com
# Daftarkan URL ini di Accurate Developer Portal
ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback

ACCURATE_SIGNATURE_SECRET=your_accurate_signature_secret_from_developer_portal

# Kosongkan, akan diisi otomatis setelah OAuth
ACCURATE_ACCESS_TOKEN=
ACCURATE_DATABASE_ID=

# =================================
# CORS CONFIGURATION
# =================================
# Domain iwareid.com dengan dan tanpa www
CORS_ORIGIN=https://iwareid.com,https://www.iwareid.com
CORS_CREDENTIALS=true

# =================================
# FRONTEND API URL
# =================================
# URL API untuk frontend (akan di-embed saat build)
VITE_API_URL=https://iwareid.com/api

# =================================
# RATE LIMITING
# =================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =================================
# LOGGING
# =================================
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d

# =================================
# SYNC CONFIGURATION
# =================================
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=300
SYNC_BATCH_SIZE=100

# =================================
# WEBHOOK
# =================================
WEBHOOK_SECRET=GANTI_DENGAN_WEBHOOK_SECRET_KUAT_MINIMAL_32_KARAKTER

# =================================
# TTS (Optional - ElevenLabs)
# =================================
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL=eleven_multilingual_v2
