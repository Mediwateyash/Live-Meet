import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { isTokenBlacklisted } from '../controllers/authController.js'

export async function authMiddleware(req, res, next) {
  try {
    let token = req.cookies?.accessToken
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) throw new ApiError(401, 'No access token — please log in')

    // Reject tokens that have been explicitly revoked (e.g. on logout)
    if (isTokenBlacklisted(token)) throw new ApiError(401, 'Token has been revoked — please log in again')

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user    = await User.findById(decoded.userId).select('-password -refreshToken -resetPasswordToken')
    if (!user) throw new ApiError(401, 'User not found')

    if (user.suspended) {
      throw new ApiError(403, 'Account has been suspended')
    }

    if (decoded.role && user.role !== decoded.role) {
      throw new ApiError(401, 'Session expired — please log in again')
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'))
    }
    next(err instanceof ApiError ? err : new ApiError(401, 'Invalid token'))
  }
}
