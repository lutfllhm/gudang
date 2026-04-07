# Quick Setup Database - Copy Paste ke VPS

Pilih salah satu cara di bawah ini:

---

## CARA 1: One-Line Command (Paling Cepat)

Copy-paste perintah ini ke VPS Anda (dalam satu baris):

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/setup-database-vps.sh | bash
```

Atau jika file sudah ada di VPS:

```bash
cd /opt/werehouse && chmod +x setup-database-vps.sh && ./setup-database-vps.sh
```

---

## CARA 2: Copy-Paste Langsung (Tanpa File)

Copy seluruh blok di bawah ini dan paste ke terminal VPS Anda:

```bash
#!/bin/bash
# Quick Database Setup - iWare Warehouse

# Warna
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting iWare Database Setup...${NC}"

# Generate password random
DB_PASSWORD="iware_$(openssl rand -hex 6)"

# Install MySQL jika belum ada
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}Installing MySQL...${NC}"
    sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
fi

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

echo -e "${YELLOW}Creating database and user...${NC}"

# Buat database dan user
sudo mysql << EOF
CREATE DATABASE IF NOT EXISTS iware_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'iware'@'localhost';
DROP USER IF EXISTS 'iware'@'%';
DROP USER IF EXISTS 'iware'@'172.17.0.1';
CREATE USER 'iware'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER 'iware'@'%' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER 'iware'@'172.17.0.1' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'localhost';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'%';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'172.17.0.1';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✅ Database created!${NC}"

# Import schema
if [ -f "/opt/werehouse/backend/database/schema.sql" ]; then
    echo -e "${YELLOW}Importing schema...${NC}"
    mysql -u iware -p$DB_PASSWORD iware_warehouse < /opt/werehouse/backend/database/schema.sql
    echo -e "${GREEN}✅ Schema imported!${NC}"
else
    echo -e "${YELLOW}⚠️  Schema file not found. Please import manually.${NC}"
fi

# Simpan kredensial
cat > ~/.db_credentials << CRED
DB_HOST=172.17.0.1
DB_PORT=3306
DB_NAME=iware_warehouse
DB_USER=iware
DB_PASSWORD=$DB_PASSWORD
CRED

chmod 600 ~/.db_credentials

# Konfigurasi untuk Docker
sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf 2>/dev/null || true
sudo systemctl restart mysql

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database Credentials:"
echo "  DB_HOST=172.17.0.1"
echo "  DB_USER=iware"
echo "  DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "Default Admin Login:"
echo "  Email: superadmin@iware.id"
echo "  Password: admin123"
echo ""
echo "Credentials saved in: ~/.db_credentials"
echo ""
echo "Update your .env file with these credentials!"
```

---

## CARA 3: Manual Step-by-Step (Jika Cara 1 & 2 Gagal)

### Step 1: Install MySQL

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Step 2: Login ke MySQL

```bash
sudo mysql
```

### Step 3: Buat Database dan User (Paste di MySQL prompt)

```sql
-- Buat database
CREATE DATABASE iware_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user (ganti PASSWORD_ANDA dengan password kuat)
CREATE USER 'iware'@'localhost' IDENTIFIED BY 'PASSWORD_ANDA';
CREATE USER 'iware'@'%' IDENTIFIED BY 'PASSWORD_ANDA';
CREATE USER 'iware'@'172.17.0.1' IDENTIFIED BY 'PASSWORD_ANDA';

-- Grant privileges
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'localhost';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'%';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'172.17.0.1';

-- Apply
FLUSH PRIVILEGES;

-- Keluar
EXIT;
```

### Step 4: Import Schema

```bash
cd /opt/werehouse
mysql -u iware -p iware_warehouse < backend/database/schema.sql
# Masukkan password yang Anda buat di Step 3
```

### Step 5: Konfigurasi untuk Docker

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Cari baris `bind-address = 127.0.0.1` dan ubah menjadi:
```
bind-address = 0.0.0.0
```

Simpan (Ctrl+X, Y, Enter), lalu restart:

```bash
sudo systemctl restart mysql
```

### Step 6: Update .env

```bash
cd /opt/werehouse
nano .env
```

Update bagian database:
```env
DB_HOST=172.17.0.1
DB_PORT=3306
DB_USER=iware
DB_PASSWORD=PASSWORD_ANDA
DB_NAME=iware_warehouse
```

### Step 7: Restart Backend

```bash
docker compose restart backend
```

---

## Verifikasi Setup

Setelah setup, cek apakah database berjalan:

```bash
# Test koneksi database
mysql -u iware -p -h localhost iware_warehouse -e "SHOW TABLES;"

# Test dari backend container
docker exec -it iware_backend node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: '172.17.0.1',
  user: 'iware',
  password: 'PASSWORD_ANDA',
  database: 'iware_warehouse'
}).then(c => {
  console.log('✅ Database OK');
  return c.query('SELECT COUNT(*) as total FROM users');
}).then(([r]) => {
  console.log('Total users:', r[0].total);
  process.exit(0);
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
"
```

---

## Troubleshooting

### Error: Access denied

```bash
# Reset user password
sudo mysql -e "ALTER USER 'iware'@'localhost' IDENTIFIED BY 'new_password'; FLUSH PRIVILEGES;"
```

### Error: Can't connect from Docker

```bash
# Cek bind-address
sudo grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf

# Harus: bind-address = 0.0.0.0
# Jika tidak, edit dan restart MySQL
```

### Error: Table doesn't exist

```bash
# Re-import schema
cd /opt/werehouse
mysql -u iware -p iware_warehouse < backend/database/schema.sql
```

### Cek logs backend

```bash
docker logs iware_backend --tail 50
```

---

## Login ke Aplikasi

Setelah database setup:

1. Buka browser: `https://iwareid.com`
2. Login dengan:
   - Email: `superadmin@iware.id`
   - Password: `admin123`
3. **PENTING:** Ganti password setelah login pertama!

---

## Backup Database

```bash
# Backup manual
mysqldump -u iware -p iware_warehouse > backup_$(date +%Y%m%d).sql

# Restore
mysql -u iware -p iware_warehouse < backup_20260407.sql
```
