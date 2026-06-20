import { Router } from 'express'
import {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} from '../controllers/testimonialController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../middleware/role.js'

const router = Router()

// Public route for landing page
router.get('/', getTestimonials)

// Student route for course feedback
router.post('/student', authMiddleware, createTestimonial)

// Admin routes
router.use('/admin', authMiddleware, requireRole('admin'))
router.get('/admin', getAllTestimonials)
router.post('/admin', createTestimonial)
router.put('/admin/:id', updateTestimonial)
router.delete('/admin/:id', deleteTestimonial)

export default router
