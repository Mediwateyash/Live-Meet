import express from 'express';
import { getAllUsers, approveTeacher, deleteUser } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes are protected and restricted to admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/approve/:id', approveTeacher);
router.delete('/users/:id', deleteUser);

export default router;
