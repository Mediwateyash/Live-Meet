import { Router } from 'express'
import {
  getAllLegalPages,
  getLegalPage,
  toggleLegalPage,
} from '../controllers/legalController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole }   from '../middleware/role.js'

const router = Router()

// Public routes (anyone can read feature flag status)
router.get('/', getAllLegalPages)
router.get('/:key', getLegalPage)

// Admin-only toggle route
router.patch('/:key/toggle', authMiddleware, requireRole('admin'), toggleLegalPage)

export default router
