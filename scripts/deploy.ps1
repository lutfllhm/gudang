# ================================
# iWare Deployment Script (PowerShell)
# ================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "iWare Warehouse Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.production to .env and configure it first."
    exit 1
}

Write-Host "Step 1: Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

Write-Host ""
Write-Host "Step 2: Pulling latest images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml pull

Write-Host ""
Write-Host "Step 3: Building images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

Write-Host ""
Write-Host "Step 4: Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

Write-Host ""
Write-Host "Step 5: Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:"
Write-Host "  - Frontend: http://localhost"
Write-Host "  - Backend API: http://localhost/api"
Write-Host "  - MySQL: localhost:3306"
Write-Host "  - Redis: localhost:6379"
Write-Host ""
Write-Host "To view logs:"
Write-Host "  docker-compose -f docker-compose.prod.yml logs -f"
Write-Host ""
Write-Host "To stop services:"
Write-Host "  docker-compose -f docker-compose.prod.yml down"
Write-Host ""
