// backend/config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Railway и др. часто отдают одну строку подключения (DATABASE_URL / MYSQL_URL)
function getConfig() {
    const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (url) {
        try {
            const u = new URL(url);
            return {
                host: u.hostname,
                port: parseInt(u.port, 10) || 3306,
                user: u.username,
                password: u.password,
                database: (u.pathname || '/').replace(/^\//, '') || process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            };
        } catch (e) {
            console.warn('[DB] DATABASE_URL parse error, using DB_* vars:', e.message);
        }
    }
    return {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const pool = mysql.createPool(getConfig());

export default pool;