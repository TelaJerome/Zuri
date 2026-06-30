import { Router } from 'express'
import {
  listPros,
  getProById,
  updateMyProfile,
  uploadPhoto,
  upsertServices,
  setAvailabilities,
  getAvailableSlots,
} from '../controllers/pro.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

router.get('/', listPros)
router.get('/:id', getProById)
router.get('/:id/slots', getAvailableSlots)

router.put('/me/profile', authenticate, requireRole('PRO'), updateMyProfile)
router.post('/me/photo', authenticate, requireRole('PRO'), upload.single('photo'), uploadPhoto)
router.put('/me/services', authenticate, requireRole('PRO'), upsertServices)
router.put('/me/availabilities', authenticate, requireRole('PRO'), setAvailabilities)

export default router
