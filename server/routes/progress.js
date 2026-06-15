import { Router } from 'express'
import { getProgress, markLesson, savePosition } from '../controllers/progressController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get ('/:courseId',                     authMiddleware, getProgress)
router.post('/:courseId/lesson/:lessonId',    authMiddleware, markLesson)
router.put ('/:courseId/position',            authMiddleware, savePosition)

export default router
