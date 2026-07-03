#!/bin/bash
# Ambil backup database dari VPS ke komputer lokal
# Jalankan di LOKAL (bukan di VPS): bash pull-backup-to-local.sh

set -e

# ==== KONFIGURASI ====
VPS_USER="root"                        # user SSH ke VPS
VPS_HOST="ISI_IP_ATAU_DOMAIN_VPS"      # contoh: 123.45.67.89
VPS_BACKUP_DIR="/root/backup-db"       # folder backup di VPS (samakan dengan backup-db.sh)
LOCAL_BACKUP_DIR="./backup"            # folder tujuan di lokal

# ==== PROSES ====
mkdir -p "$LOCAL_BACKUP_DIR"

echo "Mengambil file backup terbaru dari VPS..."

# Ambil semua file backup (bisa diganti biar cuma ambil yang terbaru saja)
scp "$VPS_USER@$VPS_HOST:$VPS_BACKUP_DIR/*.sql.gz" "$LOCAL_BACKUP_DIR/"

echo "Selesai. File backup ada di: $LOCAL_BACKUP_DIR"
