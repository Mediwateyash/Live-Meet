import { Router } from 'express'
import {
  browse, getFeatured, getBySlug, createCourse, updateCourse, deleteCourse, enroll, getLearn, addReview, getYoutubeMeta, generateLessonWH, saveLessonWH
} from '../controllers/courseController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole }   from '../middleware/role.js'
import { writeLimiter, enrollLimiter, courseCreateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.get ('/',              browse)
router.get ('/featured',      getFeatured)
router.get ('/youtube-meta',  authMiddleware, requireRole('instructor', 'admin'), getYoutubeMeta)
router.get ('/:slug',         getBySlug)
router.post('/',              authMiddleware, requireRole('instructor', 'admin'), courseCreateLimiter, writeLimiter, createCourse)
router.put ('/:id',           authMiddleware, requireRole('instructor', 'admin'), writeLimiter, updateCourse)
router.delete('/:id',         authMiddleware, requireRole('instructor', 'admin'), deleteCourse)
router.post('/:id/enroll',    authMiddleware, enrollLimiter, enroll)
router.get ('/:id/learn',     authMiddleware, getLearn)
router.post('/:id/review',    authMiddleware, addReview)
router.post('/:id/sections/:sectionIndex/lessons/:lessonIndex/generate-wh', authMiddleware, requireRole('instructor', 'admin'), writeLimiter, generateLessonWH)
router.put ('/:id/sections/:sectionIndex/lessons/:lessonIndex/wh-questions', authMiddleware, requireRole('instructor', 'admin'), writeLimiter, saveLessonWH)

export default router
