// backend/routes/export.js
import express from 'express'
import { exportController } from '../controllers/exportController.js'

const router = express.Router()

// Возможности (доступность Apple Notes на текущей платформе и т.п.)
router.get('/capabilities', exportController.getCapabilities)

// Список папок (для UI выбора, что экспортировать)
router.get('/folders', exportController.getFolders)

// Массовый экспорт в Apple Notes (через osascript на самом сервере; только если backend на macOS)
router.post('/apple-notes', exportController.exportToAppleNotes)

// Альтернатива: скачать .applescript-файл и запустить локально на Mac
router.post('/apple-notes/script', exportController.downloadAppleScript)

export default router
