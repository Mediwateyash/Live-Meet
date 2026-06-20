import express from 'express';
import { uploadResource } from '../controllers/uploadController.js';
import { authMiddleware as protect } from '../middleware/auth.js';
import { requireRole as authorize } from '../middleware/role.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/resource', protect, authorize('instructor', 'admin'), upload.single('file'), uploadResource);

export default router;
