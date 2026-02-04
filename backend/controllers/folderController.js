// backend/controllers/folderController.js
import { folderService } from '../services/folderService.js'

export const getAllFolders = async (req, res) => {
    try {
        const folders = await folderService.findAll();
        res.json(folders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFolderById = async (req, res) => {
    try {
        const folder = await folderService.findById(req.params.id);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFolderTree = async (req, res) => {
    try {
        const tree = await folderService.buildTree();
        res.json(tree);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFoldersWithCount = async (req, res) => {
    try {
        const folders = await folderService.getWithNotesCount();
        res.json(folders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createFolder = async (req, res) => {
    try {
        const folder = await folderService.create(req.body);
        res.status(201).json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateFolder = async (req, res) => {
    try {
        const folder = await folderService.update(req.params.id, req.body);
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteFolder = async (req, res) => {
    try {
        await folderService.delete(req.params.id);
        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        if (error.message.includes('subfolders')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const reorderFolder = async (req, res) => {
    try {
        const { position } = req.body;
        const folder = await folderService.reorder(req.params.id, position);
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const folderController = {
    getAllFolders,
    getFolderById,
    getFolderTree,
    getFoldersWithCount,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolder
};