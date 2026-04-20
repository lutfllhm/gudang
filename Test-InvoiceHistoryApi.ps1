# PowerShell Script untuk Test API Histori Faktur Penjualan
# Usage: .\Test-InvoiceHistoryApi.ps1 [-Token "your_token"]

param(
    [string]$Token = "",
    [string]$VpsHost = "212.85.26.166",
    [int]$Port = 3000
)

# Colors
$ColorRed = "Red"
$ColorGreen = "Green"
$ColorYellow = "Yellow"
$ColorCyan = "Cyan"
$ColorBlue = "Blue"

$ApiUrl = "http://${VpsHost}:${Port}"

Write-Host "==========================================" -ForegroundColor $ColorCyan
Write-Host "Testing Invoice History API" -ForegroundColor $ColorCyan
Write-Host "==========================================" -ForegroundColor $ColorCyan
Write-Host ""

# Get token if not provided
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "Token not provided. Getting token first..." -ForegroundColor $ColorYellow
    
    $Username = Read-Host "Enter admin username"
    $Password = Read-Host "Enter admin password" -AsSecureString
    $PasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    )
    
    Write-Host ""
    Write-Host "Logging in..." -ForegroundColor $ColorYellow
    
    try {
        $loginBody = @{
            username = $Username
            password = $PasswordPlain
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" `
            -Method Post `
            -Body $loginBody `
            -ContentType "application/json" `
            -TimeoutSec 10
        
        $Token = $loginResponse.data.token
        
        if ([string]::IsNullOrEmpty($Token)) {
            Write-Host "[ERROR] Failed to get token" -ForegroundColor $ColorRed
            Write-Host "Response: $($loginResponse | ConvertTo-Json)" -ForegroundColor $ColorRed
            exit 1
        }
        
        Write-Host "[OK] Token obtained" -ForegroundColor $ColorGreen
    } catch {
        Write-Host "[ERROR] Login failed" -ForegroundColor $ColorRed
        Write-Host "Error: $_" -ForegroundColor $ColorRed
        exit 1
    }
} else {
    Write-Host "Using provided token" -ForegroundColor $ColorGreen
}

Write-Host ""

# Test 1: Health check
Write-Host "[1/5] Testing health endpoint..." -ForegroundColor $ColorYellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 5
    Write-Host "[OK] Health check passed" -ForegroundColor $ColorGreen
    Write-Host "Response: $($healthResponse | ConvertTo-Json -Depth 3)" -ForegroundColor $ColorCyan
} catch {
    Write-Host "[ERROR] Health check failed" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
}

Write-Host ""

# Test 2: Get recent history
Write-Host "[2/5] Testing GET /api/sales-invoice-history/recent..." -ForegroundColor $ColorYellow
try {
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    $recentResponse = Invoke-RestMethod -Uri "$ApiUrl/api/sales-invoice-history/recent?limit=5" `
        -Method Get `
        -Headers $headers `
        -TimeoutSec 10
    
    Write-Host "[OK] Get recent history successful" -ForegroundColor $ColorGreen
    Write-Host "Response:" -ForegroundColor $ColorCyan
    Write-Host ($recentResponse | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "[ERROR] Get recent history failed" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
}

Write-Host ""

# Test 3: Get history by status
Write-Host "[3/5] Testing GET /api/sales-invoice-history/status/..." -ForegroundColor $ColorYellow
try {
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    $statusResponse = Invoke-RestMethod -Uri "$ApiUrl/api/sales-invoice-history/status/Sebagian%20diproses?limit=5" `
        -Method Get `
        -Headers $headers `
        -TimeoutSec 10
    
    Write-Host "[OK] Get history by status successful" -ForegroundColor $ColorGreen
    Write-Host "Response:" -ForegroundColor $ColorCyan
    Write-Host ($statusResponse | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "[ERROR] Get history by status failed" -ForegroundColor $ColorRed
    Write-Host "Error: $_" -ForegroundColor $ColorRed
}

Write-Host ""

# Test 4: Manual sync (optional)
Write-Host "[4/5] Testing POST /api/sales-invoice-history/sync..." -ForegroundColor $ColorYellow
$syncConfirm = Read-Host "Do you want to trigger manual sync? (y/n)"

if ($syncConfirm -eq "y" -or $syncConfirm -eq "Y") {
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        }
        
        $syncBody = @{
            startDate = "2026-01-01"
            endDate = "2026-12-31"
            pageSize = 100
        } | ConvertTo-Json
        
        $syncResponse = Invoke-RestMethod -Uri "$ApiUrl/api/sales-invoice-history/sync" `
            -Method Post `
            -Headers $headers `
            -Body $syncBody `
            -TimeoutSec 30
        
        Write-Host "[OK] Manual sync successful" -ForegroundColor $ColorGreen
        Write-Host "Response:" -ForegroundColor $ColorCyan
        Write-Host ($syncResponse | ConvertTo-Json -Depth 5)
    } catch {
        Write-Host "[ERROR] Manual sync failed" -ForegroundColor $ColorRed
        Write-Host "Error: $_" -ForegroundColor $ColorRed
    }
} else {
    Write-Host "Skipped manual sync" -ForegroundColor $ColorYellow
}

Write-Host ""

# Test 5: Get history by order ID (if available)
Write-Host "[5/5] Testing GET /api/sales-invoice-history/order/:orderId..." -ForegroundColor $ColorYellow
$orderId = Read-Host "Enter order ID to test (or press Enter to skip)"

if (![string]::IsNullOrEmpty($orderId)) {
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $orderResponse = Invoke-RestMethod -Uri "$ApiUrl/api/sales-invoice-history/order/$orderId" `
            -Method Get `
            -Headers $headers `
            -TimeoutSec 10
        
        Write-Host "[OK] Get history by order ID successful" -ForegroundColor $ColorGreen
        Write-Host "Response:" -ForegroundColor $ColorCyan
        Write-Host ($orderResponse | ConvertTo-Json -Depth 5)
    } catch {
        Write-Host "[ERROR] Get history by order ID failed" -ForegroundColor $ColorRed
        Write-Host "Error: $_" -ForegroundColor $ColorRed
    }
} else {
    Write-Host "Skipped order ID test" -ForegroundColor $ColorYellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor $ColorGreen
Write-Host "API Testing completed!" -ForegroundColor $ColorGreen
Write-Host "==========================================" -ForegroundColor $ColorGreen
Write-Host ""

Write-Host "Your token (save for future use):" -ForegroundColor $ColorYellow
Write-Host $Token
Write-Host ""

Write-Host "You can reuse this token by running:" -ForegroundColor $ColorCyan
Write-Host ".\Test-InvoiceHistoryApi.ps1 -Token `"$Token`""
