# 🐳 Deploy Sales Order History dengan Docker

Panduan lengkap untuk deploy fitur Sales Order History menggunakan Docker dan Docker Compose.

## 📋 Prerequisites

- Docker dan Docker Compose sudah terinstall di VPS
- Aplikasi sudah running dengan Docker Compose
- Akses SSH ke VPS
- Git repository sudah ter-setup

## 🚀 Metode Deploy

### Metode 1: Deploy dengan Docker Compose (Recommended)

#### Step 1: SSH ke VPS

```bash
ssh root@your-vps-ip
cd /var/www/iware
```

#### Step 2: Backup Database

```bash
# Backup database dari container
docker-compose exec mysql mysqldump -u root -p iware_warehouse > /tmp/backup-$(date +%Y%m%d-%H%M%S).sql

# Atau backup dari host
docker-compose exec -T mysql mysqldump -u root -p iware_warehouse > backup-$(date +%Y%m%d-%H%M%S).sql
```

#### Step 3: Pull Latest Code

```bash
git pull origin main
```

#### Step 4: Setup Database

**Opsi A: Exec ke container MySQL**

```bash
# Masuk ke container MySQL
docker-compose exec mysql bash

# Di dalam container
mysql -u root -p iware_warehouse < /app/backend/database/add-sales-order-history.sql
exit
```

**Opsi B: Dari host (jika volume mounted)**

```bash
# Copy SQL file ke container
docker cp backend/database/add-sales-order-history.sql $(docker-compose ps -q mysql):/tmp/

# Execute SQL
docker-compose exec -T mysql mysql -u root -p iware_warehouse < /tmp/add-sales-order-history.sql
```

**Opsi C: One-liner dari host**

```bash
cat backend/database/add-sales-order-history.sql | docker-compose exec -T mysql mysql -u root -p iware_warehouse
```

#### Step 5: Rebuild Images

```bash
# Rebuild backend dan frontend
docker-compose build backend frontend

# Atau rebuild tanpa cache
docker-compose build --no-cache backend frontend
```

#### Step 6: Restart Containers

```bash
# Restart specific containers
docker-compose restart backend frontend

# Atau stop dan start ulang
docker-compose stop backend frontend
docker-compose up -d backend frontend
```

#### Step 7: Verify Deployment

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check database
docker-compose exec mysql mysql -u root -p iware_warehouse -e "SHOW TABLES LIKE 'sales_order_history';"
```

### Metode 2: Deploy dengan Docker Build & Run Manual

#### Step 1: Build Images

```bash
# Build backend
cd backend
docker build -t iware-backend:latest .

# Build frontend
cd ../frontend
docker build -t iware-frontend:latest .
```

#### Step 2: Stop Old Containers

```bash
docker stop iware-backend iware-frontend
docker rm iware-backend iware-frontend
```

#### Step 3: Run New Containers

```bash
# Run backend
docker run -d \
  --name iware-backend \
  --network iware-network \
  -p 5000:5000 \
  -v $(pwd)/backend:/app \
  -e NODE_ENV=production \
  iware-backend:latest

# Run frontend
docker run -d \
  --name iware-frontend \
  --network iware-network \
  -p 3000:3000 \
  -v $(pwd)/frontend/dist:/app/dist \
  iware-frontend:latest
```

## 📝 Docker Compose Configuration

Pastikan `docker-compose.yml` Anda sudah benar:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: iware-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: iware_warehouse
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/database:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    networks:
      - iware-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: iware-backend
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      DB_NAME: iware_warehouse
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "5000:5000"
    depends_on:
      - mysql
    networks:
      - iware-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: iware-frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - iware-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  iware-network:
    driver: bridge
```

## 🔧 Troubleshooting Docker

### Container tidak start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps

# Restart container
docker-compose restart backend
```

### Database connection error

```bash
# Check MySQL container
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec backend ping mysql

# Check environment variables
docker-compose exec backend env | grep DB_
```

### Port already in use

```bash
# Check what's using the port
netstat -tulpn | grep 5000

# Kill process
kill -9 $(lsof -t -i:5000)

# Or change port in docker-compose.yml
```

### Volume permission issues

```bash
# Fix permissions
sudo chown -R $USER:$USER ./backend
sudo chown -R $USER:$USER ./frontend

# Or run as root
docker-compose exec -u root backend chown -R node:node /app
```

## 📊 Monitoring Docker Containers

### Check Resource Usage

```bash
# All containers
docker stats

# Specific container
docker stats iware-backend

# One-time stats
docker stats --no-stream
```

### Check Logs

```bash
# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Logs with timestamp
docker-compose logs -t backend

# All services
docker-compose logs -f
```

### Inspect Container

```bash
# Container details
docker inspect iware-backend

# Network details
docker network inspect iware-network

# Volume details
docker volume inspect iware_mysql_data
```

## 🔄 Rollback dengan Docker

### Rollback Code

```bash
cd /var/www/iware
git reset --hard HEAD~1
docker-compose build backend frontend
docker-compose restart backend frontend
```

### Rollback Database

```bash
# Restore from backup
docker-compose exec -T mysql mysql -u root -p iware_warehouse < backup-YYYYMMDD-HHMMSS.sql

# Or drop table
docker-compose exec mysql mysql -u root -p iware_warehouse -e "DROP TABLE IF EXISTS sales_order_history; DROP TRIGGER IF EXISTS trg_sales_order_status_change;"
```

## 🧹 Cleanup Docker

### Remove Old Images

```bash
# Remove unused images
docker image prune -a

# Remove specific image
docker rmi iware-backend:old
```

### Remove Old Containers

```bash
# Remove stopped containers
docker container prune

# Remove specific container
docker rm iware-backend-old
```

### Clean Everything

```bash
# WARNING: This removes everything!
docker system prune -a --volumes
```

## 📦 Docker Commands Cheat Sheet

### Build & Run

```bash
# Build
docker-compose build

# Build without cache
docker-compose build --no-cache

# Run in background
docker-compose up -d

# Run specific service
docker-compose up -d backend

# Stop
docker-compose stop

# Stop and remove
docker-compose down

# Stop, remove, and remove volumes
docker-compose down -v
```

### Exec Commands

```bash
# Bash into container
docker-compose exec backend bash

# Run command
docker-compose exec backend npm install

# Run as root
docker-compose exec -u root backend bash

# Run without TTY
docker-compose exec -T backend node script.js
```

### Logs & Monitoring

```bash
# Follow logs
docker-compose logs -f

# Logs for specific service
docker-compose logs backend

# Last N lines
docker-compose logs --tail=50 backend

# Stats
docker stats
```

## 🚀 Quick Deploy Script untuk Docker

Buat file `deploy-docker.sh`:

```bash
#!/bin/bash

echo "Deploying with Docker..."

# Backup database
echo "1. Backing up database..."
docker-compose exec -T mysql mysqldump -u root -p'password' iware_warehouse > backup-$(date +%Y%m%d-%H%M%S).sql

# Pull code
echo "2. Pulling latest code..."
git pull origin main

# Setup database
echo "3. Setting up database..."
cat backend/database/add-sales-order-history.sql | docker-compose exec -T mysql mysql -u root -p'password' iware_warehouse

# Rebuild images
echo "4. Rebuilding images..."
docker-compose build backend frontend

# Restart containers
echo "5. Restarting containers..."
docker-compose restart backend frontend

# Verify
echo "6. Verifying deployment..."
sleep 5
docker-compose ps
docker-compose logs --tail=20 backend

echo "✓ Deployment complete!"
```

Jalankan:

```bash
chmod +x deploy-docker.sh
./deploy-docker.sh
```

## 🔐 Security Best Practices

### Use Docker Secrets

```yaml
services:
  backend:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### Use .env File

```bash
# .env
MYSQL_ROOT_PASSWORD=your_secure_password
NODE_ENV=production
```

```yaml
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
```

### Limit Resources

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 📈 Performance Optimization

### Multi-stage Build

```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["node", "server.js"]
```

### Use BuildKit

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with BuildKit
docker-compose build
```

### Cache Optimization

```dockerfile
# Copy package.json first for better caching
COPY package*.json ./
RUN npm install
COPY . .
```

## ✅ Verification Checklist

- [ ] Database backup created
- [ ] Code pulled successfully
- [ ] SQL script executed
- [ ] Images rebuilt
- [ ] Containers restarted
- [ ] All containers running
- [ ] No errors in logs
- [ ] Database table created
- [ ] Trigger created
- [ ] API endpoint accessible
- [ ] Frontend updated
- [ ] Feature working in browser

---

**Estimated Time**: 10-15 minutes  
**Downtime**: 1-2 minutes  
**Difficulty**: ⭐⭐ Medium
