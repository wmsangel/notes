// backend/controllers/todoController.js
import { todoService } from '../services/todoService.js'

export const todoController = {
    async getAllLists(req, res) {
        try {
            const lists = await todoService.getAllLists()
            res.json(lists)
        } catch (error) {
            console.error('Error fetching todo lists:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async getOverview(req, res) {
        try {
            const data = await todoService.getOverview()
            res.json(data)
        } catch (error) {
            console.error('Error fetching todo overview:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async getListById(req, res) {
        try {
            const list = await todoService.getListById(req.params.id)
            res.json(list)
        } catch (error) {
            console.error('Error fetching todo list:', error)
            res.status(404).json({ error: error.message })
        }
    },

    async getListByFolder(req, res) {
        try {
            const list = await todoService.getOrCreateListByFolder(req.params.folderId)
            res.json(list)
        } catch (error) {
            console.error('Error fetching todo list by folder:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async createList(req, res) {
        try {
            const list = await todoService.createList(req.body)
            res.status(201).json(list)
        } catch (error) {
            console.error('Error creating todo list:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async updateList(req, res) {
        try {
            const list = await todoService.updateList(req.params.id, req.body)
            res.json(list)
        } catch (error) {
            console.error('Error updating todo list:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async deleteList(req, res) {
        try {
            await todoService.deleteList(req.params.id)
            res.json({ success: true })
        } catch (error) {
            console.error('Error deleting todo list:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async createItem(req, res) {
        try {
            const item = await todoService.createItem(req.body)
            res.status(201).json(item)
        } catch (error) {
            console.error('Error creating todo item:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async updateItem(req, res) {
        try {
            const item = await todoService.updateItem(req.params.id, req.body)
            res.json(item)
        } catch (error) {
            console.error('Error updating todo item:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async toggleItem(req, res) {
        try {
            const item = await todoService.toggleItem(req.params.id)
            res.json(item)
        } catch (error) {
            console.error('Error toggling todo item:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async deleteItem(req, res) {
        try {
            await todoService.deleteItem(req.params.id)
            res.json({ success: true })
        } catch (error) {
            console.error('Error deleting todo item:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async reorderItems(req, res) {
        try {
            const { list_id, order } = req.body
            const result = await todoService.reorderItems(list_id, order)
            res.json(result)
        } catch (error) {
            console.error('Error reordering todo items:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async linkNoteToList(req, res) {
        try {
            const { noteId } = req.body
            const list = await todoService.linkNoteToList(req.params.id, noteId)
            res.json(list)
        } catch (error) {
            console.error('Error linking note to list:', error)
            res.status(500).json({ error: error.message })
        }
    },

    // Связь с заметками
    async linkNote(req, res) {
        try {
            const { todoItemId, noteId } = req.body
            const result = await todoService.linkNoteToItem(todoItemId, noteId)
            res.json(result)
        } catch (error) {
            console.error('Error linking note:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async unlinkNote(req, res) {
        try {
            const { todoItemId, noteId } = req.body
            const result = await todoService.unlinkNoteFromItem(todoItemId, noteId)
            res.json(result)
        } catch (error) {
            console.error('Error unlinking note:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async getLinkedNotes(req, res) {
        try {
            const notes = await todoService.getLinkedNotes(req.params.itemId)
            res.json(notes)
        } catch (error) {
            console.error('Error fetching linked notes:', error)
            res.status(500).json({ error: error.message })
        }
    }
}
