# Panduan Setup Database Manual di VPS (Tanpa Docker)

Panduan ini untuk install MySQL langsung di VPS Ubuntu/Debian dan membuat database secara manual.

---

## 1) Install MySQL Server di VPS

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install -y mysql-server

# Cek status MySQL
sudo systemctl status mysql

# Enable MySQL auto-start saat boot
sudo systemctl enable mysql
```

---

## 2) Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Jawab pertanyaan:
- **Set root password?** → Yes (buat password kuat)
- **Remove anonymous users?** → Yes
- **Disallow root login remotely?** → Yes
- **Remove test database?** → Yes
- **Reload privilege tables?** → Yes

---

## 3) Login ke MySQL sebagai Root

```bash
sudo mysql -u root -p
# Masukkan password root yang baru dibuat
```

---

## 4) Buat Database dan User

Jalankan perintah SQL berikut di MySQL prompt:

```sql
-- Buat database
CREATE DATABASE iware_warehouse 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Buat user untuk aplikasi
CREATE USER 'iware'@'localhost' IDENTIFIED BY 'iware_password_ganti_ini';

-- Berikan akses penuh ke database
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'localhost';

-- Jika backend di container perlu akses, buat user untuk semua host
CREATE USER 'iware'@'%' IDENTIFIED BY 'iware_password_ganti_ini';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'%';

-- Apply perubahan
FLUSH PRIVILEGES;

-- Cek user yang sudah dibuat
SELECT user, host FROM mysql.user WHERE user = 'iware';

-- Keluar dari MySQL
EXIT;
```

---

## 5) Import Schema Database

```bash
# Download atau copy file schema.sql ke VPS
# Misalnya file ada di /opt/werehouse/backend/database/schema.sql

# Import schema
mysql -u iware -p iware_warehouse < /opt/werehouse/backend/database/schema.sql

# Masukkan password user 'iware' saat diminta
```

---

## 6) Verifikasi Database Sudah Terbuat

```bash
# Login ke database
mysql -u iware -p iware_warehouse

# Di MySQL prompt, cek tabel yang sudah dibuat
SHOW TABLES;

# Cek struktur tabel users
DESCRIBE users;

# Cek data default (super admin)
SELECT id, nama, email, role, status FROM users;

# Keluar
EXIT;
```

Output yang diharapkan dari `SHOW TABLES;`:
```
+----------------------------+
| Tables_in_iware_warehouse  |
+----------------------------+
| accurate_tokens            |
| activity_logs              |
| items                      |
| sales_order_details        |
| sales_orders               |
| sync_config                |
| sync_logs                  |
| users                      |
| webhook_logs               |
+----------------------------+
```

---

## 7) Konfigurasi MySQL untuk Remote Access (Jika Backend di Container)

Jika backend berjalan di Docker container dan perlu akses ke MySQL di host:

### 7.1 Edit konfigurasi MySQL

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Cari baris:
```
bind-address = 127.0.0.1
```

Ubah menjadi (agar bisa diakses dari container):
```
bind-address = 0.0.0.0
```

Atau lebih aman, bind ke IP internal Docker:
```
bind-address = 172.17.0.1
```

### 7.2 Restart MySQL

```bash
sudo systemctl restart mysql
```

### 7.3 Buka port MySQL di firewall (hanya untuk Docker network)

```bash
# Jangan buka port 3306 ke public!
# Hanya untuk localhost atau Docker network
sudo ufw allow from 172.17.0.0/16 to any port 3306
```

---

## 8) Update Konfigurasi Backend

Jika database manual (bukan di container), update file `.env`:

```bash
nano /opt/werehouse/.env
```

Ubah konfigurasi database:

```env
# Untuk database di host VPS (bukan container)
DB_HOST=172.17.0.1
# Atau gunakan IP VPS internal
# DB_HOST=localhost (jika backend juga di host, bukan container)

DB_PORT=3306
DB_USER=iware
DB_PASSWORD=iware_password_ganti_ini
DB_NAME=iware_warehouse
```

---

## 9) Update docker-compose.yml (Jika Pakai Database Manual)

Jika database manual di VPS, hapus service `db` dari `docker-compose.yml`:

```bash
nano /opt/werehouse/docker-compose.yml
```

Hapus atau comment section `db:` dan update `backend` dependencies:

```yaml
services:
  # db:  # <-- Comment atau hapus seluruh section db
  #   image: mysql:8.0
  #   ...

  backend:
    # ...
    depends_on:
      # db:  # <-- Hapus dependency ke db
      #   condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      # DB_HOST akan ambil dari .env (172.17.0.1 atau localhost)
      DB_HOST: ${DB_HOST:-172.17.0.1}
      # ...
```

Lalu restart backend:

```bash
cd /opt/werehouse
docker compose up -d --build backend
```

---

## 10) Test Koneksi Database

### Test dari VPS host:

```bash
mysql -u iware -p -h localhost iware_warehouse -e "SELECT COUNT(*) as total_users FROM users;"
```

### Test dari backend container:

```bash
docker exec -it iware_backend node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: '172.17.0.1',
  user: 'iware',
  password: 'iware_password_ganti_ini',
  database: 'iware_warehouse'
}).then(conn => {
  console.log('✅ Database connection successful!');
  return conn.query('SELECT COUNT(*) as total FROM users');
}).then(([rows]) => {
  console.log('Total users:', rows[0].total);
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"
```

---

## 11) Buat User Admin (Jika Belum Ada)

```bash
# Jika import schema berhasil, seharusnya sudah ada user default:
# Email: superadmin@iware.id
# Password: admin123

# Untuk membuat user baru via script:
docker exec -it iware_backend node src/scripts/create-admin-auto.js
```

---

## 12) Troubleshooting

### Error: Access denied for user 'iware'@'172.17.0.1'

```sql
-- Login sebagai root
sudo mysql -u root -p

-- Buat user untuk IP Docker
CREATE USER 'iware'@'172.17.0.1' IDENTIFIED BY 'iware_password_ganti_ini';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'172.17.0.1';
FLUSH PRIVILEGES;
EXIT;
```

### Error: Can't connect to MySQL server

```bash
# Cek MySQL berjalan
sudo systemctl status mysql

# Cek port 3306 listening
sudo netstat -tlnp | grep 3306

# Cek bind-address
sudo grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf
```

### Error: Table doesn't exist

```bash
# Re-import schema
mysql -u iware -p iware_warehouse < /opt/werehouse/backend/database/schema.sql
```

---

## 13) Backup Database (Penting!)

```bash
# Backup manual
mysqldump -u iware -p iware_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
mysql -u iware -p iware_warehouse < backup_20260407_120000.sql
```

### Setup Auto Backup (Cron)

```bash
# Buat script backup
sudo nano /usr/local/bin/backup-iware-db.sh
```

Isi script:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/iware"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u iware -piware_password_ganti_ini iware_warehouse > $BACKUP_DIR/iware_$DATE.sql

# Hapus backup lebih dari 7 hari
find $BACKUP_DIR -name "iware_*.sql" -mtime +7 -delete

echo "Backup completed: iware_$DATE.sql"
```

Buat executable dan tambah ke cron:

```bash
sudo chmod +x /usr/local/bin/backup-iware-db.sh

# Edit crontab
crontab -e

# Tambahkan baris ini (backup setiap hari jam 2 pagi)
0 2 * * * /usr/local/bin/backup-iware-db.sh >> /var/log/iware-backup.log 2>&1
```

---

## Kesimpulan

Setelah setup manual:
- ✅ MySQL Server terinstall di VPS
- ✅ Database `iware_warehouse` sudah dibuat
- ✅ User `iware` punya akses penuh
- ✅ Schema dan tabel sudah ter-import
- ✅ User admin default sudah ada
- ✅ Backend container bisa connect ke database

Login ke aplikasi dengan:
- Email: `superadmin@iware.id`
- Password: `admin123`

**PENTING:** Ganti password default setelah login pertama kali!
