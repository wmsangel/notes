// backend/controllers/calendarController.js
import { calendarService } from '../services/calendarService.js'

export const calendarController = {
    async getAll(req, res) {
        try {
            const events = await calendarService.getAll()
            res.json(events)
        } catch (error) {
            console.error('Error fetching calendar events:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async getUpcoming(req, res) {
        try {
            const days = parseInt(req.query.days, 10) || 7
            const events = await calendarService.getUpcoming(days)
            res.json(events)
        } catch (error) {
            console.error('Error fetching upcoming events:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async create(req, res) {
        try {
            const event = await calendarService.create(req.body)
            res.status(201).json(event)
        } catch (error) {
            console.error('Error creating calendar event:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async update(req, res) {
        try {
            const event = await calendarService.update(req.params.id, req.body)
            res.json(event)
        } catch (error) {
            console.error('Error updating calendar event:', error)
            res.status(500).json({ error: error.message })
        }
    },

    async delete(req, res) {
        try {
            await calendarService.delete(req.params.id)
            res.json({ success: true })
        } catch (error) {
            console.error('Error deleting calendar event:', error)
            res.status(500).json({ error: error.message })
        }
    }
}
