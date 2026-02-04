// backend/services/uploadService.js
import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

class UploadService {
    async saveImage(noteId, fileData) {
        const { filename, filepath, size, mimetype } = fileData;

        const [result] = await pool.query(
            'INSERT INTO images (note_id, filename, filepath, size, mime_type) VALUES (?, ?, ?, ?, ?)',
            [noteId, filename, filepath, size, mimetype]
        );

        const [image] = await pool.query('SELECT * FROM images WHERE id = ?', [result.insertId]);
        return image[0];
    }

    async getImagesByNoteId(noteId) {
        const [images] = await pool.query(
            'SELECT * FROM images WHERE note_id = ? ORDER BY uploaded_at DESC',
            [noteId]
        );
        return images;
    }

    async deleteImage(id) {
        const [image] = await pool.query('SELECT * FROM images WHERE id = ?', [id]);

        if (image.length === 0) {
            throw new Error('Image not found');
        }

        // Удаляем файл с диска
        try {
            await fs.unlink(image[0].filepath);
        } catch (error) {
            console.error('Error deleting file:', error);
        }

        await pool.query('DELETE FROM images WHERE id = ?', [id]);
        return true;
    }

    async deleteImagesByNoteId(noteId) {
        const images = await this.getImagesByNoteId(noteId);

        for (const image of images) {
            try {
                await fs.unlink(image.filepath);
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        }

        await pool.query('DELETE FROM images WHERE note_id = ?', [noteId]);
        return true;
    }
}

const uploadService = new UploadService();
export { uploadService };