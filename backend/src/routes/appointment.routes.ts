import { Router } from 'express'
import {
  bookAppointment,
  getMyAppointments,
  getProAppointments,
  updateAppointmentStatus,
} from '../controllers/appointment.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authenticate, requireRole('CLIENT'), bookAppointment)
router.get('/mine', authenticate, getMyAppointments)
router.get('/pro', authenticate, requireRole('PRO'), getProAppointments)
router.patch('/:id/status', authenticate, updateAppointmentStatus)

export default router
