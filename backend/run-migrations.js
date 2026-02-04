#!/usr/bin/env node
/**
 * Выполняет миграции из database/*.sql используя подключение из .env
 * Запуск: node run-migrations.js (из папки backend)
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import db from './config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const DB_MIGRATIONS_DIR = path.join(__dirname, '..', 'database')

const MIGRATIONS = [
  'migrate-notes-add-note-type.sql',
  'migrate-notes-add-protection.sql',
  'migrate-notes-add-position.sql',
]

// Коды ошибок MySQL, которые можно игнорировать (уже применено)
const IGNORE_CODES = new Set([
  'ER_DUP_FIELDNAME',   // Duplicate column name
  'ER_DUP_KEYNAME',    // Duplicate key name
  'ER_DUP_INDEX',      // Duplicate key
])

function stripComments(sql) {
  return sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
}

function getStatements(content) {
  const sql = stripComments(content)
  return sql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
}

async function runMigration(filename) {
  const filepath = path.join(DB_MIGRATIONS_DIR, filename)
  if (!fs.existsSync(filepath)) {
    console.warn(`[migrate] Файл не найден: ${filename}`)
    return
  }
  const content = fs.readFileSync(filepath, 'utf8')
  const statements = getStatements(content)
  for (const sql of statements) {
    if (!sql) continue
    try {
      await db.query(sql)
      console.log(`[migrate] OK: ${filename} — выполнен запрос`)
    } catch (err) {
      if (IGNORE_CODES.has(err.code)) {
        console.log(`[migrate] Пропуск (уже есть): ${filename} — ${err.message?.slice(0, 60)}`)
      } else {
        console.error(`[migrate] Ошибка в ${filename}:`, err.message)
        throw err
      }
    }
  }
}

async function main() {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  const missing = required.filter(key => !process.env[key])
  if (missing.length) {
    console.error('[migrate] Нет переменных окружения:', missing.join(', '))
    console.error('Создайте backend/.env из backend/.env.example')
    process.exit(1)
  }
  try {
    await db.query('SELECT 1')
    console.log('[migrate] Подключение к БД успешно')
  } catch (err) {
    console.error('[migrate] Ошибка подключения к БД:', err.message)
    process.exit(1)
  }
  for (const name of MIGRATIONS) {
    await runMigration(name)
  }
  console.log('[migrate] Готово.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
