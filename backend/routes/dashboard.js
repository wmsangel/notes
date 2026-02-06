import express from 'express'
import { dashboardController } from '../controllers/dashboardController.js'

const router = express.Router()

router.get('/stats', dashboardController.getStats)
router.get('/recent', dashboardController.getRecentNotes)
router.get('/widgets', dashboardController.getWidgets)
router.get('/links', dashboardController.getLinks)
router.post('/links', dashboardController.createLink)
router.put('/links/:id', dashboardController.updateLink)
router.delete('/links/:id', dashboardController.deleteLink)

export default router
