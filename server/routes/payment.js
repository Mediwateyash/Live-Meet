import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createOrder, verifyPayment } from '../controllers/paymentController.js'

const router = express.Router()

router.post('/create-order', authMiddleware, createOrder)
router.post('/verify-payment', authMiddleware, verifyPayment)

export default router
