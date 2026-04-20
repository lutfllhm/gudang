#!/bin/bash

# Script untuk setup Sales Order History table
# Usage: ./setup-history.sh

echo "=========================================="
echo "Sales Order History Setup"
echo "=========================================="
echo ""

# Prompt untuk MySQL credentials
read -p "MySQL Host [localhost]: " MYSQL_HOST
MYSQL_HOST=${MYSQL_HOST:-localhost}

read -p "MySQL User [root]: " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL Password: " MYSQL_PASSWORD
echo ""

read -p "Database Name [iware_warehouse]: " DB_NAME
DB_NAME=${DB_NAME:-iware_warehouse}

echo ""
echo "Connecting to MySQL..."
echo ""

# Run SQL script
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$DB_NAME" < add-sales-order-history.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Setup berhasil!"
    echo "=========================================="
    echo ""
    echo "Tabel 'sales_order_history' telah dibuat."
    echo "Trigger 'trg_sales_order_status_change' telah dibuat."
    echo ""
    echo "Silakan restart backend server:"
    echo "  cd backend"
    echo "  npm restart"
    echo ""
    echo "Atau jika menggunakan PM2:"
    echo "  pm2 restart backend"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "✗ Setup gagal!"
    echo "=========================================="
    echo ""
    echo "Periksa kredensial MySQL Anda dan coba lagi."
    echo ""
    exit 1
fi
