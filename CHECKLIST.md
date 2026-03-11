# ✅ Deployment Checklist

## 📋 Pre-Deployment

### VPS Preparation
- [ ] VPS provisioned (Hostinger KVM 2)
- [ ] Ubuntu 22.04 installed
- [ ] Root access available
- [ ] SSH key configured
- [ ] Domain purchased (iwareid.com)
- [ ] Domain DNS pointed to VPS IP

### Local Preparation
- [ ] Repository cloned/downloaded
- [ ] All files reviewed
- [ ] Accurate Online developer account created
- [ ] API credentials obtained from Accurate

---

## 🔧 Initial Setup

### VPS Configuration
- [ ] Logged into VPS via SSH
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Docker service started and enabled

### Project Setup
- [ ] Project directory created (`/var/www/iware-warehouse`)
- [ ] Repository cloned to VPS
- [ ] Scripts made executable (`chmod +x scripts/*.sh`)
- [ ] Directory structure verified

---

## ⚙️ Configuration

### Environment Variables
- [ ] `.env.production` copied from template
- [ ] MySQL root password set (strong password)
- [ ] Database user password set (strong password)
- [ ] Redis password set (strong password)
- [ ] JWT secret generated (32+ characters)
- [ ] JWT refresh secret generated (32+ characters)
- [ ] Webhook secret generated (32+ characters)
- [ ] Accurate API credentials configured:
  - [ ] ACCURATE_APP_KEY
  - [ ] ACCURATE_CLIENT_ID
  - [ ] ACCURATE_CLIENT_SECRET
  - [ ] ACCURATE_SIGNATURE_SECRET
- [ ] CORS origin set to domain
- [ ] VITE_API_URL set to domain/api

### Security
- [ ] All default passwords changed
- [ ] Strong passwords used (min 16 characters)
- [ ] Secrets properly generated (not default values)
- [ ] `.env.production` permissions set (chmod 600)

---

## 🚀 Deployment

### Build & Deploy
- [ ] `./scripts/deploy.sh` executed successfully
- [ ] All containers started
- [ ] No errors in deployment logs

### Container Status
- [ ] MySQL container: Up (healthy)
- [ ] Redis container: Up (healthy)
- [ ] Backend container: Up (healthy)
- [ ] Frontend container: Up (healthy)
- [ ] Nginx container: Up (healthy)

### Health Checks
- [ ] `./scripts/health-check.sh` passed
- [ ] MySQL responding to ping
- [ ] Redis responding to ping
- [ ] Backend API health endpoint working
- [ ] Frontend health endpoint working
- [ ] Nginx health endpoint working

---

## ✅ Verification

### Database
- [ ] MySQL accessible
- [ ] Database created
- [ ] Tables created
- [ ] Admin user created
- [ ] Can login to MySQL shell

### Redis
- [ ] Redis accessible
- [ ] Can execute PING command
- [ ] Password authentication working

### Backend API
- [ ] Health endpoint responding: `/health`
- [ ] API health endpoint responding: `/api/health`
- [ ] Can access backend directly (port 5000)
- [ ] Database connection working
- [ ] Redis connection working

### Frontend
- [ ] Frontend accessible (port 3000)
- [ ] Static files loading
- [ ] Health endpoint responding
- [ ] Build files present

### Nginx
- [ ] Nginx accessible (port 80)
- [ ] Health endpoint responding
- [ ] Frontend proxying working
- [ ] Backend API proxying working
- [ ] Static files caching working

### Domain Access
- [ ] Frontend accessible via domain
- [ ] Backend API accessible via domain/api
- [ ] Health check accessible via domain/health
- [ ] No CORS errors in browser console

---

## 🔒 SSL/HTTPS (Optional but Recommended)

### Certificate Setup
- [ ] Certbot installed
- [ ] SSL certificate generated
- [ ] Certificate files copied to nginx/ssl/
- [ ] Nginx HTTPS configuration uncommented
- [ ] Nginx restarted with SSL config
- [ ] HTTPS accessible
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured

---

## 🧪 Testing

### Functional Testing
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] Dashboard loads correctly
- [ ] Can view items page
- [ ] Can view sales orders page
- [ ] API endpoints responding correctly
- [ ] No JavaScript errors in console

### Integration Testing
- [ ] Accurate OAuth flow working
- [ ] Can connect to Accurate Online
- [ ] Data sync working
- [ ] Webhook receiving data

### Performance Testing
- [ ] Page load time acceptable (<3s)
- [ ] API response time acceptable (<500ms)
- [ ] No memory leaks
- [ ] CPU usage normal

---

## 📊 Monitoring Setup

### Logging
- [ ] Backend logs being written
- [ ] Nginx logs being written
- [ ] Log rotation configured
- [ ] Can view logs via scripts

### Health Monitoring
- [ ] Health check script working
- [ ] Connection test script working
- [ ] Monitor script working
- [ ] Debug script working

### Backup
- [ ] Backup script tested
- [ ] Backup directory created
- [ ] Database backup working
- [ ] Backup cron job configured (optional)

---

## 📝 Documentation

### Documentation Complete
- [ ] README.md reviewed
- [ ] DEPLOYMENT.md reviewed
- [ ] QUICK-START.md reviewed
- [ ] TROUBLESHOOTING.md reviewed
- [ ] COMMANDS.md reviewed
- [ ] All scripts documented

### Team Handoff
- [ ] Credentials documented (securely)
- [ ] Access information shared
- [ ] Maintenance procedures documented
- [ ] Emergency contacts listed

---

## 🎯 Post-Deployment

### Immediate Tasks
- [ ] Monitor logs for errors
- [ ] Test all major features
- [ ] Verify auto-sync working
- [ ] Check resource usage
- [ ] Document any issues

### Within 24 Hours
- [ ] Monitor container health
- [ ] Check disk space
- [ ] Review logs for warnings
- [ ] Test backup/restore
- [ ] Verify SSL auto-renewal (if configured)

### Within 1 Week
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Backup verification
- [ ] Documentation updates

---

## 🚨 Emergency Contacts

### Critical Information
- [ ] VPS provider support contact
- [ ] Domain registrar support
- [ ] Development team contacts
- [ ] Accurate Online support

### Access Information
- [ ] VPS IP address documented
- [ ] SSH access documented
- [ ] Database credentials secured
- [ ] API credentials secured

---

## 📞 Support Resources

### Documentation
- [ ] All documentation accessible
- [ ] Scripts location known
- [ ] Command reference available
- [ ] Troubleshooting guide available

### Tools
- [ ] Health check script tested
- [ ] Debug script tested
- [ ] Backup script tested
- [ ] Monitoring tools configured

---

## ✨ Production Ready Criteria

### All Must Pass
- [ ] All containers healthy
- [ ] All health checks passing
- [ ] Application accessible via domain
- [ ] No errors in logs
- [ ] Database working
- [ ] Redis working
- [ ] API endpoints working
- [ ] Frontend loading correctly
- [ ] SSL configured (recommended)
- [ ] Backups working
- [ ] Monitoring in place
- [ ] Documentation complete

---

## 🎉 Deployment Complete!

Once all items are checked:
- [ ] Deployment signed off
- [ ] Stakeholders notified
- [ ] Go-live announced
- [ ] Monitoring active
- [ ] Support ready

---

## 📝 Notes

Use this space to document any specific issues, customizations, or important information:

```
Date: _______________
Deployed by: _______________
VPS IP: _______________
Domain: _______________
Issues encountered: _______________
Customizations made: _______________
```
