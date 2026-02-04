import express from 'express'
import { dashboardController } from '../controllers/dashboardController.js'

const router = express.Router()

router.get('/stats', dashboardController.getStats)
router.get('/recent', dashboardController.getRecentNotes)
router.get('/widgets', dashboardController.getWidgets)

export default router