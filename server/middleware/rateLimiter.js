import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 10000,                   // 10 attempts in prod, 10000 in dev
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 10000,                    // 5 attempts in prod, 10000 in dev
  message: { success: false, message: 'Too many password reset requests. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 10000,                  // 300 requests in prod, 10000 in dev
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

