import express from 'express';
import { uploadMaterial, getMaterials, getMaterialById, deleteMaterial } from '../controllers/materialController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/upload', protect, authorize('instructor', 'admin', 'student'), upload.single('file'), uploadMaterial);
router.get('/', protect, authorize('instructor', 'admin', 'student'), getMaterials);
router.get('/:id', protect, authorize('instructor', 'admin', 'student'), getMaterialById);
router.delete('/:id', protect, authorize('instructor', 'admin', 'student'), deleteMaterial);

export default router;
