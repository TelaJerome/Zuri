import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'

const productSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['SOIN', 'MAQUILLAGE', 'PARFUM', 'ACCESSOIRE', 'AUTRE']),
  price: z.number().positive(),
  description: z.string().optional(),
  stock: z.number().int().min(0).default(0),
})

export async function listProducts(req: Request, res: Response) {
  const { category, sort } = req.query

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category && { category: category as any }),
    },
    include: { pro: { select: { name: true, city: true } } },
    orderBy: sort === 'price_asc'
      ? { price: 'asc' }
      : sort === 'price_desc'
      ? { price: 'desc' }
      : { createdAt: 'desc' },
  })

  res.json(products)
}

export async function getProductById(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id, isActive: true },
    include: { pro: { select: { name: true, city: true, photoUrl: true } } },
  })
  if (!product) {
    res.status(404).json({ message: 'Produit introuvable' })
    return
  }
  res.json(product)
}

export async function createProduct(req: AuthRequest, res: Response) {
  const parsed = productSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!pro) {
    res.status(404).json({ message: 'Profil professionnel introuvable' })
    return
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, proId: pro.id },
  })
  res.status(201).json(product)
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const parsed = productSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })

  if (!product || product.proId !== pro?.id) {
    res.status(403).json({ message: 'Accès refusé' })
    return
  }

  const updated = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data })
  res.json(updated)
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })

  if (!product || product.proId !== pro?.id) {
    res.status(403).json({ message: 'Accès refusé' })
    return
  }

  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } })
  res.json({ message: 'Produit supprimé' })
}

export async function uploadProductPhoto(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ message: 'Aucun fichier envoyé' })
    return
  }

  const pro = await prisma.proProfile.findUnique({ where: { userId: req.user!.userId } })
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })

  if (!product || product.proId !== pro?.id) {
    res.status(403).json({ message: 'Accès refusé' })
    return
  }

  const photoUrl = `/uploads/${req.file.filename}`
  await prisma.product.update({ where: { id: req.params.id }, data: { photoUrl } })
  res.json({ photoUrl })
}
