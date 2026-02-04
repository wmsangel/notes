// backend/controllers/noteController.js
import { noteService } from '../services/noteService.js'  // <-- Изменили на именованный импорт

export const noteController = {
    async getAllNotes(req, res) {
        try {
            const notes = await noteService.getAllNotes(req.query)
            res.json(notes)
        } catch (error) {
            console.error('Error fetching notes:', error?.message || error)
            if (error?.code) console.error('Error code:', error.code)
            res.status(500).json({ error: error?.message || 'Ошибка загрузки заметок' })
        }
    },

    async getNoteById(req, res) {
        try {
            const note = await noteService.getNoteById(req.params.id)
            res.json(note)
        } catch (error) {
            console.error('Error fetching note:', error)
            res.status(404).json({ error: error.message })
        }
    },

    async unlockNote(req, res) {
        try {
            const { id } = req.params
            const { password } = req.body || {}
            const note = await noteService.unlockNote(id, password)
            res.json(note)
        } catch (error) {
            if (error.statusCode === 403) {
                return res.status(403).json({ error: error.message === 'Invalid password' ? 'Неверный пароль' : 'Требуется пароль' })
            }
            if (error.message === 'Note not found') {
                return res.status(404).json({ error: 'Заметка не найдена' })
            }
            console.error('Error unlocking note:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async createNote(req, res) {
        try {
            const note = await noteService.createNote(req.body)
            res.status(201).json(note)
        } catch (error) {
            console.error('Error creating note:', error?.message || error)
            if (error?.code) console.error('Error code:', error.code)
            res.status(500).json({ error: error?.message || 'Ошибка при создании заметки' })
        }
    },

    async updateNote(req, res) {
        try {
            const note = await noteService.updateNote(req.params.id, req.body)
            res.json(note)
        } catch (error) {
            console.error('Error updating note:', error?.message || error)
            const status = error?.code === 'ER_MIGRATION_NEEDED' ? 503 : 500
            res.status(status).json({ error: error?.message || 'Ошибка обновления заметки' })
        }
    },

    async deleteNote(req, res) {
        try {
            await noteService.deleteNote(req.params.id)
            res.json({ success: true })
        } catch (error) {
            console.error('Error deleting note:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async reorderNotes(req, res) {
        try {
            const order = req.body?.order
            if (!Array.isArray(order) || order.length === 0) {
                return res.status(400).json({ error: 'order must be a non-empty array of note ids' })
            }
            await noteService.reorderNotes(order)
            res.json({ success: true })
        } catch (error) {
            console.error('Error reordering notes:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async searchNotes(req, res) {
        try {
            const { q } = req.query
            if (!q) {
                return res.status(400).json({ error: 'Search query is required' })
            }
            const notes = await noteService.searchNotes(q)
            res.json(notes)
        } catch (error) {
            console.error('Error searching notes:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async toggleFavorite(req, res) {
        try {
            const note = await noteService.toggleFavorite(req.params.id)
            res.json(note)
        } catch (error) {
            console.error('Error toggling favorite:', error)
            res.status(500).json({ error: error.message })
        }
    }
}