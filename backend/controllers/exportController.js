// backend/controllers/exportController.js
import { folderService } from '../services/folderService.js'
import {
    isAppleNotesAvailable,
    exportNotesToAppleNotes,
    buildBatchAppleScript
} from '../services/appleNotesExportService.js'
import pool from '../config/database.js'

/**
 * Загружает заметки по тем же правилам, что и exportToAppleNotes:
 * scope = 'all' | 'folder' | 'ids'.
 */
async function loadNotesForExport({ scope, folder_id, ids }) {
    if (scope === 'ids') {
        const safeIds = (Array.isArray(ids) ? ids : [])
            .slice(0, 1000)
            .map((x) => Number(x))
            .filter(Number.isFinite)
        if (!safeIds.length) return { error: 'Список ids пуст или некорректен' }
        const placeholders = safeIds.map(() => '?').join(',')
        const [rows] = await pool.query(
            `SELECT id, title, content, is_protected FROM notes WHERE id IN (${placeholders}) ORDER BY id ASC`,
            safeIds
        )
        return { notes: rows }
    }
    if (scope === 'folder') {
        const fid = folder_id == null ? null : Number(folder_id)
        if (folder_id != null && !Number.isFinite(fid)) {
            return { error: 'Неверный folder_id' }
        }
        const [rows] = fid == null
            ? await pool.query('SELECT id, title, content, is_protected FROM notes WHERE folder_id IS NULL ORDER BY id ASC')
            : await pool.query('SELECT id, title, content, is_protected FROM notes WHERE folder_id = ? ORDER BY id ASC', [fid])
        return { notes: rows }
    }
    const [rows] = await pool.query('SELECT id, title, content, is_protected FROM notes ORDER BY id ASC')
    return { notes: rows }
}

export const exportController = {
    /**
     * GET /api/export/capabilities
     * Сообщает фронту, доступен ли экспорт в Apple Notes
     * (он работает только когда backend на macOS).
     */
    async getCapabilities(req, res) {
        try {
            const platform = process.platform
            res.json({
                platform,
                appleNotes: {
                    available: isAppleNotesAvailable(),
                    reason: isAppleNotesAvailable()
                        ? null
                        : 'Apple Notes доступен только когда сервер запущен на macOS'
                }
            })
        } catch (error) {
            console.error('Error getting export capabilities:', error)
            res.status(500).json({ error: error?.message || 'Ошибка проверки возможностей экспорта' })
        }
    },

    /**
     * POST /api/export/apple-notes
     * Body:
     *   {
     *     scope: 'all' | 'folder' | 'ids',
     *     folder_id?: number | null,           // если scope === 'folder'
     *     ids?: number[],                       // если scope === 'ids'
     *     target_folder?: string,               // имя папки в Apple Notes
     *     include_attachments?: boolean         // подмешивать ли вложения в тело
     *   }
     */
    async exportToAppleNotes(req, res) {
        try {
            if (!isAppleNotesAvailable()) {
                return res.status(400).json({
                    error: 'Apple Notes доступны только когда backend запущен на macOS'
                })
            }

            const {
                scope = 'all',
                folder_id = null,
                ids = [],
                target_folder,
                include_attachments
            } = req.body || {}

            const loaded = await loadNotesForExport({ scope, folder_id, ids })
            if (loaded.error) return res.status(400).json({ error: loaded.error })
            const notes = loaded.notes
            if (!Array.isArray(notes) || notes.length === 0) {
                return res.status(404).json({ error: 'Не найдено заметок для экспорта' })
            }

            const result = await exportNotesToAppleNotes(notes, {
                folderName: target_folder,
                includeAttachments: include_attachments !== false
            })

            return res.json(result)
        } catch (error) {
            console.error('Error exporting to Apple Notes:', error)
            res.status(500).json({ error: error?.message || 'Ошибка экспорта в Apple Notes' })
        }
    },

    /**
     * POST /api/export/apple-notes/script
     * Возвращает один большой .applescript-файл со всеми заметками внутри.
     * Пользователь скачивает его и запускает у себя на Маке двойным кликом.
     * Работает даже если backend не на macOS — вся работа делается клиентом.
     */
    async downloadAppleScript(req, res) {
        try {
            const {
                scope = 'all',
                folder_id = null,
                ids = [],
                target_folder,
                include_attachments
            } = req.body || {}

            const loaded = await loadNotesForExport({ scope, folder_id, ids })
            if (loaded.error) return res.status(400).json({ error: loaded.error })
            const notes = loaded.notes
            if (!Array.isArray(notes) || notes.length === 0) {
                return res.status(404).json({ error: 'Не найдено заметок для экспорта' })
            }

            const { script, stats } = await buildBatchAppleScript(notes, {
                folderName: target_folder,
                includeAttachments: include_attachments !== false
            })

            const safeName = `notes-export-${new Date().toISOString().slice(0, 10)}.applescript`
            res.setHeader('Content-Type', 'application/x-applescript; charset=utf-8')
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`)
            res.setHeader('X-Export-Total', String(stats.total))
            res.setHeader('X-Export-Included', String(stats.included))
            res.setHeader('X-Export-Skipped', String(stats.skipped))
            res.setHeader('Access-Control-Expose-Headers', 'X-Export-Total, X-Export-Included, X-Export-Skipped, Content-Disposition')
            res.send(script)
        } catch (error) {
            console.error('Error generating AppleScript:', error)
            res.status(500).json({ error: error?.message || 'Ошибка генерации AppleScript' })
        }
    },

    /**
     * GET /api/export/folders
     * Возвращает список папок (id + name) — фронту, чтобы показать селектор для scope=folder.
     */
    async getFolders(req, res) {
        try {
            const folders = await folderService.findAll()
            res.json((folders || []).map((f) => ({ id: f.id, name: f.name, parent_id: f.parent_id })))
        } catch (error) {
            console.error('Error fetching folders for export:', error)
            res.status(500).json({ error: error?.message || 'Ошибка получения папок' })
        }
    }
}

export default exportController
