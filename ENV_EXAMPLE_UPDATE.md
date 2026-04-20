# Environment Variables Update

## Untuk Fitur Sales Invoice History

Tidak ada environment variable baru yang perlu ditambahkan untuk fitur ini. Fitur menggunakan konfigurasi yang sudah ada.

---

## ✅ Environment Variables yang Digunakan

Fitur ini menggunakan environment variables yang sudah ada:

### Database Configuration
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iware_warehouse
DB_USER=root
DB_PASSWORD=your_password
```

### Accurate API Configuration
```env
ACCURATE_CLIENT_ID=your_client_id
ACCURATE_CLIENT_SECRET=your_client_secret
ACCURATE_REDIRECT_URI=http://localhost:3000/accurate/callback
ACCURATE_ACCOUNT_URL=https://account.accurate.id
ACCURATE_DATABASE_ID=your_database_id
```

### Server Configuration
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your_jwt_secret
```

---

## 🔍 Verifikasi Environment Variables

### Di VPS (Docker)

```bash
# Cek .env file
cat .env

# Cek environment di container backend
docker exec iware-backend env | grep -E "DB_|ACCURATE_|PORT|NODE_ENV"

# Cek environment di container MySQL
docker exec iware-mysql env | grep MYSQL_
```

### Expected Output:
```
DB_HOST=iware-mysql
DB_PORT=3306
DB_NAME=iware_warehouse
DB_USER=root
DB_PASSWORD=********
ACCURATE_CLIENT_ID=********
ACCURATE_CLIENT_SECRET=********
PORT=5000
NODE_ENV=production
```

---

## 🔧 Jika Environment Variables Tidak Sesuai

### Update .env File

```bash
# Edit .env file
nano .env

# Atau via vim
vim .env
```

### Restart Containers

```bash
# Restart untuk apply perubahan
docker-compose down
docker-compose up -d

# Verify
docker exec iware-backend env | grep DB_HOST
```

---

## 📝 Docker Compose Environment

Pastikan `docker-compose.yml` sudah menggunakan `.env` file:

```yaml
services:
  backend:
    environment:
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - ACCURATE_CLIENT_ID=${ACCURATE_CLIENT_ID}
      - ACCURATE_CLIENT_SECRET=${ACCURATE_CLIENT_SECRET}
      # ... other variables
    env_file:
      - .env
```

---

## 🔐 Security Notes

1. **Jangan commit `.env` file ke Git**
   ```bash
   # Pastikan .env ada di .gitignore
   echo ".env" >> .gitignore
   ```

2. **Gunakan strong password untuk database**
   ```bash
   # Generate random password
   openssl rand -base64 32
   ```

3. **Rotate JWT secret secara berkala**
   ```bash
   # Generate new JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

---

## 📚 Reference

- Main `.env.example`: `backend/.env.example`
- Docker Compose: `docker-compose.yml`
- Config file: `backend/src/config/index.js`

---

**No new environment variables needed for this feature! ✅**
