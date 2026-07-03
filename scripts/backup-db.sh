#!/bin/bash
# Backup database MySQL dari container Docker di VPS
# Jalankan langsung di VPS: bash backup-db.sh

set -e

# ==== KONFIGURASI ====
CONTAINER_NAME="iware-mysql-prod"
DB_NAME="iware_warehouse"
DB_USER="root"
DB_PASSWORD="ISI_PASSWORD_DB_DISINI"   # samakan dengan DB_ROOT_PASSWORD / DB_PASSWORD di .env VPS
BACKUP_DIR="/root/backup-db"           # folder penyimpanan backup di VPS
KEEP_DAYS=7                            # backup lebih lama dari ini akan dihapus otomatis

# ==== PROSES BACKUP ====
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Membuat backup database '$DB_NAME' dari container '$CONTAINER_NAME'..."

docker exec "$CONTAINER_NAME" mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > "$FILENAME"

echo "Backup selesai: $FILENAME"
echo "Ukuran: $(du -h "$FILENAME" | cut -f1)"

# Hapus backup yang lebih tua dari KEEP_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup lama (>$KEEP_DAYS hari) sudah dibersihkan."
