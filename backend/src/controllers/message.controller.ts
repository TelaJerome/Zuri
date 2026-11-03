import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'

const startSchema = z.object({
  proId: z.string().optional(),
  clientId: z.string().optional(),
})

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

// Ce que chaque côté voit de l'autre : jamais la fiche complète de l'utilisatrice
const conversationInclude = {
  client: { select: { id: true, email: true } },
  pro: { select: { id: true, name: true, photoUrl: true, city: true } },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
}

async function proIdOf(userId: string) {
  const pro = await prisma.proProfile.findUnique({ where: { userId }, select: { id: true } })
  return pro?.id ?? null
}

// Renvoie la conversation si l'utilisatrice en fait partie, sinon null
async function findOwnConversation(req: AuthRequest, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation) return null
  const { userId, role } = req.user!
  if (role === 'CLIENT' && conversation.clientId === userId) return conversation
  if (role === 'PRO' && conversation.proId === (await proIdOf(userId))) return conversation
  return null
}

export async function listConversations(req: AuthRequest, res: Response) {
  const { userId, role } = req.user!
  const where = role === 'PRO' ? { proId: (await proIdOf(userId)) ?? '' } : { clientId: userId }

  const conversations = await prisma.conversation.findMany({
    where,
    include: conversationInclude,
    orderBy: { lastMessageAt: 'desc' },
  })

  const unread = await prisma.message.groupBy({
    by: ['conversationId'],
    where: { conversation: where, senderId: { not: userId }, readAt: null },
    _count: true,
  })
  const unreadById = new Map(unread.map((u) => [u.conversationId, u._count]))

  res.json(
    conversations.map(({ messages, ...c }) => ({
      ...c,
      lastMessage: messages[0] ?? null,
      unreadCount: unreadById.get(c.id) ?? 0,
    }))
  )
}

export async function unreadCount(req: AuthRequest, res: Response) {
  const { userId, role } = req.user!
  const conversation = role === 'PRO' ? { proId: (await proIdOf(userId)) ?? '' } : { clientId: userId }
  const count = await prisma.message.count({
    where: { conversation, senderId: { not: userId }, readAt: null },
  })
  res.json({ count })
}

// Ouvre (ou retrouve) le fil avec une pro (côté cliente) ou une cliente (côté pro)
export async function startConversation(req: AuthRequest, res: Response) {
  const parsed = startSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides' })
    return
  }
  const { userId, role } = req.user!
  let clientId: string
  let proId: string

  if (role === 'CLIENT') {
    const pro = parsed.data.proId
      ? await prisma.proProfile.findUnique({ where: { id: parsed.data.proId } })
      : null
    if (!pro || !pro.isActive) {
      res.status(404).json({ message: 'Professionnelle introuvable' })
      return
    }
    clientId = userId
    proId = pro.id
  } else {
    const ownProId = await proIdOf(userId)
    if (!ownProId || !parsed.data.clientId) {
      res.status(400).json({ message: 'Cliente introuvable' })
      return
    }
    // Une pro ne peut écrire en premier qu'à une cliente qui a pris rendez-vous chez elle
    const hasAppointment = await prisma.appointment.findFirst({
      where: { proId: ownProId, clientId: parsed.data.clientId },
      select: { id: true },
    })
    if (!hasAppointment) {
      res.status(403).json({ message: 'Vous ne pouvez écrire qu\'à une cliente qui a réservé chez vous' })
      return
    }
    clientId = parsed.data.clientId
    proId = ownProId
  }

  const conversation = await prisma.conversation.upsert({
    where: { clientId_proId: { clientId, proId } },
    update: {},
    create: { clientId, proId },
    include: conversationInclude,
  })
  const { messages, ...rest } = conversation
  res.status(201).json({ ...rest, lastMessage: messages[0] ?? null, unreadCount: 0 })
}

export async function getMessages(req: AuthRequest, res: Response) {
  const conversation = await findOwnConversation(req, req.params.id)
  if (!conversation) {
    res.status(404).json({ message: 'Conversation introuvable' })
    return
  }

  // Ouvrir le fil marque comme lus les messages de l'autre personne
  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderId: { not: req.user!.userId }, readAt: null },
    data: { readAt: new Date() },
  })

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 500,
  })
  res.json(messages)
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Le message doit faire entre 1 et 2000 caractères' })
    return
  }
  const conversation = await findOwnConversation(req, req.params.id)
  if (!conversation) {
    res.status(404).json({ message: 'Conversation introuvable' })
    return
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: conversation.id, senderId: req.user!.userId, body: parsed.data.body },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ])
  res.status(201).json(message)
}
