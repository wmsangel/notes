// backend/routes/upload.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadImage, getImagesByNote, deleteImage, uploadAttachment, getAttachmentsByNote, deleteAttachment } from '../controllers/uploadController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

router.post('/', upload.single('image'), uploadImage);
router.get('/note/:noteId', getImagesByNote);
router.delete('/:id', deleteImage);

// Attachments: любые файлы (лимит 25MB)
const uploadAny = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024
    }
});

router.post('/attachment', uploadAny.single('file'), uploadAttachment);
router.get('/attachment/note/:noteId', getAttachmentsByNote);
router.delete('/attachment/:id', deleteAttachment);

export default router;