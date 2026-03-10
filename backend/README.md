# iWare Warehouse Backend v2.0 - Production Ready

## ⚠️ PENTING: Aplikasi Read-Only

**Aplikasi ini HANYA untuk melihat data dari Accurate Online.**

✅ Dapat membaca data (Items, Sales Orders, Customers)
❌ TIDAK dapat menambah, mengubah, atau menghapus data di Accurate Online

Lihat [ACCURATE_INTEGRATION.md](./ACCURATE_INTEGRATION.md) untuk detail lengkap.

## 🎯 Rebuild Goals Achieved

✅ **Clean Architecture** - Proper separation of concerns
✅ **Professional Accurate Integration** - Sesuai pedoman resmi Accurate Online
✅ **Read-Only Operations** - Hanya operasi view/list
✅ **Rate Limiting** - Maksimal 8 request/detik, 8 proses paralel
✅ **Comprehensive Logging** - Winston with daily rotation
✅ **Robust Error Handling** - Centralized error management
✅ **Input Validation** - Joi validation schemas
✅ **Security** - Rate limiting, JWT, helmet
✅ **Scalability** - Connection pooling, caching
✅ **Maintainability** - Modular, documented code

---

## 📁 Project Structure

```
backend-new/
├── src/
│   ├── config/
│   │   ├── index.js              # Central configuration
│   │   └── database.js           # Database connection pool
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Global error handler
│   │   └── rateLimiter.js        # Rate limiting
│   │
│   ├── utils/
│   │   ├── logger.js             # Winston logger
│   │   ├── retry.js              # Retry mechanism
│   │   ├── validator.js          # Joi validation
│   │   └── response.js           # Standard responses
│   │
│   ├── services/
│   │   └── accurate/
│   │       ├── TokenManager.js   # Token management
│   │       ├── ApiClient.js      # API client
│   │       ├── ItemService.js    # Items sync
│   │       ├── SalesOrderService.js  # SO sync
│   │       └── SyncService.js    # Auto sync
│   │
│   ├── models/                   # Database models
│   ├── controllers/              # Request handlers
│   ├── routes/                   # API routes
│   └── scripts/                  # Utility scripts
│
├── logs/                         # Log files
├── .env.example                  # Environment template
├── package.json
└── server.js                     # Entry point
```

---

## 🚀 Key Features

### 1. Token Management
- ✅ Auto-refresh expired tokens
- ✅ In-memory caching
- ✅ Database persistence
- ✅ Automatic cleanup

### 2. API Client
- ✅ Retry with exponential backoff
- ✅ Dynamic host resolution
- ✅ Request/response logging
- ✅ Error handling

### 3. Logging System
- ✅ Daily log rotation
- ✅ Separate logs (all, error, accurate, http)
- ✅ Structured logging
- ✅ Production-ready

### 4. Error Handling
- ✅ Custom error classes
- ✅ Centralized handler
- ✅ Async wrapper
- ✅ Detailed logging

### 5. Validation
- ✅ Joi schemas
- ✅ Middleware integration
- ✅ Common patterns
- ✅ Error formatting

### 6. Security
- ✅ Rate limiting (general, auth, sync)
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Helmet security headers

---

## 📦 Installation

```bash
cd backend-new
npm install
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DB_HOST=127.0.0.1
DB_USER=accurate_user
DB_PASSWORD=your_password
DB_NAME=iware_warehouse

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# Accurate Online API
ACCURATE_ACCOUNT_URL=https://account.accurate.id
ACCURATE_API_URL=https://public-api.accurate.id/api
ACCURATE_APP_KEY=your_app_key
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_REDIRECT_URI=https://iwareid.com/api/accurate/callback
ACCURATE_SIGNATURE_SECRET=your_signature_secret
ACCURATE_ACCESS_TOKEN=your_access_token (optional, untuk testing)
ACCURATE_DATABASE_ID=your_database_id (optional)
```

### Konfigurasi Accurate Online

Untuk mendapatkan kredensial Accurate Online:

1. Login ke [Accurate Online Developer Portal](https://account.accurate.id)
2. Buat aplikasi baru atau gunakan aplikasi yang sudah ada
3. Dapatkan:
   - **App Key**: Identifier aplikasi Anda
   - **Client ID**: OAuth client identifier
   - **Client Secret**: OAuth client secret
   - **Signature Secret**: Untuk generate HMAC signature
4. Set **OAuth Callback URL** ke: `https://iwareid.com/api/accurate/callback`
5. Set **Website URL** ke: `https://iwareid.com`

**Catatan**: Access Token bersifat opsional di `.env`. Token akan didapat otomatis melalui OAuth flow saat user melakukan koneksi pertama kali.

---

## 🗄️ Database Setup

```bash
# Run migration
npm run migrate

# Or setup from scratch
npm run setup
```

---

## 🏃 Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

---

## 📝 Logging

Logs are stored in `logs/` directory:

- `all-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- `accurate-YYYY-MM-DD.log` - Accurate API logs
- `http-YYYY-MM-DD.log` - HTTP request logs
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `rejections-YYYY-MM-DD.log` - Unhandled rejections

---

## 🔐 Security Features

1. **Rate Limiting**
   - General API: 100 req/15min
   - Auth endpoints: 5 req/15min
   - Sync endpoints: 10 req/1min

2. **JWT Authentication**
   - Access token: 7 days
   - Refresh token: 30 days
   - Secure secret keys

3. **Input Validation**
   - Joi schemas for all inputs
   - SQL injection prevention
   - XSS protection

4. **Security Headers**
   - Helmet middleware
   - CORS configuration
   - Content Security Policy

---

## 🔄 Accurate Integration

### ✅ Implementasi Sesuai Pedoman Resmi

Aplikasi ini mengikuti pedoman integrasi API Accurate Online:

1. **Headers Lengkap**
   - Authorization: Bearer Token
   - X-Api-Timestamp: Format dd/mm/yyyy hh:nn:ss
   - X-Api-Signature: HMAC SHA-256 (Base64)

2. **Rate Limiting**
   - Maksimal 8 request per detik
   - Maksimal 8 proses paralel
   - Auto-wait jika limit tercapai

3. **Dynamic Host**
   - Host diambil dari /api-token.do
   - Cache 30 hari
   - Auto-update saat redirect 308

4. **Follow Redirect**
   - Otomatis follow redirect 308
   - Preserve HTTP method
   - Update host cache

5. **Read-Only Operations**
   - Hanya endpoint view/list
   - POST/PUT/DELETE disabled
   - OAuth scopes: *_view only

### Token Flow

1. User authorizes via OAuth
2. Token saved to database
3. Token cached in memory
4. Auto-refresh before expiry
5. Retry on failure

### API Request Flow

1. Check rate limit → wait if needed
2. Get token from cache/database
3. Check if expired → refresh if needed
4. Get dynamic host from cache
5. Generate timestamp & signature
6. Make request with retry
7. Handle redirect 308 if needed
8. Log request/response
9. Release rate limit counter

### Retry Strategy

- Max 3 attempts
- Exponential backoff (2s, 4s, 8s)
- Retry on: 5xx, 429, 401, network errors
- Auto token refresh on 401

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Accurate OAuth
```
GET    /api/accurate/auth-url
GET    /api/accurate/callback
POST   /api/accurate/refresh-token
GET    /api/accurate/status
POST   /api/accurate/disconnect
```

### Items
```
GET    /api/items
GET    /api/items/:id
POST   /api/items/sync
GET    /api/items/stats
```

### Sales Orders
```
GET    /api/sales-orders
GET    /api/sales-orders/:id
POST   /api/sales-orders/sync
GET    /api/sales-orders/stats
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/charts
```

### Users (Superadmin)
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📈 Performance

- Connection pooling (10 connections)
- In-memory token caching
- Host caching (30 days)
- Query optimization
- Compression enabled

---

## 🔧 Maintenance

### Cleanup Expired Tokens

Automatic via cron (runs daily):
```javascript
TokenManager.cleanupExpiredTokens()
```

### Clear Caches

```javascript
TokenManager.clearCache()
ApiClient.clearCache()
```

### View Logs

```bash
# All logs
tail -f logs/all-*.log

# Errors only
tail -f logs/error-*.log

# Accurate API
tail -f logs/accurate-*.log
```

---

## 🚀 Deployment

### PM2 (Recommended)

```bash
pm2 start server.js --name iware-backend
pm2 save
pm2 startup
```

### Docker

```bash
docker build -t iware-backend .
docker run -d -p 5000:5000 --name iware-backend iware-backend
```

---

## 📚 Documentation

- [Configuration Guide](./docs/CONFIGURATION.md)
- [API Documentation](./docs/API.md)
- [Accurate Integration](./docs/ACCURATE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 🆚 Comparison: Old vs New

| Feature | Old Backend | New Backend |
|---------|-------------|-------------|
| Architecture | Mixed | Clean Architecture |
| Error Handling | Basic | Comprehensive |
| Logging | Console only | Winston + Files |
| Token Management | Manual | Auto-refresh |
| Retry Mechanism | None | Exponential backoff |
| Validation | Minimal | Joi schemas |
| Rate Limiting | None | Multi-level |
| Caching | None | Multi-layer |
| Security | Basic | Production-ready |
| Scalability | Limited | High |

---

## 👥 Team

iWare Development Team

---

## 📄 License

ISC

---

Made with ❤️ for Production


---

## 📅 Sales Order Sync Configuration

### Default Behavior (Mulai Maret 2026)

Sistem ini dikonfigurasi untuk mengambil data sales order dari **1 Maret 2026** ke depan. Saat pergantian bulan, sistem hanya akan memperbarui data bulan berjalan untuk efisiensi.

### Sync Modes

1. **Current Month Sync** (Recommended untuk update rutin)
   ```bash
   curl -X POST http://localhost:5000/api/sync/current-month \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Full Sync dari Maret 2026**
   ```bash
   curl -X POST http://localhost:5000/api/sync/from-march-2026 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Custom Date Range**
   ```bash
   curl -X POST http://localhost:5000/api/sync/sales-orders \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"startDate": "2026-03-01", "endDate": "2026-03-31"}'
   ```

### Testing Sync

```bash
# Test sync bulan berjalan
node src/scripts/test-sync-sales-orders.js current-month

# Test full sync
node src/scripts/test-sync-sales-orders.js full

# Test custom range
node src/scripts/test-sync-sales-orders.js custom
```

### Dokumentasi Lengkap

Lihat [SYNC_SALES_ORDER_GUIDE.md](../SYNC_SALES_ORDER_GUIDE.md) untuk panduan lengkap tentang:
- Cara kerja sync
- Error handling yang lebih baik
- Best practices
- Troubleshooting
- API reference

---
