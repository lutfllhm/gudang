# 🔍 Deployment Troubleshooting Guide

Panduan troubleshooting lengkap untuk masalah yang mungkin terjadi saat deployment.

## 📝 Table of Contents
1. [Pre-Deployment Issues](#pre-deployment-issues)
2. [Installation Issues](#installation-issues)
3. [Deployment Issues](#deployment-issues)
4. [Database Issues](#database-issues)
5. [SSL/HTTPS Issues](#sslhttps-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)

---

## Pre-Deployment Issues

### Issue: SSH Connection Refused

**Error Message:**
```
ssh: connect to host x.x.x.x port 22: Connection refused
```

**Solutions:**
```bash
# 1. Cek apakah IP VPS benar
ping your_vps_ip

# 2. Cek firewall UFW
sudo ufw allow 22/tcp
sudo ufw reload

# 3. Restart SSH service
sudo systemctl restart ssh

# 4. Cek SSH service status
sudo systemctl status ssh

# 5. Verify SSH port
sudo ss -tulpn | grep ssh
```

### Issue: Domain Not Pointing to VPS

**Check DNS:**
```bash
nslookup yourdomain.com
dig yourdomain.com

# Expected: Returns VPS IP
# If not, wait 24-48 hours for DNS propagation
```

**Solutions:**
```bash
# 1. Update DNS records at registrar
# A record: yourdomain.com → YOUR_VPS_IP
# A record: www.yourdomain.com → YOUR_VPS_IP

# 2. Clear DNS cache
# Windows: ipconfig /flushdns
# Mac: sudo dscacheutil -flushcache
# Linux: sudo systemctl restart systemd-resolved

# 3. Verify after update
nslookup yourdomain.com
```

### Issue: Permission Denied on SSH Key

**Error:**
```
Permission denied (publickey).
```

**Solution:**
```bash
# Set correct permissions
chmod 600 /path/to/private_key
chmod 700 ~/.ssh

# Verify SSH key
ssh -v -i /path/to/private_key root@your_vps_ip
```

---

## Installation Issues

### Issue: Docker Installation Fails

**Error:**
```
E: Unable to locate package docker-ce
E: Package has no installation candidate
```

**Solutions:**
```bash
# 1. Update package list
sudo apt update

# 2. Remove old Docker versions
sudo apt remove docker docker-engine docker.io containerd runc

# 3. Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 4. Verify GPG key added correctly
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 5. Verify repository
cat /etc/apt/sources.list.d/docker.list

# 6. Try installation again
sudo apt update
sudo apt install -y docker-ce
```

### Issue: Docker Compose Not Found After Install

**Error:**
```
docker-compose: command not found
```

**Solutions:**
```bash
# Check if installed
which docker-compose

# If not found, install manually
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version

# Add to PATH if needed
export PATH="/usr/local/bin:$PATH"
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: Permission Denied Running Docker

**Error:**
```
Got permission denied while trying to connect to the Docker daemon
```

**Solutions:**
```bash
# 1. Run with sudo
sudo docker ps

# 2. Add user to docker group
sudo usermod -aG docker $USER

# 3. Apply group changes
newgrp docker

# 4. Verify
docker ps

# 5. If still not working, restart Docker
sudo systemctl restart docker
```

### Issue: Disk Space Error

**Error:**
```
No space left on device
```

**Solutions:**
```bash
# 1. Check disk usage
df -h

# 2. Clean Docker system
docker system prune -a

# 3. Remove unused images
docker image prune -a

# 4. Remove unused volumes
docker volume prune

# 5. Clear apt cache
sudo apt clean
sudo apt autoclean

# 6. Check what's taking space
du -sh /*
du -sh /var/lib/docker/*
```

---

## Deployment Issues

### Issue: Containers Not Starting

**Error:**
```
docker-compose up error: service "backend" failed to start
```

**Solutions:**
```bash
# 1. Check detailed error
docker-compose logs backend

# 2. Verify environment variables
docker-compose config

# 3. Check .env.production exists and valid
test -f .env.production && echo "OK" || echo "File not found"

# 4. Validate compose file
docker-compose config

# 5. Check port conflicts
sudo netstat -tulpn | grep LISTEN
sudo lsof -i :3000
sudo lsof -i :80

# 6. Free up ports if needed
sudo kill -9 <PID>

# 7. Try again
docker-compose down
docker-compose up -d --build
```

### Issue: Containers Keep Restarting

**Symptom:**
```
Containers restart every few seconds
```

**Solutions:**
```bash
# 1. Check restart policy
docker-compose ps

# 2. View logs to find error
docker-compose logs -f backend

# 3. Common issues:
# - Database not ready
# - Environment variables missing
# - Port conflict
# - Out of memory

# Solutions:
# Wait longer for MySQL
sleep 30
docker-compose restart backend

# Check env vars
echo $DB_PASSWORD

# Check memory
free -h
docker stats

# Increase timeout in docker-compose.yml
# Add healthcheck with longer start_period
```

### Issue: Image Build Fails

**Error:**
```
Error: Cannot find module 'express'
ERROR: Service 'backend' failed to build
```

**Solutions:**
```bash
# 1. Check node_modules not in image
test -d node_modules && rm -rf node_modules

# 2. Verify Dockerfile is correct
cat backend/Dockerfile

# 3. Check .dockerignore
cat backend/.dockerignore

# 4. Build with verbose output
docker-compose build --verbose backend

# 5. Check npm package-lock.json
test -f backend/package-lock.json

# 6. Try clean build
docker-compose down
docker volume prune
docker-compose build --no-cache
```

---

## Database Issues

### Issue: MySQL Container Won't Start

**Error:**
```
MySQL exited with code 1
```

**Solutions:**
```bash
# 1. Check logs
docker-compose logs mysql

# 2. Common issues: volume corruption
docker-compose down
docker volume rm iware_mysql_data
docker-compose up -d mysql

# 3. Wait for initialization
sleep 30
docker-compose logs mysql | tail -20

# 4. Verify connection
docker-compose exec mysql mysql -u root -p<password> -e "SELECT 1"

# 5. Check port conflicts
sudo lsof -i :3306

# 6. Check disk space
df -h
```

### Issue: Cannot Connect to Database

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
ER_ACCESS_DENIED_FOR_USER
```

**Solutions:**
```bash
# 1. Check MySQL status
docker-compose ps mysql
docker-compose exec mysql mysql -uroot -p<password> -e "SELECT 1"

# 2. Verify connection from backend
docker-compose exec backend mysql -h mysql -u iware_user -p<password> iware_warehouse -e "SELECT 1"

# 3. Check credentials in .env.production
grep DB_ .env.production

# 4. Verify user exists
docker-compose exec mysql mysql -u root -p<password> -e "SELECT user FROM mysql.user;"

# 5. Reset database
docker-compose down
rm -rf backup_mysql_data
docker-compose up -d

# 6. Check network
docker network ls
docker network inspect iware_network
```

### Issue: Database Migration Error

**Error:**
```
Error: Table already exists
```

**Solutions:**
```bash
# 1. Check if tables exist
docker-compose exec mysql mysql -u iware_user -p<password> iware_warehouse -e "SHOW TABLES;"

# 2. View migration status
docker-compose exec backend npm run verify

# 3. If tables corrupted, reset
docker-compose exec -T mysql mysql -u root -p<root_password> iware_warehouse -e "DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS items;"

# 4. Re-run initialization
docker-compose exec backend npm run setup

# 5. Or manual import
cat backend/database/schema.sql | docker-compose exec -T mysql mysql -u root -p<password> iware_warehouse
```

---

## SSL/HTTPS Issues

### Issue: SSL Certificate Installation Fails

**Error:**
```
Certbot Error: Could not resolve
Check your intent to verify your domain
```

**Solutions:**
```bash
# 1. Verify domain points to VPS
nslookup yourdomain.com
# Should return YOUR_VPS_IP

# 2. Verify ports open
curl -I http://yourdomain.com
sudo netstat -tulpn | grep LISTEN

# 3. Allow ports in firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. Ensure Nginx not blocking
docker-compose logs nginx

# 5. Try challenge again
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 6. Or use DNS challenge if possible
sudo certbot certonly --manual --preferred-challenges dns -d yourdomain.com
```

### Issue: HTTPS Shows Certificate Error

**Error:**
```
Certificate Not Valid
NET::ERR_CERT_AUTHORITY_INVALID
```

**Solutions:**
```bash
# 1. Verify cert installed
sudo certbot certificates
ls -la /etc/letsencrypt/live/yourdomain.com/

# 2. Copy to correct location in Docker
docker cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem <nginx_container>:/etc/nginx/ssl/
docker cp /etc/letsencrypt/live/yourdomain.com/privkey.pem <nginx_container>:/etc/nginx/ssl/

# 3. Reload Nginx
docker-compose exec nginx nginx -s reload

# 4. Check Nginx config
docker-compose exec nginx nginx -t

# 5. Verify certificate chain
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout
```

### Issue: SSL Certificate Expired

**Error:**
```
Certificate has expired
```

**Solutions:**
```bash
# 1. Check expiry date
sudo certbot certificates

# 2. Renew certificate
sudo certbot renew

# 3. Force renewal
sudo certbot renew --force-renewal

# 4. Setup auto-renewal if not present
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet

# 5. Verify renewal
sudo certbot renew --dry-run
```

### Issue: Mixed Content Error (HTTPS/HTTP)

**Error:**
```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

**Solutions:**
```bash
# Check Nginx config redirect
cat /home/iware/nginx/conf.d/default.conf

# Ensure all requests redirect to HTTPS:
server {
    listen 80;
    location / {
        return 301 https://$host$request_uri;
    }
}

# Reload Nginx
docker-compose reload nginx

# Update frontend API URL to use HTTPS
# In frontend config or env variables:
VITE_API_URL=https://yourdomain.com
```

---

## Performance Issues

### Issue: Slow API Response

**Symptom:**
```
API requests taking 10+ seconds
```

**Diagnosis:**
```bash
# 1. Check server resources
docker stats

# 2. Check database performance
docker-compose exec mysql mysql -u iware_user -p<password> iware_warehouse -e "SHOW PROCESSLIST;"

# 3. Check backend logs
docker-compose logs -f backend | grep 'duration\|ms'

# 4. Monitor network
docker-compose exec backend ping redis

# 5. Check all services health
bash scripts/health-check.sh
```

**Solutions:**
```bash
# 1. Restart services
docker-compose restart backend

# 2. Optimize database
docker-compose exec -T mysql mysql -u iware_user -p<password> iware_warehouse -e "OPTIMIZE TABLE items; OPTIMIZE TABLE orders;"

# 3. Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# 4. Increase resource limits in docker-compose.yml
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

# 5. Check concurrent connections limit
docker-compose exec mysql mysql -u root -p<password> -e "SHOW VARIABLES LIKE 'max_connections';"
```

### Issue: High Memory Usage

**Symptom:**
```
Docker container using 100%+ memory
```

**Solutions:**
```bash
# 1. Identify memory hog
docker stats

# 2. Check container resource usage
docker inspect <container_id>

# 3. Increase available memory or check for leaks
docker logs <container_id> | tail -50

# 4. Set memory limits
# In docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M

# 5. Restart container
docker-compose restart backend

# 6. Check for memory leaks in application
docker-compose logs backend | grep -i "memory\|leak"
```

---

## Security Issues

### Issue: Unauthorized Access Attempts

**Error:**
```
Rate limit exceeded
Brute force attempts detected
```

**Solutions:**
```bash
# 1. Enable rate limiting in Nginx (already configured)
# Verify in nginx.conf

# 2. Check logs
docker-compose logs nginx | grep "rate"

# 3. Block IP (if needed)
# Add to Nginx config:
location /api {
    limit_req zone=api burst=10 nodelay;
}

# 4. Monitor failed login attempts
docker-compose logs backend | grep "401\|Unauthorized"

# 5. RReview logs
bash scripts/health-check.sh

# 6. Update firewall if needed
sudo ufw deny from <attack_ip>
```

### Issue: Data Breach or Compromise

**Immediate Actions:**
```bash
# 1. Isolate affected container
docker-compose stop <service>

# 2. Backup data (uncompromised)
docker-compose exec -T mysql mysqldump -u root -p<password> iware_warehouse | gzip > emergency_backup.sql.gz

# 3. Rotate credentials
# Change JWT_SECRET in .env.production
# Change database password
# Change API keys

# 4. Review logs
docker-compose logs backend > security_audit.log
docker-compose logs nginx > nginx_security_audit.log

# 5. Force re-authentication
# Clear all sessions in database

# 6. Patch & redeploy
docker-compose down
docker-compose up -d --build
```

### Issue: Invalid SSL Configuration

**Error:**
```
SSL_ERROR_BAD_CERT_DOMAIN
```

**Solutions:**
```bash
# 1. Verify certificate
sudo openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# 2. Check certificate matches domain
sudo certbot certificates

# 3. Regenerate if needed
sudo certbot certonly --force-renewal -d yourdomain.com

# 4. Verify Nginx config has correct paths
cat nginx/conf.d/default.conf | grep ssl_

# 5. Restart Nginx
docker-compose restart nginx

# 6. Test SSL
curl -I https://yourdomain.com

# 7. Check SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

---

## 🆘 Emergency Contacts

If you can't resolve issue:

1. **Check Docker Logs:**
```bash
docker-compose logs -f
```

2. **Check System Logs:**
```bash
sudo journalctl -xe
```

3. **Full system diagnostic:**
```bash
bash scripts/verify-deployment.sh
bash scripts/health-check.sh
```

4. **Backup before major changes:**
```bash
bash scripts/backup.sh
```

---

## ✅ Testing After Fixes

```bash
# 1. Verify deployment
bash scripts/verify-deployment.sh

# 2. Health check
bash scripts/health-check.sh

# 3. Test endpoints
curl http://localhost/api/health
curl http://yourdomain.com/health

# 4. Check logs
docker-compose logs -f

# 5. Monitor resources
docker stats
```

**Last Updated:** Maret 2026  
**Version:** 1.0.0
