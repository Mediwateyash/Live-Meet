import { Router } from 'express'
import {
  createTicket,
  getMyTickets,
  adminGetAllTickets,
  adminReplyTicket,
  markTicketAsRead
} from '../controllers/supportController.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../middleware/role.js'
import { supportTicketLimiter } from '../middleware/rateLimiter.js'


const router = Router()

// All support routes require authentication
router.use(authMiddleware)

// Student routes — creating a ticket has a stricter rate limit to prevent spam
router.post('/', supportTicketLimiter, createTicket)

router.get('/my-tickets', getMyTickets)
router.patch('/:id/read', markTicketAsRead)

// Admin routes
router.get('/admin/all', requireRole('admin'), adminGetAllTickets)
router.post('/admin/:id/reply', requireRole('admin'), adminReplyTicket)

export default router
