import { Router } from 'express'
import { createOrder, getMyOrders, getOrderById } from '../controllers/order.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authenticate, requireRole('CLIENT'), createOrder)
router.get('/mine', authenticate, getMyOrders)
router.get('/:id', authenticate, getOrderById)

export default router
