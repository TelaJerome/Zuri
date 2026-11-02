import { Router } from 'express'
import {
  bookAppointment,
  getMyAppointments,
  getProAppointments,
  updateAppointmentStatus,
} from '../controllers/appointment.controller'
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware'

const router = Router()

// Ouvert aux visiteurs : une cliente connectée réserve avec son compte, les autres donnent leurs coordonnées
router.post('/', optionalAuth, bookAppointment)
router.get('/mine', authenticate, getMyAppointments)
router.get('/pro', authenticate, requireRole('PRO'), getProAppointments)
router.patch('/:id/status', authenticate, updateAppointmentStatus)

export default router
