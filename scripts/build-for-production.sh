#!/bin/sh
# Сборка фронтенда и копирование в backend/public для деплоя одним сервером.
# Запуск из корня проекта: sh scripts/build-for-production.sh

set -e
cd "$(dirname "$0")/.."

echo "[build] Сборка фронтенда (VITE_API_URL=/api)..."
cd frontend
VITE_API_URL=/api npm run build
cd ..

echo "[build] Копирование dist в backend/public..."
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public

echo "[build] Готово. Запуск на сервере: cd backend && NODE_ENV=production node server.js"
echo "[build] Или используйте Docker: docker build -t notes . && docker run ..."
