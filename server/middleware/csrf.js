import crypto from 'crypto'

const CSRF_COOKIE_OPTS = (isProd) => ({
  httpOnly: false, // Must be readable by Axios/client JavaScript
  secure:   isProd,
  sameSite: 'strict',
  maxAge:   24 * 60 * 60 * 1000, // 24 hours
})

export function csrfMiddleware(req, res, next) {
  const isProd = process.env.NODE_ENV === 'production'

  // Ensure XSRF-TOKEN cookie is initialized on GET requests
  if (req.method === 'GET') {
    const existing = req.cookies?.['XSRF-TOKEN']
    if (!existing) {
      const token = crypto.randomBytes(32).toString('hex')
      res.cookie('XSRF-TOKEN', token, CSRF_COOKIE_OPTS(isProd))
    }
    return next()
  }

  // Validate CSRF token for all state-changing requests (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token  = req.cookies?.['XSRF-TOKEN']
    const header = req.headers['x-xsrf-token']

    if (!token || !header || token !== header) {
      return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token' })
    }

    // ── Rotate token after every successful state-changing request ────────────
    // This limits the reuse window of a stolen token (CSRF token rotation).
    const newToken = crypto.randomBytes(32).toString('hex')
    res.cookie('XSRF-TOKEN', newToken, CSRF_COOKIE_OPTS(isProd))
  }

  next()
}
