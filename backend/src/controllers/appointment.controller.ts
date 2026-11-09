import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'
import { toMinutes, isWithinBookingHorizon } from './pro.controller'
import { PRIVATE_PRO_FIELDS } from '../lib/publicPro'
import { CLIENT_FOR_PRO } from '../utils/social'

const bookSchema = z.object({
  proId: z.string(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(1000).optional(),
  guest: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email(),
      phone: z.string().trim().min(6).max(20),
    })
    .optional(),
})

export async function bookAppointment(req: AuthRequest, res: Response) {
  const parsed = bookSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }
  const { proId, serviceId, date, startTime, notes, guest } = parsed.data

  // Une cliente connectée réserve avec son compte ; sinon il faut ses coordonnées
  const clientId = req.user?.role === 'CLIENT' ? req.user.userId : null
  if (!clientId && !guest) {
    res.status(400).json({ message: 'Indiquez votre nom, votre email et votre téléphone' })
    return
  }

  if (!isWithinBookingHorizon(date)) {
    res.status(400).json({ message: 'Les réservations sont possibles jusqu\'à 1 mois à l\'avance' })
    return
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service || service.proId !== proId) {
    res.status(400).json({ message: 'Prestation introuvable' })
    return
  }

  const startMinutes = toMinutes(startTime)
  const endMinutes = startMinutes + service.durationMinutes
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  const dateObj = new Date(date)
  const nextDay = new Date(dateObj)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)

  // Le RDV doit tenir entièrement dans une plage de disponibilité (pas sur une pause)
  const ranges = await prisma.availability.findMany({ where: { proId, dayOfWeek: dateObj.getUTCDay() } })
  const fits = ranges.some((r) => startMinutes >= toMinutes(r.startTime) && endMinutes <= toMinutes(r.endTime))
  if (!fits) {
    res.status(409).json({ message: 'Ce créneau n\'est pas dans les horaires de la professionnelle' })
    return
  }

  // Vérifie qu'aucun RDV ne chevauche ce créneau
  const sameDay = await prisma.appointment.findMany({
    where: {
      proId,
      date: { gte: dateObj, lt: nextDay },
      status: { not: 'CANCELLED' },
    },
    select: { startTime: true, endTime: true },
  })
  const conflict = sameDay.some(
    (apt) => startMinutes < toMinutes(apt.endTime) && endMinutes > toMinutes(apt.startTime)
  )
  if (conflict) {
    res.status(409).json({ message: 'Ce créneau est déjà réservé' })
    return
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      ...(!clientId && guest && {
        guestName: guest.name,
        guestEmail: guest.email,
        guestPhone: guest.phone,
      }),
      proId,
      serviceId,
      date: dateObj,
      startTime,
      endTime,
      notes,
    },
    include: { service: true, pro: { omit: PRIVATE_PRO_FIELDS } },
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
    include: { service: true, pro: { omit: PRIVATE_PRO_FIELDS } },
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
    // Jamais la fiche complète de la cliente (elle contient le hash du mot de passe)
    include: { service: true, client: { select: { ...CLIENT_FOR_PRO, phone: true } } },
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
