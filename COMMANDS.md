# 📝 Command Reference

## 🚀 Deployment Commands

### Initial Setup
```bash
# Setup VPS (first time only)
./scripts/setup-vps.sh

# Clone project
git clone https://github.com/your-username/iware-warehouse.git
cd iware-warehouse

# Configure environment
cp .env.production .env.production.local
nano .env.production

# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
```

### Update & Redeploy
```bash
# Update application
./scripts/update.sh

# Manual update
git pull origin main
docker compose --env-file .env.production up -d --build

# Rebuild specific service
docker compose up -d --build backend
docker compose up -d --build frontend
```

---

## 🔄 Service Management

### Start/Stop Services
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Stop without removing containers
docker compose stop

# Start stopped containers
docker compose start

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

### Service Status
```bash
# Check status
docker compose ps

# Detailed status
docker compose ps -a

# Check health
./scripts/health-check.sh
```

---

## 📊 Monitoring Commands

### Logs
```bash
# View all logs
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# Specific service logs
docker compose logs backend
docker compose logs -f backend

# Last N lines
docker compose logs --tail=100 backend

# Since time
docker compose logs --since 30m backend
docker compose logs --since 2024-03-11T10:00:00

# Using scripts
./scripts/logs.sh              # All services
./scripts/logs.sh backend      # Specific service
```

### Resource Monitoring
```bash
# Real-time stats
docker stats

# One-time stats
docker stats --no-stream

# Specific container
docker stats iware-backend

# Using script
./scripts/monitor.sh
```

### Health Checks
```bash
# Full health check
./scripts/health-check.sh

# Test connections
./scripts/test-connection.sh

# Debug specific service
./scripts/debug.sh backend
./scripts/debug.sh mysql
```

---

## 🗄️ Database Commands

### MySQL Access
```bash
# MySQL shell
docker compose exec mysql mysql -u root -p

# Execute query
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Access specific database
docker compose exec mysql mysql -u root -p iware_warehouse

# Show tables
docker compose exec mysql mysql -u root -p iware_warehouse -e "SHOW TABLES;"
```

### Database Backup & Restore
```bash
# Backup
./scripts/backup.sh

# Manual backup
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup.sql

# Restore
docker compose exec -T mysql mysql -u root -p iware_warehouse < backup.sql

# Initialize database
./scripts/init-database.sh
```

---

## 🔴 Redis Commands

### Redis Access
```bash
# Redis CLI
docker compose exec redis redis-cli -a your_password

# Ping
docker compose exec redis redis-cli -a your_password ping

# Get info
docker compose exec redis redis-cli -a your_password INFO

# List keys
docker compose exec redis redis-cli -a your_password KEYS '*'

# Get key value
docker compose exec redis redis-cli -a your_password GET key_name

# Flush all data
docker compose exec redis redis-cli -a your_password FLUSHALL
```

---

## 🐳 Docker Commands

### Container Management
```bash
# List containers
docker ps
docker ps -a

# Inspect container
docker inspect iware-backend

# Execute command in container
docker compose exec backend sh
docker compose exec backend node -v

# Copy files
docker cp local_file.txt iware-backend:/app/
docker cp iware-backend:/app/file.txt ./
```

### Image Management
```bash
# List images
docker images

# Remove image
docker rmi image_name

# Pull image
docker pull nginx:alpine

# Build image
docker build -t my-image ./backend
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect iware-warehouse_mysql_data

# Remove volume
docker volume rm iware-warehouse_mysql_data

# Backup volume
docker run --rm -v iware-warehouse_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

### Network Management
```bash
# List networks
docker network ls

# Inspect network
docker network inspect iware-warehouse_iware-network

# Create network
docker network create my-network

# Connect container to network
docker network connect my-network container_name
```

---

## 🧹 Cleanup Commands

### Using Script
```bash
./scripts/clean.sh
```

### Manual Cleanup
```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f

# Complete cleanup
docker system prune -a --volumes -f

# Check disk usage
docker system df
```

---

## 🔒 SSL Commands

### Setup SSL
```bash
# Using script
./scripts/setup-ssl.sh

# Manual setup
certbot certonly --standalone -d iwareid.com -d www.iwareid.com

# Copy certificates
cp /etc/letsencrypt/live/iwareid.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/iwareid.com/privkey.pem nginx/ssl/
```

### Renew SSL
```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Manual renewal
certbot renew
```

---

## 🔧 Maintenance Commands

### Restart Services
```bash
# Using script
./scripts/restart.sh              # All services
./scripts/restart.sh backend      # Specific service

# Manual restart
docker compose restart
docker compose restart backend
```

### Update Services
```bash
# Using script
./scripts/update.sh

# Manual update
git pull
docker compose up -d --build
```

### Backup
```bash
# Full backup
./scripts/backup.sh

# Database only
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup.sql

# Redis only
docker compose exec redis redis-cli -a password BGSAVE
```

---

## 🔍 Debugging Commands

### Check Configuration
```bash
# Validate docker-compose.yml
docker compose config

# Check environment variables
docker compose exec backend env

# Check nginx config
docker compose exec nginx nginx -t
docker compose exec frontend nginx -t
```

### Network Testing
```bash
# Test connectivity
docker compose exec backend ping mysql
docker compose exec nginx wget -O- http://backend:5000/health

# Check DNS
docker compose exec backend nslookup mysql

# Check ports
docker compose exec backend netstat -tulpn
```

### Performance Testing
```bash
# API response time
time curl http://localhost:5000/api/health

# Load test (using ab)
ab -n 1000 -c 10 http://localhost:80/api/health

# Database query time
docker compose exec mysql mysql -u root -p -e "SELECT NOW();"
```

---

## 📦 Backup & Restore

### Full Backup
```bash
# Using script
./scripts/backup.sh

# Manual full backup
mkdir -p backups/$(date +%Y%m%d)
docker compose exec mysql mysqldump -u root -p iware_warehouse > backups/$(date +%Y%m%d)/database.sql
docker compose exec redis redis-cli -a password BGSAVE
cp .env.production backups/$(date +%Y%m%d)/
tar -czf backups/backup_$(date +%Y%m%d).tar.gz backups/$(date +%Y%m%d)
```

### Restore
```bash
# Stop services
docker compose down

# Restore database
docker compose up -d mysql
sleep 10
docker compose exec -T mysql mysql -u root -p iware_warehouse < backup.sql

# Start all services
docker compose up -d
```

---

## 🚨 Emergency Commands

### Quick Restart
```bash
docker compose restart
```

### Force Recreate
```bash
docker compose down
docker compose up -d --force-recreate
```

### Reset Everything
```bash
# WARNING: This will delete all data!
docker compose down -v
docker compose up -d
./scripts/init-database.sh
```

### Check System Resources
```bash
# Memory
free -h

# Disk
df -h

# CPU
top
htop

# Docker resources
docker stats --no-stream
```

---

## 📱 Quick Reference

### Most Used Commands
```bash
# Deploy
./scripts/deploy.sh

# Check health
./scripts/health-check.sh

# View logs
./scripts/logs.sh backend

# Restart
./scripts/restart.sh backend

# Backup
./scripts/backup.sh

# Debug
./scripts/debug.sh backend
```

### Emergency Fixes
```bash
# Container unhealthy
docker compose restart <service>

# Port conflict
netstat -tulpn | grep :<port>
kill -9 <PID>

# Out of memory
docker compose restart
./scripts/clean.sh

# Database connection failed
docker compose restart mysql
sleep 10
docker compose restart backend
```
