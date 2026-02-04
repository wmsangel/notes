// backend/services/folderService.js
import pool from '../config/database.js';

class FolderService {
    async findAll() {
        const [folders] = await pool.query(
            'SELECT * FROM folders ORDER BY position ASC, name ASC'
        );
        return folders;
    }

    async findById(id) {
        const [folders] = await pool.query('SELECT * FROM folders WHERE id = ?', [id]);
        return folders[0] || null;
    }

    async buildTree(parentId = null) {
        const folders = await this.findAll();

        const buildRecursive = (pid) => {
            return folders
                .filter(folder => folder.parent_id === pid)
                .map(folder => ({
                    ...folder,
                    children: buildRecursive(folder.id)
                }));
        };

        return buildRecursive(parentId);
    }

    async create(data) {
        const { name, parent_id, color, icon, position } = data;

        const [result] = await pool.query(
            'INSERT INTO folders (name, parent_id, color, icon, position, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                name,
                parent_id || null,
                color || '#6366f1',
                icon || 'folder',
                position || 0,
                'synced'
            ]
        );

        return this.findById(result.insertId);
    }

    async update(id, data) {
        const updates = [];
        const values = [];

        const allowedFields = ['name', 'parent_id', 'color', 'icon', 'position'];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(data[field]);
            }
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        updates.push('sync_status = ?');
        values.push('synced');
        values.push(id);

        await pool.query(
            `UPDATE folders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    async delete(id) {
        // Проверяем, есть ли дочерние папки
        const [children] = await pool.query(
            'SELECT COUNT(*) as count FROM folders WHERE parent_id = ?',
            [id]
        );

        if (children[0].count > 0) {
            throw new Error('Cannot delete folder with subfolders');
        }

        await pool.query('DELETE FROM folders WHERE id = ?', [id]);
        return true;
    }

    async getWithNotesCount() {
        const [folders] = await pool.query(`
      SELECT f.*, COUNT(n.id) as notes_count 
      FROM folders f
      LEFT JOIN notes n ON f.id = n.folder_id
      GROUP BY f.id
      ORDER BY f.position ASC, f.name ASC
    `);
        return folders;
    }

    async reorder(folderId, newPosition) {
        await pool.query(
            'UPDATE folders SET position = ? WHERE id = ?',
            [newPosition, folderId]
        );
        return this.findById(folderId);
    }
}

const folderService = new FolderService();
export { folderService };