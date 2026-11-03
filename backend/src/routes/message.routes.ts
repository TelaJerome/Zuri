import { Router } from 'express'
import {
  listConversations,
  unreadCount,
  startConversation,
  getMessages,
  sendMessage,
} from '../controllers/message.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

// Réservé aux clientes avec compte et aux pros
router.use(authenticate, requireRole('CLIENT', 'PRO'))

router.get('/conversations', listConversations)
router.get('/unread-count', unreadCount)
router.post('/conversations', startConversation)
router.get('/conversations/:id/messages', getMessages)
router.post('/conversations/:id/messages', sendMessage)

export default router
