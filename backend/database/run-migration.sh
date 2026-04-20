#!/bin/bash

# Script untuk menjalankan migration sales invoice history
# Usage: ./run-migration.sh

echo "=========================================="
echo "Sales Invoice History Migration"
echo "=========================================="
echo ""

# Load environment variables
if [ -f ../../.env ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Database credentials
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-iware_warehouse}
DB_USER=${DB_USER:-root}

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Prompt for password
read -sp "Enter MySQL password: " DB_PASSWORD
echo ""
echo ""

# Run migration
echo "Running migration..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < add-sales-invoice-history.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Verifying tables..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'sales_invoice_history';"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE sales_invoice_history;"
    echo ""
    echo "✅ All done! You can now restart the backend server."
else
    echo ""
    echo "❌ Migration failed! Please check the error messages above."
    exit 1
fi
