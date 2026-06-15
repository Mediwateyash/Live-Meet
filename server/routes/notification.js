import { Router } from 'express'
import { getNotifications, markRead, markAllRead, deleteNotification, clearAll } from '../controllers/notificationController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get   ('/',              getNotifications)
router.patch ('/read-all',      markAllRead)
router.delete('/clear-all',     clearAll)
router.patch ('/:id/read',      markRead)
router.delete('/:id',           deleteNotification)

export default router
