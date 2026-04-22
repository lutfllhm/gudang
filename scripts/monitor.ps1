# ================================
# Monitoring Script (PowerShell)
# ================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "iWare System Monitor" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Container Status
Write-Host "Container Status:" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps
Write-Host ""

# Resource Usage
Write-Host "Resource Usage:" -ForegroundColor Yellow
docker stats --no-stream --format "table {{.Name}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.NetIO}}`t{{.BlockIO}}"
Write-Host ""

# Disk Usage
Write-Host "Disk Usage:" -ForegroundColor Yellow
docker system df
Write-Host ""

# Health Checks
Write-Host "Health Checks:" -ForegroundColor Yellow

# Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend API: " -NoNewline
        Write-Host "✓ Healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "Backend API: " -NoNewline
    Write-Host "✗ Unhealthy" -ForegroundColor Red
}

# Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend: " -NoNewline
        Write-Host "✓ Healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend: " -NoNewline
    Write-Host "✗ Unhealthy" -ForegroundColor Red
}

# MySQL
try {
    $result = docker exec iware-mysql-prod mysqladmin ping -h localhost --silent 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MySQL: " -NoNewline
        Write-Host "✓ Healthy" -ForegroundColor Green
    } else {
        Write-Host "MySQL: " -NoNewline
        Write-Host "✗ Unhealthy" -ForegroundColor Red
    }
} catch {
    Write-Host "MySQL: " -NoNewline
    Write-Host "✗ Unhealthy" -ForegroundColor Red
}

# Redis
try {
    $result = docker exec iware-redis-prod redis-cli ping 2>&1
    if ($result -eq "PONG") {
        Write-Host "Redis: " -NoNewline
        Write-Host "✓ Healthy" -ForegroundColor Green
    } else {
        Write-Host "Redis: " -NoNewline
        Write-Host "✗ Unhealthy" -ForegroundColor Red
    }
} catch {
    Write-Host "Redis: " -NoNewline
    Write-Host "✗ Unhealthy" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
