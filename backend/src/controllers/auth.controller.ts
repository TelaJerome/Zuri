import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { signToken } from '../utils/jwt'
import { isValidSiret } from '../utils/siret'
import { geocode } from '../utils/geocode'
import { instagramSchema, snapchatSchema } from '../utils/social'
import prisma from '../lib/prisma'

const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  // Prénom et nom, pour que les pros reconnaissent la cliente ; réseaux facultatifs
  name: z.string().trim().min(2).max(100),
  instagram: instagramSchema.optional(),
  snapchat: snapchatSchema.optional(),
})

// Modification de ses propres informations par une cliente (champ absent = inchangé)
const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  instagram: instagramSchema.optional(),
  snapchat: snapchatSchema.optional(),
})

const registerProSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  name: z.string().min(2),
  // Facultatif : la pro peut l'ajouter plus tard depuis son espace (espaces retirés)
  siret: z.string().transform((s) => s.replace(/\s/g, '')).optional(),
  city: z.string().min(2),
  specialties: z.array(z.enum(['COIFFURE', 'ESTHETIQUE', 'NAIL_ART', 'MASSAGE', 'MAQUILLAGE'])).min(1),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function registerClient(req: Request, res: Response) {
  const parsed = registerClientSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }
  const { email, password, phone, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'Cet email est déjà utilisé' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email, passwordHash, phone, name, role: Role.CLIENT,
      instagram: parsed.data.instagram || null,
      snapchat: parsed.data.snapchat || null,
    },
  })

  const token = signToken({ userId: user.id, role: user.role })
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
}

export async function updateMe(req: Request & { user?: { userId: string; role: string } }, res: Response) {
  const parsed = updateMeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }
  const { name, phone, instagram, snapchat } = parsed.data
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(instagram !== undefined && { instagram: instagram || null }),
      ...(snapchat !== undefined && { snapchat: snapchat || null }),
    },
    select: { id: true, email: true, role: true, phone: true, name: true, instagram: true, snapchat: true },
  })
  res.json(user)
}

export async function registerPro(req: Request, res: Response) {
  const parsed = registerProSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }
  const { email, password, phone, name, city, specialties } = parsed.data
  const siret = parsed.data.siret || null

  if (siret && !isValidSiret(siret)) {
    res.status(400).json({ message: 'Numéro SIRET invalide' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'Cet email est déjà utilisé' })
    return
  }

  if (siret && (await prisma.proProfile.findUnique({ where: { siret } }))) {
    res.status(409).json({ message: 'Ce SIRET est déjà enregistré' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  // Position de départ sur la carte : le centre de la ville (affinée quand la pro saisit son adresse)
  const place = await geocode(city)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone,
      role: Role.PRO,
      proProfile: {
        create: { name, siret, city, specialties, lat: place?.lat, lng: place?.lng },
      },
    },
    include: { proProfile: true },
  })

  const token = signToken({ userId: user.id, role: user.role })
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role: user.role, proProfile: user.proProfile },
  })
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides' })
    return
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    include: { proProfile: true },
  })
  if (!user) {
    res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    return
  }

  const token = signToken({ userId: user.id, role: user.role })
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, proProfile: user.proProfile },
  })
}

export async function getMe(req: Request & { user?: { userId: string; role: string } }, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { proProfile: { include: { services: true } } },
  })
  if (!user) {
    res.status(404).json({ message: 'Utilisateur introuvable' })
    return
  }
  const { passwordHash: _pw, ...safeUser } = user
  res.json(safeUser)
}
