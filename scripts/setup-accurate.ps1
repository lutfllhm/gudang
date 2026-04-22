# ================================
# Accurate Integration Setup Script (PowerShell)
# ================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Accurate Integration Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Panduan Setup Integrasi Accurate Online" -ForegroundColor Yellow
Write-Host ""
Write-Host "Anda perlu mendapatkan credentials dari Accurate Developer Portal:"
Write-Host "https://account.accurate.id/developer"
Write-Host ""

# Prompt for credentials
$has_app = Read-Host "Apakah Anda sudah membuat aplikasi di Developer Portal? (y/n)"

if ($has_app -ne "y") {
    Write-Host ""
    Write-Host "Silakan buat aplikasi terlebih dahulu:" -ForegroundColor Yellow
    Write-Host "1. Buka: https://account.accurate.id/developer"
    Write-Host "2. Login dengan akun Accurate Online"
    Write-Host "3. Klik 'Create New Application'"
    Write-Host "4. Isi form dan simpan"
    Write-Host "5. Catat credentials yang diberikan"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Masukkan credentials dari Developer Portal:" -ForegroundColor Green
Write-Host ""

$app_key = Read-Host "App Key"
$client_id = Read-Host "Client ID"
$client_secret = Read-Host "Client Secret"
$signature_secret = Read-Host "Signature Secret"
$redirect_uri = Read-Host "Redirect URI (contoh: https://yourdomain.com/api/accurate/callback)"

# Update .env file
Write-Host ""
Write-Host "Updating .env file..." -ForegroundColor Yellow

# Backup .env
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item .env ".env.backup.$timestamp"

# Read .env content
$envContent = Get-Content .env

# Update Accurate credentials
$envContent = $envContent -replace "ACCURATE_APP_KEY=.*", "ACCURATE_APP_KEY=$app_key"
$envContent = $envContent -replace "ACCURATE_CLIENT_ID=.*", "ACCURATE_CLIENT_ID=$client_id"
$envContent = $envContent -replace "ACCURATE_CLIENT_SECRET=.*", "ACCURATE_CLIENT_SECRET=$client_secret"
$envContent = $envContent -replace "ACCURATE_SIGNATURE_SECRET=.*", "ACCURATE_SIGNATURE_SECRET=$signature_secret"
$envContent = $envContent -replace "ACCURATE_REDIRECT_URI=.*", "ACCURATE_REDIRECT_URI=$redirect_uri"

# Save updated content
$envContent | Set-Content .env

Write-Host "✓ .env file updated" -ForegroundColor Green

# Restart backend
Write-Host ""
Write-Host "Restarting backend..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml restart backend

Write-Host "✓ Backend restarted" -ForegroundColor Green

# Wait for backend to be ready
Write-Host ""
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test configuration
Write-Host ""
Write-Host "Testing Accurate configuration..." -ForegroundColor Yellow
docker exec iware-backend-prod node src/scripts/test-accurate-connection.js

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Buka aplikasi: http://localhost"
Write-Host "2. Login dengan akun admin"
Write-Host "3. Buka halaman Settings/Integrasi"
Write-Host "4. Klik 'Connect to Accurate'"
Write-Host "5. Authorize aplikasi di Accurate Online"
Write-Host ""
Write-Host "Atau dapatkan authorization URL:"
Write-Host "  curl http://localhost/api/accurate/auth-url"
Write-Host ""
Write-Host "Dokumentasi lengkap: ACCURATE-INTEGRATION.md"
Write-Host ""
