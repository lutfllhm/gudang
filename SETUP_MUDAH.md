# Setup Database - Cara Paling Mudah

## Langkah 1: Login ke VPS

```bash
ssh root@IP_VPS_ANDA
cd /opt/werehouse
```

## Langkah 2: Install MySQL (jika belum ada)

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## Langkah 3: Buat Database dan User

Copy-paste perintah ini (satu blok):

```bash
sudo mysql << 'EOF'
CREATE DATABASE IF NOT EXISTS iware_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'iware'@'localhost' IDENTIFIED BY 'iware123';
CREATE USER IF NOT EXISTS 'iware'@'%' IDENTIFIED BY 'iware123';
CREATE USER IF NOT EXISTS 'iware'@'172.17.0.1' IDENTIFIED BY 'iware123';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'localhost';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'%';
GRANT ALL PRIVILEGES ON iware_warehouse.* TO 'iware'@'172.17.0.1';
FLUSH PRIVILEGES;
SELECT '✅ Database dan user berhasil dibuat!' as status;
EOF
```

## Langkah 4: Import Schema

```bash
cd /opt/werehouse
sudo mysql iware_warehouse < backend/database/schema.sql
echo "✅ Schema berhasil diimport!"
```

## Langkah 5: Konfigurasi MySQL untuk Docker

```bash
sudo sed -i.bak 's/^bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
sudo systemctl restart mysql
echo "✅ MySQL dikonfigurasi untuk Docker!"
```

## Langkah 6: Update File .env

```bash
nano /opt/werehouse/.env
```

Ubah bagian database menjadi:

```env
DB_HOST=172.17.0.1
DB_PORT=3306
DB_USER=iware
DB_PASSWORD=iware123
DB_NAME=iware_warehouse
```

Simpan dengan: `Ctrl+X`, lalu `Y`, lalu `Enter`

## Langkah 7: Restart Backend

```bash
cd /opt/werehouse
docker compose restart backend
```

## Langkah 8: Cek Logs

```bash
docker logs iware_backend --tail 50
```

Jika tidak ada error, database sudah siap!

## Langkah 9: Login ke Aplikasi

Buka browser: `https://iwareid.com`

Login dengan:
- Email: `superadmin@iware.id`
- Password: `admin123`

---

## Verifikasi Database

Cek apakah database berhasil:

```bash
# Cek tabel
sudo mysql iware_warehouse -e "SHOW TABLES;"

# Cek user default
sudo mysql iware_warehouse -e "SELECT id, nama, email, role FROM users;"

# Test koneksi dari backend
docker exec -it iware_backend node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host: '172.17.0.1', user: 'iware', password: 'iware123', database: 'iware_warehouse'}).then(c => {console.log('✅ Database OK'); c.end()}).catch(e => console.error('❌ Error:', e.message))"
```

---

## Troubleshooting

### Error: Access denied

```bash
sudo mysql -e "ALTER USER 'iware'@'localhost' IDENTIFIED BY 'iware123'; FLUSH PRIVILEGES;"
```

### Error: Can't connect from Docker

```bash
sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
sudo systemctl restart mysql
```

### Backend tidak bisa connect

```bash
# Cek logs
docker logs iware_backend --tail 50

# Cek .env
cat /opt/werehouse/.env | grep DB_

# Restart backend
docker compose restart backend
```

---

## Ganti Password Database (Opsional)

Jika ingin ganti password 'iware123' dengan password lain:

```bash
# Ganti PASSWORD_BARU dengan password yang Anda inginkan
sudo mysql -e "ALTER USER 'iware'@'localhost' IDENTIFIED BY 'PASSWORD_BARU'; ALTER USER 'iware'@'%' IDENTIFIED BY 'PASSWORD_BARU'; ALTER USER 'iware'@'172.17.0.1' IDENTIFIED BY 'PASSWORD_BARU'; FLUSH PRIVILEGES;"

# Update .env
nano /opt/werehouse/.env
# Ubah: DB_PASSWORD=PASSWORD_BARU

# Restart backend
docker compose restart backend
```

---

## Selesai!

Database sudah siap digunakan. Silakan login ke aplikasi.
