// backend/routes/auth.js
import express from 'express'
import { authController } from '../controllers/authController.js'
import { authRequired, csrfRequired } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = express.Router()

router.get('/status', authController.status)
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), authController.login)
router.post('/logout', authRequired, csrfRequired, authController.logout)
router.get('/me', authRequired, authController.me)

export default router
