import { Router } from 'express'
import { register, login, logout, refresh, getMe, forgotPassword, resetPassword } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register',              register)
router.post('/login',                 login)
router.post('/logout',                authMiddleware, logout)
router.post('/refresh',               refresh)
router.get ('/me',                    authMiddleware, getMe)
router.post('/forgot-password',       forgotPassword)
router.post('/reset-password/:token', resetPassword)

export default router
