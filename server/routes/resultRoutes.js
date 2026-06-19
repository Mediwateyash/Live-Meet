import express from 'express';
import { submitQuiz, getMyResults, getResultById, getTeacherResults } from '../controllers/resultController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';

const router = express.Router();

router.post('/submit', protect, authorize('student', 'instructor', 'teacher', 'admin'), submitQuiz);
router.get('/my-results', protect, authorize('student', 'instructor', 'teacher', 'admin'), getMyResults);
router.get('/teacher', protect, authorize('instructor', 'admin'), getTeacherResults);
router.get('/:id', protect, getResultById);

export default router;
