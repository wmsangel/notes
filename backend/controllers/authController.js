// backend/controllers/authController.js
import crypto from 'crypto'
import {
  verifyPassword,
  signToken,
  setAuthCookies,
  clearAuthCookies,
  isPasswordConfigured,
  getAuthStatus
} from '../middleware/auth.js'

function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex')
}

export const authController = {
  async status(req, res) {
    res.json(getAuthStatus())
  },

  async me(req, res) {
    res.json({ authenticated: true })
  },

  async login(req, res) {
    if (!isPasswordConfigured()) {
      return res.status(500).json({ error: 'Password not configured' })
    }
    const { password } = req.body || {}
    const ok = await verifyPassword(password)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid password' })
    }
    const token = signToken({ role: 'owner' })
    const csrf = generateCsrfToken()
    setAuthCookies(res, token, csrf, req.app.get('isProduction'))
    res.json({ success: true })
  },

  async logout(req, res) {
    clearAuthCookies(res)
    res.json({ success: true })
  }
}
