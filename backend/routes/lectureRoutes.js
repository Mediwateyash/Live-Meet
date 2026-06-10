import express from 'express';
import {
    createLecture,
    getLectures,
    updateLecture,
    deleteLecture,
    getApprovedTeachers
} from '../controllers/lectureController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get lectures route is available to all authenticated roles
router.get('/', protect, getLectures);

// Admin only routes for managing lectures
router.post('/create', protect, authorize('admin'), createLecture);
router.put('/:id', protect, authorize('admin'), updateLecture);
router.delete('/:id', protect, authorize('admin'), deleteLecture);
router.get('/teachers', protect, authorize('admin'), getApprovedTeachers);

export default router;
