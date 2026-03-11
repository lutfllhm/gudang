# 🎯 START HERE - Panduan Memulai

Selamat datang! Dokumen ini akan memandu Anda memulai dengan aplikasi iWare Warehouse.

---

## 🤔 Apa yang Anda Ingin Lakukan?

### 1️⃣ Deploy ke VPS Production (Hostinger)

**Waktu:** ~60 menit  
**Skill Level:** Intermediate  
**Hasil:** Aplikasi live di internet dengan SSL/HTTPS

**Mulai dari:**
1. 📖 Baca: [DEPLOY-VPS-HOSTINGER.md](DEPLOY-VPS-HOSTINGER.md)
2. ✅ Print: [QUICK-DEPLOY-CHECKLIST.md](QUICK-DEPLOY-CHECKLIST.md)
3. 📝 Simpan: [COMMAND-REFERENCE.md](COMMAND-REFERENCE.md)

**Yang Anda Butuhkan:**
- VPS Hostinger KVM 2 (atau VPS lain dengan Ubuntu)
- Domain (opsional, bisa pakai IP)
- Akun Accurate Online
- Terminal/SSH client

---

### 2️⃣ Testing di Local (Development)

**Waktu:** ~15 menit  
**Skill Level:** Beginner  
**Hasil:** Aplikasi berjalan di komputer lokal

**Langkah Cepat:**

```bash
# 1. Clone repository
git clone YOUR_REPO_URL
cd iware-warehouse

# 2. Edit backend/.env dengan kredensial Accurate
nano backend/.env

# 3. Start dengan Docker
docker compose up -d

# 4. Create admin user
docker compose exec backend node src/scripts/create-admin-auto.js

# 5. Open browser
# http://localhost
```

**Yang Anda Butuhkan:**
- Docker & Docker Compose terinstall
- Akun Accurate Online (untuk kredensial)
- Text editor

---

### 3️⃣ Setup Accurate Online Integration

**Waktu:** ~10 menit  
**Skill Level:** Beginner  
**Hasil:** Aplikasi terhubung ke Accurate Online

**Mulai dari:**
1. 📖 Baca: [ACCURATE-SETUP-GUIDE.md](ACCURATE-SETUP-GUIDE.md)
2. ✅ Checklist: [INTEGRATION-STATUS.md](INTEGRATION-STATUS.md)

**Langkah Singkat:**
1. Buka https://account.accurate.id/developer/application
2. Buat aplikasi baru
3. Catat: APP_KEY, CLIENT_ID, CLIENT_SECRET, SIGNATURE_SECRET
4. Isi ke `backend/.env`
5. Restart aplikasi
6. Connect via frontend

---

### 4️⃣ Memahami Arsitektur & Konfigurasi

**Untuk Developer/DevOps yang ingin memahami detail teknis**

**Baca:**
- [ACCURATE-INTEGRATION-ANALYSIS.md](ACCURATE-INTEGRATION-ANALYSIS.md) - Analisis teknis integrasi
- [DOCKER-COMPOSE-COMPARISON.md](DOCKER-COMPOSE-COMPARISON.md) - Arsitektur Docker
- [NGINX-SETUP.md](NGINX-SETUP.md) - Konfigurasi Nginx & SSL

---

## 📋 Checklist Persiapan

Sebelum mulai, pastikan Anda punya:

### Untuk Local Development
- [ ] Docker terinstall
- [ ] Docker Compose terinstall
- [ ] Git terinstall
- [ ] Text editor (VS Code, Sublime, dll)
- [ ] Akun Accurate Online

### Untuk Production VPS
- [ ] VPS aktif (Hostinger KVM 2 atau sejenis)
- [ ] IP Address VPS
- [ ] SSH access (username & password)
- [ ] Domain (opsional)
- [ ] Akun Accurate Online
- [ ] Email untuk SSL certificate

---

## 🎓 Skill Level Guide

### Beginner
- Bisa menggunakan terminal/command line
- Familiar dengan konsep client-server
- Bisa edit file text

**Recommended:**
- Local development
- Mengikuti panduan step-by-step

### Intermediate
- Familiar dengan Docker
- Pernah deploy aplikasi ke VPS
- Mengerti DNS & domain

**Recommended:**
- VPS deployment
- SSL/HTTPS setup
- Production configuration

### Advanced
- Expert Docker & containerization
- Familiar dengan Nginx
- Mengerti security best practices

**Recommended:**
- Custom configuration
- Load balancing
- Advanced monitoring

---

## 🚀 Quick Start Paths

### Path A: Fastest (Local Testing)
```
1. Clone repo (2 min)
2. Edit backend/.env (5 min)
3. docker compose up -d (3 min)
4. Create admin (1 min)
5. Connect to Accurate (5 min)
Total: 15 minutes
```

### Path B: Production Ready (VPS)
```
1. Setup VPS (10 min)
2. Install Docker (10 min)
3. Clone & configure (15 min)
4. Setup Accurate (5 min)
5. Deploy (10 min)
6. Setup SSL (5 min)
7. Testing (5 min)
Total: 60 minutes
```

### Path C: Understanding First
```
1. Read ACCURATE-INTEGRATION-ANALYSIS.md (15 min)
2. Read DOCKER-COMPOSE-COMPARISON.md (10 min)
3. Read NGINX-SETUP.md (10 min)
4. Then follow Path A or B
Total: 35 min + deployment time
```

---

## 📖 Documentation Map

```
START-HERE.md (You are here!)
│
├─ DEPLOY-VPS-HOSTINGER.md ← Production deployment
│  ├─ QUICK-DEPLOY-CHECKLIST.md ← Print this
│  └─ COMMAND-REFERENCE.md ← Save for reference
│
├─ ACCURATE-SETUP-GUIDE.md ← Accurate Online setup
│  ├─ ACCURATE-INTEGRATION-ANALYSIS.md ← Technical details
│  └─ INTEGRATION-STATUS.md ← Status checklist
│
├─ NGINX-SETUP.md ← Nginx & SSL configuration
│  └─ DOCKER-COMPOSE-COMPARISON.md ← Architecture
│
└─ README.md ← Project overview
```

---

## 🎯 Recommended Learning Path

### Day 1: Local Setup (1 hour)
1. Read this file (5 min)
2. Setup local development (15 min)
3. Setup Accurate Online (10 min)
4. Test basic features (30 min)

### Day 2: Understanding (2 hours)
1. Read ACCURATE-INTEGRATION-ANALYSIS.md (30 min)
2. Read DOCKER-COMPOSE-COMPARISON.md (30 min)
3. Read NGINX-SETUP.md (30 min)
4. Experiment with configuration (30 min)

### Day 3: Production Deployment (2 hours)
1. Prepare VPS (30 min)
2. Follow DEPLOY-VPS-HOSTINGER.md (60 min)
3. Testing & verification (30 min)

### Day 4: Optimization (1 hour)
1. Setup monitoring (20 min)
2. Configure backup (20 min)
3. Performance tuning (20 min)

---

## ❓ FAQ

### Q: Apakah saya harus punya domain?
**A:** Tidak wajib. Anda bisa pakai IP address VPS. Tapi domain recommended untuk production.

### Q: Berapa biaya VPS Hostinger KVM 2?
**A:** Sekitar $10-15/bulan. Cek website Hostinger untuk harga terbaru.

### Q: Apakah bisa deploy di VPS lain (bukan Hostinger)?
**A:** Ya! Panduan ini bisa digunakan untuk VPS manapun dengan Ubuntu 20.04/22.04.

### Q: Apakah harus pakai Docker?
**A:** Ya, aplikasi ini dirancang untuk deploy dengan Docker untuk kemudahan dan konsistensi.

### Q: Bagaimana cara update aplikasi?
**A:** Pull latest code, rebuild Docker images, restart services. Detail di COMMAND-REFERENCE.md

### Q: Apakah data aman?
**A:** Ya, dengan konfigurasi yang benar (SSL, firewall, strong passwords). Ikuti security checklist di panduan deployment.

---

## 🆘 Butuh Bantuan?

### Troubleshooting
1. Cek [COMMAND-REFERENCE.md](COMMAND-REFERENCE.md) - Troubleshooting section
2. Cek logs: `docker compose logs -f`
3. Cek [DEPLOY-VPS-HOSTINGER.md](DEPLOY-VPS-HOSTINGER.md) - Troubleshooting section

### Resources
- Accurate API Docs: https://accurate.id/api-docs
- Docker Docs: https://docs.docker.com
- Hostinger Tutorials: https://www.hostinger.com/tutorials

### Support
- Open issue di repository
- Email: support@your-company.com

---

## ✅ Ready to Start?

**Pilih path Anda:**

🏠 **Local Development** → Scroll up ke "2️⃣ Testing di Local"

🚀 **Production VPS** → Open [DEPLOY-VPS-HOSTINGER.md](DEPLOY-VPS-HOSTINGER.md)

🔗 **Accurate Setup** → Open [ACCURATE-SETUP-GUIDE.md](ACCURATE-SETUP-GUIDE.md)

📚 **Learn First** → Open [ACCURATE-INTEGRATION-ANALYSIS.md](ACCURATE-INTEGRATION-ANALYSIS.md)

---

**Good luck! 🎉**

Jika ada pertanyaan, jangan ragu untuk membuka issue atau menghubungi support.
