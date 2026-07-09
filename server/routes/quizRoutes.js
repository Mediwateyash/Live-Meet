import express from 'express';
import { createQuiz, getQuizzes, getQuizById, deleteQuiz } from '../controllers/quizController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';

const router = express.Router();

router.post('/create', protect, authorize('instructor', 'admin'), createQuiz);
router.get('/', protect, getQuizzes);
router.get('/:id', protect, getQuizById);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteQuiz);

export default router;
