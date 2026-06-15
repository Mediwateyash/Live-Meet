import { Router } from 'express'
import {
  getMyLectures,
  getEnrolledLectures,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
  adminGetAllLectures,
} from '../controllers/liveLectureController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole }    from '../middleware/role.js'

const router = Router()

router.use(authMiddleware)

// IMPORTANT: specific paths before /:id wildcard
router.get ('/enrolled',   getEnrolledLectures)
router.get ('/admin/all',  requireRole('admin'), adminGetAllLectures)

// Instructor: their own lectures
router.get ('/',           requireRole('instructor', 'admin'), getMyLectures)
router.post('/',           requireRole('instructor', 'admin'), createLecture)
router.put ('/:id',        requireRole('instructor', 'admin'), updateLecture)
router.delete('/:id',      requireRole('instructor', 'admin'), deleteLecture)

// Single lecture — any authenticated user (access validated in controller)
router.get ('/:id',        getLectureById)

export default router
