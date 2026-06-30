import { Router } from 'express'
import { listProsAdmin, toggleProStatus, verifySiret } from '../controllers/admin.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate, requireRole('ADMIN'))

router.get('/pros', listProsAdmin)
router.patch('/pros/:id/status', toggleProStatus)
router.patch('/pros/:id/verify-siret', verifySiret)

export default router
