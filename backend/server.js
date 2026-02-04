// backend/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './config/database.js';
import folderRoutes from './routes/folders.js';
import noteRoutes from './routes/notes.js';
import todoRoutes from './routes/todos.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Проверка подключения к БД при старте
async function checkDatabase() {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
        console.error(
            '[DB] Не заданы переменные окружения:',
            missing.join(', '),
            '\nСкопируйте backend/.env.example в backend/.env и укажите данные MySQL.'
        );
        return false;
    }
    try {
        await pool.query('SELECT 1');
        console.log('[DB] Подключение к MySQL успешно.');
        return true;
    } catch (err) {
        console.error(
            '[DB] Ошибка подключения к MySQL:',
            err.message,
            '\nУбедитесь, что MySQL запущен, база создана и таблицы созданы (database/schema.sql).'
        );
        return false;
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/folders', folderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Notes API is running' });
});

// В продакшене отдаём собранный фронтенд из backend/public
if (isProduction) {
    const publicDir = path.join(__dirname, 'public');
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
        res.sendFile(path.join(publicDir, 'index.html'));
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

checkDatabase().then((ok) => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        if (!ok) console.log('API будет отвечать 500 на запросы к БД до настройки подключения.');
    });
});