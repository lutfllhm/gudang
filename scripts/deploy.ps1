$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env.production")) {
  Write-Error "File .env.production belum ada. Salin dari .env.example lalu isi nilainya."
}

Write-Host "Pull image base terbaru..." -ForegroundColor Cyan
docker compose pull mysql redis | Out-Null

Write-Host "Build dan jalankan container..." -ForegroundColor Cyan
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

Write-Host "Status container:" -ForegroundColor Green
docker compose ps

Write-Host "Deploy selesai." -ForegroundColor Green
