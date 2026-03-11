# 📇 Quick Reference Card - iWare Warehouse

Print halaman ini untuk referensi cepat saat deployment.

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| **Application** | https://your-domain.com |
| **Backend API** | https://your-domain.com/api |
| **Health Check** | https://your-domain.com/health |
| **Accurate Developer** | https://account.accurate.id/developer/application |
| **Accurate API Docs** | https://accurate.id/api-docs |

---

## 🔑 Default Credentials

### Admin User (Change after first login!)
```
Email: superadmin@iware.id
Password: admin123
```

### Database
```
User: accurate_user
Password: (set in .env)
Database: iware_warehouse
```

---

## 🐳 Essential Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all
docker compose restart

# View logs (real-time)
docker compose logs -f

# Check status
docker compose ps

# Create admin user
docker compose exec backend node src/scripts/create-admin-auto.js

# Test Accurate connection
docker compose exec backend npm run test:accurate

# Backup database
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup.sql

# Connect to MySQL
docker compose exec mysql mysql -u accurate_user -p iware_warehouse
```

---

## 🔧 Quick Troubleshooting

### Backend tidak start
```bash
docker compose logs backend
docker compose restart backend
```

### Nginx 502 Error
```bash
docker compose ps backend
curl http://localhost:5000/health
docker compose restart nginx
```

### MySQL connection error
```bash
docker compose logs mysql
docker compose restart mysql
```

### Accurate connection failed
```bash
docker compose exec backend npm run test:accurate
cat backend/.env | grep ACCURATE
```

### SSL certificate error
```bash
sudo certbot renew
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
docker compose restart nginx
```

---

## 📁 Important Files

```
.env                    # Docker Compose environment
backend/.env            # Backend environment (ACCURATE credentials here!)
nginx/nginx.conf        # Nginx configuration
docker-compose.yml      # Docker orchestration
```

---

## 🔐 Environment Variables Checklist

### .env (Root)
- [ ] MYSQL_ROOT_PASSWORD
- [ ] DB_PASSWORD
- [ ] REDIS_PASSWORD
- [ ] VITE_API_URL

### backend/.env
- [ ] DB_PASSWORD (same as .env)
- [ ] JWT_SECRET (generate)
- [ ] JWT_REFRESH_SECRET (generate)
- [ ] ACCURATE_APP_KEY
- [ ] ACCURATE_CLIENT_ID
- [ ] ACCURATE_CLIENT_SECRET
- [ ] ACCURATE_SIGNATURE_SECRET
- [ ] ACCURATE_REDIRECT_URI
- [ ] CORS_ORIGIN
- [ ] WEBHOOK_SECRET (generate)

---

## 🔒 Security Checklist

- [ ] Firewall enabled (UFW)
- [ ] SSL/HTTPS configured
- [ ] Strong passwords (12+ chars)
- [ ] JWT secrets (32+ chars)
- [ ] Admin password changed
- [ ] Database not exposed
- [ ] Redis not exposed
- [ ] Fail2Ban installed

---

## 📊 Health Check Commands

```bash
# Application health
curl https://your-domain.com/health

# Backend health
curl http://localhost:5000/health

# Check all containers
docker compose ps | grep healthy

# Check resources
docker stats

# Check disk
df -h
```

---

## 🔄 Maintenance Commands

```bash
# Update system
apt update && apt upgrade -y

# Update application
git pull
docker compose build
docker compose up -d

# Backup database
docker compose exec mysql mysqldump -u root -p iware_warehouse > backup-$(date +%Y%m%d).sql

# Clean Docker
docker system prune -a

# View logs
tail -f backend/logs/combined.log
tail -f nginx/logs/access.log
```

---

## 📞 Emergency Contacts

| Issue | Action |
|-------|--------|
| **Server Down** | Check logs, restart services |
| **Database Error** | Check MySQL logs, restart MySQL |
| **Accurate API Error** | Check credentials, test connection |
| **SSL Expired** | Renew certificate, restart Nginx |
| **Out of Memory** | Check docker stats, restart services |
| **Disk Full** | Clean logs, prune Docker |

---

## 🎯 Quick Deploy Steps

1. **Setup VPS** (10 min)
   - Login SSH
   - Update system
   - Install Docker

2. **Configure** (15 min)
   - Clone project
   - Edit .env files
   - Get Accurate credentials

3. **Deploy** (10 min)
   - docker compose build
   - docker compose up -d
   - Create admin

4. **SSL** (5 min)
   - Install certbot
   - Generate certificate
   - Enable HTTPS

5. **Test** (5 min)
   - Access application
   - Connect Accurate
   - Test sync

**Total: ~60 minutes**

---

## 📚 Documentation Quick Links

| Doc | Purpose |
|-----|---------|
| START-HERE.md | Panduan memulai |
| DEPLOY-VPS-HOSTINGER.md | Deploy VPS lengkap |
| QUICK-DEPLOY-CHECKLIST.md | Checklist deployment |
| COMMAND-REFERENCE.md | Command lengkap |
| ACCURATE-SETUP-GUIDE.md | Setup Accurate |
| SUMMARY.md | Ringkasan project |

---

## 💡 Pro Tips

1. **Always check logs first**
   ```bash
   docker compose logs -f
   ```

2. **Test before deploy**
   ```bash
   docker compose exec nginx nginx -t
   ```

3. **Backup before update**
   ```bash
   docker compose exec mysql mysqldump -u root -p iware_warehouse > backup.sql
   ```

4. **Monitor resources**
   ```bash
   docker stats
   htop
   ```

5. **Keep credentials safe**
   - Never commit .env to git
   - Use strong passwords
   - Backup .env securely

---

## 🆘 When Things Go Wrong

1. **Check logs**
   ```bash
   docker compose logs -f backend
   ```

2. **Check status**
   ```bash
   docker compose ps
   ```

3. **Restart service**
   ```bash
   docker compose restart backend
   ```

4. **Check environment**
   ```bash
   docker compose exec backend env | grep ACCURATE
   ```

5. **Test connection**
   ```bash
   docker compose exec backend npm run test:accurate
   ```

6. **Still broken?**
   - Read DEPLOY-VPS-HOSTINGER.md troubleshooting section
   - Check COMMAND-REFERENCE.md
   - Open issue in repository

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible
- [ ] SSL/HTTPS working
- [ ] Admin login successful
- [ ] Accurate connected
- [ ] Data sync working
- [ ] Backup configured
- [ ] Monitoring setup
- [ ] Admin password changed
- [ ] Documentation reviewed
- [ ] Team notified

---

**Print this page and keep it handy during deployment!** 📄

**Version:** 2.0.0  
**Last Updated:** 11 Maret 2026
