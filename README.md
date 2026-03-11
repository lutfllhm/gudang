# 🏭 iWare Warehouse - Accurate Online Integration

Aplikasi warehouse management system yang terintegrasi dengan Accurate Online untuk sinkronisasi data item, sales order, dan inventory secara real-time.

---

## 🚀 MULAI DARI SINI

**Baru pertama kali?** Baca: [START-HERE.md](START-HERE.md)

**Mau deploy ke VPS?** Baca: [DEPLOY-VPS-HOSTINGER.md](DEPLOY-VPS-HOSTINGER.md)

**Ringkasan lengkap?** Baca: [SUMMARY.md](SUMMARY.md)

---

## ✅ Status Integrasi

**🎉 IMPLEMENTASI LENGKAP & SIAP DEPLOY**

Semua komponen integrasi Accurate Online sudah diimplementasikan dengan benar sesuai dokumentasi API Token v1.0.3.

## 🚀 Quick Deploy

### Local Development (15 Menit)

1. Clone repository
2. Edit `backend/.env` dengan kredensial Accurate
3. Run `docker compose up -d`
4. Create admin: `docker compose exec backend node src/scripts/create-admin-auto.js`
5. Open http://localhost dan connect ke Accurate

### Production VPS (60 Menit)

### 1. Dapatkan Kredensial Accurate (5 menit)
```
1. Buka https://account.accurate.id/developer/application
2. Login dan buat aplikasi baru
3. Catat: APP_KEY, CLIENT_ID, CLIENT_SECRET, SIGNATURE_SECRET
```

### 2. Konfigurasi (2 menit)
```bash
# Edit backend/.env
nano backend/.env

# Isi kredensial Accurate dan generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy dengan Docker (3 menit)

**Opsi A: Simple (Development)**
```bash
docker-compose up -d
```

**Opsi B: Production (dengan Nginx Reverse Proxy)**
```bash
docker-compose -f docker-compose.production.yml up -d
```

### 4. Buat Admin User (1 menit)
```bash
docker-compose exec backend node src/scripts/create-admin-auto.js
```

### 5. Connect ke Accurate (2 menit)
```
1. Buka http://localhost
2. Login dengan admin
3. Klik "Connect to Accurate Online"
4. Authorize
```

## 📁 Struktur Project

```
iware-warehouse/
├── backend/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/       # AccurateController, AuthController, dll
│   │   ├── services/
│   │   │   └── accurate/      # ApiClient, TokenManager
│   │   ├── middleware/        # auth, errorHandler, rateLimiter
│   │   ├── models/            # User, Item, SalesOrder
│   │   ├── routes/            # API routes
│   │   └── scripts/           # Setup & testing scripts
│   ├── database/              # SQL schema
│   ├── .env                   # Environment variables (LENGKAP)
│   ├── Dockerfile             # Backend container
│   └── package.json
│
├── frontend/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Pages
│   │   └── utils/             # API client
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf             # Nginx configuration
│   └── package.json
│
├── docker-compose.yml          # Docker orchestration
├── .env                        # Docker Compose env
│
└── Documentation/
    ├── README-DEPLOYMENT.md              # Panduan deployment lengkap
    ├── ACCURATE-SETUP-GUIDE.md           # Setup Accurate detail
    ├── ACCURATE-INTEGRATION-ANALYSIS.md  # Analisis teknis
    ├── QUICK-START.md                    # Quick start guide
    └── INTEGRATION-STATUS.md             # Status integrasi
```

## 🔧 Tech Stack

### Backend
- Node.js + Express
- MySQL 8.0
- Redis (Queue management)
- JWT Authentication
- Axios (HTTP client)
- Winston (Logging)

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios

### DevOps
- Docker & Docker Compose
- Nginx
- Health checks
- Auto-restart

## ✨ Fitur Integrasi Accurate Online

### ✅ OAuth 2.0 Authentication
- Authorization flow lengkap
- Token exchange & refresh
- Multi-user support
- Secure token storage

### ✅ API Integration
- Dynamic host resolution
- Rate limiting (8 req/sec, 8 parallel)
- Auto retry mechanism
- Error handling & logging

### ✅ Data Synchronization
- Items/Products sync
- Sales Orders sync
- Auto sync (configurable interval)
- Manual sync via API/UI

### ✅ Security
- HMAC SHA-256 signature
- Bearer token authentication
- CORS protection
- Rate limiting
- SQL injection prevention

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login              # Login
POST   /api/auth/logout             # Logout
POST   /api/auth/refresh            # Refresh token
```

### Accurate Integration
```
GET    /api/accurate/auth-url       # Get authorization URL
GET    /api/accurate/callback       # OAuth callback
GET    /api/accurate/status         # Connection status
POST   /api/accurate/refresh-token  # Refresh Accurate token
POST   /api/accurate/disconnect     # Disconnect
```

### Data Sync
```
POST   /api/sync/items              # Sync items
POST   /api/sync/sales-orders       # Sync sales orders
POST   /api/sync/all                # Sync all
GET    /api/sync/status             # Sync status
```

### Items & Sales Orders
```
GET    /api/items                   # List items
GET    /api/items/:id               # Get item
GET    /api/sales-orders            # List sales orders
GET    /api/sales-orders/:id        # Get sales order
```

## 🔐 Environment Variables

### Accurate Online (Required)
```env
ACCURATE_APP_KEY=your_app_key
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_SIGNATURE_SECRET=your_signature_secret
ACCURATE_REDIRECT_URI=http://localhost:5000/api/accurate/callback
```

### Database
```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=accurate_user
DB_PASSWORD=your_password
DB_NAME=iware_warehouse
```

### JWT
```env
JWT_SECRET=your_jwt_secret_32_chars_min
JWT_REFRESH_SECRET=your_refresh_secret
```

### Redis
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Accurate Connection
```bash
docker-compose exec backend npm run test:accurate
```

### Test API
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iware.id","password":"admin123"}'

# Get Accurate status
curl http://localhost:5000/api/accurate/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Dokumentasi

### 🔥 Deployment (Mulai dari sini!)
| Dokumen | Deskripsi | Waktu |
|---------|-----------|-------|
| [DEPLOY-VPS-HOSTINGER.md](DEPLOY-VPS-HOSTINGER.md) | **Panduan lengkap deploy VPS Hostinger** | 60 menit |
| [QUICK-DEPLOY-CHECKLIST.md](QUICK-DEPLOY-CHECKLIST.md) | Checklist deployment (print & centang) | - |
| [COMMAND-REFERENCE.md](COMMAND-REFERENCE.md) | Command reference (simpan untuk referensi) | - |

### 🔗 Accurate Online Integration
| Dokumen | Deskripsi |
|---------|-----------|
| [ACCURATE-SETUP-GUIDE.md](ACCURATE-SETUP-GUIDE.md) | Setup Accurate Online step-by-step |
| [ACCURATE-INTEGRATION-ANALYSIS.md](ACCURATE-INTEGRATION-ANALYSIS.md) | Analisis teknis implementasi |
| [INTEGRATION-STATUS.md](INTEGRATION-STATUS.md) | Status & checklist integrasi |

### ⚙️ Configuration & Architecture
| Dokumen | Deskripsi |
|---------|-----------|
| [NGINX-SETUP.md](NGINX-SETUP.md) | Nginx configuration & SSL setup |
| [DOCKER-COMPOSE-COMPARISON.md](DOCKER-COMPOSE-COMPARISON.md) | Perbandingan arsitektur Docker |
| [README-DEPLOYMENT.md](README-DEPLOYMENT.md) | Panduan deployment umum |

## 🐛 Troubleshooting

### Backend tidak start
```bash
docker-compose logs backend
docker-compose restart backend
```

### MySQL connection error
```bash
docker-compose logs mysql
# Tunggu sampai status: healthy
```

### Accurate connection failed
```bash
# Cek credentials
cat backend/.env | grep ACCURATE

# Test connection
docker-compose exec backend npm run test:accurate
```

## 📞 Support

- Accurate API Docs: https://accurate.id/api-docs
- Developer Portal: https://account.accurate.id/developer
- Support Email: support@accurate.id

## 📝 License

ISC

## 👥 Team

iWare Development Team

---

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 11 Maret 2026
