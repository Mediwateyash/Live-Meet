import crypto from 'crypto'

export function csrfMiddleware(req, res, next) {
  const isProd = process.env.NODE_ENV === 'production'

  // Ensure XSRF-TOKEN cookie is initialized/updated on GET requests
  if (req.method === 'GET') {
    let token = req.cookies?.['XSRF-TOKEN']
    if (!token) {
      token = crypto.randomBytes(32).toString('hex')
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // Must be readable by Axios/client JavaScript
        secure:   isProd,
        sameSite: 'strict',
        maxAge:   24 * 60 * 60 * 1000, // 24 hours
      })
    }
  }

  // Validate CSRF token for all state-changing requests (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.cookies?.['XSRF-TOKEN']
    const header = req.headers['x-xsrf-token']

    if (!token || !header || token !== header) {
      return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token' })
    }
  }

  next()
}
