// backend/middleware/rateLimit.js
const store = new Map()

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = req.ip
    const now = Date.now()
    const entry = store.get(key)
    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    if (entry.count >= max) {
      return res.status(429).json({ error: 'Too many attempts, try позже' })
    }
    entry.count += 1
    return next()
  }
}
