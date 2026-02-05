// backend/services/todoService.js
import db from '../config/database.js'

function normalizeDueDate(value) {
    if (value == null || value === '') return null
    if (value instanceof Date) {
        const pad = (n) => String(n).padStart(2, '0')
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
    }
    if (typeof value === 'string') {
        const s = value.trim()
        // 'YYYY-MM-DD' → оставляем как есть (MySQL примет для DATETIME)
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
        // ISO → конвертим в 'YYYY-MM-DD HH:MM:SS'
        if (s.includes('T')) {
            const d = new Date(s)
            if (!isNaN(d.getTime())) return normalizeDueDate(d)
        }
        return s
    }
    return value
}

export const todoService = {
    async getAllLists() {
        const [lists] = await db.query(`
      SELECT 
        tl.*,
        COUNT(ti.id) as total,
        SUM(CASE WHEN ti.is_completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN ti.is_completed = 0 THEN 1 ELSE 0 END) as pending
      FROM todo_lists tl
      LEFT JOIN todo_items ti ON tl.id = ti.list_id
      GROUP BY tl.id
      ORDER BY tl.updated_at DESC
    `)

        return lists.map(list => ({
            ...list,
            tags: list.tags ? JSON.parse(list.tags) : [],
            stats: {
                total: parseInt(list.total) || 0,
                completed: parseInt(list.completed) || 0,
                pending: parseInt(list.pending) || 0
            }
        }))
    },

    async getListById(id) {
        const [lists] = await db.query(
            'SELECT * FROM todo_lists WHERE id = ?',
            [id]
        )

        if (lists.length === 0) {
            throw new Error('List not found')
        }

        const list = lists[0]
        const [items] = await db.query(
            'SELECT * FROM todo_items WHERE list_id = ? ORDER BY position ASC, created_at DESC',
            [id]
        )

        return {
            ...list,
            tags: list.tags ? JSON.parse(list.tags) : [],
            items
        }
    },

    async createList(data) {
        const { title, description, folder_id } = data
        const folderId = folder_id === '' || folder_id === 'null' || folder_id == null
            ? null
            : parseInt(folder_id, 10)

        if (!title || typeof title !== 'string' || !title.trim()) {
            throw new Error('Title is required')
        }

        const [result] = await db.query(
            `INSERT INTO todo_lists (title, description, folder_id) VALUES (?, ?, ?)`,
            [title.trim(), (description && description.trim()) || null, folderId]
        )

        return await this.getListById(result.insertId)
    },

    async updateList(id, data) {
        const { title, description, folder_id } = data

        const updates = []
        const values = []
        if (title !== undefined) {
            updates.push('title = ?')
            values.push(title)
        }
        if (description !== undefined) {
            updates.push('description = ?')
            values.push(description)
        }
        if (folder_id !== undefined) {
            updates.push('folder_id = ?')
            values.push(folder_id)
        }
        if (updates.length === 0) return await this.getListById(id)
        values.push(id)
        await db.query(
            `UPDATE todo_lists SET ${updates.join(', ')} WHERE id = ?`,
            values
        )
        return await this.getListById(id)
    },

    async deleteList(id) {
        await db.query('DELETE FROM todo_lists WHERE id = ?', [id])
        return { success: true }
    },

    async createItem(data) {
        const { list_id, title, description, priority, due_date } = data

        const [result] = await db.query(
            `INSERT INTO todo_items (list_id, title, description, priority, due_date) 
       VALUES (?, ?, ?, ?, ?)`,
            [list_id, title, description || null, priority || 'medium', normalizeDueDate(due_date)]
        )

        const [items] = await db.query(
            'SELECT * FROM todo_items WHERE id = ?',
            [result.insertId]
        )

        return items[0]
    },

    async updateItem(id, data) {
        const updates = []
        const values = []
        if (data.title !== undefined) {
            updates.push('title = ?')
            values.push(data.title)
        }
        if (data.description !== undefined) {
            updates.push('description = ?')
            values.push(data.description ?? null)
        }
        if (data.priority !== undefined) {
            updates.push('priority = ?')
            values.push(data.priority)
        }
        if (data.due_date !== undefined) {
            updates.push('due_date = ?')
            values.push(normalizeDueDate(data.due_date))
        }
        if (updates.length === 0) {
            const [items] = await db.query('SELECT * FROM todo_items WHERE id = ?', [id])
            return items[0]
        }
        values.push(id)
        await db.query(
            `UPDATE todo_items SET ${updates.join(', ')} WHERE id = ?`,
            values
        )
        const [items] = await db.query('SELECT * FROM todo_items WHERE id = ?', [id])
        return items[0]
    },

    async toggleItem(id) {
        await db.query(
            `UPDATE todo_items 
       SET is_completed = NOT is_completed,
           completed_at = CASE WHEN is_completed = 0 THEN NOW() ELSE NULL END
       WHERE id = ?`,
            [id]
        )

        const [items] = await db.query('SELECT * FROM todo_items WHERE id = ?', [id])
        return items[0]
    },

    async deleteItem(id) {
        await db.query('DELETE FROM todo_items WHERE id = ?', [id])
        return { success: true }
    },

    // Связь задач с заметками
    async linkNoteToItem(todoItemId, noteId) {
        const [result] = await db.query(
            'INSERT IGNORE INTO todo_note_links (todo_item_id, note_id) VALUES (?, ?)',
            [todoItemId, noteId]
        )

        return { success: true, linkId: result.insertId }
    },

    async unlinkNoteFromItem(todoItemId, noteId) {
        await db.query(
            'DELETE FROM todo_note_links WHERE todo_item_id = ? AND note_id = ?',
            [todoItemId, noteId]
        )

        return { success: true }
    },

    async getLinkedNotes(todoItemId) {
        const [notes] = await db.query(
            `SELECT n.*, tnl.created_at as linked_at
       FROM todo_note_links tnl
       JOIN notes n ON tnl.note_id = n.id
       WHERE tnl.todo_item_id = ?
       ORDER BY tnl.created_at DESC`,
            [todoItemId]
        )

        return notes
    }
}