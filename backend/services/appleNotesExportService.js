// backend/services/appleNotesExportService.js
//
// Экспорт заметок в Apple Notes (встроенное приложение macOS).
// Работает только когда backend запущен на macOS — использует osascript.
//
// Подход:
//   1. Содержимое заметки — это HTML из tiptap-редактора. Картинки внутри (<img src="/uploads/...">)
//      инлайнятся как base64 data: URI, чтобы они корректно ехали в Apple Notes через AppleScript body.
//   2. Записи из таблиц images / attachments тоже добавляются в тело заметки:
//      - картинки → инлайн <img>;
//      - прочие файлы → секция "Вложения" со списком имён и (если включено) размером.
//   3. Скрипт пишется во временный .applescript файл и запускается через osascript.
//
// Совет: пользователь должен один раз разрешить терминалу/Node контролировать Apple Notes
// (System Settings → Privacy & Security → Automation).

import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import pool from '../config/database.js'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads')

const DEFAULT_FOLDER_NAME = 'Imported from Notes System'
const OSASCRIPT_TIMEOUT_MS = 60_000
const OSASCRIPT_BUFFER = 20 * 1024 * 1024

/** macOS только. */
export function isAppleNotesAvailable() {
    return process.platform === 'darwin'
}

/** Простой mime detect по расширению — без сторонних зависимостей. */
function mimeFromName(name) {
    const ext = String(name || '').toLowerCase().split('.').pop()
    const map = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
        webp: 'image/webp', heic: 'image/heic', svg: 'image/svg+xml',
        pdf: 'application/pdf'
    }
    return map[ext] || 'application/octet-stream'
}

function isImageMime(mime) {
    return typeof mime === 'string' && mime.toLowerCase().startsWith('image/')
}

/** Безопасное преобразование строки в литерал AppleScript. */
function escapeAS(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '')
        .replace(/\n/g, '\\n')
}

/** Минимальное экранирование для HTML-литерала, чтобы не сломать body. */
function htmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function formatBytes(bytes) {
    const n = Number(bytes || 0)
    if (!n) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let v = n
    let i = 0
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Прочитать файл из uploads/ и вернуть data:URI или null, если файла нет
 * либо он слишком большой (Apple Notes плохо переваривает body > ~20МБ).
 */
async function fileToDataUri(absolutePath, mime, maxBytes = 5 * 1024 * 1024) {
    try {
        const stat = await fs.stat(absolutePath)
        if (stat.size > maxBytes) return null
        const buf = await fs.readFile(absolutePath)
        const base64 = buf.toString('base64')
        return `data:${mime};base64,${base64}`
    } catch {
        return null
    }
}

/** Резолв пути из значения filepath/filename, лежащего в БД. */
function resolveUploadPath(record) {
    const candidates = []
    if (record?.filepath) candidates.push(record.filepath)
    if (record?.filename) candidates.push(path.join(UPLOADS_DIR, record.filename))
    for (const c of candidates) {
        if (!c) continue
        const abs = path.isAbsolute(c) ? c : path.resolve(__dirname, '..', c)
        if (abs.startsWith(UPLOADS_DIR)) return abs
        // также примем — файлы могут быть в backend/uploads даже если путь относительный
        if (c.includes('uploads')) return abs
    }
    return null
}

/**
 * Заменяет <img src="/uploads/имя"> внутри HTML заметки на инлайн-base64,
 * чтобы картинки не отвалились в Apple Notes.
 */
async function inlineContentImages(html) {
    if (!html || typeof html !== 'string') return html || ''
    const regex = /<img\b([^>]*?)\s+src=(["'])([^"']+)\2([^>]*)>/gi
    const tasks = []
    const replacements = []
    let m
    while ((m = regex.exec(html)) !== null) {
        const fullMatch = m[0]
        const before = m[1] || ''
        const quote = m[2]
        const src = m[3]
        const after = m[4] || ''
        replacements.push({ fullMatch, before, quote, src, after })
    }

    for (const r of replacements) {
        const src = r.src
        // Берём только локальные uploads, чтобы не качать сеть.
        const upMatch = src.match(/\/uploads\/([^?#"']+)/)
        if (!upMatch) continue
        const filename = upMatch[1]
        const abs = path.join(UPLOADS_DIR, filename)
        tasks.push(
            fileToDataUri(abs, mimeFromName(filename)).then((dataUri) => {
                if (dataUri) {
                    r.replacement = `<img${r.before} src=${r.quote}${dataUri}${r.quote}${r.after}>`
                }
            })
        )
    }
    await Promise.all(tasks)

    let result = html
    for (const r of replacements) {
        if (r.replacement) {
            result = result.split(r.fullMatch).join(r.replacement)
        }
    }
    return result
}

/** Получить вложения и картинки заметки из БД. */
async function loadNoteMedia(noteId) {
    const result = { images: [], attachments: [] }
    try {
        const [images] = await pool.query(
            'SELECT id, filename, filepath, size, mime_type FROM images WHERE note_id = ?',
            [noteId]
        )
        result.images = Array.isArray(images) ? images : []
    } catch { /* таблицы может не быть — игнорируем */ }
    try {
        const [attachments] = await pool.query(
            'SELECT id, original_name, filename, filepath, size, mime_type FROM attachments WHERE note_id = ?',
            [noteId]
        )
        result.attachments = Array.isArray(attachments) ? attachments : []
    } catch { /* таблицы может не быть — игнорируем */ }
    return result
}

/**
 * Собрать итоговый HTML body заметки для Apple Notes:
 *  - заголовок <h1>;
 *  - оригинальный HTML с инлайн-картинками;
 *  - блок «Вложения» со встроенными изображениями и списком файлов.
 */
async function buildAppleNotesHtmlBody(note, { includeAttachments } = {}) {
    const title = (note.title && String(note.title).trim()) ? String(note.title).trim() : 'Без названия'
    const safeTitle = htmlEscape(title)

    const inlinedContent = await inlineContentImages(note.content || '')

    const parts = []
    parts.push(`<h1>${safeTitle}</h1>`)
    if (inlinedContent && String(inlinedContent).trim()) {
        parts.push(`<div>${inlinedContent}</div>`)
    }

    if (includeAttachments && note.id) {
        const { images, attachments } = await loadNoteMedia(note.id)

        const inlineImages = []
        const fileLines = []

        // images table — это вложенные картинки заметки.
        for (const img of images) {
            const abs = resolveUploadPath(img)
            if (!abs) continue
            const mime = img.mime_type || mimeFromName(img.filename)
            const dataUri = await fileToDataUri(abs, mime)
            if (dataUri) {
                inlineImages.push(`<p><img src="${dataUri}" alt="${htmlEscape(img.filename || '')}"></p>`)
            } else {
                fileLines.push(`<li>${htmlEscape(img.filename || 'image')}${img.size ? ` <span style="color:#888">(${htmlEscape(formatBytes(img.size))})</span>` : ''}</li>`)
            }
        }

        // attachments table — произвольные файлы.
        for (const a of attachments) {
            const name = a.original_name || a.filename || 'file'
            const abs = resolveUploadPath(a)
            const mime = a.mime_type || mimeFromName(name)
            if (abs && isImageMime(mime)) {
                const dataUri = await fileToDataUri(abs, mime)
                if (dataUri) {
                    inlineImages.push(`<p><img src="${dataUri}" alt="${htmlEscape(name)}"></p>`)
                    continue
                }
            }
            fileLines.push(`<li>${htmlEscape(name)}${a.size ? ` <span style="color:#888">(${htmlEscape(formatBytes(a.size))})</span>` : ''}</li>`)
        }

        if (inlineImages.length || fileLines.length) {
            parts.push('<hr>')
            parts.push('<h3>Вложения</h3>')
            if (inlineImages.length) parts.push(inlineImages.join('\n'))
            if (fileLines.length) parts.push(`<ul>${fileLines.join('')}</ul>`)
        }
    }

    return { html: parts.join('\n'), title }
}

/**
 * Собирает AppleScript, создающий заметку в Apple Notes.
 * Возвращает текст скрипта.
 */
function buildAppleScript({ title, htmlBody, folderName, attachmentFilePaths = [] }) {
    const titleAS = escapeAS(title)
    const bodyAS = escapeAS(htmlBody)
    const folderAS = escapeAS(folderName || DEFAULT_FOLDER_NAME)

    const attachmentBlock = (attachmentFilePaths || [])
        .map((p) => `      try
        tell newNote to make new attachment with data (POSIX file "${escapeAS(p)}")
      end try`)
        .join('\n')

    return `tell application "Notes"
  set targetFolder to missing value
  try
    set targetFolder to folder "${folderAS}"
  end try
  if targetFolder is missing value then
    try
      set targetFolder to make new folder with properties {name:"${folderAS}"}
    on error
      -- fallback: создаём в корне дефолтного аккаунта
      set targetFolder to missing value
    end try
  end if
  if targetFolder is missing value then
    set newNote to make new note with properties {name:"${titleAS}", body:"${bodyAS}"}
  else
    set newNote to make new note at targetFolder with properties {name:"${titleAS}", body:"${bodyAS}"}
  end if
${attachmentBlock}
  return id of newNote
end tell`
}

async function runAppleScript(script) {
    const tmp = path.join(os.tmpdir(), `notes-export-${Date.now()}-${Math.floor(Math.random() * 1e6)}.applescript`)
    await fs.writeFile(tmp, script, 'utf8')
    try {
        const { stdout } = await execAsync(`osascript ${JSON.stringify(tmp)}`, {
            timeout: OSASCRIPT_TIMEOUT_MS,
            maxBuffer: OSASCRIPT_BUFFER
        })
        return { ok: true, output: String(stdout || '').trim() }
    } catch (err) {
        const stderr = err?.stderr ? String(err.stderr).trim() : ''
        const message = stderr || err?.message || 'osascript execution failed'
        return { ok: false, error: message }
    } finally {
        fs.unlink(tmp).catch(() => {})
    }
}

/**
 * Экспортирует одну заметку в Apple Notes.
 * note: { id, title, content }
 * options: { folderName, includeAttachments }
 */
export async function exportNoteToAppleNotes(note, options = {}) {
    if (!isAppleNotesAvailable()) {
        return { ok: false, id: note?.id, error: 'Apple Notes доступны только на macOS' }
    }
    if (!note || !note.id) {
        return { ok: false, error: 'Не передана заметка' }
    }

    const folderName = (options.folderName && String(options.folderName).trim()) || DEFAULT_FOLDER_NAME
    const includeAttachments = options.includeAttachments !== false

    try {
        const { html, title } = await buildAppleNotesHtmlBody(note, { includeAttachments })
        const script = buildAppleScript({ title, htmlBody: html, folderName, attachmentFilePaths: [] })
        const res = await runAppleScript(script)
        if (!res.ok) {
            return { ok: false, id: note.id, title, error: res.error }
        }
        return { ok: true, id: note.id, title, appleNotesId: res.output }
    } catch (err) {
        return { ok: false, id: note.id, error: err?.message || 'Ошибка экспорта' }
    }
}

/**
 * Массовый экспорт. notes: массив записей из БД (как минимум id/title/content/is_protected).
 * Защищённые заметки пропускаются.
 */
export async function exportNotesToAppleNotes(notes, options = {}) {
    if (!isAppleNotesAvailable()) {
        return {
            ok: false,
            error: 'Apple Notes доступны только на macOS',
            results: []
        }
    }

    const results = []
    let succeeded = 0
    let failed = 0
    let skipped = 0

    for (const note of (notes || [])) {
        if (note?.is_protected) {
            skipped += 1
            results.push({ ok: false, id: note.id, title: note.title || '', skipped: true, error: 'Защищённая заметка пропущена' })
            continue
        }
        const r = await exportNoteToAppleNotes(note, options)
        if (r.ok) succeeded += 1
        else failed += 1
        results.push(r)
    }

    return {
        ok: failed === 0,
        total: results.length,
        succeeded,
        failed,
        skipped,
        results
    }
}

/**
 * Сгенерировать один большой AppleScript-файл, который при запуске
 * создаст все переданные заметки в Apple Notes.
 *
 * Этот вариант не требует, чтобы backend был на macOS — пользователь
 * скачивает файл и запускает его двойным кликом у себя на Маке.
 *
 * notes: [{ id, title, content, is_protected }]
 * options: { folderName, includeAttachments }
 * → возвращает { script: string, stats: { total, included, skipped } }
 */
export async function buildBatchAppleScript(notes, options = {}) {
    const folderName = (options.folderName && String(options.folderName).trim()) || DEFAULT_FOLDER_NAME
    const includeAttachments = options.includeAttachments !== false
    const folderAS = escapeAS(folderName)

    const noteBlocks = []
    let included = 0
    let skipped = 0

    for (const note of (notes || [])) {
        if (!note || !note.id) continue
        if (note.is_protected) {
            skipped += 1
            continue
        }
        try {
            const { html, title } = await buildAppleNotesHtmlBody(note, { includeAttachments })
            const titleAS = escapeAS(title)
            const bodyAS = escapeAS(html)
            noteBlocks.push(`  try
    make new note at targetFolder with properties {name:"${titleAS}", body:"${bodyAS}"}
    set successCount to successCount + 1
  on error errMsg
    set failCount to failCount + 1
  end try`)
            included += 1
        } catch {
            skipped += 1
        }
    }

    const script = `-- Notes System → Apple Notes batch import
-- Сгенерировано автоматически. Запусти двойным кликом или из Script Editor (⌘R).
-- При первом запуске macOS попросит разрешить управление приложением «Заметки».

set successCount to 0
set failCount to 0

tell application "Notes"
  activate
  set targetFolder to missing value
  try
    set targetFolder to folder "${folderAS}"
  end try
  if targetFolder is missing value then
    try
      set targetFolder to make new folder with properties {name:"${folderAS}"}
    on error
      set targetFolder to missing value
    end try
  end if

${noteBlocks.join('\n')}
end tell

display dialog "Импорт завершён." & return & "Создано заметок: " & successCount & return & "Ошибок: " & failCount buttons {"OK"} default button "OK"
`

    return {
        script,
        stats: {
            total: (notes || []).length,
            included,
            skipped
        }
    }
}

export const appleNotesExportService = {
    isAppleNotesAvailable,
    exportNoteToAppleNotes,
    exportNotesToAppleNotes,
    buildBatchAppleScript,
    DEFAULT_FOLDER_NAME
}

export default appleNotesExportService
