import { Router } from 'express'
import { registerClient, registerPro, login, getMe, updateMe } from '../controllers/auth.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.post('/register/client', registerClient)
router.post('/register/pro', registerPro)
router.post('/login', login)
router.get('/me', authenticate, getMe)
// Nom, téléphone et réseaux sociaux d'une cliente (le profil pro a sa propre route)
router.put('/me', authenticate, requireRole('CLIENT'), updateMe)

export default router
