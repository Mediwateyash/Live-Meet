import express from 'express';
import { getWHByMaterial, deleteWHQuestion } from '../controllers/whController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';

const router = express.Router();

router.get('/material/:materialId', protect, getWHByMaterial);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteWHQuestion);

export default router;
