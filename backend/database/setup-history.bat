@echo off
REM Script untuk setup Sales Order History table (Windows)
REM Usage: setup-history.bat

echo ==========================================
echo Sales Order History Setup
echo ==========================================
echo.

REM Prompt untuk MySQL credentials
set /p MYSQL_HOST="MySQL Host [localhost]: "
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set /p MYSQL_USER="MySQL User [root]: "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD="MySQL Password: "

set /p DB_NAME="Database Name [iware_warehouse]: "
if "%DB_NAME%"=="" set DB_NAME=iware_warehouse

echo.
echo Connecting to MySQL...
echo.

REM Run SQL script
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %DB_NAME% < add-sales-order-history.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo Setup berhasil!
    echo ==========================================
    echo.
    echo Tabel 'sales_order_history' telah dibuat.
    echo Trigger 'trg_sales_order_status_change' telah dibuat.
    echo.
    echo Silakan restart backend server:
    echo   cd backend
    echo   npm restart
    echo.
    echo Atau jika menggunakan PM2:
    echo   pm2 restart backend
    echo.
) else (
    echo.
    echo ==========================================
    echo Setup gagal!
    echo ==========================================
    echo.
    echo Periksa kredensial MySQL Anda dan coba lagi.
    echo.
    exit /b 1
)

pause
