import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function listProsAdmin(_req: Request, res: Response) {
  const pros = await prisma.proProfile.findMany({
    // Jamais le hash du mot de passe, même pour l'admin
    include: { user: { select: { id: true, email: true, phone: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(pros)
}

export async function toggleProStatus(req: Request, res: Response) {
  const { isActive } = req.body
  if (typeof isActive !== 'boolean') {
    res.status(400).json({ message: 'isActive (boolean) requis' })
    return
  }

  const pro = await prisma.proProfile.update({
    where: { id: req.params.id },
    data: { isActive },
  })
  res.json(pro)
}

export async function verifySiret(req: Request, res: Response) {
  const existing = await prisma.proProfile.findUnique({ where: { id: req.params.id }, select: { siret: true } })
  if (!existing?.siret) {
    res.status(400).json({ message: 'Cette professionnelle n\'a pas renseigné de SIRET' })
    return
  }
  const pro = await prisma.proProfile.update({
    where: { id: req.params.id },
    data: { siretVerified: true },
  })
  res.json(pro)
}
