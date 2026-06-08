import express from 'express';
import {
    createLiveClass,
    getLiveClasses,
    getLiveClassById,
    updateLiveClass,
    deleteLiveClass,
    startLiveClass,
    endLiveClass,
    getAttendance,
    getChatHistory
} from '../controllers/liveClassController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, authorize('teacher', 'admin'), createLiveClass);
router.get('/', protect, getLiveClasses);
router.get('/:id', protect, getLiveClassById);
router.put('/:id', protect, authorize('teacher', 'admin'), updateLiveClass);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteLiveClass);
router.put('/:id/start', protect, authorize('teacher', 'admin'), startLiveClass);
router.put('/:id/end', protect, authorize('teacher', 'admin'), endLiveClass);
router.get('/:id/attendance', protect, authorize('teacher', 'admin'), getAttendance);
router.get('/:id/chat', protect, getChatHistory);

export default router;
