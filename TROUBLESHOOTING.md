# 🔧 Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Container Status "Unhealthy"

#### Symptoms
```bash
docker compose ps
# Shows: Status: Up (unhealthy)
```

#### Solutions

**A. Check Logs First**
```bash
./scripts/debug.sh <service_name>
# or
docker compose logs <service_name>
```

**B. Backend Unhealthy**
```bash
# Check database connection
docker compose exec backend node -e "require('./src/config/database').testConnection()"

# Check environment variables
docker compose exec backend env | grep -E "DB_|REDIS_"

# Restart with fresh logs
docker compose restart backend
docker compose logs -f backend
```

**C. Frontend Unhealthy**
```bash
# Check nginx config
docker compose exec frontend nginx -t

# Check if build files exist
docker compose exec frontend ls -la /usr/share/nginx/html

# Rebuild frontend
docker compose up -d --build frontend
```

**D. MySQL Unhealthy**
```bash
# Check MySQL logs
docker compose logs mysql | tail -50

# Check if MySQL is responding
docker compose exec mysql mysqladmin ping -h localhost -u root -p

# If corrupted, recreate
docker compose down
docker volume rm iware-warehouse_mysql_data
docker compose up -d mysql
./scripts/init-database.sh
```

**E. Redis Unhealthy**
```bash
# Check Redis
docker compose exec redis redis-cli -a your_password ping

# Check logs
docker compose logs redis

# Restart Redis
docker compose restart redis
```

---

### 2. Container Keeps Restarting

#### Check Restart Count
```bash
docker compose ps
# Look at STATUS column
```

#### Common Causes

**A. Port Already in Use**
```bash
# Check ports
netstat -tulpn | grep -E ":80|:443|:3306|:5000|:6379"

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

**B. Out of Memory**
```bash
# Check memory
free -h
docker stats

# Add swap if needed
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

**C. Configuration Error**
```bash
# Validate docker-compose.yml
docker compose config

# Check environment variables
cat .env.production | grep -v '^#'
```

---

### 3. Database Connection Failed

#### Error Messages
- "ECONNREFUSED"
- "Access denied"
- "Unknown database"

#### Solutions

**A. Check MySQL is Running**
```bash
docker compose ps mysql
docker compose logs mysql
```

**B. Verify Credentials**
```bash
# Test connection
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD}

# Check user exists
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT User, Host FROM mysql.user;"
```

**C. Check Database Exists**
```bash
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

**D. Recreate Database**
```bash
./scripts/init-database.sh
```

**E. Check Network**
```bash
# Verify containers are on same network
docker network inspect iware-warehouse_iware-network

# Check if backend can reach mysql
docker compose exec backend ping -c 3 mysql
```

---

### 4. Redis Connection Failed

#### Solutions

**A. Check Redis is Running**
```bash
docker compose ps redis
docker compose logs redis
```

**B. Test Connection**
```bash
docker compose exec redis redis-cli -a ${REDIS_PASSWORD} ping
```

**C. Check Password**
```bash
# Verify password in .env.production
grep REDIS_PASSWORD .env.production

# Test with password
docker compose exec redis redis-cli -a your_password INFO
```

---

### 5. Nginx 502 Bad Gateway

#### Causes
- Backend not running
- Backend not healthy
- Network issue
- Wrong upstream configuration

#### Solutions

**A. Check Backend Status**
```bash
docker compose ps backend
curl http://localhost:5000/health
```

**B. Check Nginx Configuration**
```bash
docker compose exec nginx nginx -t
docker compose logs nginx
```

**C. Check Network Connectivity**
```bash
docker compose exec nginx ping -c 3 backend
docker compose exec nginx wget -O- http://backend:5000/health
```

**D. Restart Services**
```bash
docker compose restart backend
sleep 10
docker compose restart nginx
```

---

### 6. Frontend Not Loading

#### Solutions

**A. Check Build Files**
```bash
docker compose exec frontend ls -la /usr/share/nginx/html
```

**B. Check Nginx Config**
```bash
docker compose exec frontend nginx -t
docker compose exec frontend cat /etc/nginx/conf.d/default.conf
```

**C. Rebuild Frontend**
```bash
docker compose up -d --build frontend
```

**D. Check Browser Console**
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for failed requests

---

### 7. API Requests Failing

#### Check CORS Configuration

**A. Verify CORS_ORIGIN**
```bash
docker compose exec backend env | grep CORS_ORIGIN
```

**B. Check Backend Logs**
```bash
docker compose logs backend | grep -i cors
```

**C. Test API Directly**
```bash
# Test backend directly
curl http://localhost:5000/api/health

# Test through nginx
curl http://localhost:80/api/health
```

---

### 8. SSL Certificate Issues

#### Solutions

**A. Check Certificate Files**
```bash
ls -la nginx/ssl/
```

**B. Verify Certificate**
```bash
openssl x509 -in nginx/ssl/fullchain.pem -text -noout
```

**C. Check Nginx SSL Config**
```bash
docker compose exec nginx nginx -t
```

**D. Renew Certificate**
```bash
certbot renew --force-renewal
./scripts/setup-ssl.sh
```

---

### 9. High Memory Usage

#### Solutions

**A. Check Resource Usage**
```bash
docker stats
free -h
```

**B. Restart Services**
```bash
docker compose restart
```

**C. Clean Up**
```bash
./scripts/clean.sh
```

**D. Add Resource Limits**
Edit `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

### 10. Disk Space Full

#### Solutions

**A. Check Disk Usage**
```bash
df -h
docker system df
```

**B. Clean Docker**
```bash
./scripts/clean.sh
```

**C. Clean Logs**
```bash
# Truncate logs
truncate -s 0 backend/logs/*.log
truncate -s 0 nginx/logs/*.log

# Or delete old logs
find backend/logs -name "*.log" -mtime +7 -delete
find nginx/logs -name "*.log" -mtime +7 -delete
```

**D. Remove Old Backups**
```bash
find backups -name "*.tar.gz" -mtime +30 -delete
```

---

## 🔍 Debugging Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Since specific time
docker compose logs --since 30m backend
```

### Execute Commands in Container
```bash
# Shell access
docker compose exec backend sh
docker compose exec mysql bash

# Run command
docker compose exec backend node -v
docker compose exec mysql mysql -V
```

### Inspect Container
```bash
# Container details
docker inspect iware-backend

# Network details
docker network inspect iware-warehouse_iware-network

# Volume details
docker volume inspect iware-warehouse_mysql_data
```

### Test Connectivity
```bash
# From host to container
curl http://localhost:5000/health

# From container to container
docker compose exec backend wget -O- http://mysql:3306
docker compose exec nginx wget -O- http://backend:5000/health
```

---

## 📞 Still Having Issues?

1. Run full diagnostic:
```bash
./scripts/health-check.sh
./scripts/test-connection.sh
```

2. Collect logs:
```bash
docker compose logs > debug-logs.txt
```

3. Check system resources:
```bash
free -h
df -h
docker stats --no-stream
```

4. Review configuration:
```bash
docker compose config
cat .env.production
```

5. Try complete restart:
```bash
docker compose down
docker compose up -d
./scripts/health-check.sh
```
