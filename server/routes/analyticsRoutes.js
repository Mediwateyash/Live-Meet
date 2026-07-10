import express from 'express';
import { getTeacherAnalytics, getStudentAnalytics, getCourseAnalytics, getCourseAIInsights } from '../controllers/analyticsController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';

const router = express.Router();

router.get('/teacher', protect, authorize('instructor', 'admin'), getTeacherAnalytics);
router.get('/student', protect, authorize('student', 'admin'), getStudentAnalytics);
router.get('/course/:courseId', protect, authorize('instructor', 'admin'), getCourseAnalytics);
router.post('/course/:courseId/ai-insights', protect, authorize('instructor', 'admin'), getCourseAIInsights);

export default router;
