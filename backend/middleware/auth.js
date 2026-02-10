// backend/middleware/auth.js
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const COOKIE_NAME = 'notes_auth'
const CSRF_COOKIE = 'notes_csrf'
const JWT_EXPIRES_DAYS = 30

let cachedHash = null
let cachedFromPlain = false

export function getAuthConfig() {
  return {
    cookieName: COOKIE_NAME,
    csrfCookie: CSRF_COOKIE,
    jwtExpiresDays: JWT_EXPIRES_DAYS
  }
}

async function getPasswordHash() {
  if (cachedHash) return cachedHash
  const hash = process.env.APP_PASSWORD_HASH
  const plain = process.env.APP_PASSWORD
  if (hash && String(hash).trim()) {
    cachedHash = String(hash).trim()
    cachedFromPlain = false
    return cachedHash
  }
  if (plain && String(plain).trim()) {
    // Hash on startup if only plain password provided
    cachedHash = await bcrypt.hash(String(plain).trim(), 12)
    cachedFromPlain = true
    return cachedHash
  }
  return null
}

export async function verifyPassword(plain) {
  const hash = await getPasswordHash()
  if (!hash) return false
  try {
    return await bcrypt.compare(String(plain || ''), hash)
  } catch {
    return false
  }
}

export function isPasswordConfigured() {
  return !!(process.env.APP_PASSWORD_HASH || process.env.APP_PASSWORD)
}

export function signToken(payload) {
  const secret = process.env.APP_JWT_SECRET
  if (!secret) throw new Error('APP_JWT_SECRET is not set')
  return jwt.sign(payload, secret, { expiresIn: `${JWT_EXPIRES_DAYS}d` })
}

export function verifyToken(token) {
  const secret = process.env.APP_JWT_SECRET
  if (!secret) throw new Error('APP_JWT_SECRET is not set')
  return jwt.verify(token, secret)
}

export function authRequired(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = verifyToken(token)
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export function csrfRequired(req, res, next) {
  const method = req.method?.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()
  const csrfCookie = req.cookies?.[CSRF_COOKIE]
  const csrfHeader = req.get('x-csrf-token')
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  return next()
}

export function setAuthCookies(res, token, csrfToken, isProduction) {
  const maxAge = JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: !!isProduction,
    maxAge
  })
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: 'strict',
    secure: !!isProduction,
    maxAge
  })
}

export function clearAuthCookies(res) {
  res.clearCookie(COOKIE_NAME)
  res.clearCookie(CSRF_COOKIE)
}

export function getAuthStatus() {
  return { hasPassword: isPasswordConfigured(), hashedFromPlain: cachedFromPlain }
}
