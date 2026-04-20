# PowerShell Script untuk Deploy Histori Faktur Penjualan ke VPS
# Usage: .\Deploy-InvoiceHistory.ps1

param(
    [string]$VpsHost = "212.85.26.166",
    [string]$VpsUser = "root",
    [string]$AppDir = "/root/accurate-sync"
)

# Colors
$ColorRed = "Red"
$ColorGreen = "Green"
$ColorYellow = "Yellow"
$ColorCyan = "Cyan"

Write-Host "==========================================" -ForegroundColor $ColorCyan
Write-Host "Deploy Histori Faktur Penjualan" -ForegroundColor $ColorCyan
Write-Host "==========================================" -ForegroundColor $ColorCyan
Write-Host ""

# Check if SSH is available
try {
    $sshVersion = ssh -V 2>&1
    Write-Host "[OK] SSH available: $sshVersion" -ForegroundColor $ColorGreen
} catch {
    Write-Host "[ERROR] SSH not found. Please install OpenSSH." -ForegroundColor $ColorRed
    Write-Host "Install via: Settings > Apps > Optional Features > OpenSSH Client" -ForegroundColor $ColorYellow
    exit 1
}

# Check if SCP is available
try {
    $scpVersion = scp 2>&1
    Write-Host "[OK] SCP available" -ForegroundColor $ColorGreen
} catch {
    Write-Host "[ERROR] SCP not found. Please install OpenSSH." -ForegroundColor $ColorRed
    exit 1
}

Write-Host ""

# Step 1: Check VPS connection
Write-Host "[1/7] Checking VPS connection..." -ForegroundColor $ColorYellow
try {
    $result = ssh "$VpsUser@$VpsHost" "echo 'Connected successfully'" 2>&1
    if ($result -match "Connected successfully") {
        Write-Host "[OK] VPS connection successful" -ForegroundColor $ColorGreen
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "[ERROR] Failed to connect to VPS" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
    exit 1
}

Write-Host ""

# Step 2: Backup database
Write-Host "[2/7] Creating database backup..." -ForegroundColor $ColorYellow
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
$backupCmd = "cd $AppDir/backend && docker-compose exec -T db mysqldump -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync > backup_before_invoice_history_$backupDate.sql"
try {
    ssh "$VpsUser@$VpsHost" $backupCmd
    Write-Host "[OK] Database backup created" -ForegroundColor $ColorGreen
} catch {
    Write-Host "[WARNING] Backup failed, but continuing..." -ForegroundColor $ColorYellow
}

Write-Host ""

# Step 3: Upload migration file
Write-Host "[3/7] Uploading migration file..." -ForegroundColor $ColorYellow
try {
    scp "backend/database/add-sales-invoice-history.sql" "${VpsUser}@${VpsHost}:${AppDir}/backend/database/"
    Write-Host "[OK] Migration file uploaded" -ForegroundColor $ColorGreen
} catch {
    Write-Host "[ERROR] Failed to upload migration file" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
    exit 1
}

Write-Host ""

# Step 4: Run migration
Write-Host "[4/7] Running database migration..." -ForegroundColor $ColorYellow
$migrationCmd = "cd $AppDir/backend && docker-compose exec -T db mysql -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync < database/add-sales-invoice-history.sql"
try {
    ssh "$VpsUser@$VpsHost" $migrationCmd
    Write-Host "[OK] Database migration completed" -ForegroundColor $ColorGreen
} catch {
    Write-Host "[ERROR] Migration failed" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
    exit 1
}

Write-Host ""

# Step 5: Upload updated backend files
Write-Host "[5/7] Uploading updated backend files..." -ForegroundColor $ColorYellow
$files = @(
    @{Local="backend/src/controllers/SalesInvoiceHistoryController.js"; Remote="$AppDir/backend/src/controllers/"},
    @{Local="backend/src/models/SalesInvoiceHistory.js"; Remote="$AppDir/backend/src/models/"},
    @{Local="backend/src/services/CustomerService.js"; Remote="$AppDir/backend/src/services/"},
    @{Local="backend/src/services/SyncService.js"; Remote="$AppDir/backend/src/services/"},
    @{Local="backend/src/routes/salesInvoiceHistory.js"; Remote="$AppDir/backend/src/routes/"}
)

$uploadSuccess = $true
foreach ($file in $files) {
    try {
        Write-Host "  Uploading $($file.Local)..." -ForegroundColor $ColorCyan
        scp $file.Local "${VpsUser}@${VpsHost}:$($file.Remote)"
    } catch {
        Write-Host "  [ERROR] Failed to upload $($file.Local)" -ForegroundColor $ColorRed
        $uploadSuccess = $false
    }
}

if ($uploadSuccess) {
    Write-Host "[OK] All backend files uploaded" -ForegroundColor $ColorGreen
} else {
    Write-Host "[ERROR] Some files failed to upload" -ForegroundColor $ColorRed
    exit 1
}

Write-Host ""

# Step 6: Restart backend service
Write-Host "[6/7] Restarting backend service..." -ForegroundColor $ColorYellow
try {
    ssh "$VpsUser@$VpsHost" "cd $AppDir && docker-compose restart backend"
    Write-Host "[OK] Backend service restarted" -ForegroundColor $ColorGreen
} catch {
    Write-Host "[ERROR] Failed to restart backend" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
    exit 1
}

Write-Host ""
Write-Host "Waiting for backend to start..." -ForegroundColor $ColorYellow
Start-Sleep -Seconds 5

# Step 7: Verify deployment
Write-Host "[7/7] Verifying deployment..." -ForegroundColor $ColorYellow
try {
    $psResult = ssh "$VpsUser@$VpsHost" "cd $AppDir && docker-compose ps | grep backend | grep Up"
    if ($psResult) {
        Write-Host "[OK] Backend is running" -ForegroundColor $ColorGreen
    } else {
        Write-Host "[ERROR] Backend is not running properly" -ForegroundColor $ColorRed
        Write-Host "Checking logs..." -ForegroundColor $ColorYellow
        ssh "$VpsUser@$VpsHost" "cd $AppDir && docker-compose logs --tail=50 backend"
        exit 1
    }
} catch {
    Write-Host "[WARNING] Could not verify backend status" -ForegroundColor $ColorYellow
}

Write-Host ""

# Check database table
Write-Host "Checking database table..." -ForegroundColor $ColorYellow
try {
    $tableCheck = ssh "$VpsUser@$VpsHost" "cd $AppDir/backend && docker-compose exec -T db mysql -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SHOW TABLES LIKE \`"sales_invoice_history\`";'"
    if ($tableCheck -match "sales_invoice_history") {
        Write-Host "[OK] Table sales_invoice_history exists" -ForegroundColor $ColorGreen
    }
} catch {
    Write-Host "[WARNING] Could not verify table" -ForegroundColor $ColorYellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor $ColorGreen
Write-Host "Deployment completed successfully!" -ForegroundColor $ColorGreen
Write-Host "==========================================" -ForegroundColor $ColorGreen
Write-Host ""

Write-Host "Endpoints yang tersedia:" -ForegroundColor $ColorCyan
Write-Host "  GET  /api/sales-invoice-history/recent"
Write-Host "  GET  /api/sales-invoice-history/order/:orderId"
Write-Host "  GET  /api/sales-invoice-history/so/:soId"
Write-Host "  GET  /api/sales-invoice-history/status/:status"
Write-Host "  POST /api/sales-invoice-history/sync"
Write-Host ""

Write-Host "Untuk test sync manual:" -ForegroundColor $ColorCyan
Write-Host "  curl -X POST http://${VpsHost}:3000/api/sales-invoice-history/sync \"
Write-Host "       -H 'Authorization: Bearer YOUR_TOKEN' \"
Write-Host "       -H 'Content-Type: application/json' \"
Write-Host "       -d '{`"startDate`":`"2026-01-01`",`"endDate`":`"2026-12-31`"}'"
Write-Host ""

Write-Host "Next steps:" -ForegroundColor $ColorYellow
Write-Host "  1. Run .\Verify-InvoiceHistory.ps1 to verify"
Write-Host "  2. Run .\Test-InvoiceHistoryApi.ps1 to test API"
Write-Host ""
