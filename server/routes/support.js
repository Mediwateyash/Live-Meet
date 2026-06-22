import { Router } from 'express'
import {
  createTicket,
  getMyTickets,
  adminGetAllTickets,
  adminReplyTicket
} from '../controllers/supportController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../middleware/role.js'

const router = Router()

// All support routes require authentication
router.use(authMiddleware)

// Student routes
router.post('/', createTicket)
router.get('/my-tickets', getMyTickets)

// Admin routes
router.get('/admin/all', requireRole('admin'), adminGetAllTickets)
router.post('/admin/:id/reply', requireRole('admin'), adminReplyTicket)

export default router
