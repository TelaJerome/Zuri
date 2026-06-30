import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../lib/api'
import { Appointment, ProProfile, Product } from '../types'
import { useAuthStore } from '../lib/store'
import { LABELS } from '../components/ui/SpecialtyBadge'

export default function ProDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'agenda' | 'profile' | 'products'>('agenda')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<ProProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.proProfile) setProfile(data.proProfile)
    })
    api.get<Appointment[]>('/appointments/pro').then(({ data }) => setAppointments(data))
    api.get<Product[]>('/products').then(({ data }) => {
      // Filtre sur les produits du pro courant
      const proId = user?.proProfile?.id
      if (proId) setProducts(data.filter((p: Product) => p.proId === proId))
    })
  }, [])

  const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'En attente', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Confirmé', class: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'Annulé', class: 'bg-red-50 text-red-700 border-red-200' },
  }

  async function confirm(id: string) {
    await api.patch(`/appointments/${id}/status`, { status: 'CONFIRMED' })
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'CONFIRMED' } : a)))
  }

  async function cancel(id: string) {
    await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' })
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a)))
  }

  const upcoming = appointments.filter((a) => new Date(a.date) >= new Date() && a.status !== 'CANCELLED')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl mb-1">Mon espace pro</h1>
        <p className="text-anthracite/60">{profile?.name} · {profile?.city}</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="font-serif text-3xl text-taupe">{upcoming.length}</p>
          <p className="text-xs text-anthracite/50 mt-1">RDV à venir</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-serif text-3xl text-taupe">{appointments.filter((a) => a.status === 'CONFIRMED').length}</p>
          <p className="text-xs text-anthracite/50 mt-1">Confirmés</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-serif text-3xl text-taupe">{products.length}</p>
          <p className="text-xs text-anthracite/50 mt-1">Produits</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['agenda', 'profile', 'products'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === t ? 'bg-taupe text-white border-taupe' : 'bg-white border-rose/50 text-anthracite'
            }`}
          >
            {t === 'agenda' ? 'Mon agenda' : t === 'profile' ? 'Mon profil' : 'Mes produits'}
          </button>
        ))}
      </div>

      {/* Agenda */}
      {tab === 'agenda' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <p className="text-center py-12 text-anthracite/40 font-serif text-xl">Aucun rendez-vous pour le moment</p>
          ) : (
            appointments.map((apt) => {
              const status = STATUS_LABELS[apt.status]
              return (
                <div key={apt.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{apt.service?.name}</p>
                      <p className="text-sm text-anthracite/60">
                        Cliente : {(apt.client as any)?.email}
                      </p>
                      <p className="text-sm font-medium text-taupe mt-1">
                        {format(new Date(apt.date), 'EEEE d MMMM', { locale: fr })} · {apt.startTime} → {apt.endTime}
                      </p>
                      {apt.notes && <p className="text-xs text-anthracite/50 mt-1 italic">"{apt.notes}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge border text-xs ${status.class}`}>{status.label}</span>
                      {apt.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => confirm(apt.id)} className="text-xs text-green-600 font-medium hover:underline">
                            Confirmer
                          </button>
                          <button onClick={() => cancel(apt.id)} className="text-xs text-red-500 hover:underline">
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && profile && (
        <ProfileEditor profile={profile} onSave={(p) => setProfile(p)} />
      )}

      {/* Products */}
      {tab === 'products' && (
        <ProductsManager proId={profile?.id || ''} />
      )}
    </div>
  )
}

function ProfileEditor({ profile, onSave }: { profile: ProProfile; onSave: (p: ProProfile) => void }) {
  const [form, setForm] = useState({ name: profile.name, bio: profile.bio || '', city: profile.city })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { data } = await api.put('/pros/me/profile', form)
    onSave(data)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-4">
        <h2 className="font-serif text-xl">Informations générales</h2>
        <div>
          <label className="label">Nom</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input h-24 resize-none" value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div>
          <label className="label">SIRET</label>
          <p className="text-sm text-anthracite/60 bg-pearl px-4 py-2.5 rounded-xl border border-rose/30">
            {profile.siret}
            {profile.siretVerified && (
              <span className="ml-2 text-green-600 text-xs">✓ Vérifié</span>
            )}
          </p>
        </div>
        <div>
          <label className="label">Spécialités</label>
          <div className="flex flex-wrap gap-2">
            {profile.specialties.map((s) => (
              <span key={s} className="badge bg-rose text-anthracite">{LABELS[s]}</span>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

function ProductsManager({ proId: _proId }: { proId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'SOIN', price: '', stock: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<Product[]>('/products').then(({ data }) => setProducts(data))
  }, [])

  async function create() {
    setSaving(true)
    try {
      const { data } = await api.post<Product>('/products', {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
      })
      setProducts((p) => [data, ...p])
      setShowForm(false)
      setForm({ name: '', category: 'SOIN', price: '', stock: '', description: '' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await api.delete(`/products/${id}`)
    setProducts((p) => p.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-xl">Mes produits</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs">
          + Ajouter un produit
        </button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nom du produit</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['SOIN', 'MAQUILLAGE', 'PARFUM', 'ACCESSOIRE', 'AUTRE'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prix (€)</label>
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input h-16 resize-none" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="btn-primary text-xs">
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Annuler</button>
          </div>
        </div>
      )}

      {products.map((p) => (
        <div key={p.id} className="card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{p.name}</p>
            <p className="text-xs text-anthracite/50">{p.category} · {p.price}€ · {p.stock} en stock</p>
          </div>
          <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-600">
            Supprimer
          </button>
        </div>
      ))}
    </div>
  )
}
