import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'

export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.accessToken
    if (!token) throw new ApiError(401, 'No access token — please log in')

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user    = await User.findById(decoded.userId).select('-password -refreshToken -resetPasswordToken')
    if (!user) throw new ApiError(401, 'User not found')

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'))
    }
    next(err instanceof ApiError ? err : new ApiError(401, 'Invalid token'))
  }
}
