import { User } from '../types'
import { MOCK_PROS } from './mockData'

// Comptes de démo utilisables sans backend
const MOCK_ACCOUNTS: { email: string; password: string; user: User }[] = [
  {
    email: 'cliente@zuri.fr',
    password: 'Test@1234',
    user: { id: 'u-client', email: 'cliente@zuri.fr', role: 'CLIENT' },
  },
  {
    email: 'admin@zuri.fr',
    password: 'Admin@1234',
    user: { id: 'u-admin', email: 'admin@zuri.fr', role: 'ADMIN' },
  },
  // Tous les pros du mock
  ...MOCK_PROS.map((pro) => ({
    email: `${pro.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@zuri.fr`,
    password: 'Pro@1234',
    user: {
      id: pro.userId,
      email: `${pro.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@zuri.fr`,
      role: 'PRO' as const,
      proProfile: pro,
    },
  })),
  // Compte explicite Aïcha
  {
    email: 'aicha.kone@zuri.fr',
    password: 'Pro@1234',
    user: {
      id: 'u7',
      email: 'aicha.kone@zuri.fr',
      role: 'PRO',
      proProfile: MOCK_PROS.find((p) => p.id === 'pro-7'),
    },
  },
]

export function mockLogin(email: string, password: string): User | null {
  const account = MOCK_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  )
  return account?.user ?? null
}
