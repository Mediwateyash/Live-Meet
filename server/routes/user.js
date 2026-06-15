import { Router } from 'express'
import { getProfile, updateProfile, becomeInstructor, getRequestStatus, toggleWishlist, getEnrolled, getWishlist } from '../controllers/userController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Specific routes BEFORE /:id wildcard
router.get ('/me/enrolled',               authMiddleware, getEnrolled)
router.get ('/me/wishlist',               authMiddleware, getWishlist)
router.put ('/profile',                   authMiddleware, updateProfile)
router.post('/become-instructor',         authMiddleware, becomeInstructor)
router.get ('/instructor-request/status', authMiddleware, getRequestStatus)
router.put ('/wishlist/:courseId',        authMiddleware, toggleWishlist)

// Wildcard last
router.get ('/:id',                       getProfile)

export default router
