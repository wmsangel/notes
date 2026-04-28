// backend/controllers/exportController.js
import { folderService } from '../services/folderService.js'
import {
    isAppleNotesAvailable,
    exportNotesToAppleNotes
} from '../services/appleNotesExportService.js'
import pool from '../config/database.js'

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

            // Подбираем заметки.
            let notes = []
            if (scope === 'ids') {
                if (!Array.isArray(ids) || ids.length === 0) {
                    return res.status(400).json({ error: 'Передайте список ids' })
                }
                // Ограничим максимальный размер запроса
                const safeIds = ids.slice(0, 500).map((x) => Number(x)).filter(Number.isFinite)
                if (safeIds.length === 0) {
                    return res.status(400).json({ error: 'Список ids пуст или некорректен' })
                }
                const placeholders = safeIds.map(() => '?').join(',')
                const [rows] = await pool.query(
                    `SELECT id, title, content, is_protected FROM notes WHERE id IN (${placeholders}) ORDER BY id ASC`,
                    safeIds
                )
                notes = rows
            } else if (scope === 'folder') {
                const fid = folder_id == null ? null : Number(folder_id)
                if (folder_id != null && !Number.isFinite(fid)) {
                    return res.status(400).json({ error: 'Неверный folder_id' })
                }
                let rows
                if (fid == null) {
                    [rows] = await pool.query(
                        'SELECT id, title, content, is_protected FROM notes WHERE folder_id IS NULL ORDER BY id ASC'
                    )
                } else {
                    [rows] = await pool.query(
                        'SELECT id, title, content, is_protected FROM notes WHERE folder_id = ? ORDER BY id ASC',
                        [fid]
                    )
                }
                notes = rows
            } else {
                // all
                const [rows] = await pool.query(
                    'SELECT id, title, content, is_protected FROM notes ORDER BY id ASC'
                )
                notes = rows
            }

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
