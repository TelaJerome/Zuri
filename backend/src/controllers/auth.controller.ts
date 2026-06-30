import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { signToken } from '../utils/jwt'
import { isValidSiret } from '../utils/siret'
import prisma from '../lib/prisma'

const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
})

const registerProSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  name: z.string().min(2),
  siret: z.string(),
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
  const { email, password, phone } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'Cet email est déjà utilisé' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, phone, role: Role.CLIENT },
  })

  const token = signToken({ userId: user.id, role: user.role })
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } })
}

export async function registerPro(req: Request, res: Response) {
  const parsed = registerProSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }
  const { email, password, phone, name, siret, city, specialties } = parsed.data

  if (!isValidSiret(siret)) {
    res.status(400).json({ message: 'Numéro SIRET invalide' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'Cet email est déjà utilisé' })
    return
  }

  const siretExists = await prisma.proProfile.findUnique({ where: { siret } })
  if (siretExists) {
    res.status(409).json({ message: 'Ce SIRET est déjà enregistré' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone,
      role: Role.PRO,
      proProfile: {
        create: { name, siret, city, specialties },
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
