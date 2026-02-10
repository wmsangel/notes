/**
 * Инициализация БД при старте: схема (если пустая) + миграции.
 * Вызывается из server.js перед listen.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Локально: backend и database — соседи. В Docker: /app/database
const DB_DIR = fs.existsSync(path.join(__dirname, 'database'))
  ? path.join(__dirname, 'database')
  : path.join(__dirname, '..', 'database');

const MIGRATIONS = [
  'migrate-notes-add-note-type.sql',
  'migrate-notes-add-protection.sql',
  'migrate-notes-add-position.sql',
  'migrate-todo-lists-add-tags-color.sql',
  'migrate-todo-note-links.sql',
  'migrate-note-attachments.sql',
  'migrate-notes-add-show-on-dashboard.sql',
  'migrate-notes-add-color.sql',
  'migrate-todo-lists-add-note-link.sql',
  'migrate-calendar-events.sql',
  'migrate-calendar-frequency-extend.sql',
  'migrate-dashboard-links.sql',
  'migrate-todo-items-add-show-on-dashboard.sql',
];

const IGNORE_CODES = new Set(['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_DUP_INDEX']);

function stripComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function getStatements(content) {
  const sql = stripComments(content);
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function schemaNeeded() {
  try {
    const [rows] = await db.query("SHOW TABLES LIKE 'folders'");
    return rows.length === 0;
  } catch {
    return true;
  }
}

async function runSchema() {
  const filepath = path.join(DB_DIR, 'schema.sql');
  if (!fs.existsSync(filepath)) {
    console.warn('[db-init] schema.sql не найден:', filepath);
    return;
  }
  const content = fs.readFileSync(filepath, 'utf8');
  const statements = getStatements(content);
  for (const sql of statements) {
    if (!sql) continue;
    try {
      await db.query(sql);
      console.log('[db-init] schema: выполнен запрос');
    } catch (err) {
      console.error('[db-init] schema:', err.message);
      throw err;
    }
  }
  console.log('[db-init] Схема применена.');
}

async function runMigrations() {
  for (const name of MIGRATIONS) {
    const filepath = path.join(DB_DIR, name);
    if (!fs.existsSync(filepath)) continue;
    const content = fs.readFileSync(filepath, 'utf8');
    const statements = getStatements(content);
    for (const sql of statements) {
      if (!sql) continue;
      try {
        await db.query(sql);
        console.log('[db-init] миграция:', name);
      } catch (err) {
        if (IGNORE_CODES.has(err.code)) {
          console.log('[db-init] пропуск (уже есть):', name);
        } else {
          console.error('[db-init] ошибка в', name, err.message);
          throw err;
        }
      }
    }
  }
  console.log('[db-init] Миграции применены.');
}

export async function initDb() {
  try {
    await db.query('SELECT 1');
  } catch (err) {
    console.error('[db-init] Нет подключения к БД:', err.message);
    throw err;
  }
  if (await schemaNeeded()) {
    await runSchema();
  }
  await runMigrations();
}
