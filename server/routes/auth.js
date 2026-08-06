import { Router } from 'express'
import { register, login, logout, refresh, getMe, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'
import { forgotPasswordLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/register',              register)
router.post('/login',                 login)
router.post('/verify-email',          verifyEmail)
router.post('/resend-verification',   resendVerification)
router.post('/logout',                authMiddleware, logout)
router.post('/refresh',               refresh)
router.get ('/me',                    authMiddleware, getMe)
router.post('/forgot-password',       forgotPasswordLimiter, forgotPassword)
router.post('/reset-password',        forgotPasswordLimiter, resetPassword)

export default router
