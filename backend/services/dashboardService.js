// backend/services/dashboardService.js
import pool from '../config/database.js';

class DashboardService {
    async getWidgets() {
        const [widgets] = await pool.query(
            'SELECT * FROM dashboard_widgets WHERE is_visible = 1 ORDER BY position ASC'
        );
        return widgets;
    }

    async updateWidget(id, data) {
        const { position, is_visible, settings } = data;
        const updates = [];
        const values = [];

        if (position !== undefined) {
            updates.push('position = ?');
            values.push(position);
        }
        if (is_visible !== undefined) {
            updates.push('is_visible = ?');
            values.push(is_visible);
        }
        if (settings !== undefined) {
            updates.push('settings = ?');
            values.push(JSON.stringify(settings));
        }

        if (updates.length === 0) return null;

        values.push(id);
        await pool.query(
            `UPDATE dashboard_widgets SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [widget] = await pool.query('SELECT * FROM dashboard_widgets WHERE id = ?', [id]);
        return widget[0];
    }

    async createWidget(data) {
        const { widget_type, position, settings } = data;

        const [result] = await pool.query(
            'INSERT INTO dashboard_widgets (widget_type, position, settings) VALUES (?, ?, ?)',
            [widget_type, position || 0, JSON.stringify(settings || {})]
        );

        const [widget] = await pool.query('SELECT * FROM dashboard_widgets WHERE id = ?', [result.insertId]);
        return widget[0];
    }

    async deleteWidget(id) {
        await pool.query('DELETE FROM dashboard_widgets WHERE id = ?', [id]);
        return true;
    }

    async getRecentNotes(limit = 10) {
        const [notes] = await pool.query(
            'SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC LIMIT ?',
            [limit]
        );
        return notes;
    }

    async getStats() {
        // Получаем различную статистику для дашборда
        const [notesCount] = await pool.query('SELECT COUNT(*) as count FROM notes');
        const [foldersCount] = await pool.query('SELECT COUNT(*) as count FROM folders');
        const [todosCount] = await pool.query(
            'SELECT COUNT(*) as total, SUM(is_completed) as completed FROM todo_items'
        );
        const [recentNotes] = await pool.query(
            'SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC LIMIT 5'
        );
        const [favorites] = await pool.query(
            'SELECT id, title, updated_at FROM notes WHERE is_favorite = 1 ORDER BY updated_at DESC LIMIT 10'
        );
        const [pinned] = await pool.query(
            'SELECT id, title, updated_at FROM notes WHERE is_pinned = 1 ORDER BY updated_at DESC LIMIT 10'
        );
        const tags = await this.getUniqueTags();

        return {
            notes: {
                total: notesCount[0].count,
                recent: recentNotes
            },
            folders: {
                total: foldersCount[0].count
            },
            todos: {
                total: todosCount[0].total || 0,
                completed: todosCount[0].completed || 0,
                pending: (todosCount[0].total || 0) - (todosCount[0].completed || 0)
            },
            favorites: favorites,
            pinned: pinned,
            tags
        };
    }

    async getUniqueTags() {
        const [rows] = await pool.query('SELECT tags FROM notes WHERE tags IS NOT NULL AND JSON_LENGTH(tags) > 0');
        const set = new Set();
        for (const row of rows) {
            let arr = [];
            if (Array.isArray(row.tags)) arr = row.tags;
            else if (typeof row.tags === 'string') {
                try {
                    const p = JSON.parse(row.tags);
                    arr = Array.isArray(p) ? p : [];
                } catch {
                    arr = [];
                }
            }
            arr.forEach(t => {
                if (t != null && String(t).trim() !== '') set.add(String(t).trim());
            });
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
    }
}

const dashboardService = new DashboardService();
export { dashboardService };