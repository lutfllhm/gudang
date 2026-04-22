# ================================
# Database Backup Script (PowerShell)
# ================================

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Configuration
$BACKUP_DIR = "./backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "iware_backup_$DATE.sql"

Write-Host "Starting database backup..." -ForegroundColor Yellow

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Backup database
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

docker exec iware-mysql-prod mysqldump `
    -u $DB_USER `
    -p$DB_PASSWORD `
    $DB_NAME > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
Compress-Archive -Path "$BACKUP_DIR/$BACKUP_FILE" -DestinationPath "$BACKUP_DIR/$BACKUP_FILE.zip"
Remove-Item "$BACKUP_DIR/$BACKUP_FILE"

Write-Host "Backup completed: $BACKUP_DIR/$BACKUP_FILE.zip" -ForegroundColor Green

# Keep only last 7 backups
Get-ChildItem "$BACKUP_DIR/iware_backup_*.zip" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip 7 | 
    Remove-Item

Write-Host "Old backups cleaned up" -ForegroundColor Green
