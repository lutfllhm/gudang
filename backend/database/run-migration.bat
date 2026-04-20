@echo off
REM Script untuk menjalankan migration sales invoice history di Windows
REM Usage: run-migration.bat

echo ==========================================
echo Sales Invoice History Migration
echo ==========================================
echo.

REM Load environment variables (optional)
if exist ..\..\env (
    for /f "tokens=*" %%a in ('type ..\..\env ^| findstr /v "^#"') do set %%a
)

REM Database credentials
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=3306
if "%DB_NAME%"=="" set DB_NAME=iware_warehouse
if "%DB_USER%"=="" set DB_USER=root

echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Prompt for password
set /p DB_PASSWORD="Enter MySQL password: "
echo.

REM Run migration
echo Running migration...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < add-sales-invoice-history.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
    echo.
    echo Verifying tables...
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SHOW TABLES LIKE 'sales_invoice_history';"
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "DESCRIBE sales_invoice_history;"
    echo.
    echo All done! You can now restart the backend server.
) else (
    echo.
    echo Migration failed! Please check the error messages above.
    exit /b 1
)

pause
