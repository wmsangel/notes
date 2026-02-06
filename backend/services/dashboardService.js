// backend/services/dashboardService.js
import pool from '../config/database.js';
import { calendarService } from './calendarService.js';

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
        await pool.query(
            `DELETE FROM todo_items
       WHERE is_completed = 1
         AND completed_at IS NOT NULL
         AND completed_at < DATE_SUB(NOW(), INTERVAL 100 DAY)`
        );
        const [notesCount] = await pool.query('SELECT COUNT(*) as count FROM notes');
        const [foldersCount] = await pool.query('SELECT COUNT(*) as count FROM folders');
        const [todosCount] = await pool.query(
            'SELECT COUNT(*) as total, SUM(is_completed) as completed FROM todo_items'
        );
        let recentNotes = []
        try {
            const [rows] = await pool.query(
                `SELECT n.id, n.title, n.updated_at, n.folder_id, n.color, f.name AS folder_name
                 FROM notes n
                 LEFT JOIN folders f ON n.folder_id = f.id
                 ORDER BY n.updated_at DESC LIMIT 5`
            )
            recentNotes = rows
        } catch (err) {
            const msg = String(err.message || '')
            if (/Unknown column|ER_BAD_FIELD_ERROR/i.test(msg)) {
                const [rows] = await pool.query(
                    `SELECT n.id, n.title, n.updated_at, n.folder_id, f.name AS folder_name
                     FROM notes n
                     LEFT JOIN folders f ON n.folder_id = f.id
                     ORDER BY n.updated_at DESC LIMIT 5`
                )
                recentNotes = rows
            } else {
                throw err
            }
        }
        let favorites = []
        try {
            const [rows] = await pool.query(
                'SELECT id, title, updated_at, color FROM notes WHERE is_favorite = 1 ORDER BY updated_at DESC LIMIT 10'
            )
            favorites = rows
        } catch (err) {
            const msg = String(err.message || '')
            if (/Unknown column|ER_BAD_FIELD_ERROR/i.test(msg)) {
                const [rows] = await pool.query(
                    'SELECT id, title, updated_at FROM notes WHERE is_favorite = 1 ORDER BY updated_at DESC LIMIT 10'
                )
                favorites = rows
            } else {
                throw err
            }
        }
        let dashboardNotes = []
        try {
            const [rows] = await pool.query(
                `SELECT n.id, n.title, n.updated_at, n.folder_id, n.color, f.name AS folder_name
                 FROM notes n
                 LEFT JOIN folders f ON n.folder_id = f.id
                 WHERE n.show_on_dashboard = 1
                 ORDER BY n.updated_at DESC LIMIT 20`
            )
            dashboardNotes = rows
        } catch (err) {
            const msg = String(err.message || '')
            if (/Unknown column|ER_BAD_FIELD_ERROR/i.test(msg)) {
                const [rows] = await pool.query(
                    `SELECT n.id, n.title, n.updated_at, n.folder_id, f.name AS folder_name
                     FROM notes n
                     LEFT JOIN folders f ON n.folder_id = f.id
                     WHERE n.show_on_dashboard = 1
                     ORDER BY n.updated_at DESC LIMIT 20`
                )
                dashboardNotes = rows
            } else {
                throw err
            }
        }
        const [foldersList] = await pool.query(
            'SELECT id, name, parent_id FROM folders ORDER BY position ASC, name ASC'
        );
        const [todoLists] = await pool.query(
            `SELECT tl.id, tl.title, tl.folder_id, f.name AS folder_name,
                    COUNT(ti.id) AS total,
                    SUM(CASE WHEN ti.is_completed = 1 THEN 1 ELSE 0 END) AS completed
             FROM todo_lists tl
             LEFT JOIN folders f ON tl.folder_id = f.id
             LEFT JOIN todo_items ti ON tl.id = ti.list_id
             GROUP BY tl.id
             ORDER BY tl.updated_at DESC`
        );
        const [tasksDueToday] = await pool.query(
            `SELECT ti.id, ti.title, ti.is_completed, ti.due_date, ti.list_id,
                    tl.title AS list_title, tl.folder_id, f.name AS folder_name
             FROM todo_items ti
             JOIN todo_lists tl ON ti.list_id = tl.id
             LEFT JOIN folders f ON tl.folder_id = f.id
             WHERE DATE(ti.due_date) = CURDATE()
             ORDER BY ti.is_completed ASC, ti.due_date ASC`
        );
        let projectLinks = []
        try {
            const [rows] = await pool.query(
                'SELECT id, title, url, icon_url FROM dashboard_links ORDER BY id DESC'
            )
            projectLinks = rows
        } catch (err) {
            const msg = String(err.message || '')
            if (!/dashboard_links|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                throw err
            }
        }
        let upcoming = []
        try {
            upcoming = await calendarService.getUpcoming(7);
        } catch (err) {
            const msg = String(err.message || '')
            if (!/calendar_events|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                throw err
            }
        }
        const tags = await this.getUniqueTags();

        return {
            notes: {
                total: notesCount[0].count,
                recent: recentNotes
            },
            folders: {
                total: foldersCount[0].count,
                list: foldersList
            },
            todos: {
                total: todosCount[0].total || 0,
                completed: todosCount[0].completed || 0,
                pending: (todosCount[0].total || 0) - (todosCount[0].completed || 0),
                lists: todoLists.map((row) => ({
                    id: row.id,
                    title: row.title,
                    folder_id: row.folder_id,
                    folder_name: row.folder_name || null,
                    total: parseInt(row.total) || 0,
                    completed: parseInt(row.completed) || 0
                })),
                tasks_due_today: tasksDueToday.map((row) => ({
                    id: row.id,
                    title: row.title,
                    is_completed: Boolean(row.is_completed),
                    due_date: row.due_date,
                    list_id: row.list_id,
                    list_title: row.list_title,
                    folder_name: row.folder_name || null
                }))
            },
            favorites,
            dashboard_notes: dashboardNotes,
            tags,
            project_links: projectLinks,
            calendar_upcoming: upcoming
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

    async getLinks() {
        const [rows] = await pool.query('SELECT id, title, url, icon_url FROM dashboard_links ORDER BY id DESC');
        return rows;
    }

    async createLink(data) {
        const { title, url, icon_url } = data;
        const [result] = await pool.query(
            'INSERT INTO dashboard_links (title, url, icon_url) VALUES (?, ?, ?)',
            [title, url, icon_url || null]
        );
        const [rows] = await pool.query('SELECT id, title, url, icon_url FROM dashboard_links WHERE id = ?', [result.insertId]);
        return rows[0];
    }

    async updateLink(id, data) {
        const updates = [];
        const values = [];
        if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
        if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url); }
        if (data.icon_url !== undefined) { updates.push('icon_url = ?'); values.push(data.icon_url || null); }
        if (!updates.length) {
            const [rows] = await pool.query('SELECT id, title, url, icon_url FROM dashboard_links WHERE id = ?', [id]);
            return rows[0];
        }
        values.push(id);
        await pool.query(`UPDATE dashboard_links SET ${updates.join(', ')} WHERE id = ?`, values);
        const [rows] = await pool.query('SELECT id, title, url, icon_url FROM dashboard_links WHERE id = ?', [id]);
        return rows[0];
    }

    async deleteLink(id) {
        await pool.query('DELETE FROM dashboard_links WHERE id = ?', [id]);
        return { success: true };
    }
}

const dashboardService = new DashboardService();
export { dashboardService };
