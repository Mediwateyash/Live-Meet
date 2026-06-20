import express from 'express';
import { generateQuickQuiz } from '../controllers/quickQuizController.js';
import { authMiddleware as protect } from '../middleware/auth.js';

const router = express.Router();

// Generate quick quiz on the fly
router.post('/generate', protect, generateQuickQuiz);

export default router;
