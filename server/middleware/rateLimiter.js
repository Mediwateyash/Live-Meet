import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100,                   // 10 attempts in prod, 100 in dev
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 100,                    // 5 attempts in prod, 100 in dev
  message: { success: false, message: 'Too many password reset requests. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,                // 1000 requests in prod, 5000 in dev
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 1000,                 // 300 attempts in prod, 1000 in dev
  message: { success: false, message: 'Too many updates, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const enrollLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 5 : 100,                    // 5 attempts in prod, 100 in dev
  message: { success: false, message: 'Too many enrollment actions, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const courseCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 50,                     // 5 attempts in prod, 50 in dev
  message: { success: false, message: 'Too many courses created. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500,                   // 100 attempts in prod, 500 in dev
  message: { success: false, message: 'Too many profile lookups. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const supportTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100,                    // 5 tickets / 15 min in prod
  message: { success: false, message: 'Too many support tickets submitted. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
