import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
})

export async function createOrder(req: AuthRequest, res: Response) {
  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const { items } = parsed.data

  // Vérifie les stocks et récupère les prix actuels
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  })

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product) {
      res.status(400).json({ message: `Produit ${item.productId} introuvable` })
      return
    }
    if (product.stock < item.quantity) {
      res.status(400).json({ message: `Stock insuffisant pour "${product.name}"` })
      return
    }
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!
    return sum + product.price * item.quantity
  }, 0)

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        clientId: req.user!.userId,
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: products.find((p) => p.id === item.productId)!.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })

    // Décrémente les stocks
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return created
  })

  res.status(201).json(order)
}

export async function getMyOrders(req: AuthRequest, res: Response) {
  const orders = await prisma.order.findMany({
    where: { clientId: req.user!.userId },
    include: { items: { include: { product: { select: { name: true, photoUrl: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders)
}

export async function getOrderById(req: AuthRequest, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  })

  if (!order || order.clientId !== req.user!.userId) {
    res.status(404).json({ message: 'Commande introuvable' })
    return
  }
  res.json(order)
}
