# 🏭 iWare Warehouse Management System

Sistem manajemen warehouse terintegrasi dengan Accurate Online untuk sinkronisasi data inventory dan sales order.

## 🚀 Tech Stack

- **Frontend**: React.js + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0
- **Cache**: Redis
- **Reverse Proxy**: Nginx
- **Deployment**: Docker + Docker Compose
- **Integration**: Accurate Online API

## 📋 Features

- ✅ User Authentication & Authorization
- ✅ Item/Product Management
- ✅ Sales Order Management
- ✅ Dashboard & Analytics
- ✅ Accurate Online Integration
- ✅ Auto Sync with Accurate
- ✅ Webhook Support
- ✅ Real-time Updates
- ✅ Queue Management (Bull + Redis)

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Nginx    │  (Reverse Proxy)
│   Port 80   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Frontend │   │ Backend  │   │  MySQL   │
│ Port 3000│   │ Port 5000│   │ Port 3306│
└──────────┘   └────┬─────┘   └──────────┘
                    │
                    ▼
               ┌──────────┐
               │  Redis   │
               │ Port 6379│
               └──────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Domain (optional)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/iware-warehouse.git
cd iware-warehouse
```

### 2. Configure Environment
```bash
cp .env.production .env.production.local
nano .env.production
```

### 3. Deploy
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

### 4. Verify
```bash
./scripts/health-check.sh
```

## 📖 Documentation

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan deployment lengkap.

## 🛠️ Development

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables
Lihat `.env.example` di masing-masing folder untuk konfigurasi yang diperlukan.

## 🔧 Maintenance

### View Logs
```bash
./scripts/logs.sh [service_name]
```

### Restart Services
```bash
./scripts/restart.sh [service_name]
```

### Backup Database
```bash
./scripts/backup.sh
```

### Health Check
```bash
./scripts/health-check.sh
```

## 📊 Monitoring

### Container Status
```bash
docker compose ps
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
docker compose logs -f [service_name]
```

## 🐛 Troubleshooting

Lihat section Troubleshooting di [DEPLOYMENT.md](DEPLOYMENT.md)

## 📝 License

ISC

## 👥 Team

iWare Development Team

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
