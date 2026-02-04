// backend/controllers/uploadController.js
import { uploadService } from '../services/uploadService.js';
import path from 'path';

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { noteId } = req.body;

        if (!noteId) {
            return res.status(400).json({ error: 'Note ID is required' });
        }

        const fileData = {
            filename: req.file.filename,
            filepath: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        const image = await uploadService.saveImage(noteId, fileData);

        res.status(201).json({
            ...image,
            url: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getImagesByNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const images = await uploadService.getImagesByNoteId(noteId);

        const imagesWithUrls = images.map(img => ({
            ...img,
            url: `/uploads/${path.basename(img.filepath)}`
        }));

        res.json(imagesWithUrls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteImage = async (req, res) => {
    try {
        await uploadService.deleteImage(req.params.id);
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};