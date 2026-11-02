import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

// Supprime les comptes de démo créés par le seed (cliente + pros), en gardant l'admin.
// Sans --confirm, le script affiche seulement ce qu'il supprimerait.

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const DEMO_EMAILS = [
  'cliente@zuri.fr',
  'sophie.coiffure@zuri.fr',
  'camille.esthe@zuri.fr',
  'lea.nailart@zuri.fr',
  'marie.maquillage@zuri.fr',
  'julia.massage@zuri.fr',
  'ines.beaute@zuri.fr',
  'aicha.kone@zuri.fr',
]

const confirm = process.argv.includes('--confirm')

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true, proProfile: { select: { id: true } } },
  })
  const userIds = users.map((u) => u.id)
  const proIds = users.flatMap((u) => (u.proProfile ? [u.proProfile.id] : []))
  const productIds = (
    await prisma.product.findMany({ where: { proId: { in: proIds } }, select: { id: true } })
  ).map((p) => p.id)

  // Rendez-vous et commandes n'ont pas de suppression en cascade : on les retire d'abord
  const appointmentWhere = { OR: [{ clientId: { in: userIds } }, { proId: { in: proIds } }] }
  const orderItemWhere = { productId: { in: productIds } }
  const counts = {
    comptes: users.length,
    rendezVous: await prisma.appointment.count({ where: appointmentWhere }),
    commandesCliente: await prisma.order.count({ where: { clientId: { in: userIds } } }),
    lignesProduitsDemo: await prisma.orderItem.count({ where: orderItemWhere }),
  }

  console.log(`🧹 Comptes de démo trouvés : ${users.map((u) => u.email).join(', ') || 'aucun'}`)
  console.log('   À supprimer :', counts)

  if (!confirm) {
    console.log('\nAucune suppression (relancer avec --confirm pour supprimer).')
    return
  }

  const touchedOrderIds = (
    await prisma.orderItem.findMany({ where: orderItemWhere, select: { orderId: true } })
  ).map((i) => i.orderId)

  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({ where: appointmentWhere })
    await tx.order.deleteMany({ where: { clientId: { in: userIds } } })
    await tx.orderItem.deleteMany({ where: orderItemWhere })
    // Commandes d'autres clientes qui ne contenaient que des produits de démo
    await tx.order.deleteMany({ where: { id: { in: touchedOrderIds }, items: { none: {} } } })
    // Profils, prestations, disponibilités et produits suivent par cascade
    await tx.user.deleteMany({ where: { id: { in: userIds } } })
  })

  console.log('\n✅ Comptes de démo supprimés.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
