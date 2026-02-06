// backend/controllers/dashboardController.js
import { dashboardService } from '../services/dashboardService.js'

export const getWidgets = async (req, res) => {
    try {
        const widgets = await dashboardService.getWidgets();
        res.json(widgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateWidget = async (req, res) => {
    try {
        const widget = await dashboardService.updateWidget(req.params.id, req.body);
        res.json(widget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createWidget = async (req, res) => {
    try {
        const widget = await dashboardService.createWidget(req.body);
        res.status(201).json(widget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteWidget = async (req, res) => {
    try {
        await dashboardService.deleteWidget(req.params.id);
        res.json({ message: 'Widget deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRecentNotes = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;
        const notes = await dashboardService.getRecentNotes(limit);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const stats = await dashboardService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLinks = async (req, res) => {
    try {
        const links = await dashboardService.getLinks();
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createLink = async (req, res) => {
    try {
        const link = await dashboardService.createLink(req.body);
        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateLink = async (req, res) => {
    try {
        const link = await dashboardService.updateLink(req.params.id, req.body);
        res.json(link);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteLink = async (req, res) => {
    try {
        await dashboardService.deleteLink(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const dashboardController = {
    getWidgets,
    updateWidget,
    createWidget,
    deleteWidget,
    getRecentNotes,
    getStats,
    getLinks,
    createLink,
    updateLink,
    deleteLink
};
