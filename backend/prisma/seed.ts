import 'dotenv/config'
import { Role, Specialty, ProductCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seed en cours...')

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@beaute.fr' },
    update: {},
    create: {
      email: 'admin@beaute.fr',
      passwordHash: await bcrypt.hash('Admin@1234', 10),
      role: Role.ADMIN,
    },
  })

  // Client de test
  await prisma.user.upsert({
    where: { email: 'cliente@test.fr' },
    update: {},
    create: {
      email: 'cliente@test.fr',
      passwordHash: await bcrypt.hash('Test@1234', 10),
      phone: '0601020304',
      role: Role.CLIENT,
    },
  })

  const pros = [
    {
      email: 'sophie.coiffure@beaute.fr',
      name: 'Sophie Martin',
      city: 'Paris',
      siret: '73282932000074',
      specialties: [Specialty.COIFFURE],
      bio: 'Coiffeuse passionnée avec 10 ans d\'expérience. Spécialisée en colorations végétales et coupes tendance.',
      rating: 4.8,
      services: [
        { name: 'Coupe femme', price: 45, durationMinutes: 45 },
        { name: 'Coloration complète', price: 85, durationMinutes: 90 },
        { name: 'Balayage', price: 110, durationMinutes: 120 },
        { name: 'Brushing', price: 30, durationMinutes: 30 },
      ],
      availabilities: [
        { dayOfWeek: 0, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      ],
      products: [
        { name: 'Shampoing éclat couleur', category: ProductCategory.SOIN, price: 18, stock: 20, description: 'Protège et sublime les colorations' },
        { name: 'Masque réparateur intense', category: ProductCategory.SOIN, price: 24, stock: 15, description: 'Soin profond pour cheveux abîmés' },
      ],
    },
    {
      email: 'camille.esthe@beaute.fr',
      name: 'Camille Dubois',
      city: 'Lyon',
      siret: '80263460900019',
      specialties: [Specialty.ESTHETIQUE, Specialty.MASSAGE],
      bio: 'Esthéticienne diplomée et masseuse bien-être. Je propose des soins du visage personnalisés et des massages relaxants.',
      rating: 4.9,
      services: [
        { name: 'Soin visage hydratant', price: 65, durationMinutes: 60 },
        { name: 'Épilation jambes complètes', price: 40, durationMinutes: 45 },
        { name: 'Massage relaxant', price: 70, durationMinutes: 60 },
        { name: 'Massage aux pierres chaudes', price: 90, durationMinutes: 75 },
      ],
      availabilities: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '19:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' },
      ],
      products: [
        { name: 'Huile de massage relaxante', category: ProductCategory.SOIN, price: 22, stock: 12, description: 'Mélange d\'huiles essentielles apaisantes' },
        { name: 'Crème visage hydratante SPF30', category: ProductCategory.SOIN, price: 35, stock: 8, description: 'Protection solaire et hydratation quotidienne' },
      ],
    },
    {
      email: 'lea.nailart@beaute.fr',
      name: 'Léa Fontaine',
      city: 'Bordeaux',
      siret: '51234567800017',
      specialties: [Specialty.NAIL_ART],
      bio: 'Nail artist créative, spécialisée en gel, résine et nail art personnalisé. Chaque ongle est une œuvre d\'art !',
      rating: 5.0,
      services: [
        { name: 'Pose gel couleur', price: 55, durationMinutes: 60 },
        { name: 'Nail art (par ongle)', price: 5, durationMinutes: 10 },
        { name: 'Remplissage gel', price: 40, durationMinutes: 45 },
        { name: 'Semi-permanent', price: 35, durationMinutes: 45 },
      ],
      availabilities: [
        { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' },
      ],
      products: [
        { name: 'Kit vernis semi-permanent', category: ProductCategory.SOIN, price: 28, stock: 10, description: 'Set de 3 couleurs tendance + base et top coat' },
        { name: 'Lime à ongles professionnelle', category: ProductCategory.ACCESSOIRE, price: 8, stock: 30, description: 'Grain 180/240, idéale pour la maison' },
      ],
    },
    {
      email: 'marie.maquillage@beaute.fr',
      name: 'Marie Leclerc',
      city: 'Paris',
      siret: '40483304800023',
      specialties: [Specialty.MAQUILLAGE],
      bio: 'Maquilleuse professionnelle pour mariages, shootings et événements. Je sublime votre beauté naturelle.',
      rating: 4.7,
      services: [
        { name: 'Maquillage mariée', price: 150, durationMinutes: 90 },
        { name: 'Maquillage soirée', price: 80, durationMinutes: 60 },
        { name: 'Cours de maquillage', price: 95, durationMinutes: 90 },
        { name: 'Maquillage naturel', price: 60, durationMinutes: 45 },
      ],
      availabilities: [
        { dayOfWeek: 0, startTime: '08:00', endTime: '20:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '20:00' },
        { dayOfWeek: 6, startTime: '08:00', endTime: '20:00' },
      ],
      products: [
        { name: 'Fond de teint longue tenue', category: ProductCategory.MAQUILLAGE, price: 42, stock: 6, description: 'Tenue 24h, fini naturel, 30 teintes disponibles' },
        { name: 'Palette fards à paupières', category: ProductCategory.MAQUILLAGE, price: 55, stock: 4, description: '12 teintes nude et smoky' },
        { name: 'Fixateur maquillage', category: ProductCategory.MAQUILLAGE, price: 19, stock: 15, description: 'Brume fixatrice longue durée' },
      ],
    },
    {
      email: 'julia.massage@beaute.fr',
      name: 'Julia Renard',
      city: 'Marseille',
      siret: '61234567800011',
      specialties: [Specialty.MASSAGE],
      bio: 'Masseuse bien-être certifiée en massages suédois, balinais et drainage lymphatique. Détente garantie.',
      rating: 4.6,
      services: [
        { name: 'Massage suédois 1h', price: 75, durationMinutes: 60 },
        { name: 'Massage balinais', price: 85, durationMinutes: 75 },
        { name: 'Drainage lymphatique', price: 90, durationMinutes: 60 },
        { name: 'Massage dos et nuque', price: 45, durationMinutes: 30 },
      ],
      availabilities: [
        { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      ],
      products: [
        { name: 'Huile de coco bio', category: ProductCategory.SOIN, price: 14, stock: 25, description: 'Idéale pour l\'hydratation et le massage' },
        { name: 'Sel de bain relaxant', category: ProductCategory.SOIN, price: 16, stock: 18, description: 'Aux huiles essentielles de lavande et eucalyptus' },
      ],
    },
    {
      email: 'inès.beaute@beaute.fr',
      name: 'Inès Benali',
      city: 'Toulouse',
      siret: '71234567800015',
      specialties: [Specialty.COIFFURE, Specialty.ESTHETIQUE],
      bio: 'Experte en beauté globale : coiffure afro et texturée, soins visage et corps. Beauté inclusive, tous types de cheveux et de peaux.',
      rating: 4.9,
      services: [
        { name: 'Coiffure afro (nattes)', price: 80, durationMinutes: 120 },
        { name: 'Soin cheveux bouclés', price: 55, durationMinutes: 60 },
        { name: 'Soin visage éclat', price: 60, durationMinutes: 50 },
        { name: 'Épilation sourcils + lèvres', price: 20, durationMinutes: 20 },
      ],
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '16:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' },
      ],
      products: [
        { name: 'Crème coiffante boucles', category: ProductCategory.SOIN, price: 20, stock: 14, description: 'Définit et hydrate les cheveux bouclés et frisés' },
        { name: 'Sérum éclat peau noire', category: ProductCategory.SOIN, price: 38, stock: 7, description: 'Unifie le teint et atténue les taches' },
      ],
    },
  ]

  for (const pro of pros) {
    const user = await prisma.user.upsert({
      where: { email: pro.email },
      update: {},
      create: {
        email: pro.email,
        passwordHash: await bcrypt.hash('Pro@1234', 10),
        role: Role.PRO,
      },
    })

    const profile = await prisma.proProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: pro.name,
        city: pro.city,
        siret: pro.siret,
        siretVerified: true,
        specialties: pro.specialties,
        bio: pro.bio,
        rating: pro.rating,
        isActive: true,
      },
    })

    // Recrée les services et disponibilités
    await prisma.service.deleteMany({ where: { proId: profile.id } })
    await prisma.service.createMany({
      data: pro.services.map((s) => ({ ...s, proId: profile.id })),
    })

    await prisma.availability.deleteMany({ where: { proId: profile.id } })
    await prisma.availability.createMany({
      data: pro.availabilities.map((a) => ({ ...a, proId: profile.id })),
    })

    await prisma.product.deleteMany({ where: { proId: profile.id } })
    await prisma.product.createMany({
      data: pro.products.map((p) => ({ ...p, proId: profile.id, isActive: true })),
    })

    console.log(`  ✓ ${pro.name} (${pro.city})`)
  }

  console.log('\n✅ Seed terminé !')
  console.log('\nComptes de test :')
  console.log('  Admin   : admin@beaute.fr / Admin@1234')
  console.log('  Cliente : cliente@test.fr / Test@1234')
  console.log('  Pros    : <email_pro> / Pro@1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
