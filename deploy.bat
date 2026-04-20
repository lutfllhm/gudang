@echo off
REM #############################################
REM Auto Deploy Script - Sales Invoice History
REM For Docker + VPS Environment (Windows)
REM #############################################

setlocal enabledelayedexpansion

echo ========================================
echo Sales Invoice History Deployment
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker Compose is not installed
    exit /b 1
)

REM Confirmation
set /p confirm="Are you sure you want to deploy? (yes/no): "
if not "%confirm%"=="yes" (
    echo Deployment cancelled
    exit /b 0
)

echo.

REM #############################################
REM Step 1: Backup Database
REM #############################################
echo ========================================
echo Step 1: Backup Database
echo ========================================

set BACKUP_FILE=backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo Creating backup: %BACKUP_FILE%

REM Get MySQL password
set /p MYSQL_PASSWORD="Enter MySQL root password: "

REM Create backup
docker exec iware-mysql mysqldump -u root -p%MYSQL_PASSWORD% iware_warehouse > %BACKUP_FILE% 2>nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Backup created: %BACKUP_FILE%
) else (
    echo ERROR: Backup failed
    exit /b 1
)

echo.

REM #############################################
REM Step 2: Pull Latest Code
REM #############################################
echo ========================================
echo Step 2: Pull Latest Code
echo ========================================

echo Pulling from Git...
git pull origin main
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Code updated
) else (
    echo ERROR: Git pull failed
    exit /b 1
)

echo.

REM #############################################
REM Step 3: Database Migration
REM #############################################
echo ========================================
echo Step 3: Database Migration
echo ========================================

REM Check if migration file exists
if not exist "backend\database\add-sales-invoice-history.sql" (
    echo ERROR: Migration file not found
    exit /b 1
)

echo Copying migration file to MySQL container...
docker cp backend\database\add-sales-invoice-history.sql iware-mysql:/tmp/
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: File copied
) else (
    echo ERROR: Failed to copy file
    exit /b 1
)

echo Running migration...
docker exec -i iware-mysql mysql -u root -p%MYSQL_PASSWORD% iware_warehouse < backend\database\add-sales-invoice-history.sql 2>nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Migration completed
) else (
    echo ERROR: Migration failed
    echo WARNING: You may need to restore from backup: %BACKUP_FILE%
    exit /b 1
)

echo Verifying migration...
docker exec iware-mysql mysql -u root -p%MYSQL_PASSWORD% -e "USE iware_warehouse; SHOW TABLES LIKE 'sales_invoice_history';" 2>nul | find "sales_invoice_history" >nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Table 'sales_invoice_history' created
) else (
    echo ERROR: Table verification failed
    exit /b 1
)

echo.

REM #############################################
REM Step 4: Rebuild Containers
REM #############################################
echo ========================================
echo Step 4: Rebuild Containers
echo ========================================

echo Stopping containers...
docker-compose down
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Containers stopped
) else (
    echo ERROR: Failed to stop containers
    exit /b 1
)

echo Rebuilding images (this may take a few minutes)...
docker-compose build --no-cache
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Images rebuilt
) else (
    echo ERROR: Build failed
    exit /b 1
)

echo Starting containers...
docker-compose up -d
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Containers started
) else (
    echo ERROR: Failed to start containers
    exit /b 1
)

echo Waiting for containers to be ready...
timeout /t 10 /nobreak >nul

echo.

REM #############################################
REM Step 5: Verification
REM #############################################
echo ========================================
echo Step 5: Verification
echo ========================================

echo Checking container status...
docker-compose ps backend | find "Up" >nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Backend: Running
) else (
    echo ERROR: Backend: Not running
)

docker-compose ps frontend | find "Up" >nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Frontend: Running
) else (
    echo ERROR: Frontend: Not running
)

docker-compose ps mysql | find "Up" >nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: MySQL: Running
) else (
    echo ERROR: MySQL: Not running
)

echo Checking backend health...
timeout /t 5 /nobreak >nul
curl -s http://localhost:5000/health | find "success" >nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Backend health check: OK
) else (
    echo WARNING: Backend health check: Failed (may need more time to start)
)

echo.

REM #############################################
REM Step 6: Summary
REM #############################################
echo ========================================
echo Deployment Summary
echo ========================================
echo.
echo Backup File: %BACKUP_FILE%
echo Database: Migration completed
echo Containers: Rebuilt and restarted
echo Status: Deployment completed
echo.
echo Next steps:
echo   1. Test the application: http://your-vps-ip:3000
echo   2. Check logs: docker-compose logs -f backend
echo   3. Verify feature: Go to Sales Orders page
echo   4. Sync history (optional): POST /api/sales-invoice-history/sync
echo.
echo WARNING: Keep the backup file safe: %BACKUP_FILE%
echo.

REM Ask if user wants to see logs
set /p show_logs="Do you want to see backend logs? (yes/no): "
if "%show_logs%"=="yes" (
    echo.
    echo Showing backend logs (Ctrl+C to exit)...
    docker-compose logs -f backend
)

echo.
echo SUCCESS: Deployment script completed!
pause
