# PowerShell Script untuk Verifikasi Histori Faktur Penjualan di VPS
# Usage: .\Verify-InvoiceHistory.ps1

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
$ColorBlue = "Blue"

Write-Host "==========================================" -ForegroundColor $ColorCyan
Write-Host "Verifikasi Histori Faktur Penjualan" -ForegroundColor $ColorCyan
Write-Host "==========================================" -ForegroundColor $ColorCyan
Write-Host ""

# Step 1: Check database table
Write-Host "[1/5] Checking database table..." -ForegroundColor $ColorYellow
Write-Host ""

Write-Host "Tables:" -ForegroundColor $ColorBlue
try {
    $tables = ssh "$VpsUser@$VpsHost" "cd $AppDir/backend && docker-compose exec -T db mysql -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SHOW TABLES LIKE \`"%invoice%\`";'"
    Write-Host $tables
} catch {
    Write-Host "[ERROR] Failed to check tables" -ForegroundColor $ColorRed
}

Write-Host ""
Write-Host "Table structure:" -ForegroundColor $ColorBlue
try {
    $structure = ssh "$VpsUser@$VpsHost" "cd $AppDir/backend && docker-compose exec -T db mysql -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'DESCRIBE sales_invoice_history;'"
    Write-Host $structure
} catch {
    Write-Host "[ERROR] Failed to check table structure" -ForegroundColor $ColorRed
}

Write-Host ""

# Step 2: Check record count
Write-Host "[2/5] Checking record count..." -ForegroundColor $ColorYellow
try {
    $count = ssh "$VpsUser@$VpsHost" "cd $AppDir/backend && docker-compose exec -T db mysql -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SELECT COUNT(*) as total_records FROM sales_invoice_history;'"
    Write-Host $count
} catch {
    Write-Host "[ERROR] Failed to check record count" -ForegroundColor $ColorRed
}

Write-Host ""

# Step 3: Check recent records
Write-Host "[3/5] Checking recent records..." -ForegroundColor $ColorYellow
try {
    $recent = ssh "$VpsUser@$VpsHost" "cd $AppDir/backend && docker-compose exec -T db mysql -u root -p`$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) accurate_sync -e 'SELECT * FROM v_sales_invoice_history ORDER BY created_at DESC LIMIT 5;'"
    Write-Host $recent
} catch {
    Write-Host "[WARNING] No recent records or query failed" -ForegroundColor $ColorYellow
}

Write-Host ""

# Step 4: Check backend logs
Write-Host "[4/5] Checking backend logs..." -ForegroundColor $ColorYellow
Write-Host "Recent logs:" -ForegroundColor $ColorBlue
try {
    $logs = ssh "$VpsUser@$VpsHost" "cd $AppDir && docker-compose logs --tail=20 backend | grep -i 'invoice\|history' || echo 'No invoice/history logs found'"
    Write-Host $logs
} catch {
    Write-Host "[WARNING] Could not fetch logs" -ForegroundColor $ColorYellow
}

Write-Host ""

# Step 5: Test API endpoints
Write-Host "[5/5] Testing API endpoints..." -ForegroundColor $ColorYellow
$backendUrl = "http://${VpsHost}:3000"

Write-Host "Testing health endpoint:" -ForegroundColor $ColorBlue
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get -TimeoutSec 5
    Write-Host "[OK] Health check passed" -ForegroundColor $ColorGreen
    Write-Host ($health | ConvertTo-Json)
} catch {
    Write-Host "[ERROR] Health check failed" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
}

Write-Host ""
Write-Host "Available endpoints:" -ForegroundColor $ColorBlue
Write-Host "  GET  $backendUrl/api/sales-invoice-history/recent"
Write-Host "  GET  $backendUrl/api/sales-invoice-history/order/:orderId"
Write-Host "  GET  $backendUrl/api/sales-invoice-history/so/:soId"
Write-Host "  GET  $backendUrl/api/sales-invoice-history/status/:status"
Write-Host "  POST $backendUrl/api/sales-invoice-history/sync"

Write-Host ""
Write-Host "==========================================" -ForegroundColor $ColorGreen
Write-Host "Verification completed!" -ForegroundColor $ColorGreen
Write-Host "==========================================" -ForegroundColor $ColorGreen
Write-Host ""

Write-Host "Note:" -ForegroundColor $ColorYellow
Write-Host "Untuk test endpoint, Anda perlu token autentikasi."
Write-Host "Gunakan endpoint /api/auth/login untuk mendapatkan token."
Write-Host ""
Write-Host "Next step: Run .\Test-InvoiceHistoryApi.ps1 to test API with authentication"
