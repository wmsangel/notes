# 📋 ПОЛНЫЙ СПИСОК ФАЙЛОВ ДЛЯ КОПИРОВАНИЯ

## Инструкция:
1. Прокрутите чат вверх
2. Найдите код каждого файла (они отмечены комментариями)
3. Скопируйте код в соответствующий файл

---

## BACKEND FILES (19 файлов)

### Корневые файлы
- [ ] `backend/package.json` - Зависимости проекта
- [ ] `backend/server.js` - Главный файл сервера Express
- [ ] `backend/.env.example` - Пример конфигурации
- [ ] `backend/.gitignore` - Git ignore правила
- [ ] `backend/README.md` - Backend документация

### Config (1 файл)
- [ ] `backend/config/database.js` - MySQL подключение с пулом

### Controllers (5 файлов)
- [ ] `backend/controllers/dashboardController.js` - Контроллер дашборда
- [ ] `backend/controllers/folderController.js` - Контроллер папок
- [ ] `backend/controllers/noteController.js` - Контроллер заметок  
- [ ] `backend/controllers/todoController.js` - Контроллер TODO листов
- [ ] `backend/controllers/uploadController.js` - Контроллер загрузки файлов

### Routes (5 файлов)
- [ ] `backend/routes/dashboard.js` - API роуты дашборда
- [ ] `backend/routes/folders.js` - API роуты папок
- [ ] `backend/routes/notes.js` - API роуты заметок
- [ ] `backend/routes/todos.js` - API роуты TODO
- [ ] `backend/routes/upload.js` - API роуты загрузки (с Multer)

### Services (5 файлов)
- [ ] `backend/services/dashboardService.js` - Бизнес-логика дашборда
- [ ] `backend/services/folderService.js` - Бизнес-логика папок
- [ ] `backend/services/noteService.js` - Бизнес-логика заметок
- [ ] `backend/services/todoService.js` - Бизнес-логика TODO
- [ ] `backend/services/uploadService.js` - Бизнес-логика загрузки

### Uploads
- [ ] `backend/uploads/.gitkeep` - Пустой файл для сохранения папки

---

## FRONTEND FILES (38 файлов)

### Корневые файлы
- [ ] `frontend/package.json` - Зависимости проекта
- [ ] `frontend/vite.config.js` - Конфигурация Vite + PWA
- [ ] `frontend/index.html` - HTML шаблон
- [ ] `frontend/.env.example` - Пример конфигурации
- [ ] `frontend/.gitignore` - Git ignore правила
- [ ] `frontend/README.md` - Frontend документация

### Source
- [ ] `frontend/src/main.js` - Точка входа приложения
- [ ] `frontend/src/App.vue` - Главный Vue компонент
- [ ] `frontend/src/style.css` - Глобальные CSS стили (~400 строк)

### Components - Layout (3 файла)
- [ ] `frontend/src/components/layout/MainLayout.vue` - Главный layout
- [ ] `frontend/src/components/layout/Sidebar.vue` - Боковая панель навигации
- [ ] `frontend/src/components/layout/Header.vue` - Шапка с поиском

### Components - Features (9 файлов)
- [ ] `frontend/src/components/features/FolderModal.vue` - Модалка создания/редактирования папки
- [ ] `frontend/src/components/features/FolderTreeItem.vue` - Элемент дерева папок
- [ ] `frontend/src/components/features/NoteCard.vue` - Карточка заметки
- [ ] `frontend/src/components/features/QuickAdd.vue` - Быстрое добавление
- [ ] `frontend/src/components/features/TiptapEditor.vue` - WYSIWYG редактор (~400 строк)
- [ ] `frontend/src/components/features/TodoItem.vue` - Элемент TODO
- [ ] `frontend/src/components/features/TodoListCard.vue` - Карточка TODO листа
- [ ] `frontend/src/components/features/TodoListModal.vue` - Модалка TODO листа

### Components - UI (3 файла)
- [ ] `frontend/src/components/ui/Modal.vue` - Модальное окно (обертка)
- [ ] `frontend/src/components/ui/ModalBase.vue` - Базовый компонент модалки
- [ ] `frontend/src/components/ui/Toast.vue` - Уведомления

### Views (8 файлов)
- [ ] `frontend/src/views/Dashboard.vue` - Главная страница
- [ ] `frontend/src/views/Notes.vue` - Список всех заметок
- [ ] `frontend/src/views/NoteView.vue` - Просмотр/редактирование заметки
- [ ] `frontend/src/views/Favorites.vue` - Избранные заметки
- [ ] `frontend/src/views/Folder.vue` - Просмотр содержимого папки
- [ ] `frontend/src/views/Todos.vue` - Список TODO листов
- [ ] `frontend/src/views/TodoList.vue` - Просмотр TODO листа
- [ ] `frontend/src/views/Search.vue` - Поиск по заметкам
- [ ] `frontend/src/views/NotFound.vue` - 404 страница

### Stores (5 файлов)
- [ ] `frontend/src/stores/dashboard.js` - Pinia store дашборда
- [ ] `frontend/src/stores/folders.js` - Pinia store папок
- [ ] `frontend/src/stores/notes.js` - Pinia store заметок
- [ ] `frontend/src/stores/todos.js` - Pinia store TODO
- [ ] `frontend/src/stores/ui.js` - Pinia store UI (модалки, тосты)

### Services/API (6 файлов)
- [ ] `frontend/src/config/api.js` - Axios конфигурация
- [ ] `frontend/src/services/api/dashboard.js` - API клиент дашборда
- [ ] `frontend/src/services/api/folders.js` - API клиент папок
- [ ] `frontend/src/services/api/notes.js` - API клиент заметок
- [ ] `frontend/src/services/api/todos.js` - API клиент TODO
- [ ] `frontend/src/services/api/upload.js` - API клиент загрузки

### Router
- [ ] `frontend/src/router/index.js` - Vue Router конфигурация

---

## DATABASE (1 файл)

- [ ] `database/schema.sql` - Полная SQL схема с индексами (~150 строк)

---

## DOCUMENTATION (3 файла)

- [ ] `README.md` - Главная документация проекта
- [ ] `DEPLOYMENT.md` - Инструкция по деплою на Timeweb
- [ ] `INSTALL.md` - Инструкция по установке (этот файл)

---

## ИТОГО: 61 файл

### Разбивка по типам:
- **JavaScript (Backend)**: 19 файлов
- **Vue компоненты**: 23 файла
- **JavaScript (Frontend)**: 12 файлов
- **CSS**: 1 файл
- **HTML**: 1 файл
- **SQL**: 1 файл
- **Markdown**: 4 файла

### Разбивка по размеру кода:
- Маленькие (<100 строк): 20 файлов
- Средние (100-300 строк): 30 файлов
- Большие (300+ строк): 11 файлов

---

## ⚡ Быстрая установка

После копирования всех файлов:

```bash
# 1. Установка зависимостей
cd backend && npm install
cd ../frontend && npm install

# 2. Настройка БД
mysql -u sangel_notes -paK7Nmn3a sangel_notes < ../database/schema.sql

# 3. Настройка .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Запуск
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## 📌 Важные моменты

1. **Не забудьте создать папку** `backend/uploads/` с файлом `.gitkeep`
2. **Все файлы уже созданы в чате** - просто копируйте код
3. **Следуйте структуре папок точно** как указано
4. **MySQL должен быть запущен** перед стартом backend
5. **Порты 3000 и 5173** должны быть свободны

## 🎉 После установки

Откройте браузер:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/health

## 🐛 Troubleshooting

**Backend не запускается:**
- Проверьте MySQL запущен ли
- Проверьте .env файл
- Проверьте порт 3000 свободен

**Frontend не запускается:**
- Проверьте установлены ли зависимости
- Проверьте порт 5173 свободен
- Очистите кэш: `rm -rf node_modules && npm install`

**БД ошибка:**
- Проверьте права доступа: `GRANT ALL PRIVILEGES ON sangel_notes.* TO 'sangel_notes'@'localhost';`
- Проверьте пароль в .env

---

✅ **Все готово! Удачи в использовании Notes System!**
