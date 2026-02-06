// backend/routes/calendar.js
import express from 'express'
import { calendarController } from '../controllers/calendarController.js'

const router = express.Router()

router.get('/events', calendarController.getAll)
router.get('/upcoming', calendarController.getUpcoming)
router.post('/events', calendarController.create)
router.put('/events/:id', calendarController.update)
router.delete('/events/:id', calendarController.delete)

export default router
