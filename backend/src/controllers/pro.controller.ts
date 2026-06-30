import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  city: z.string().min(2).optional(),
  specialties: z
    .array(z.enum(['COIFFURE', 'ESTHETIQUE', 'NAIL_ART', 'MASSAGE', 'MAQUILLAGE']))
    .optional(),
})

const serviceSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  durationMinutes: z.number().int().positive(),
  description: z.string().optional(),
})

const availabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
)

export async function listPros(req: Request, res: Response) {
  const { search, specialty, city } = req.query

  const pros = await prisma.proProfile.findMany({
    where: {
      isActive: true,
      ...(specialty && { specialties: { has: specialty as any } }),
      ...(city && { city: { contains: city as string, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } },
          { bio: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      services: { orderBy: { price: 'asc' }, take: 1 },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(pros)
}

export async function getProById(req: Request, res: Response) {
  const pro = await prisma.proProfile.findUnique({
    where: { id: req.params.id, isActive: true },
    include: {
      services: true,
      availabilities: { orderBy: { dayOfWeek: 'asc' } },
      products: { where: { isActive: true } },
    },
  })
  if (!pro) {
    res.status(404).json({ message: 'Professionnel introuvable' })
    return
  }
  res.json(pro)
}

export async function updateMyProfile(req: AuthRequest, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil professionnel introuvable' })
    return
  }

  const updated = await prisma.proProfile.update({
    where: { id: pro.id },
    data: parsed.data,
  })
  res.json(updated)
}

export async function uploadPhoto(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ message: 'Aucun fichier envoyé' })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil introuvable' })
    return
  }

  const photoUrl = `/uploads/${req.file.filename}`
  await prisma.proProfile.update({ where: { id: pro.id }, data: { photoUrl } })
  res.json({ photoUrl })
}

export async function upsertServices(req: AuthRequest, res: Response) {
  const parsed = z.array(serviceSchema).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil introuvable' })
    return
  }

  await prisma.service.deleteMany({ where: { proId: pro.id } })
  const services = await prisma.service.createMany({
    data: parsed.data.map((s) => ({ ...s, proId: pro.id })),
  })
  res.json(services)
}

export async function setAvailabilities(req: AuthRequest, res: Response) {
  const parsed = availabilitySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil introuvable' })
    return
  }

  await prisma.availability.deleteMany({ where: { proId: pro.id } })
  await prisma.availability.createMany({
    data: parsed.data.map((a) => ({ ...a, proId: pro.id })),
  })

  const availabilities = await prisma.availability.findMany({ where: { proId: pro.id } })
  res.json(availabilities)
}

export async function getAvailableSlots(req: Request, res: Response) {
  const { date } = req.query
  if (!date) {
    res.status(400).json({ message: 'Date requise' })
    return
  }

  const pro = await prisma.proProfile.findUnique({
    where: { id: req.params.id },
    include: { availabilities: true, services: true },
  })
  if (!pro) {
    res.status(404).json({ message: 'Professionnel introuvable' })
    return
  }

  const dateObj = new Date(date as string)
  const dayOfWeek = (dateObj.getDay() + 6) % 7 // lundi=0

  const dayAvailability = pro.availabilities.filter((a) => a.dayOfWeek === dayOfWeek)
  if (dayAvailability.length === 0) {
    res.json([])
    return
  }

  // Récupère les RDV déjà réservés pour ce jour
  const start = new Date(date as string)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      proId: req.params.id,
      date: { gte: start, lt: end },
      status: { not: 'CANCELLED' },
    },
    include: { service: true },
  })

  // Génère des créneaux de 30 min dans les plages de disponibilité
  const slots: { time: string; available: boolean }[] = []
  for (const avail of dayAvailability) {
    const [startH, startM] = avail.startTime.split(':').map(Number)
    const [endH, endM] = avail.endTime.split(':').map(Number)
    let current = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    while (current < endMinutes) {
      const h = Math.floor(current / 60)
      const m = current % 60
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      const isBooked = existingAppointments.some((apt) => apt.startTime === timeStr)
      slots.push({ time: timeStr, available: !isBooked })
      current += 30
    }
  }

  res.json(slots)
}
