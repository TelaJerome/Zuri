import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'

const bookSchema = z.object({
  proId: z.string(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
})

export async function bookAppointment(req: AuthRequest, res: Response) {
  const parsed = bookSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }
  const { proId, serviceId, date, startTime, notes } = parsed.data

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service || service.proId !== proId) {
    res.status(400).json({ message: 'Prestation introuvable' })
    return
  }

  const [h, m] = startTime.split(':').map(Number)
  const endMinutes = h * 60 + m + service.durationMinutes
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  const dateObj = new Date(date)
  const nextDay = new Date(dateObj)
  nextDay.setDate(nextDay.getDate() + 1)

  // Vérifie qu'aucun RDV ne chevauche ce créneau
  const conflict = await prisma.appointment.findFirst({
    where: {
      proId,
      date: { gte: dateObj, lt: nextDay },
      status: { not: 'CANCELLED' },
      startTime,
    },
  })
  if (conflict) {
    res.status(409).json({ message: 'Ce créneau est déjà réservé' })
    return
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId: req.user!.userId,
      proId,
      serviceId,
      date: dateObj,
      startTime,
      endTime,
      notes,
    },
    include: { service: true, pro: true },
  })

  res.status(201).json(appointment)
}

export async function getMyAppointments(req: AuthRequest, res: Response) {
  const { upcoming } = req.query
  const now = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: req.user!.userId,
      ...(upcoming === 'true' && { date: { gte: now } }),
      ...(upcoming === 'false' && { date: { lt: now } }),
    },
    include: { service: true, pro: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  res.json(appointments)
}

export async function getProAppointments(req: AuthRequest, res: Response) {
  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil introuvable' })
    return
  }

  const appointments = await prisma.appointment.findMany({
    where: { proId: pro.id },
    include: { service: true, client: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  res.json(appointments)
}

export async function updateAppointmentStatus(req: AuthRequest, res: Response) {
  const { status } = req.body
  if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
    res.status(400).json({ message: 'Statut invalide' })
    return
  }

  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } })
  if (!appointment) {
    res.status(404).json({ message: 'Rendez-vous introuvable' })
    return
  }

  // Le client peut annuler ses propres RDV, le pro peut confirmer/annuler les siens
  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  const isClient = appointment.clientId === req.user!.userId
  const isPro = pro && appointment.proId === pro.id

  if (!isClient && !isPro) {
    res.status(403).json({ message: 'Accès refusé' })
    return
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(updated)
}
