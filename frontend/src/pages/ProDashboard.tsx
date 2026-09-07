import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../lib/api'
import { Appointment, Availability, ProProfile, Product, Service, UnavailablePeriod } from '../types'
import { useAuthStore } from '../lib/store'
import { LABELS } from '../components/ui/SpecialtyBadge'

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function ProDashboard() {
  const { user, setAuth } = useAuthStore()
  const [tab, setTab] = useState<'agenda' | 'profile' | 'products'>('agenda')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<ProProfile | null>(user?.proProfile || null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => { if (data.proProfile) setProfile(data.proProfile) })
      .catch(() => { if (user?.proProfile) setProfile(user.proProfile) })

    api.get<Appointment[]>('/appointments/pro')
      .then(({ data }) => setAppointments(data))
      .catch(() => {})

    api.get<Product[]>('/products')
      .then(({ data }) => {
        const proId = user?.proProfile?.id
        if (proId) setProducts(data.filter((p: Product) => p.proId === proId))
      })
      .catch(() => {
        if (user?.proProfile?.products) setProducts(user.proProfile.products as Product[])
      })
  }, [])

  const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'En attente', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Confirmé', class: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'Annulé', class: 'bg-red-50 text-red-700 border-red-200' },
  }

  const upcoming = appointments.filter((a) => new Date(a.date) >= new Date() && a.status !== 'CANCELLED')

  function handleProfileSave(updated: ProProfile) {
    setProfile(updated)
    if (user) setAuth({ ...user, proProfile: updated }, localStorage.getItem('zuri_token') || '')
  }

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
          <p className="font-serif text-3xl text-taupe">{profile?.services?.length || 0}</p>
          <p className="text-xs text-anthracite/50 mt-1">Prestations</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-serif text-3xl text-taupe">{products.length}</p>
          <p className="text-xs text-anthracite/50 mt-1">Produits</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['agenda', 'profile', 'products'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === t ? 'bg-taupe text-white border-taupe' : 'bg-white border-rose/50 text-anthracite'
            }`}
          >
            {t === 'agenda' ? 'Mon agenda' : t === 'profile' ? 'Mon profil & prestations' : 'Mes produits'}
          </button>
        ))}
      </div>

      {/* Agenda */}
      {tab === 'agenda' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-2xl text-anthracite/30 mb-2">Aucun rendez-vous</p>
              <p className="text-sm text-anthracite/40">Les réservations apparaîtront ici</p>
            </div>
          ) : (
            appointments.map((apt) => {
              const status = STATUS_LABELS[apt.status]
              return (
                <div key={apt.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{apt.service?.name}</p>
                      <p className="text-sm text-anthracite/60">Cliente : {(apt.client as any)?.email}</p>
                      <p className="text-sm font-medium text-taupe mt-1">
                        {format(new Date(apt.date), 'EEEE d MMMM', { locale: fr })} · {apt.startTime} → {apt.endTime}
                      </p>
                      {apt.notes && <p className="text-xs text-anthracite/50 mt-1 italic">"{apt.notes}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge border text-xs ${status.class}`}>{status.label}</span>
                      {apt.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => api.patch(`/appointments/${apt.id}/status`, { status: 'CONFIRMED' }).then(() =>
                              setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'CONFIRMED' } : a))
                            )}
                            className="text-xs text-green-600 font-medium hover:underline"
                          >Confirmer</button>
                          <button
                            onClick={() => api.patch(`/appointments/${apt.id}/status`, { status: 'CANCELLED' }).then(() =>
                              setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'CANCELLED' } : a))
                            )}
                            className="text-xs text-red-500 hover:underline"
                          >Refuser</button>
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

      {/* Profile + Prestations */}
      {tab === 'profile' && profile && (
        <ProfileEditor profile={profile} onSave={handleProfileSave} />
      )}

      {/* Products */}
      {tab === 'products' && (
        <ProductsManager initialProducts={products} />
      )}
    </div>
  )
}

// ─── Photo upload helper ─────────────────────────────────────────────────────

function PhotoUpload({
  current,
  onSelect,
  size = 'lg',
  label = 'Changer la photo',
}: {
  current?: string | null
  onSelect: (url: string) => void
  size?: 'sm' | 'lg'
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onSelect(url)
    // En mode réel : upload vers le backend
    const formData = new FormData()
    formData.append('photo', file)
    api.post('/pros/me/photo', formData).then(({ data }) => onSelect(data.photoUrl)).catch(() => {})
  }

  const sz = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16'
  const iconSz = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sz} rounded-2xl bg-rose/30 overflow-hidden cursor-pointer relative group border-2 border-rose/50 hover:border-taupe transition-colors`}
        onClick={() => ref.current?.click()}
      >
        {current ? (
          <img src={current} alt="Photo de profil" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className={`${iconSz} text-taupe/40`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-anthracite/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      <button type="button" onClick={() => ref.current?.click()} className="text-xs text-taupe hover:underline font-medium">
        {label}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ─── Profile Editor ───────────────────────────────────────────────────────────

function ProfileEditor({ profile, onSave }: { profile: ProProfile; onSave: (p: ProProfile) => void }) {
  const [form, setForm] = useState({
    name: profile.name,
    bio: profile.bio || '',
    city: profile.city,
    photoUrl: profile.photoUrl || '',
  })
  const [services, setServices] = useState<Service[]>(profile.services || [])
  const [availabilities, setAvailabilities] = useState<Availability[]>(
    (profile as any).availabilities || []
  )
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>(
    profile.unavailableDates || []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleDay(day: number) {
    setAvailabilities(prev => {
      if (prev.find(a => a.dayOfWeek === day)) return prev.filter(a => a.dayOfWeek !== day)
      return [...prev, { id: `new-${day}`, proId: profile.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00' }].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    })
  }

  function updateDayTime(day: number, field: 'startTime' | 'endTime', value: string) {
    setAvailabilities(prev => prev.map(a => a.dayOfWeek === day ? { ...a, [field]: value } : a))
  }

  function updateService(index: number, field: keyof Service, value: string | number) {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function addService() {
    const newService: Service = {
      id: `new-${Date.now()}`,
      proId: profile.id,
      name: '',
      price: 0,
      durationMinutes: 60,
      description: '',
    }
    setServices(prev => [...prev, newService])
  }

  function removeService(index: number) {
    setServices(prev => prev.filter((_, i) => i !== index))
  }

  function handleServicePhoto(index: number, url: string) {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, photoUrl: url } : s))
  }

  async function save() {
    setSaving(true)
    try {
      await api.put('/pros/me/profile', { name: form.name, bio: form.bio, city: form.city })
      await api.put('/pros/me/services', services.map(s => ({
        name: s.name, price: s.price, durationMinutes: s.durationMinutes, description: s.description,
      })))
      await api.put('/pros/me/availabilities', availabilities)
      await api.put('/pros/me/unavailable-periods', unavailablePeriods.map(p => ({
        startDate: p.startDate, endDate: p.endDate, reason: p.reason,
      })))
    } catch {}
    const updated = { ...profile, ...form, services, availabilities, unavailableDates: unavailablePeriods }
    onSave(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setSaving(false)
  }

  return (
    <div className="space-y-6">

      {/* Photo de profil */}
      <div className="card p-6">
        <h2 className="font-serif text-xl mb-5">Photo de profil</h2>
        <PhotoUpload
          current={form.photoUrl}
          onSelect={(url) => setForm(f => ({ ...f, photoUrl: url }))}
          size="lg"
          label="Cliquer pour changer la photo"
        />
      </div>

      {/* Infos générales */}
      <div className="card p-6 space-y-4">
        <h2 className="font-serif text-xl">Informations générales</h2>
        <div>
          <label className="label">Nom affiché</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input h-28 resize-none" value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Parlez de votre expérience, vos spécialités..."
          />
        </div>
        <div>
          <label className="label">SIRET</label>
          <p className="text-sm text-anthracite/60 bg-pearl px-4 py-2.5 rounded-xl border border-rose/30">
            {profile.siret}
            {profile.siretVerified && <span className="ml-2 text-green-600 text-xs">✓ Vérifié</span>}
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
      </div>

      {/* Prestations */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl">Mes prestations</h2>
          <button type="button" onClick={addService} className="btn-primary text-xs">
            + Ajouter une prestation
          </button>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-anthracite/40 text-center py-6">
            Aucune prestation — cliquez sur "+ Ajouter" pour commencer
          </p>
        ) : (
          <div className="space-y-4">
            {services.map((service, i) => (
              <div key={service.id} className="border border-rose/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-4">
                  {/* Photo prestation */}
                  <div className="flex-shrink-0">
                    <PhotoUpload
                      current={(service as any).photoUrl}
                      onSelect={(url) => handleServicePhoto(i, url)}
                      size="sm"
                      label="Photo"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="label">Nom de la prestation</label>
                      <input
                        className="input"
                        placeholder="ex : Soin visage hydratant"
                        value={service.name}
                        onChange={(e) => updateService(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Prix (€)</label>
                        <input
                          type="number"
                          className="input"
                          value={service.price}
                          onChange={(e) => updateService(i, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="label">Durée (min)</label>
                        <input
                          type="number"
                          className="input"
                          value={service.durationMinutes}
                          onChange={(e) => updateService(i, 'durationMinutes', parseInt(e.target.value) || 30)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Description (optionnel)</label>
                      <input
                        className="input"
                        placeholder="Détails de la prestation..."
                        value={service.description || ''}
                        onChange={(e) => updateService(i, 'description', e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disponibilités */}
      <div className="card p-6">
        <h2 className="font-serif text-xl mb-5">Mes disponibilités</h2>
        <p className="text-xs text-anthracite/50 mb-4">Cochez les jours où vous travaillez et définissez vos horaires.</p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const avail = availabilities.find(a => a.dayOfWeek === day)
            const active = !!avail
            return (
              <div key={day} className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-colors ${active ? 'border-taupe/40 bg-cream' : 'border-rose/20 bg-white'}`}>
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${active ? 'bg-taupe' : 'bg-rose/40'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className={`w-20 text-sm font-medium flex-shrink-0 ${active ? 'text-anthracite' : 'text-anthracite/40'}`}>
                  {DAYS[day]}
                </span>
                {active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={avail!.startTime}
                      onChange={(e) => updateDayTime(day, 'startTime', e.target.value)}
                      className="input py-1.5 text-sm w-28"
                    />
                    <span className="text-anthracite/40 text-sm">→</span>
                    <input
                      type="time"
                      value={avail!.endTime}
                      onChange={(e) => updateDayTime(day, 'endTime', e.target.value)}
                      className="input py-1.5 text-sm w-28"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-anthracite/30 italic">Repos</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Plages d'indisponibilité */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl">Congés & indisponibilités</h2>
            <p className="text-xs text-anthracite/50 mt-1">Bloquez une période entière (vacances, formation, etc.)</p>
          </div>
          <button
            type="button"
            onClick={() => setUnavailablePeriods(prev => [...prev, {
              id: `new-${Date.now()}`, proId: profile.id,
              startDate: format(new Date(), 'yyyy-MM-dd'),
              endDate: format(new Date(), 'yyyy-MM-dd'),
              reason: '',
            }])}
            className="btn-primary text-xs"
          >
            + Ajouter
          </button>
        </div>

        {unavailablePeriods.length === 0 ? (
          <p className="text-sm text-anthracite/40 text-center py-4">Aucune période bloquée</p>
        ) : (
          <div className="space-y-3">
            {unavailablePeriods.map((period, i) => (
              <div key={period.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Du</label>
                    <input
                      type="date"
                      value={period.startDate}
                      onChange={(e) => setUnavailablePeriods(prev => prev.map((p, j) => j === i ? { ...p, startDate: e.target.value } : p))}
                      className="input py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Au</label>
                    <input
                      type="date"
                      value={period.endDate}
                      min={period.startDate}
                      onChange={(e) => setUnavailablePeriods(prev => prev.map((p, j) => j === i ? { ...p, endDate: e.target.value } : p))}
                      className="input py-1.5 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="input py-1.5 text-sm"
                      placeholder="Raison (optionnel) : vacances, formation..."
                      value={period.reason || ''}
                      onChange={(e) => setUnavailablePeriods(prev => prev.map((p, j) => j === i ? { ...p, reason: e.target.value } : p))}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUnavailablePeriods(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton save */}
      <button onClick={save} disabled={saving} className="btn-primary w-full py-3">
        {saving ? 'Enregistrement...' : saved ? '✓ Enregistré !' : 'Enregistrer toutes les modifications'}
      </button>
    </div>
  )
}

// ─── Products Manager ─────────────────────────────────────────────────────────

function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'SOIN', price: '', stock: '', description: '', photoUrl: '' })
  const [saving, setSaving] = useState(false)

  async function create() {
    setSaving(true)
    const newProduct: Product = {
      id: `local-${Date.now()}`,
      proId: '',
      name: form.name,
      category: form.category as any,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      description: form.description,
      photoUrl: form.photoUrl || undefined,
      isActive: true,
    }
    try {
      const { data } = await api.post<Product>('/products', {
        name: form.name, category: form.category,
        price: parseFloat(form.price), stock: parseInt(form.stock), description: form.description,
      })
      setProducts(p => [data, ...p])
    } catch {
      setProducts(p => [newProduct, ...p])
    }
    setShowForm(false)
    setForm({ name: '', category: 'SOIN', price: '', stock: '', description: '', photoUrl: '' })
    setSaving(false)
  }

  function remove(id: string) {
    api.delete(`/products/${id}`).catch(() => {})
    setProducts(p => p.filter(x => x.id !== id))
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
        <div className="card p-5 space-y-4">
          <h3 className="font-medium text-sm">Nouveau produit</h3>

          {/* Photo produit */}
          <div className="flex justify-center">
            <PhotoUpload
              current={form.photoUrl}
              onSelect={(url) => setForm(f => ({ ...f, photoUrl: url }))}
              size="lg"
              label="Ajouter une photo"
            />
          </div>

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
              <input type="number" className="input" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" className="input" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} />
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

      {products.length === 0 && !showForm ? (
        <div className="text-center py-12 text-anthracite/40">
          <p className="font-serif text-xl mb-1">Aucun produit</p>
          <p className="text-sm">Ajoutez vos premiers produits à vendre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-rose/20 overflow-hidden flex-shrink-0">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-taupe/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-anthracite/50">{p.category} · {p.price}€ · {p.stock} en stock</p>
              </div>
              <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
