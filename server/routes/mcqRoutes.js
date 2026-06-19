import express from 'express';
import { getMCQsByMaterial, updateMCQ, deleteMCQ } from '../controllers/mcqController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';

const router = express.Router();

router.get('/material/:materialId', protect, authorize('instructor', 'admin'), getMCQsByMaterial);
router.put('/:id', protect, authorize('instructor', 'admin'), updateMCQ);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteMCQ);

export default router;
