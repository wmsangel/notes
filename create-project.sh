#!/bin/bash

echo "Создание структуры проекта Notes System..."

# Создание директорий
mkdir -p backend/{config,controllers,routes,services,uploads}
mkdir -p frontend/{public,src/{components/{layout,features,ui},views,stores,services/api,router,config}}
mkdir -p database

echo "✓ Структура директорий создана"

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "notes-backend",
  "version": "1.0.0",
  "type": "module",
  "description": "Backend API for Notes System",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "keywords": ["notes", "api", "express"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "googleapis": "^128.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

echo "✓ Backend package.json создан"

# Backend .env.example
cat > backend/.env.example << 'EOF'
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root
DB_NAME=notes
JWT_SECRET=your_super_secret_key_change_this_in_production
PORT=3000
UPLOAD_DIR=./uploads
EOF

# Backend .gitignore
cat > backend/.gitignore << 'EOF'
node_modules/
.env
uploads/*
!uploads/.gitkeep
*.log
.DS_Store
package-lock.json
EOF

# Backend uploads/.gitkeep
echo "# Keep uploads directory" > backend/uploads/.gitkeep

echo "✓ Backend конфигурационные файлы созданы"
echo ""
echo "Структура проекта готова!"
echo "Теперь скопируйте код из чата в соответствующие файлы."
echo ""
echo "Список всех файлов смотрите в FILES-CHECKLIST.md"

