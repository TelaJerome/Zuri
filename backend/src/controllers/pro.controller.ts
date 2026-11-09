import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'
import { geocode } from '../utils/geocode'
import { isValidSiret } from '../utils/siret'
import { PRIVATE_PRO_FIELDS } from '../lib/publicPro'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  city: z.string().min(2).optional(),
  // Chaîne vide = adresse retirée (la pro est alors placée au centre de sa ville)
  address: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().regex(/^(\d{5})?$/, 'Code postal à 5 chiffres').optional(),
  // Chaîne vide = SIRET retiré ; jamais affiché aux clientes
  siret: z.string().transform((s) => s.replace(/\s/g, '')).optional(),
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

// Jusqu'à 2 plages par jour (ex. matin et après-midi, avec une pause entre les deux).
// dayOfWeek suit la convention JavaScript : 0 = dimanche, 1 = lundi… 6 = samedi.
const MAX_RANGES_PER_DAY = 2
const availabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
)

export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Message d'erreur si les plages d'un même jour sont incohérentes, sinon null
function availabilityError(ranges: { dayOfWeek: number; startTime: string; endTime: string }[]) {
  for (let day = 0; day < 7; day++) {
    const dayRanges = ranges
      .filter((r) => r.dayOfWeek === day)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
    if (dayRanges.length > MAX_RANGES_PER_DAY) return `${MAX_RANGES_PER_DAY} plages maximum par jour`
    for (let i = 0; i < dayRanges.length; i++) {
      if (toMinutes(dayRanges[i].startTime) >= toMinutes(dayRanges[i].endTime)) {
        return 'Chaque plage doit finir après son début'
      }
      if (i > 0 && toMinutes(dayRanges[i].startTime) < toMinutes(dayRanges[i - 1].endTime)) {
        return 'Les plages d\'un même jour ne doivent pas se chevaucher'
      }
    }
  }
  return null
}

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
    omit: PRIVATE_PRO_FIELDS,
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
    omit: PRIVATE_PRO_FIELDS,
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

  // Champ absent = inchangé ; chaîne vide = effacé
  const address = parsed.data.address === undefined ? pro.address : parsed.data.address || null
  const postalCode = parsed.data.postalCode === undefined ? pro.postalCode : parsed.data.postalCode || null
  const city = parsed.data.city ?? pro.city
  const data: { [key: string]: unknown } = { ...parsed.data, address, postalCode }

  if (parsed.data.siret !== undefined) {
    const siret = parsed.data.siret || null
    if (siret && !isValidSiret(siret)) {
      res.status(400).json({ message: 'Numéro SIRET invalide' })
      return
    }
    if (siret && siret !== pro.siret) {
      const taken = await prisma.proProfile.findUnique({ where: { siret } })
      if (taken) {
        res.status(409).json({ message: 'Ce SIRET est déjà enregistré' })
        return
      }
    }
    data.siret = siret
    // Un nouveau numéro doit être revérifié par l'admin
    if (siret !== pro.siret) data.siretVerified = false
  }

  // Recalcule la position sur la carte si le lieu a changé (ou n'a jamais été calculé)
  const placeChanged = address !== pro.address || postalCode !== pro.postalCode || city !== pro.city
  let located: string | null = null

  if (placeChanged || pro.lat === null) {
    if (address) {
      const result = await geocode(`${address} ${postalCode ?? ''} ${city}`)
      if (!result) {
        res.status(400).json({ message: 'Adresse introuvable : vérifiez le numéro, la rue, le code postal et la ville' })
        return
      }
      data.lat = result.lat
      data.lng = result.lng
      located = result.label
    } else {
      // Sans adresse, la pro apparaît au centre de sa ville
      const result = await geocode(`${postalCode ?? ''} ${city}`)
      data.lat = result?.lat ?? null
      data.lng = result?.lng ?? null
      located = result?.label ?? null
    }
  }

  const updated = await prisma.proProfile.update({
    where: { id: pro.id },
    data,
  })
  res.json({ ...updated, located })
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
  const rangeError = availabilityError(parsed.data)
  if (rangeError) {
    res.status(400).json({ message: rangeError })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil introuvable' })
    return
  }

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { proId: pro.id } }),
    prisma.availability.createMany({
      data: parsed.data.map((a) => ({ ...a, proId: pro.id })),
    }),
  ])

  const availabilities = await prisma.availability.findMany({ where: { proId: pro.id } })
  res.json(availabilities)
}

export async function setUnavailablePeriods(req: AuthRequest, res: Response) {
  const schema = z.array(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().optional(),
  }))
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) { res.status(404).json({ message: 'Profil introuvable' }); return }

  await prisma.unavailableDate.deleteMany({ where: { proId: pro.id } })
  await prisma.unavailableDate.createMany({
    data: parsed.data.map((p) => ({
      proId: pro.id,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
      reason: p.reason,
    })),
  })

  const periods = await prisma.unavailableDate.findMany({ where: { proId: pro.id } })
  res.json(periods)
}

export async function getAvailableSlots(req: Request, res: Response) {
  const { date } = req.query
  if (!date) {
    res.status(400).json({ message: 'Date requise' })
    return
  }

  const pro = await prisma.proProfile.findUnique({
    where: { id: req.params.id },
    include: { availabilities: true, services: true, unavailableDates: true },
  })
  if (!pro) {
    res.status(404).json({ message: 'Professionnel introuvable' })
    return
  }

  const dateObj = new Date(date as string)

  // Vérifie si la date tombe dans une plage d'indisponibilité
  const isUnavailable = pro.unavailableDates.some((p) => {
    const d = dateObj.getTime()
    return d >= new Date(p.startDate).getTime() && d <= new Date(p.endDate).getTime()
  })
  if (isUnavailable) { res.json([]); return }

  // « AAAA-MM-JJ » est lu à minuit UTC : getUTCDay donne le bon jour (0 = dimanche, comme l'espace pro)
  const dayOfWeek = dateObj.getUTCDay()

  const dayAvailability = pro.availabilities
    .filter((a) => a.dayOfWeek === dayOfWeek)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
  if (dayAvailability.length === 0) {
    res.json([])
    return
  }

  // Durée de la prestation choisie (30 min par défaut) : un créneau doit tenir avant la fin de la plage
  const service = req.query.serviceId
    ? pro.services.find((s) => s.id === req.query.serviceId)
    : undefined
  const duration = service?.durationMinutes ?? 30

  // Récupère les RDV déjà réservés pour ce jour
  const start = new Date(dateObj)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      proId: req.params.id,
      date: { gte: start, lt: end },
      status: { not: 'CANCELLED' },
    },
    select: { startTime: true, endTime: true },
  })
  const booked = existingAppointments.map((apt) => [toMinutes(apt.startTime), toMinutes(apt.endTime)])

  // Créneaux toutes les 30 min dans chaque plage ; pris s'ils chevauchent un RDV existant
  const slots: { time: string; available: boolean }[] = []
  for (const avail of dayAvailability) {
    const rangeEnd = toMinutes(avail.endTime)
    for (let current = toMinutes(avail.startTime); current + duration <= rangeEnd; current += 30) {
      const timeStr = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
      const overlaps = booked.some(([s, e]) => current < e && current + duration > s)
      slots.push({ time: timeStr, available: !overlaps })
    }
  }

  res.json(slots)
}
