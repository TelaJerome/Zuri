import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { User, Specialty } from '../types'
import { LABELS } from '../components/ui/SpecialtyBadge'

const SPECIALTIES: Specialty[] = ['COIFFURE', 'ESTHETIQUE', 'NAIL_ART', 'MASSAGE', 'MAQUILLAGE']

const FIELD_LABELS: Record<string, string> = {
  email: 'email',
  password: 'mot de passe (6 caractères minimum)',
  phone: 'téléphone',
  name: 'nom',
  siret: 'SIRET',
  city: 'ville',
  specialties: 'spécialité',
}

// Même contrôle que le backend : 14 chiffres + algorithme de Luhn
function isValidSiret(siret: string) {
  if (!/^\d{14}$/.test(siret)) return false
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i])
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

function errorMessage(err: any) {
  if (!err.response) return 'Le serveur ne répond pas, réessayez dans une minute.'
  const fields = Object.keys(err.response.data?.errors?.fieldErrors ?? {})
  if (fields.length) return `Champ invalide : ${fields.map((f) => FIELD_LABELS[f] ?? f).join(', ')}`
  return err.response.data?.message || 'Erreur lors de l\'inscription'
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const isPro = searchParams.get('role') === 'pro'
  const [role, setRole] = useState<'client' | 'pro'>(isPro ? 'pro' : 'client')

  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    name: '', siret: '', city: '',
  })
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  // Le formulaire pro est long : on ramène le message d'erreur dans l'écran
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  function toggle(s: Specialty) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (role === 'pro') {
      if (form.siret && !isValidSiret(form.siret)) {
        setError('Numéro SIRET invalide : vérifiez les 14 chiffres.')
        return
      }
      if (specialties.length === 0) {
        setError('Choisissez au moins une spécialité.')
        return
      }
    }
    setLoading(true)
    try {
      const endpoint = role === 'pro' ? '/auth/register/pro' : '/auth/register/client'
      const payload =
        role === 'pro'
          ? { ...form, specialties }
          : { email: form.email, password: form.password, phone: form.phone }

      const { data } = await api.post<{ token: string; user: User }>(endpoint, payload)
      setAuth(data.user, data.token)
      navigate(role === 'pro' ? '/pro/dashboard' : '/')
    } catch (err: any) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl mb-2">Créer un compte</h1>
          <p className="text-anthracite/50 text-sm">Rejoignez la communauté Zuri</p>
        </div>

        {/* Toggle rôle */}
        <div className="flex rounded-xl border border-rose/50 p-1 mb-6 bg-white">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              role === 'client' ? 'bg-taupe text-white' : 'text-anthracite/60 hover:text-anthracite'
            }`}
          >
            Je suis cliente
          </button>
          <button
            type="button"
            onClick={() => setRole('pro')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              role === 'pro' ? 'bg-taupe text-white' : 'text-anthracite/60 hover:text-anthracite'
            }`}
          >
            Je suis professionnelle
          </button>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required placeholder="votre@email.fr"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" required minLength={6} placeholder="Minimum 6 caractères"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input type="tel" className="input" placeholder="06 00 00 00 00"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            {role === 'pro' && (
              <>
                <div>
                  <label className="label">Nom complet / Nom de votre activité</label>
                  <input type="text" className="input" required placeholder="Sophie Martin"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Ville</label>
                  <input type="text" className="input" required placeholder="Paris"
                    value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="label">
                    Numéro SIRET <span className="text-anthracite/40 normal-case">(facultatif)</span>
                  </label>
                  <input type="text" className="input" inputMode="numeric" placeholder="14 chiffres"
                    maxLength={14}
                    value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value.replace(/\s/g, '') })} />
                  <p className="text-xs text-anthracite/50 mt-1.5">
                    Vous pourrez l'ajouter plus tard dans votre espace pro. Il n'est jamais affiché aux clientes.
                    Pas encore de SIRET ?{' '}
                    <a
                      href="https://www.autoentrepreneur.urssaf.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-taupe underline"
                    >
                      Créez votre statut auto-entrepreneur →
                    </a>
                  </p>
                </div>
                <div>
                  <label className="label">Spécialité(s)</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggle(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          specialties.includes(s)
                            ? 'bg-taupe text-white border-taupe'
                            : 'bg-white border-rose/50 text-anthracite hover:border-taupe'
                        }`}
                      >
                        {LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div ref={errorRef} role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-anthracite/50 mt-6">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-taupe font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
