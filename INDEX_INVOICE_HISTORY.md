# 📚 Index - Histori Faktur Penjualan

Panduan navigasi lengkap untuk semua dokumentasi dan script.

---

## 🎯 Mulai Dari Mana?

### 👋 Baru Pertama Kali?
**Start here:** [`README_INVOICE_HISTORY.md`](README_INVOICE_HISTORY.md)

### ⚡ Mau Langsung Deploy?
**Start here:** [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md)

### 💻 Pengguna Windows?
**Start here:** [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md)

### 📖 Butuh Detail Teknis?
**Start here:** [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md)

---

## 📄 Dokumentasi

### 1. Overview & Getting Started

| File | Deskripsi | Untuk Siapa |
|------|-----------|-------------|
| [`README_INVOICE_HISTORY.md`](README_INVOICE_HISTORY.md) | Dokumentasi utama, overview lengkap | Semua orang |
| [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md) | Panduan cepat 3 langkah | Yang mau cepat deploy |
| [`SUMMARY_INVOICE_HISTORY.md`](SUMMARY_INVOICE_HISTORY.md) | Ringkasan status dan fitur | Management, overview |

### 2. Technical Documentation

| File | Deskripsi | Untuk Siapa |
|------|-----------|-------------|
| [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md) | Dokumentasi teknis lengkap | Developer, DevOps |
| [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md) | Panduan menjalankan script | DevOps, Sysadmin |

### 3. Platform-Specific Guides

| File | Deskripsi | Untuk Siapa |
|------|-----------|-------------|
| [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md) | Panduan deployment Windows | Windows users |
| [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) | Checklist deployment | DevOps, QA |

### 4. This File

| File | Deskripsi | Untuk Siapa |
|------|-----------|-------------|
| [`INDEX_INVOICE_HISTORY.md`](INDEX_INVOICE_HISTORY.md) | File ini - navigasi dokumentasi | Semua orang |

---

## 🔧 Scripts

### Bash Scripts (Linux/Mac/Git Bash)

| Script | Fungsi | Command |
|--------|--------|---------|
| `deploy-invoice-history.sh` | Deploy ke VPS | `./deploy-invoice-history.sh` |
| `verify-invoice-history.sh` | Verifikasi deployment | `./verify-invoice-history.sh` |
| `test-invoice-history-api.sh` | Test API endpoints | `./test-invoice-history-api.sh` |

### PowerShell Scripts (Windows)

| Script | Fungsi | Command |
|--------|--------|---------|
| `Deploy-InvoiceHistory.ps1` | Deploy ke VPS | `.\Deploy-InvoiceHistory.ps1` |
| `Verify-InvoiceHistory.ps1` | Verifikasi deployment | `.\Verify-InvoiceHistory.ps1` |
| `Test-InvoiceHistoryApi.ps1` | Test API endpoints | `.\Test-InvoiceHistoryApi.ps1` |

**Panduan lengkap:** [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md)

---

## 🗂️ Source Code

### Backend Files

| File | Deskripsi | Path |
|------|-----------|------|
| Migration | Database schema | `backend/database/add-sales-invoice-history.sql` |
| Controller | HTTP handlers | `backend/src/controllers/SalesInvoiceHistoryController.js` |
| Model | Database operations | `backend/src/models/SalesInvoiceHistory.js` |
| Service (Customer) | Sync logic | `backend/src/services/CustomerService.js` |
| Service (Sync) | Auto sync | `backend/src/services/SyncService.js` |
| Routes | API endpoints | `backend/src/routes/salesInvoiceHistory.js` |

---

## 🎓 Learning Path

### Path 1: Quick Deploy (15 menit)
1. Baca [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md)
2. Jalankan script deploy
3. Verifikasi dengan script verify
4. Done!

### Path 2: Understanding First (30 menit)
1. Baca [`README_INVOICE_HISTORY.md`](README_INVOICE_HISTORY.md)
2. Baca [`SUMMARY_INVOICE_HISTORY.md`](SUMMARY_INVOICE_HISTORY.md)
3. Baca [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md)
4. Deploy dengan pemahaman penuh

### Path 3: Windows User (20 menit)
1. Baca [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md)
2. Install prerequisites
3. Deploy manual atau dengan PowerShell
4. Test API

### Path 4: DevOps/Production (45 menit)
1. Baca semua dokumentasi
2. Review [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)
3. Test di staging
4. Deploy ke production
5. Monitor dan dokumentasi

---

## 📊 Comparison Table

### Dokumentasi

| Aspek | README | Quick Start | Full Docs | Windows Guide |
|-------|--------|-------------|-----------|---------------|
| Panjang | Medium | Short | Long | Medium |
| Detail Teknis | Medium | Low | High | Medium |
| Step-by-step | ✓ | ✓✓ | ✓ | ✓✓ |
| Code Examples | ✓ | ✓ | ✓✓ | ✓✓ |
| Troubleshooting | ✓ | - | ✓✓ | ✓✓ |
| Platform | All | All | All | Windows |

### Scripts

| Aspek | Bash | PowerShell | Manual |
|-------|------|------------|--------|
| Platform | Linux/Mac/Git Bash | Windows | All |
| Automation | High | High | None |
| Flexibility | Medium | Medium | High |
| Error Handling | Good | Good | Manual |
| Prerequisites | SSH, SCP | OpenSSH | SSH, SCP |

---

## 🔍 Find What You Need

### By Role

**Developer:**
- [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md) - API docs
- Source code files in `backend/src/`

**DevOps/Sysadmin:**
- [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md) - Script usage
- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Deployment steps
- Deployment scripts

**Manager/PM:**
- [`SUMMARY_INVOICE_HISTORY.md`](SUMMARY_INVOICE_HISTORY.md) - Status overview
- [`README_INVOICE_HISTORY.md`](README_INVOICE_HISTORY.md) - Feature list

**QA/Tester:**
- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Test cases
- Test scripts
- API documentation

### By Task

**Deploy to VPS:**
1. [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md)
2. Run deploy script
3. [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)

**Understand Architecture:**
1. [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md)
2. Review source code
3. Check database schema

**Test API:**
1. [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md)
2. Run test script
3. [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md) - API section

**Troubleshoot Issues:**
1. [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md) - Troubleshooting section
2. [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md) - Troubleshooting section
3. Check logs on VPS

**Windows Deployment:**
1. [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md)
2. PowerShell scripts
3. [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md) - PowerShell section

---

## 🎯 Quick Links

### Documentation
- [Main README](README_INVOICE_HISTORY.md)
- [Quick Start](QUICK_START_INVOICE_HISTORY.md)
- [Full Documentation](INVOICE_HISTORY_INTEGRATION.md)
- [Summary](SUMMARY_INVOICE_HISTORY.md)
- [Windows Guide](DEPLOY_WINDOWS.md)
- [Scripts Guide](SCRIPTS_GUIDE.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### Scripts (Bash)
- [Deploy Script](deploy-invoice-history.sh)
- [Verify Script](verify-invoice-history.sh)
- [Test Script](test-invoice-history-api.sh)

### Scripts (PowerShell)
- [Deploy Script](Deploy-InvoiceHistory.ps1)
- [Verify Script](Verify-InvoiceHistory.ps1)
- [Test Script](Test-InvoiceHistoryApi.ps1)

### Source Code
- [Migration SQL](backend/database/add-sales-invoice-history.sql)
- [Controller](backend/src/controllers/SalesInvoiceHistoryController.js)
- [Model](backend/src/models/SalesInvoiceHistory.js)
- [Customer Service](backend/src/services/CustomerService.js)
- [Sync Service](backend/src/services/SyncService.js)
- [Routes](backend/src/routes/salesInvoiceHistory.js)

---

## 📞 Support

### Documentation Issues
- Check this index for correct file
- Review table of contents in each doc
- Use search (Ctrl+F) in documents

### Deployment Issues
- Check [`SCRIPTS_GUIDE.md`](SCRIPTS_GUIDE.md) troubleshooting
- Check [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md) troubleshooting
- Review logs on VPS

### API Issues
- Check [`INVOICE_HISTORY_INTEGRATION.md`](INVOICE_HISTORY_INTEGRATION.md) API section
- Test with provided curl commands
- Check backend logs

---

## 🚀 Next Steps

1. **Choose your path** from Learning Path section above
2. **Read the appropriate documentation**
3. **Run the deployment scripts**
4. **Verify and test**
5. **Monitor and maintain**

---

## 📝 Notes

- All documentation is in Markdown format
- Scripts are provided for both Bash and PowerShell
- Manual deployment steps available for all platforms
- Full source code included in repository

---

**Start here:** [`README_INVOICE_HISTORY.md`](README_INVOICE_HISTORY.md)

**Quick deploy:** [`QUICK_START_INVOICE_HISTORY.md`](QUICK_START_INVOICE_HISTORY.md)

**Need help?** Check the appropriate documentation from the tables above.
