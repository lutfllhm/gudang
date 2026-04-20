# 📜 Scripts Guide - Histori Faktur Penjualan

Panduan lengkap untuk menjalankan semua script deployment dan testing.

---

## 📋 Daftar Script

### Bash Scripts (Linux/Mac/Git Bash)
1. `deploy-invoice-history.sh` - Deploy ke VPS
2. `verify-invoice-history.sh` - Verifikasi deployment
3. `test-invoice-history-api.sh` - Test API endpoints

### PowerShell Scripts (Windows)
1. `Deploy-InvoiceHistory.ps1` - Deploy ke VPS
2. `Verify-InvoiceHistory.ps1` - Verifikasi deployment
3. `Test-InvoiceHistoryApi.ps1` - Test API endpoints

---

## 🐧 Linux / Mac / Git Bash

### Prerequisites
- Bash shell
- SSH client
- SCP command
- curl (untuk testing)

### 1. Deploy

```bash
# Make executable
chmod +x deploy-invoice-history.sh

# Run
./deploy-invoice-history.sh
```

**Output yang diharapkan:**
```
==========================================
Deploy Histori Faktur Penjualan
==========================================

[1/7] Checking VPS connection...
✓ VPS connection OK

[2/7] Creating database backup...
✓ Database backup created

[3/7] Uploading migration file...
✓ Migration file uploaded

[4/7] Running database migration...
✓ Database migration completed

[5/7] Uploading updated backend files...
✓ Backend files uploaded

[6/7] Restarting backend service...
✓ Backend service restarted

[7/7] Verifying deployment...
✓ Backend is running

==========================================
✓ Deployment completed successfully!
==========================================
```

### 2. Verify

```bash
# Make executable
chmod +x verify-invoice-history.sh

# Run
./verify-invoice-history.sh
```

**Output yang diharapkan:**
```
==========================================
Verifikasi Histori Faktur Penjualan
==========================================

[1/5] Checking database table...
Tables:
sales_invoice_history

Table structure:
+------------------+---------------+------+-----+
| Field            | Type          | Null | Key |
+------------------+---------------+------+-----+
| id               | int           | NO   | PRI |
| sales_order_id   | int           | NO   |     |
...

[2/5] Checking record count...
total_records
0

[3/5] Checking recent records...
(empty or with data)

[4/5] Checking backend logs...
Recent logs:
...

[5/5] Testing API endpoints...
Health check passed

==========================================
✓ Verification completed!
==========================================
```

### 3. Test API

```bash
# Make executable
chmod +x test-invoice-history-api.sh

# Run (will prompt for credentials)
./test-invoice-history-api.sh

# Or with token
./test-invoice-history-api.sh YOUR_TOKEN
```

**Output yang diharapkan:**
```
==========================================
Testing Invoice History API
==========================================

[1/5] Testing health endpoint...
✓ Health check passed

[2/5] Testing GET /api/sales-invoice-history/recent...
✓ Get recent history successful

[3/5] Testing GET /api/sales-invoice-history/status/...
✓ Get history by status successful

[4/5] Testing POST /api/sales-invoice-history/sync...
Do you want to trigger manual sync? (y/n)

[5/5] Testing GET /api/sales-invoice-history/order/:orderId...
Enter order ID to test (or press Enter to skip):

==========================================
✓ API Testing completed!
==========================================
```

---

## 🪟 Windows PowerShell

### Prerequisites
- PowerShell 5.1 or later
- OpenSSH Client (Windows 10/11 built-in)
- Internet connection

### Enable OpenSSH (if not installed)

1. Open Settings
2. Go to Apps > Optional Features
3. Click "Add a feature"
4. Search for "OpenSSH Client"
5. Install

Or via PowerShell (as Administrator):
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### 1. Deploy

```powershell
# Run PowerShell as Administrator (optional, but recommended)
# Navigate to project directory
cd C:\path\to\project

# Run deploy script
.\Deploy-InvoiceHistory.ps1
```

**Parameters (optional):**
```powershell
.\Deploy-InvoiceHistory.ps1 -VpsHost "212.85.26.166" -VpsUser "root" -AppDir "/root/accurate-sync"
```

**Output yang diharapkan:**
```
==========================================
Deploy Histori Faktur Penjualan
==========================================

[OK] SSH available: OpenSSH_...
[OK] SCP available

[1/7] Checking VPS connection...
[OK] VPS connection successful

[2/7] Creating database backup...
[OK] Database backup created

[3/7] Uploading migration file...
[OK] Migration file uploaded

[4/7] Running database migration...
[OK] Database migration completed

[5/7] Uploading updated backend files...
  Uploading backend/src/controllers/SalesInvoiceHistoryController.js...
  Uploading backend/src/models/SalesInvoiceHistory.js...
  ...
[OK] All backend files uploaded

[6/7] Restarting backend service...
[OK] Backend service restarted

[7/7] Verifying deployment...
[OK] Backend is running
[OK] Table sales_invoice_history exists

==========================================
Deployment completed successfully!
==========================================
```

### 2. Verify

```powershell
.\Verify-InvoiceHistory.ps1
```

**Parameters (optional):**
```powershell
.\Verify-InvoiceHistory.ps1 -VpsHost "212.85.26.166" -VpsUser "root"
```

### 3. Test API

```powershell
.\Test-InvoiceHistoryApi.ps1
```

Script akan meminta username dan password, lalu melakukan testing.

**Atau dengan token:**
```powershell
.\Test-InvoiceHistoryApi.ps1 -Token "your_token_here"
```

**Parameters:**
```powershell
.\Test-InvoiceHistoryApi.ps1 -Token "your_token" -VpsHost "212.85.26.166" -Port 3000
```

---

## 🔧 Troubleshooting

### Bash Scripts

#### Error: Permission denied
```bash
chmod +x *.sh
```

#### Error: SSH connection refused
```bash
# Test SSH manually
ssh root@212.85.26.166

# Check if port 22 is open
telnet 212.85.26.166 22
```

#### Error: SCP failed
```bash
# Test SCP manually
scp test.txt root@212.85.26.166:/tmp/

# Check permissions
ls -la backend/src/
```

### PowerShell Scripts

#### Error: OpenSSH not found
```powershell
# Check if installed
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Install
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

#### Error: Execution policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy (as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass
powershell -ExecutionPolicy Bypass -File .\Deploy-InvoiceHistory.ps1
```

#### Error: SSH host key verification
```powershell
# Accept host key manually first
ssh root@212.85.26.166
# Type 'yes' when prompted
```

#### Error: Cannot connect to VPS
```powershell
# Test connection
Test-NetConnection -ComputerName 212.85.26.166 -Port 22

# Test SSH
ssh root@212.85.26.166 "echo 'test'"
```

---

## 🎯 Quick Reference

### Full Deployment Flow (Bash)
```bash
# 1. Deploy
chmod +x deploy-invoice-history.sh
./deploy-invoice-history.sh

# 2. Verify
chmod +x verify-invoice-history.sh
./verify-invoice-history.sh

# 3. Test
chmod +x test-invoice-history-api.sh
./test-invoice-history-api.sh
```

### Full Deployment Flow (PowerShell)
```powershell
# 1. Deploy
.\Deploy-InvoiceHistory.ps1

# 2. Verify
.\Verify-InvoiceHistory.ps1

# 3. Test
.\Test-InvoiceHistoryApi.ps1
```

---

## 📝 Manual Commands

Jika script tidak bisa dijalankan, gunakan command manual:

### Deploy Manual
```bash
# 1. Connect
ssh root@212.85.26.166

# 2. Backup
cd /root/accurate-sync/backend
docker-compose exec db mysqldump -u root -p accurate_sync > backup_$(date +%Y%m%d).sql

# 3. Upload files (from local)
scp backend/database/add-sales-invoice-history.sql root@212.85.26.166:/root/accurate-sync/backend/database/
scp backend/src/controllers/SalesInvoiceHistoryController.js root@212.85.26.166:/root/accurate-sync/backend/src/controllers/
scp backend/src/models/SalesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/models/
scp backend/src/services/CustomerService.js root@212.85.26.166:/root/accurate-sync/backend/src/services/
scp backend/src/services/SyncService.js root@212.85.26.166:/root/accurate-sync/backend/src/services/
scp backend/src/routes/salesInvoiceHistory.js root@212.85.26.166:/root/accurate-sync/backend/src/routes/

# 4. Run migration (on VPS)
cd /root/accurate-sync/backend
docker-compose exec -T db mysql -u root -p accurate_sync < database/add-sales-invoice-history.sql

# 5. Restart
cd /root/accurate-sync
docker-compose restart backend
```

### Test Manual
```bash
# Get token
curl -X POST http://212.85.26.166:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Test endpoint
curl -X GET "http://212.85.26.166:3000/api/sales-invoice-history/recent?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Additional Resources

- **Full Documentation:** `INVOICE_HISTORY_INTEGRATION.md`
- **Quick Start:** `QUICK_START_INVOICE_HISTORY.md`
- **Windows Guide:** `DEPLOY_WINDOWS.md`
- **Summary:** `SUMMARY_INVOICE_HISTORY.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

## 💡 Tips

1. **Always backup** before deployment
2. **Test in staging** first if available
3. **Monitor logs** after deployment
4. **Save your token** for future testing
5. **Document any issues** you encounter

---

## 🆘 Need Help?

1. Check logs: `docker-compose logs backend`
2. Check database: `docker-compose exec db mysql -u root -p`
3. Check API: `curl http://212.85.26.166:3000/health`
4. Review documentation in this repository

---

**Ready to deploy?** Choose your platform and run the appropriate script!
