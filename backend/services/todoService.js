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
    async pruneOldCompleted() {
        await db.query(
            `DELETE FROM todo_items
       WHERE is_completed = 1
         AND completed_at IS NOT NULL
         AND completed_at < DATE_SUB(NOW(), INTERVAL 100 DAY)`
        )
    },

    async getAllLists() {
        await this.pruneOldCompleted()
        const [lists] = await db.query(`
      SELECT 
        tl.*,
        n.id as note_id,
        n.title as note_title,
        n.color as note_color,
        COUNT(ti.id) as total,
        SUM(CASE WHEN ti.is_completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN ti.is_completed = 0 THEN 1 ELSE 0 END) as pending
      FROM todo_lists tl
      LEFT JOIN notes n ON tl.note_id = n.id
      LEFT JOIN todo_items ti ON tl.id = ti.list_id
      GROUP BY tl.id
      ORDER BY tl.updated_at DESC
    `)

        return lists.map(list => ({
            ...list,
            tags: list.tags ? JSON.parse(list.tags) : [],
            linked_note: list.note_id ? {
                id: list.note_id,
                title: list.note_title || '',
                color: list.note_color || null
            } : null,
            stats: {
                total: parseInt(list.total) || 0,
                completed: parseInt(list.completed) || 0,
                pending: parseInt(list.pending) || 0
            }
        }))
    },

    async getListById(id) {
        await this.pruneOldCompleted()
        const [lists] = await db.query(
            `SELECT tl.*, n.id as note_id, n.title as note_title, n.color as note_color
       FROM todo_lists tl
       LEFT JOIN notes n ON tl.note_id = n.id
       WHERE tl.id = ?`,
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
            linked_note: list.note_id ? {
                id: list.note_id,
                title: list.note_title || '',
                color: list.note_color || null
            } : null,
            items
        }
    },

    async getOverview() {
        await this.pruneOldCompleted()
        const [rows] = await db.query(
            `SELECT 
                tl.id          AS list_id,
                tl.title       AS list_title,
                tl.folder_id   AS list_folder_id,
                tl.color       AS list_color,
                tl.note_id     AS list_note_id,
                ln.title       AS list_note_title,
                ln.color       AS list_note_color,
                f.name         AS folder_name,
                ti.id          AS item_id,
                ti.title       AS item_title,
                ti.is_completed,
                ti.show_on_dashboard,
                ti.priority,
                ti.due_date
             FROM todo_lists tl
             LEFT JOIN todo_items ti ON tl.id = ti.list_id
             LEFT JOIN notes ln ON tl.note_id = ln.id
             LEFT JOIN folders f ON tl.folder_id = f.id
             ORDER BY tl.title ASC, ti.position ASC, ti.created_at ASC`
        )

        const byList = new Map()
        for (const row of rows) {
            let list = byList.get(row.list_id)
            if (!list) {
                list = {
                    id: row.list_id,
                    title: row.list_title,
                    folder_id: row.list_folder_id,
                    folder_name: row.folder_name || null,
                    color: row.list_color,
                    linked_note: row.list_note_id ? {
                        id: row.list_note_id,
                        title: row.list_note_title || '',
                        color: row.list_note_color || null
                    } : null,
                    items: []
                }
                byList.set(row.list_id, list)
            }
            if (row.item_id != null) {
                list.items.push({
                    id: row.item_id,
                    title: row.item_title,
                    is_completed: !!row.is_completed,
                    show_on_dashboard: !!row.show_on_dashboard,
                    priority: row.priority,
                    due_date: row.due_date
                })
            }
        }

        return Array.from(byList.values())
    },

    async createList(data) {
        const { title, description, folder_id, note_id } = data
        const folderId = folder_id === '' || folder_id === 'null' || folder_id == null
            ? null
            : parseInt(folder_id, 10)
        const noteId = note_id === '' || note_id === 'null' || note_id == null
            ? null
            : parseInt(note_id, 10)

        if (!title || typeof title !== 'string' || !title.trim()) {
            throw new Error('Title is required')
        }

        const [result] = await db.query(
            `INSERT INTO todo_lists (title, description, folder_id, note_id) VALUES (?, ?, ?, ?)`,
            [title.trim(), (description && description.trim()) || null, folderId, noteId]
        )

        return await this.getListById(result.insertId)
    },

    async updateList(id, data) {
        const { title, description, folder_id, note_id } = data

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
        if (note_id !== undefined) {
            updates.push('note_id = ?')
            values.push(note_id)
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
        const { list_id, title, description, priority, due_date, show_on_dashboard } = data

        const [[row]] = await db.query(
            'SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM todo_items WHERE list_id = ?',
            [list_id]
        )
        const nextPos = row?.nextPos ?? 1

        const [result] = await db.query(
            `INSERT INTO todo_items (list_id, title, description, priority, due_date, position, show_on_dashboard) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [list_id, title, description || null, priority || 'medium', normalizeDueDate(due_date), nextPos, show_on_dashboard ? 1 : 0]
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
        if (data.show_on_dashboard !== undefined) {
            updates.push('show_on_dashboard = ?')
            values.push(data.show_on_dashboard ? 1 : 0)
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

    async reorderItems(listId, order) {
        if (!Array.isArray(order) || order.length === 0) return
        let i = 0
        for (const itemId of order) {
            await db.query(
                'UPDATE todo_items SET position = ? WHERE id = ? AND list_id = ?',
                [i++, itemId, listId]
            )
        }
        return { success: true }
    },

    async getListByFolderId(folderId) {
        await this.pruneOldCompleted()
        const [lists] = await db.query(
            'SELECT id FROM todo_lists WHERE folder_id = ? ORDER BY updated_at DESC LIMIT 1',
            [folderId]
        )
        if (!lists.length) return null
        return await this.getListById(lists[0].id)
    },

    async getOrCreateListByFolder(folderId) {
        const existing = await this.getListByFolderId(folderId)
        if (existing) return existing
        const [folders] = await db.query('SELECT id, name FROM folders WHERE id = ?', [folderId])
        if (!folders.length) throw new Error('Folder not found')
        const title = folders[0].name || 'Проект'
        const [result] = await db.query(
            'INSERT INTO todo_lists (title, folder_id) VALUES (?, ?)',
            [title, folderId]
        )
        return await this.getListById(result.insertId)
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
    },

    async linkNoteToList(listId, noteId) {
        await db.query('UPDATE todo_lists SET note_id = ? WHERE id = ?', [noteId || null, listId])
        return await this.getListById(listId)
    }
}
