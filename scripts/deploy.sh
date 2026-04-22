#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f ".env.production" ]; then
  echo "File .env.production belum ada. Salin dari .env.example lalu isi nilainya."
  exit 1
fi

echo "Pull image base terbaru..."
docker compose pull mysql redis || true

echo "Build dan jalankan container..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "Status container:"
docker compose ps

echo "Deploy selesai."
