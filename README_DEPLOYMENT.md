# 📦 Deployment Package - Sales Invoice History Feature

## 📚 Dokumentasi yang Tersedia

Paket deployment ini berisi semua file dan dokumentasi yang diperlukan untuk deploy fitur Sales Invoice History ke VPS dengan Docker.

---

## 📄 File Dokumentasi

### 1. **DEPLOY_DOCKER_VPS.md** ⭐ UTAMA
**Untuk siapa:** DevOps, System Administrator  
**Isi:** Panduan deployment lengkap step-by-step untuk Docker + VPS  
**Kapan digunakan:** Saat melakukan deployment pertama kali atau troubleshooting

**Highlights:**
- ✅ Step-by-step deployment dengan command lengkap
- ✅ Troubleshooting guide untuk masalah umum
- ✅ Rollback plan jika ada masalah
- ✅ Monitoring dan maintenance tips

---

### 2. **QUICK_DEPLOY.md** ⚡ QUICK REFERENCE
**Untuk siapa:** Developer, DevOps yang sudah familiar  
**Isi:** Ringkasan singkat command-command penting  
**Kapan digunakan:** Saat butuh referensi cepat atau deploy ulang

**Highlights:**
- ✅ Command-command penting dalam 1 halaman
- ✅ Quick troubleshooting
- ✅ Bisa di-print untuk referensi cepat

---

### 3. **DEPLOYMENT_CHECKLIST.md** ✅ CHECKLIST
**Untuk siapa:** Project Manager, QA, DevOps  
**Isi:** Checklist lengkap untuk memastikan deployment sukses  
**Kapan digunakan:** Sebelum, saat, dan setelah deployment

**Highlights:**
- ✅ Pre-deployment checklist
- ✅ Deployment steps checklist
- ✅ Post-deployment verification
- ✅ Sign-off section untuk audit trail

---

### 4. **FITUR_HISTORY_FAKTUR.md** 📖 USER GUIDE
**Untuk siapa:** Developer, End User, Support Team  
**Isi:** Dokumentasi lengkap tentang fitur dan cara menggunakannya  
**Kapan digunakan:** Untuk memahami fitur dan cara pakainya

**Highlights:**
- ✅ Penjelasan fitur dan cara kerja
- ✅ Setup dan konfigurasi
- ✅ Troubleshooting user-facing issues
- ✅ Future enhancement ideas

---

### 5. **API_HISTORY_FAKTUR.md** 🔌 API REFERENCE
**Untuk siapa:** Developer, Integration Team  
**Isi:** Dokumentasi API endpoints lengkap  
**Kapan digunakan:** Saat develop atau integrate dengan API

**Highlights:**
- ✅ Semua endpoint dengan contoh request/response
- ✅ Error codes dan handling
- ✅ Integration examples (React, Node.js)
- ✅ Testing examples dengan curl

---

### 6. **ENV_EXAMPLE_UPDATE.md** 🔐 ENVIRONMENT VARS
**Untuk siapa:** DevOps, System Administrator  
**Isi:** Environment variables yang diperlukan  
**Kapan digunakan:** Saat setup atau troubleshoot environment

**Highlights:**
- ✅ List environment variables yang digunakan
- ✅ Cara verifikasi environment
- ✅ Security notes

---

## 🚀 Script Deployment Otomatis

### 1. **deploy.sh** (Linux/Mac)
Script bash otomatis untuk deployment di Linux/Mac.

**Cara pakai:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Fitur:**
- ✅ Auto backup database
- ✅ Pull code dari Git
- ✅ Run database migration
- ✅ Rebuild & restart containers
- ✅ Verification otomatis
- ✅ Colored output untuk readability

---

### 2. **deploy.bat** (Windows)
Script batch otomatis untuk deployment di Windows.

**Cara pakai:**
```bash
deploy.bat
```

**Fitur:**
- ✅ Same features as deploy.sh
- ✅ Windows-compatible commands

---

## 📁 File Database

### 1. **backend/database/add-sales-invoice-history.sql**
File SQL migration untuk membuat tabel dan view baru.

**Isi:**
- Tabel `sales_invoice_history`
- View `v_sales_invoice_history`

---

### 2. **backend/database/run-migration.sh** (Linux/Mac)
Script untuk menjalankan migration secara manual.

**Cara pakai:**
```bash
cd backend/database
chmod +x run-migration.sh
./run-migration.sh
```

---

### 3. **backend/database/run-migration.bat** (Windows)
Script untuk menjalankan migration secara manual di Windows.

**Cara pakai:**
```bash
cd backend\database
run-migration.bat
```

---

## 🎯 Rekomendasi Workflow

### Untuk Deployment Pertama Kali:

1. **Baca dulu:** `DEPLOY_DOCKER_VPS.md` (15 menit)
2. **Siapkan:** Backup database, pull code
3. **Jalankan:** `./deploy.sh` atau `deploy.bat`
4. **Verifikasi:** Ikuti checklist di `DEPLOYMENT_CHECKLIST.md`
5. **Test:** Buka aplikasi dan test fitur

### Untuk Deployment Ulang:

1. **Quick reference:** `QUICK_DEPLOY.md`
2. **Jalankan:** `./deploy.sh` atau manual commands
3. **Verifikasi:** Quick check dari `DEPLOYMENT_CHECKLIST.md`

### Untuk Troubleshooting:

1. **Cek:** `DEPLOY_DOCKER_VPS.md` → Section Troubleshooting
2. **Cek logs:** `docker-compose logs -f backend`
3. **Rollback:** Ikuti rollback plan di dokumentasi

### Untuk Developer:

1. **Pahami fitur:** `FITUR_HISTORY_FAKTUR.md`
2. **API reference:** `API_HISTORY_FAKTUR.md`
3. **Test:** `backend/src/scripts/test-invoice-history.js`

---

## 🔍 Quick Start (TL;DR)

**Paling cepat (otomatis):**
```bash
# Linux/Mac
./deploy.sh

# Windows
deploy.bat
```

**Manual (jika script tidak bisa dijalankan):**
```bash
# 1. Backup
docker exec iware-mysql mysqldump -u root -p iware_warehouse > backup.sql

# 2. Pull code
git pull origin main

# 3. Migration
docker cp backend/database/add-sales-invoice-history.sql iware-mysql:/tmp/
docker exec -it iware-mysql mysql -u root -p iware_warehouse -e "source /tmp/add-sales-invoice-history.sql"

# 4. Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 5. Verify
docker-compose ps
curl http://localhost:5000/health
```

---

## 📞 Support

**Jika ada masalah:**

1. **Cek dokumentasi troubleshooting:**
   - `DEPLOY_DOCKER_VPS.md` → Troubleshooting section
   - `FITUR_HISTORY_FAKTUR.md` → Troubleshooting section

2. **Cek logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f mysql
   ```

3. **Test API:**
   ```bash
   curl http://localhost:5000/health
   node backend/src/scripts/test-invoice-history.js
   ```

4. **Rollback jika perlu:**
   - Restore database dari backup
   - Revert code: `git revert HEAD`
   - Rebuild: `docker-compose build && docker-compose up -d`

5. **Contact team:**
   - Sertakan error logs
   - Sertakan output dari `docker-compose ps`
   - Jelaskan step yang sudah dilakukan

---

## 📋 File Structure

```
.
├── README_DEPLOYMENT.md          # File ini
├── DEPLOY_DOCKER_VPS.md          # ⭐ Panduan deployment lengkap
├── QUICK_DEPLOY.md               # ⚡ Quick reference
├── DEPLOYMENT_CHECKLIST.md       # ✅ Checklist deployment
├── FITUR_HISTORY_FAKTUR.md       # 📖 User guide
├── API_HISTORY_FAKTUR.md         # 🔌 API reference
├── ENV_EXAMPLE_UPDATE.md         # 🔐 Environment variables
├── deploy.sh                     # 🚀 Auto deploy script (Linux/Mac)
├── deploy.bat                    # 🚀 Auto deploy script (Windows)
│
├── backend/
│   ├── database/
│   │   ├── add-sales-invoice-history.sql
│   │   ├── run-migration.sh
│   │   └── run-migration.bat
│   │
│   ├── src/
│   │   ├── models/
│   │   │   └── SalesInvoiceHistory.js
│   │   ├── services/
│   │   │   └── CustomerService.js
│   │   ├── controllers/
│   │   │   └── SalesInvoiceHistoryController.js
│   │   ├── routes/
│   │   │   └── salesInvoiceHistory.js
│   │   └── scripts/
│   │       └── test-invoice-history.js
│   │
│   └── server.js (updated)
│
└── frontend/
    └── src/
        ├── components/
        │   └── SalesInvoiceHistory.jsx
        └── pages/
            └── SalesOrdersPage.jsx (updated)
```

---

## ✅ Pre-Deployment Checklist

Sebelum deploy, pastikan:

- [ ] VPS accessible via SSH
- [ ] Docker & Docker Compose installed
- [ ] Git repository accessible
- [ ] Database credentials ready
- [ ] Backup strategy in place
- [ ] Team notified about deployment
- [ ] Maintenance window scheduled (if needed)

---

## 🎉 Post-Deployment

Setelah deployment sukses:

1. ✅ Verify semua containers running
2. ✅ Test API endpoints
3. ✅ Test frontend feature
4. ✅ Check logs untuk errors
5. ✅ Notify team deployment complete
6. ✅ Update documentation
7. ✅ Save backup file safely

---

## 📊 Deployment Timeline

**Estimated time:**
- Backup: 2-5 minutes
- Pull code: 1 minute
- Migration: 1 minute
- Rebuild containers: 5-10 minutes
- Verification: 5 minutes
- **Total: ~15-25 minutes**

---

## 🔒 Security Notes

- ✅ Always backup before deployment
- ✅ Use strong passwords
- ✅ Don't commit `.env` files
- ✅ Keep backup files secure
- ✅ Rotate credentials regularly
- ✅ Monitor logs for suspicious activity

---

## 📈 Version History

**v1.0.0** (2026-04-20)
- Initial release
- Sales Invoice History feature
- Complete deployment package

---

**Happy Deploying! 🚀**

For questions or issues, refer to the troubleshooting sections in the documentation or contact the development team.
