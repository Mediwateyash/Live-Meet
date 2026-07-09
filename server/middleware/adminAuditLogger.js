import AuditLog from '../models/AuditLog.js'

// Sensitive field names that should never be persisted in audit logs
const REDACT_KEYS = new Set(['password', 'newPassword', 'currentPassword', 'confirmPassword', 'token', 'accessToken', 'refreshToken', 'secret'])

function redactSensitive(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]'
    } else if (v && typeof v === 'object') {
      out[k] = redactSensitive(v, depth + 1)
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Middleware that asynchronously writes an audit log entry for admin actions.
 * Uses fire-and-forget (no await) so it never delays the actual response.
 */
export function adminAuditLogger(req, res, next) {
  // Only log mutating requests (reads produce no side-effects)
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next()

  // Fire-and-forget — errors here must not affect the actual response
  AuditLog.create({
    admin:      req.user?._id,
    adminEmail: req.user?.email,
    method:     req.method,
    url:        req.originalUrl,
    body:       redactSensitive(req.body),
    ip:         req.ip,
    userAgent:  req.headers['user-agent']?.slice(0, 200),
  }).catch(err => console.error('[AuditLog] Failed to write audit log:', err.message))

  next()
}
