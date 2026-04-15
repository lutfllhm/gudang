# 🏭 iWare Warehouse Management System

Sistem manajemen warehouse terintegrasi dengan Accurate Online untuk sinkronisasi data real-time.

## ✨ Features

- 📦 **Item Management** - Kelola master data barang dengan mudah
- 📋 **Sales Order Management** - Tracking dan monitoring sales order
- 🔄 **Accurate Integration** - Sinkronisasi otomatis dengan Accurate Online
- 👥 **User Management** - Multi-user dengan role-based access
- 📊 **Dashboard** - Monitoring real-time inventory dan transaksi
- 🔐 **Secure Authentication** - JWT-based authentication dengan refresh token
- 🚀 **High Performance** - Redis caching dan queue processing
- 📱 **Responsive UI** - Modern interface dengan React + Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **MySQL** - Relational database
- **Redis** - Caching & queue management
- **Bull** - Job queue processing
- **JWT** - Authentication & authorization
- **Winston** - Logging system

### Frontend
- **React** + **Vite** - Modern frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Router** - Client-side routing

### DevOps
- **Docker** + **Docker Compose** - Containerization
- **Nginx** - Reverse proxy & static file serving
- **PM2** - Process management (alternative deployment)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (untuk validasi)
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd iware-warehouse
```

### 2. Quick Deploy

#### Windows:
```bash
quick-deploy.bat
```

#### Linux/Mac:
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

Script ini akan otomatis:
- ✅ Membuat file .env (jika belum ada)
- ✅ Validasi environment variables
- ✅ Check Docker & Docker Compose
- ✅ Build dan start semua services
- ✅ Wait sampai semua services ready

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### 4. Default Login

```
Username: admin
Password: admin123
```

**⚠️ PENTING**: Ganti password default setelah login pertama!

## 📖 Detailed Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Panduan deployment lengkap
- **[Sync & Webhook Setup](SUMMARY_SYNC_WEBHOOK.md)** - ⭐ Setup auto sync & webhook
- **[Quick Update Guide](QUICK_UPDATE_GUIDE.md)** - Update sync interval di VPS
- **[Webhook Setup Guide](WEBHOOK_SETUP_GUIDE.md)** - Setup webhook lengkap
- **[Docker Help](DOCKER_HELP.md)** - Docker commands dan troubleshooting
- **[Backend README](backend/README.md)** - Backend API documentation
- **[Frontend README](frontend/README.md)** - Frontend documentation

## 🔧 Manual Setup

Jika ingin setup manual tanpa quick deploy script:

### 1. Setup Environment

```bash
# Copy .env.example
cp .env.example .env

# Generate secrets
node generate-secrets.js

# Edit .env dan update credentials
nano .env
```

### 2. Validate Configuration

```bash
# Validate environment variables
node validate-env.js

# Pre-deployment check
./pre-deploy-check.sh  # Linux/Mac
pre-deploy-check.bat   # Windows
```

### 3. Deploy with Docker

```bash
# Build dan start
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Setup database
npm run setup

# Start development server
npm run dev
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📋 Environment Variables

### Required Variables

```env
# Database
DB_HOST=db
DB_USER=iware
DB_PASSWORD=your_strong_password
DB_NAME=iware_warehouse

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
```

### Optional Variables (Accurate Integration)

```env
# Accurate Online API
ACCURATE_APP_KEY=your_app_key
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_REDIRECT_URI=http://localhost:3000/auth/callback
ACCURATE_SIGNATURE_SECRET=your_signature_secret
```

Lihat `.env.example` untuk daftar lengkap environment variables.

## 🔍 Health Check

Check status aplikasi:

```bash
# Backend health
curl http://localhost:5000/health

# Check all services
docker-compose ps

# View logs
docker-compose logs -f
```

## 🛑 Stop Services

```bash
# Stop services (data tetap ada)
docker-compose down

# Stop dan hapus semua data
docker-compose down -v
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🔄 Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 🗄️ Backup & Restore

### Backup Database

```bash
docker exec iware_db mysqldump -u iware -piware_password iware_warehouse > backup.sql
```

### Restore Database

```bash
docker exec -i iware_db mysql -u iware -piware_password iware_warehouse < backup.sql
```

## 🐛 Troubleshooting

### Error: "failed to set up container networking"

Jika muncul error networking saat rebuild:

```bash
# Quick fix
chmod +x fix-docker-simple.sh
./fix-docker-simple.sh
```

Atau manual:
```bash
docker-compose down -v
docker rm -f $(docker ps -aq)
docker network prune -f
docker-compose up -d --build
```

### Container terus restart

```bash
# Check logs
docker-compose logs backend

# Validate environment
node validate-env.js

# Check database
docker-compose logs db
```

### Port already in use

```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Stop process atau ubah port di docker-compose.yml
```

### Database connection failed

```bash
# Restart database
docker-compose restart db

# Wait 30 seconds
sleep 30

# Restart backend
docker-compose restart backend
```

Lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md) untuk panduan lengkap troubleshooting.

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Password hashing dengan bcrypt
- ✅ Rate limiting untuk API endpoints
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Input validation dengan Joi
- ✅ SQL injection prevention
- ✅ XSS protection

## 📝 API Documentation

API endpoints tersedia di:
- **Base URL**: http://localhost:5000/api
- **Health**: http://localhost:5000/health

### Main Endpoints

```
POST   /api/auth/login          - Login
POST   /api/auth/refresh        - Refresh token
GET    /api/items               - Get all items
GET    /api/items/:id           - Get item by ID
GET    /api/sales-orders        - Get all sales orders
GET    /api/sales-orders/:id    - Get sales order by ID
GET    /api/dashboard/stats     - Get dashboard statistics
POST   /api/sync/items          - Sync items from Accurate
POST   /api/sync/sales-orders   - Sync sales orders from Accurate
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

iWare Development Team

## 📞 Support

Untuk bantuan dan support:
- 📧 Email: support@iwareid.com
- 📖 Documentation: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- 🐛 Issues: GitHub Issues

---

**Made with ❤️ by iWare Team**
