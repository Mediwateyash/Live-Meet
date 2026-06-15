import { Router } from 'express'
import { getDashboard, getMyCourses } from '../controllers/instructorController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole }   from '../middleware/role.js'

const router = Router()

router.use(authMiddleware, requireRole('instructor', 'admin'))

router.get ('/dashboard',  getDashboard)
router.get ('/courses',    getMyCourses)

export default router
