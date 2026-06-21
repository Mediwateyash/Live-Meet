import { ApiError } from '../utils/ApiError.js'

export const errorHandler = (err, req, res, next) => {
  // Log full error internally for debugging
  console.error(`[ERROR] ${err.name}: ${err.message}\n`, err.stack || '')

  // Mongoose ObjectId cast error
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' })
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field'
    return res.status(409).json({ success: false, message: `${field} is already in use` })
  }
  
  // Mongoose Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ')
    return res.status(400).json({ success: false, message: messages })
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' })
  }

  // Default error message
  const status = err.statusCode || 500
  let message = err.message || 'Something went wrong'
  
  if (status === 500 && process.env.NODE_ENV === 'production' && !(err instanceof ApiError)) {
    message = 'Internal Server Error'
  }
  
  res.status(status).json({ success: false, message })
}
