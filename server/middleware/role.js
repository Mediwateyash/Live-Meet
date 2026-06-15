import { ApiError } from '../utils/ApiError.js'

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'))
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`))
    }
    // Extra check for instructors
    if (roles.includes('instructor') && req.user.role === 'instructor' && !req.user.isApprovedInstructor) {
      return next(new ApiError(403, 'Instructor account pending approval'))
    }
    next()
  }
}
