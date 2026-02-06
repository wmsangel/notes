// backend/services/noteService.js
import db from '../config/database.js'

/** Безопасный парсинг tags: драйвер MySQL может вернуть JSON уже как объект/массив */
function parseTags(tags) {
    if (tags == null) return []
    if (Array.isArray(tags)) return tags
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    return []
}

/** Защищена ли заметка (нормализация 0/1/true/false из БД) */
function isProtected(note) {
    if (note == null) return false
    const v = note.is_protected
    return v === 1 || v === true || String(v) === '1'
}

/** Собрать объект заметки для списка (без пароля, для защищённых — без title/content) */
function noteToListItem(note) {
    const tags = parseTags(note.tags)
    const base = {
        id: note.id,
        folder_id: note.folder_id,
        is_favorite: Boolean(note.is_favorite),
        is_pinned: Boolean(note.is_pinned),
        color: note.color ?? null,
        show_on_dashboard: Boolean(note.show_on_dashboard),
        is_protected: isProtected(note),
        protection_hint: note.protection_hint ?? null,
        note_type: note.note_type || 'note',
        tags,
        created_at: note.created_at,
        updated_at: note.updated_at,
        position: note.position != null ? note.position : note.id
    }
    if (isProtected(note)) {
        return { ...base, title: note.title ?? '', content: null }
    }
    return {
        ...base,
        title: note.title ?? '',
        content: note.content ?? null
    }
}

export const noteService = {
    async getAllNotes(filters = {}) {
        let query = 'SELECT * FROM notes WHERE 1=1'
        const params = []

        if (filters.folder_id !== undefined) {
            query += ' AND folder_id = ?'
            params.push(filters.folder_id)
        }

        // Query params приходят строками ('true'/'false'/'1'/'0') — нормализуем для MySQL BOOLEAN
        if (filters.is_favorite !== undefined && filters.is_favorite !== '') {
            query += ' AND is_favorite = ?'
            const v = filters.is_favorite
            params.push(v === true || v === 'true' || v === 1 || String(v) === '1' ? 1 : 0)
        }

        if (filters.is_pinned !== undefined) {
            query += ' AND is_pinned = ?'
            const v = filters.is_pinned
            params.push(v === true || v === 'true' || v === 1 || v === '1' ? 1 : 0)
        }

        if (filters.tag !== undefined && String(filters.tag).trim() !== '') {
            query += ' AND JSON_CONTAINS(tags, ?, "$")'
            params.push(JSON.stringify(String(filters.tag).trim()))
        }

        let notes
        try {
            [notes] = await db.query(query + ' ORDER BY COALESCE(position, 999999999), id ASC', params)
        } catch (err) {
            console.error('getAllNotes order by position failed, fallback to updated_at:', err.message)
            try {
                [notes] = await db.query(query + ' ORDER BY updated_at DESC', params)
            } catch (err2) {
                console.error('getAllNotes fallback failed:', err2)
                throw err2
            }
        }
        return notes.map((row) => {
            try {
                return noteToListItem(row)
            } catch (e) {
                console.error('noteToListItem error for note id:', row?.id, e)
                return null
            }
        }).filter(Boolean)
    },

    async getNoteById(id) {
        const [notes] = await db.query(
            'SELECT * FROM notes WHERE id = ?',
            [id]
        )

        if (notes.length === 0) {
            throw new Error('Note not found')
        }

        const note = notes[0]
        const tags = parseTags(note.tags)

        // Защищённые заметки: не отдаём контент, заголовок и пароль — только метаданные
        if (note.is_protected) {
            return {
            id: note.id,
            folder_id: note.folder_id,
            is_favorite: note.is_favorite,
            is_pinned: note.is_pinned,
            color: note.color ?? null,
            is_protected: true,
                protection_hint: note.protection_hint,
                note_type: note.note_type || 'note',
                tags,
                created_at: note.created_at,
                updated_at: note.updated_at,
                position: note.position != null ? note.position : note.id,
                title: '',
                content: null,
                protection_password: null
            }
        }

        return {
            ...note,
            tags,
            protection_password: null
        }
    },

    async unlockNote(id, password) {
        const [notes] = await db.query(
            'SELECT * FROM notes WHERE id = ?',
            [id]
        )

        if (notes.length === 0) {
            throw new Error('Note not found')
        }

        const note = notes[0]
        if (!note.is_protected) {
            return {
                ...note,
                tags: parseTags(note.tags),
                protection_password: null
            }
        }

        if (!password || String(password).trim() === '') {
            const err = new Error('Password required')
            err.statusCode = 403
            throw err
        }

        if (note.protection_password !== String(password).trim()) {
            const err = new Error('Invalid password')
            err.statusCode = 403
            throw err
        }

        return {
            ...note,
            tags: parseTags(note.tags),
            protection_password: null
        }
    },

    async createNote(data) {
        const {
            title,
            content,
            folder_id,
            is_favorite,
            is_pinned,
            color,
            tags,
            is_protected,
            protection_password,
            protection_hint,
            note_type
        } = data

        const typeVal = note_type === 'page' ? 'page' : 'note'

        const insertWithPosition = async () => {
            const [[row]] = await db.query('SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM notes')
            const nextPosition = row?.nextPos ?? 1
            const [result] = await db.query(
                `INSERT INTO notes (
          title, content, note_type, folder_id, is_favorite, is_pinned, color, tags,
          is_protected, protection_password, protection_hint, position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    (title != null && String(title).trim() !== '') ? String(title).trim() : '',
                    content || '', typeVal, folder_id || null, is_favorite || false, is_pinned || false,
                    color || null, tags ? JSON.stringify(tags) : null, is_protected || false, protection_password || null,
                    protection_hint || null, nextPosition
                ]
            )
            return result
        }
        const insertWithoutPosition = async () => {
            const [result] = await db.query(
                `INSERT INTO notes (
          title, content, note_type, folder_id, is_favorite, is_pinned, color, tags,
          is_protected, protection_password, protection_hint
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    (title != null && String(title).trim() !== '') ? String(title).trim() : '',
                    content || '', typeVal, folder_id || null, is_favorite || false, is_pinned || false,
                    color || null, tags ? JSON.stringify(tags) : null, is_protected || false, protection_password || null,
                    protection_hint || null
                ]
            )
            return result
        }

        const insertMinimal = async () => {
            const [result] = await db.query(
                `INSERT INTO notes (title, content, note_type, folder_id, is_favorite, is_pinned, color, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    (title != null && String(title).trim() !== '') ? String(title).trim() : '',
                    content || '', typeVal, folder_id || null, is_favorite || false, is_pinned || false,
                    color || null, tags ? JSON.stringify(tags) : null
                ]
            )
            return result
        }

        const insertWithoutNoteType = async () => {
            const [result] = await db.query(
                `INSERT INTO notes (title, content, folder_id, is_favorite, is_pinned, color, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    (title != null && String(title).trim() !== '') ? String(title).trim() : '',
                    content || '', folder_id || null, is_favorite || false, is_pinned || false,
                    color || null, tags ? JSON.stringify(tags) : null
                ]
            )
            return result
        }

        const isUnknownColumn = (err) => (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/i.test(String(err.message)))

        let result
        try {
            result = await insertWithPosition()
        } catch (err) {
            if (!isUnknownColumn(err)) throw err
            console.error('createNote insertWithPosition failed:', err.message)
            try {
                result = await insertWithoutPosition()
            } catch (err2) {
                if (!isUnknownColumn(err2)) throw err2
                console.error('createNote insertWithoutPosition failed:', err2.message)
                try {
                    result = await insertMinimal()
                } catch (err3) {
                    if (!isUnknownColumn(err3)) throw err3
                    console.error('createNote insertMinimal failed:', err3.message)
                    try {
                        result = await insertWithoutNoteType()
                    } catch (err4) {
                        console.error('createNote insertWithoutNoteType failed:', err4.message)
                        throw err4
                    }
                }
            }
        }

        return await this.getNoteById(result.insertId)
    },

    async updateNote(id, data) {
        const {
            title,
            content,
            note_type,
            folder_id,
            is_favorite,
            is_pinned,
            show_on_dashboard,
            color,
            tags,
            is_protected,
            protection_password,
            protection_hint
        } = data

        const updates = []
        const params = []

        if (title !== undefined) {
            updates.push('title = ?')
            params.push(title)
        }

        if (content !== undefined) {
            updates.push('content = ?')
            params.push(content)
        }

        if (note_type !== undefined && (note_type === 'note' || note_type === 'page')) {
            updates.push('note_type = ?')
            params.push(note_type)
        }

        if (folder_id !== undefined) {
            updates.push('folder_id = ?')
            params.push(folder_id)
        }

        if (is_favorite !== undefined) {
            updates.push('is_favorite = ?')
            const v = is_favorite
            params.push(v === true || v === 'true' || v === 1 || v === '1' ? 1 : 0)
        }

        if (is_pinned !== undefined) {
            updates.push('is_pinned = ?')
            const v = is_pinned
            params.push(v === true || v === 'true' || v === 1 || v === '1' ? 1 : 0)
        }

        if (color !== undefined) {
            updates.push('color = ?')
            params.push(color || null)
        }

        if (show_on_dashboard !== undefined) {
            updates.push('show_on_dashboard = ?')
            const v = show_on_dashboard
            params.push(v === true || v === 'true' || v === 1 || v === '1' ? 1 : 0)
        }

        if (tags !== undefined) {
            updates.push('tags = ?')
            params.push(tags ? JSON.stringify(tags) : null)
        }

        if (is_protected !== undefined) {
            updates.push('is_protected = ?')
            params.push(!!is_protected)
        }

        if (protection_password !== undefined) {
            updates.push('protection_password = ?')
            params.push(protection_password || null)
        }

        if (protection_hint !== undefined) {
            updates.push('protection_hint = ?')
            params.push(protection_hint || null)
        }

        if (updates.length === 0) {
            return await this.getNoteById(id)
        }

        params.push(id)

        try {
            await db.query(
                `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
                params
            )
        } catch (err) {
            const msg = String(err.message || '')
            const badField = err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/i.test(msg)
            const protectionCol = /is_protected|protection_password|protection_hint/i.test(msg)
            if (badField && protectionCol) {
                const e = new Error('В БД нет колонок защиты. Выполните: database/migrate-notes-add-protection.sql')
                e.code = 'ER_MIGRATION_NEEDED'
                throw e
            }
            throw err
        }

        return await this.getNoteById(id)
    },

    async deleteNote(id) {
        await db.query('DELETE FROM notes WHERE id = ?', [id])
        return { success: true }
    },

    async reorderNotes(order) {
        if (!Array.isArray(order) || order.length === 0) return
        try {
            for (let i = 0; i < order.length; i++) {
                await db.query('UPDATE notes SET position = ? WHERE id = ?', [i, order[i]])
            }
        } catch (err) {
            const noPosition = err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column.*position|position.*unknown/i.test(String(err.message))
            if (!noPosition) throw err
        }
    },

    async searchNotes(query) {
        const baseSql = `SELECT * FROM notes 
       WHERE MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)
       LIMIT 50`
        let notes
        try {
            [notes] = await db.query(baseSql + ' ORDER BY COALESCE(position, 999999999), id ASC', [query])
        } catch (err) {
            const noPosition = err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column.*position|position.*unknown/i.test(String(err.message))
            if (noPosition) {
                [notes] = await db.query(baseSql + ' ORDER BY updated_at DESC', [query])
            } else {
                throw err
            }
        }
        return notes.map(noteToListItem)
    },

    async toggleFavorite(id) {
        await db.query(
            'UPDATE notes SET is_favorite = NOT is_favorite WHERE id = ?',
            [id]
        )

        return await this.getNoteById(id)
    },

    async togglePin(id) {
        await db.query(
            'UPDATE notes SET is_pinned = NOT is_pinned WHERE id = ?',
            [id]
        )

        return await this.getNoteById(id)
    }
}
