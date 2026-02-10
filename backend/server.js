// backend/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { initDb } from './db-init.js';
import folderRoutes from './routes/folders.js';
import noteRoutes from './routes/notes.js';
import todoRoutes from './routes/todos.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import calendarRoutes from './routes/calendar.js';
import authRoutes from './routes/auth.js';
import cookieParser from 'cookie-parser';
import { authRequired, csrfRequired, isPasswordConfigured } from './middleware/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
app.set('isProduction', isProduction);

// Проверка подключения к БД и инициализация схемы/миграций
async function checkDatabase() {
    const hasDbConfig =
        process.env.DATABASE_URL ||
        process.env.MYSQL_URL ||
        (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) ||
        (process.env.MYSQLHOST && process.env.MYSQLUSER && process.env.MYSQLPASSWORD && process.env.MYSQLDATABASE);
    if (!hasDbConfig) {
        console.error(
            '[DB] Нет переменных подключения к MySQL (DATABASE_URL, MYSQL_URL или DB_*/MYSQL*).'
        );
        console.error('[DB] В контейнере есть:', Object.keys(process.env).filter(k => /mysql|database|db_/i.test(k)).join(', ') || '(ни одной из известных)');
        return false;
    }
    try {
        await pool.query('SELECT 1');
        console.log('[DB] Подключение к MySQL успешно.');
        await initDb();
        return true;
    } catch (err) {
        console.error('[DB] Ошибка:', err.message);
        return false;
    }
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// Auth routes (no auth)
app.use('/api/auth', authRoutes);

// Protect API routes (except auth + health)
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/health')) return next();
    if (!isPasswordConfigured()) {
        return res.status(500).json({ error: 'Password not configured' });
    }
    return authRequired(req, res, next);
});
app.use('/api', csrfRequired);

// Routes
app.use('/api/folders', folderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/calendar', calendarRoutes);

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
        // If password is configured, require auth for app routes
        if (isPasswordConfigured()) {
            const token = req.cookies?.notes_auth;
            if (!token && req.path !== '/login') {
                return res.redirect('/login');
            }
        }
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
