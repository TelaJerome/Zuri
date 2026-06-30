import { Router } from 'express'
import { registerClient, registerPro, login, getMe } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/register/client', registerClient)
router.post('/register/pro', registerPro)
router.post('/login', login)
router.get('/me', authenticate, getMe)

export default router
