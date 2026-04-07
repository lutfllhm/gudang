#!/bin/bash

###############################################################################
# Script Auto Setup Database iWare Warehouse di VPS
# Tinggal copy script ini ke VPS dan jalankan
###############################################################################

set -e  # Exit jika ada error

echo "=========================================="
echo "🚀 iWare Database Setup Script"
echo "=========================================="
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fungsi untuk print dengan warna
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Konfigurasi Database
DB_NAME="iware_warehouse"
DB_USER="iware"
DB_PASSWORD="iware_password_$(openssl rand -hex 8)"  # Generate random password
DB_ROOT_PASSWORD=""

echo "Konfigurasi Database:"
echo "  Database Name: $DB_NAME"
echo "  Database User: $DB_USER"
echo "  Database Password: $DB_PASSWORD"
echo ""
print_info "Password akan disimpan di file .db_credentials"
echo ""

# Simpan kredensial ke file
cat > .db_credentials << EOF
# Database Credentials - iWare Warehouse
# Generated: $(date)

DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Untuk Docker Backend, gunakan:
# DB_HOST=172.17.0.1  (atau host.docker.internal di Mac/Windows)
EOF

chmod 600 .db_credentials
print_success "Kredensial disimpan di .db_credentials"
echo ""

# 1. Install MySQL jika belum ada
print_info "Mengecek MySQL Server..."
if ! command -v mysql &> /dev/null; then
    print_info "MySQL belum terinstall. Installing..."
    sudo apt update
    sudo DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
    print_success "MySQL Server terinstall"
else
    print_success "MySQL Server sudah terinstall"
fi

# 2. Start MySQL
print_info "Starting MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql
print_success "MySQL service running"
echo ""

# 3. Minta password root MySQL
echo "=========================================="
print_info "Masukkan password root MySQL"
print_info "Jika baru install, tekan Enter (kosong)"
echo "=========================================="
read -sp "MySQL Root Password: " DB_ROOT_PASSWORD
echo ""
echo ""

# Test koneksi root
if [ -z "$DB_ROOT_PASSWORD" ]; then
    MYSQL_ROOT_CMD="sudo mysql"
else
    MYSQL_ROOT_CMD="mysql -u root -p$DB_ROOT_PASSWORD"
fi

# 4. Buat Database dan User
print_info "Membuat database dan user..."

$MYSQL_ROOT_CMD << MYSQL_SCRIPT
-- Buat database
CREATE DATABASE IF NOT EXISTS $DB_NAME 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Hapus user lama jika ada
DROP USER IF EXISTS '$DB_USER'@'localhost';
DROP USER IF EXISTS '$DB_USER'@'%';
DROP USER IF EXISTS '$DB_USER'@'172.17.0.1';

-- Buat user baru
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER '$DB_USER'@'172.17.0.1' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'172.17.0.1';

-- Apply
FLUSH PRIVILEGES;

-- Show users
SELECT CONCAT('✅ User created: ', user, '@', host) as status FROM mysql.user WHERE user = '$DB_USER';
MYSQL_SCRIPT

print_success "Database dan user berhasil dibuat"
echo ""

# 5. Import Schema
print_info "Mengimport database schema..."

# Cek apakah file schema ada
SCHEMA_FILE=""
if [ -f "backend/database/schema.sql" ]; then
    SCHEMA_FILE="backend/database/schema.sql"
elif [ -f "/opt/werehouse/backend/database/schema.sql" ]; then
    SCHEMA_FILE="/opt/werehouse/backend/database/schema.sql"
elif [ -f "schema.sql" ]; then
    SCHEMA_FILE="schema.sql"
else
    print_error "File schema.sql tidak ditemukan!"
    print_info "Silakan download dari repository atau letakkan di folder ini"
    exit 1
fi

print_info "Menggunakan schema file: $SCHEMA_FILE"

# Import schema menggunakan root (untuk trigger yang butuh SUPER privilege)
if [ -z "$DB_ROOT_PASSWORD" ]; then
    sudo mysql $DB_NAME < $SCHEMA_FILE
else
    mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < $SCHEMA_FILE
fi

print_success "Schema berhasil diimport"
echo ""

# 6. Verifikasi
print_info "Verifikasi database..."

mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME << VERIFY_SCRIPT
SELECT '========================================' as '';
SELECT '📊 Database Tables' as '';
SELECT '========================================' as '';
SHOW TABLES;

SELECT '' as '';
SELECT '========================================' as '';
SELECT '👤 Default Users' as '';
SELECT '========================================' as '';
SELECT id, nama, email, role, status FROM users;

SELECT '' as '';
SELECT '========================================' as '';
SELECT '📈 Database Statistics' as '';
SELECT '========================================' as '';
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM items) as total_items,
    (SELECT COUNT(*) FROM sales_orders) as total_sales_orders;
VERIFY_SCRIPT

echo ""
print_success "Database setup selesai!"
echo ""

# 7. Konfigurasi MySQL untuk Docker (optional)
echo "=========================================="
print_info "Konfigurasi MySQL untuk Docker Backend?"
echo "Pilih Y jika backend berjalan di Docker container"
echo "Pilih N jika backend berjalan langsung di VPS"
echo "=========================================="
read -p "Konfigurasi untuk Docker? (Y/n): " CONFIGURE_DOCKER

if [[ $CONFIGURE_DOCKER =~ ^[Yy]$ ]] || [ -z "$CONFIGURE_DOCKER" ]; then
    print_info "Mengkonfigurasi MySQL untuk Docker..."
    
    # Backup config
    sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.backup
    
    # Update bind-address
    sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
    
    # Restart MySQL
    sudo systemctl restart mysql
    
    print_success "MySQL dikonfigurasi untuk Docker"
    print_info "Backend container bisa connect ke: 172.17.0.1:3306"
    
    # Update .db_credentials
    sed -i 's/DB_HOST=localhost/DB_HOST=172.17.0.1/' .db_credentials
else
    print_info "Skip konfigurasi Docker"
fi

echo ""
echo "=========================================="
print_success "🎉 Setup Database Selesai!"
echo "=========================================="
echo ""
echo "📋 Informasi Login:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  Host: localhost (atau 172.17.0.1 untuk Docker)"
echo ""
echo "👤 Default Admin Account:"
echo "  Email: superadmin@iware.id"
echo "  Password: admin123"
echo ""
print_info "Kredensial tersimpan di: .db_credentials"
print_info "PENTING: Ganti password admin setelah login pertama!"
echo ""
echo "🔧 Update file .env Anda dengan:"
echo "----------------------------------------"
cat .db_credentials
echo "----------------------------------------"
echo ""
print_success "Selesai! Database siap digunakan."
