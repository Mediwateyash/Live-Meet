import { Router } from 'express'
import {
  getDashboard, getRequests, approveRequest, rejectRequest,
  getUsers, updateUserRole, updateUserStatus, deleteUser,
  getAllCourses, updateCourseApproval, deleteCourse,
  getInstructors, getInstructor, getInstructorCourses, adminCreateCourse, adminUpdateCourse,
} from '../controllers/adminController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole }   from '../middleware/role.js'

const router = Router()

router.use(authMiddleware, requireRole('admin'))

router.get ('/dashboard',                           getDashboard)
router.get ('/instructor-requests',                 getRequests)
router.put ('/instructor-requests/:id/approve',     approveRequest)
router.put ('/instructor-requests/:id/reject',      rejectRequest)
router.get ('/users',                               getUsers)
router.put ('/users/:id/role',                      updateUserRole)
router.put ('/users/:id/status',                    updateUserStatus)
router.delete('/users/:id',                         deleteUser)
router.get ('/courses',                             getAllCourses)
router.put ('/courses/:id/approve',                 updateCourseApproval)
router.put ('/courses/:id/edit',                    adminUpdateCourse)
router.delete('/courses/:id',                       deleteCourse)

router.get ('/instructors',                         getInstructors)
router.get ('/instructors/:id',                     getInstructor)
router.get ('/instructors/:id/courses',             getInstructorCourses)
router.post('/instructors/:id/courses',             adminCreateCourse)

export default router
