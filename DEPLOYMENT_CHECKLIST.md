# 📋 Deployment Checklist - Complete

Gunakan checklist ini untuk memastikan deployment production-ready.

---

## Phase 1: Persiapan VPS

### Infrastructure Setup
- [ ] VPS di-order dari Hostinger (Ubuntu 20.04 LTS atau 22.04 LTS)
- [ ] Minimal 2 CPU cores, 2GB RAM, 30GB SSD
- [ ] Akses SSH ke VPS berhasil
- [ ] Firewall diaktifkan (UFW)
- [ ] Ports 22, 80, 443 dibuka di UFW

### Domain & DNS
- [ ] Domain sudah di-register
- [ ] A record: yourdomain.com → VPS_IP
- [ ] A record: www.yourdomain.com → VPS_IP
- [ ] DNS propagation verified (nslookup)
- [ ] Domain dapat dipingkan: `ping yourdomain.com`

### System Updates
- [ ] OS sudah updated: `sudo apt update && sudo apt upgrade -y`
- [ ] System utilities installed (curl, wget, git, nano)
- [ ] Timezone diatur: `sudo timedatectl set-timezone Asia/Jakarta`
- [ ] NTP synchronized: `timedatectl status`

---

## Phase 2: Docker Installation

### Docker Setup
- [ ] Docker & Docker Compose installed (via install-docker.sh)
- [ ] Atau manual installation verified
- [ ] Docker version checked: `docker --version`
- [ ] Docker Compose version checked: `docker-compose --version`
- [ ] Docker daemon running: `systemctl status docker`
- [ ] User added to docker group: `groups $USER | grep docker`
- [ ] Test Docker: `docker run hello-world` successful

### Services Prerequisites
- [ ] 30GB+ free disk space available
- [ ] MySQL port 3306 available
- [ ] Redis port 6379 available
- [ ] Nginx ports 80, 443 available

---

## Phase 3: Project Setup

### Repository & Files
- [ ] Repository cloned: `cd /home/iware`
- [ ] Git configured (if auto-deploy planned)
- [ ] Project structure verified:
  - [ ] backend/ directory exists
  - [ ] frontend/ directory exists
  - [ ] nginx/ directory exists
  - [ ] scripts/ directory exists
  - [ ] docker-compose.yml exists

### Environment Configuration
- [ ] .env.example exists
- [ ] .env.production created from template
- [ ] Database credentials strong (20+ chars mix of uppercase, lowercase, numbers, symbols):
  - [ ] DB_PASSWORD set
  - [ ] DB_ROOT_PASSWORD set
  - [ ] Both passwords verified (minimum 20 characters)
- [ ] JWT secrets generated (openssl rand -hex 32):
  - [ ] JWT_SECRET set (32+ characters)
  - [ ] JWT_REFRESH_SECRET set (32+ characters)
- [ ] Domain configuration:
  - [ ] CORS_ORIGIN set to yourdomain.com
  - [ ] API_URL set to yourdomain.com
  - [ ] FRONTEND_URL set to yourdomain.com
- [ ] Accurate Online configuration (from dashboard):
  - [ ] ACCURATE_CLIENT_ID obtained
  - [ ] ACCURATE_CLIENT_SECRET obtained
  - [ ] ACCURATE_REDIRECT_URI set correctly
- [ ] Environment variables verified: `grep -v "^#" .env.production | grep "="`

### Directory Structure
- [ ] Created directories: `mkdir -p backend/logs nginx/logs ssl`
- [ ] Permissions set: `chmod 755 backend/logs nginx/logs ssl`
- [ ] .env.production not in version control (added to .gitignore)
- [ ] Production secrets never committed to Git

---

## Phase 4: Deployment

### Build Process
- [ ] Docker images buildable: `docker-compose build`
- [ ] No build errors
- [ ] Image sizes reasonable (backend < 200MB, frontend < 100MB)
- [ ] Build completed successfully

### Container Startup
- [ ] Containers started: `docker-compose up -d`
- [ ] All containers running: `docker-compose ps` shows 5 containers
- [ ] Wait 30 seconds for services to initialize
- [ ] MySQL healthy (ps shows "healthy")
- [ ] Redis healthy (ps shows "healthy")
- [ ] Backend running (ps shows running)
- [ ] Frontend running (ps shows running)
- [ ] Nginx running (ps shows running)

### Service Connectivity
- [ ] MySQL responding: `docker-compose exec mysql mysql -u root -p -e "SELECT 1"`
- [ ] Redis responding: `docker-compose exec redis redis-cli ping`
- [ ] Backend API responding: `curl http://localhost:3000/api/health`
- [ ] Frontend responding: `curl http://localhost/ -I`
- [ ] All services communicate correctly

### Health Verification
- [ ] Health check passed: `bash scripts/health-check.sh`
- [ ] No critical errors in logs
- [ ] Docker stats reasonable (CPU < 50%, Memory < 60%)

---

## Phase 5: SSL/HTTPS Setup

### Certificate Installation
- [ ] Certbot installed: `sudo apt list --installed | grep certbot`
- [ ] Domain still pointing correctly: `nslookup yourdomain.com`
- [ ] Ports 80, 443 accessible from internet
- [ ] SSL certificate generated via certbot:
  - [ ] Certificate installed for yourdomain.com
  - [ ] Certificate installed for www.yourdomain.com
  - [ ] Certificates in /etc/letsencrypt/live/yourdomain.com/
- [ ] HTTPS working: `curl -I https://yourdomain.com`
- [ ] Redirect working: `curl -I http://yourdomain.com` → 301 to HTTPS

### Nginx Configuration
- [ ] Nginx config updated for SSL
- [ ] SSL paths correct in nginx config:
  - [ ] `ssl_certificate /etc/nginx/ssl/fullchain.pem`
  - [ ] `ssl_certificate_key /etc/nginx/ssl/privkey.pem`
- [ ] Nginx syntax valid: `docker-compose exec nginx nginx -t`
- [ ] Nginx reloaded: `docker-compose restart nginx`
- [ ] HSTS header present: `curl -I https://yourdomain.com | grep -i "strict"`

### Auto-Renewal Setup
- [ ] Cron job created for auto-renewal
- [ ] Cron verified: `sudo crontab -l | grep certbot`
- [ ] Dry-run successful: `sudo certbot renew --dry-run`
- [ ] Certificate details checked: `sudo certbot certificates`

### Security Validation
- [ ] SSL Labs test passed (A+ rating preferred):
  - [ ] Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
- [ ] No mixed content warnings: `curl -I https://yourdomain.com`
- [ ] Certificate valid 90 days from now

---

## Phase 6: Auto-Restart & Service Management

### Systemd Service
- [ ] Service file created: `/etc/systemd/system/iware.service`
- [ ] Service enabled at boot: `sudo systemctl is-enabled iware`
- [ ] Service started successfully: `sudo systemctl start iware`
- [ ] Service status healthy: `sudo systemctl status iware`
- [ ] Service survives reboot:
  - [ ] Reboot VPS: `sudo reboot`
  - [ ] Wait 2 minutes
  - [ ] Verify service running: `systemctl status iware`
  - [ ] Verify containers running: `docker-compose ps`

### Restart Policy
- [ ] Docker restart policy set to "always" in docker-compose.yml
- [ ] Container crashes trigger automatic restart
- [ ] Verified: Kill a container, verify it restarts

---

## Phase 7: Monitoring & Backup

### Monitoring Setup
- [ ] Health check script working: `bash scripts/health-check.sh`
- [ ] Logs accessible: `docker-compose logs -f`
- [ ] Metrics available: `docker stats`
- [ ] Cron job for daily health check (optional):
  ```bash
  # 0 9 * * * /home/iware/scripts/health-check.sh > /tmp/health.log 2>&1
  ```

### Backup Configuration
- [ ] Backup script tested: `bash scripts/backup.sh`
- [ ] MySQL backup successful
- [ ] Environment file backed up
- [ ] Backups directory created: `ls -la backups/`
- [ ] Cron job for daily backup (optional):
  ```bash
  # 0 2 * * * /home/iware/scripts/backup.sh
  ```
- [ ] Backup tested - can be restored if needed

### Logging
- [ ] Backend logs directory exists: `ls -la backend/logs/`
- [ ] Nginx logs directory exists: `docker exec iware-nginx ls -la /var/log/nginx/`
- [ ] Log rotation configured (optional)
- [ ] Logs don't fill disk: `df -h | grep "log"`

---

## Phase 8: Security Hardening

### Application Security
- [ ] JWT tokens configured with secrets
- [ ] CORS origin restricted to yourdomain.com
- [ ] Rate limiting enabled in Nginx
- [ ] Security headers present: `curl -I https://yourdomain.com`
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Strict-Transport-Security: max-age=31536000

### Container Security
- [ ] Containers run as non-root user
- [ ] No hardcoded secrets in image
- [ ] .env file not in Docker image
- [ ] Volumes mounted read-only where possible

### Infrastructure Security
- [ ] Firewall rules minimal and correct:
  - [ ] SSH (22) only from allowed IPs (if possible)
  - [ ] HTTP (80) open to all (for Let's Encrypt)
  - [ ] HTTPS (443) open to all
  - [ ] Other ports closed
- [ ] SSH key-based auth only (password disabled)
- [ ] Root login disabled (sudo only)
- [ ] Automatic security updates enabled

---

## Phase 9: Testing & Validation

### Functional Testing
- [ ] Frontend loads at https://yourdomain.com
- [ ] All pages accessible without errors
- [ ] Navigation between pages works
- [ ] Forms submit successfully
- [ ] API endpoints responding:
  - [ ] GET /api/health → 200 OK
  - [ ] POST /api/auth/login → Works
  - [ ] Other key endpoints tested
- [ ] Database queries work correctly
- [ ] Integration with Accurate Online working (if configured)

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No console errors
- [ ] Network requests optimized
- [ ] Images compressed
- [ ] CSS/JS minified

### Load Testing (Optional)
- [ ] Can handle 10+ concurrent users
- [ ] CPU usage stays < 80%
- [ ] Memory usage reasonable
- [ ] No connection timeouts

### Error Handling
- [ ] Database fails gracefully
- [ ] Backend errors logged
- [ ] Frontend shows user-friendly error messages
- [ ] 404 errors handled
- [ ] No sensitive data in error messages

---

## Phase 10: Documentation & Handover

### Documentation
- [ ] DEPLOYMENT.md completed
- [ ] QUICKSTART.md reviewed
- [ ] TROUBLESHOOTING.md available
- [ ] Deployment scripts documented
- [ ] Environment variables documented
- [ ] Database schema documented

### Admin Access
- [ ] Admin user created & tested
- [ ] Admin password secure
- [ ] SSH keys distributed (if team)
- [ ] VPS credentials stored securely
- [ ] Database credentials backed up securely

### Runbooks Created
- [ ] How to deploy updates
- [ ] How to rollback
- [ ] How to handle common errors
- [ ] How to scale if needed
- [ ] How to backup and restore

---

## Phase 11: Post-Deployment (First Week)

### Daily Monitoring
- [ ] Check health: `bash scripts/health-check.sh`
- [ ] Review logs: `docker-compose logs`
- [ ] Monitor resources: `docker stats`
- [ ] Check for errors: `curl https://yourdomain.com`

### Weekly Tasks
- [ ] Review error logs
- [ ] Check certificate expiry: `sudo certbot certificates`
- [ ] Verify backups: `ls -la backups/`
- [ ] Test backup restore process
- [ ] Check system updates: `sudo apt list --upgradable`

### Security Review
- [ ] SSL Labs rating verified (A or A+)
- [ ] No security warnings
- [ ] Access logs reviewed
- [ ] Database user privileges correct
- [ ] Secrets not exposed

---

## Phase 12: Ongoing Maintenance

### Monthly
- [ ] Update all packages: `sudo apt update && sudo apt upgrade -y`
- [ ] Rebuild Docker images with latest base images
- [ ] Review and rotate credentials (if needed)
- [ ] Database optimization
- [ ] Disk space check

### Quarterly
- [ ] Full disaster recovery test
- [ ] Restore from backup
- [ ] Security audit
- [ ] Performance review
- [ ] Update documentation

### Yearly
- [ ] Major version updates
- [ ] Infrastructure review
- [ ] Capacity planning
- [ ] Security assessment
- [ ] Architecture review

---

## 🎯 Success Criteria

Deployment is considered **SUCCESSFUL** when:

✅ All Phase 1-10 checkboxes are complete
✅ Application is accessible at https://yourdomain.com
✅ All features working as expected
✅ SSL certificate valid and auto-renewing
✅ Services auto-restart on failure
✅ Monitoring and alerting configured
✅ Backups working and tested
✅ Documentation complete
✅ Team trained on operations
✅ Zero critical security issues

---

## 🚀 Final Verification

Run these commands to verify everything:

```bash
# 1. Development team
docker-compose ps
bash scripts/health-check.sh
bash scripts/verify-deployment.sh

# 2. SSL verification
curl -I https://yourdomain.com
sudo certbot certificates

# 3. Database verification
docker-compose exec -T mysql mysql -u iware_user -p<password> iware_warehouse -e "SHOW TABLES;"

# 4. Service status
sudo systemctl status iware

# 5. Backup verification
ls -lah backups/
```

---

## 📊 Post-Deployment Report

### To Fill After Deployment:

**Deployment Date:** _______________

**Deployed By:** _______________

**Domain:** _______________

**VPS IP:** _______________

**Server Environment:**
- OS: _______________
- CPUs: _______________
- RAM: _______________
- Storage: _______________

**Performance Metrics:**
- Frontend Load Time: _______________ ms
- API Response Time: _______________ ms
- Database Connections: _______________
- Memory Usage: _______________ %

**Backup Status:**
- Last Backup: _______________
- Backup Size: _______________
- Restore Tested: Yes / No

**SSL Certificate:**
- Domain: _______________
- Issued: _______________
- Expires: _______________
- Expiry Status: _______________

**Known Issues (if any):**
1. _______________
2. _______________

**Next Review Date:** _______________

---

**Document Version:** 1.0.0  
**Last Updated:** Maret 2026  
**Maintained by:** iWare Team
