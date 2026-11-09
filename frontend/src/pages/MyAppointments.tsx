import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../lib/api'
import { Appointment } from '../types'
import { useOpenConversation } from '../lib/messages'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'En attente', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Confirmé', class: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Annulé', class: 'bg-red-50 text-red-700 border-red-200' },
}

// Nom, téléphone et réseaux de la cliente, visibles par les pros chez qui elle réserve ou à qui elle écrit
function MyInfoCard() {
  const [form, setForm] = useState({ name: '', phone: '', instagram: '', snapchat: '' })
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setForm({
        name: data.name ?? '', phone: data.phone ?? '',
        instagram: data.instagram ?? '', snapchat: data.snapchat ?? '',
      })
      // Comptes créés avant l'ajout du nom : on ouvre la section pour inviter à le compléter
      if (!data.name) setOpen(true)
    }).catch(() => {})
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const { data } = await api.put('/auth/me', form)
      setForm({ name: data.name ?? '', phone: data.phone ?? '', instagram: data.instagram ?? '', snapchat: data.snapchat ?? '' })
      setMessage({ ok: true, text: 'Informations enregistrées.' })
    } catch (err: any) {
      const fields = Object.keys(err.response?.data?.errors?.fieldErrors ?? {})
      const labels: Record<string, string> = { name: 'nom (2 caractères minimum)', instagram: 'pseudo Instagram', snapchat: 'pseudo Snapchat', phone: 'téléphone' }
      setMessage({
        ok: false,
        text: fields.length ? `Champ invalide : ${fields.map((f) => labels[f] ?? f).join(', ')}` : 'L\'enregistrement a échoué.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-5 mb-8">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between">
        <span className="font-serif text-xl">Mes informations</span>
        <span className="text-sm text-taupe">{open ? 'Fermer' : 'Modifier'}</span>
      </button>
      {!open && (
        <p className="text-sm text-anthracite/60 mt-1">
          {form.name || 'Nom non renseigné'}
          {form.instagram && ` · Instagram @${form.instagram}`}
          {form.snapchat && ` · Snapchat ${form.snapchat}`}
        </p>
      )}
      {open && (
        <form onSubmit={save} className="space-y-3 mt-4">
          {!form.name && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Ajoutez votre nom pour que les professionnelles vous reconnaissent.
            </p>
          )}
          <div>
            <label className="label">Prénom et nom</label>
            <input className="input" value={form.name} autoComplete="name" required minLength={2}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Téléphone <span className="text-anthracite/40 normal-case">(facultatif)</span></label>
            <input className="input" type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Instagram <span className="text-anthracite/40 normal-case">(facultatif)</span></label>
              <input className="input" placeholder="@pseudo" autoCapitalize="none" value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
            <div>
              <label className="label">Snapchat <span className="text-anthracite/40 normal-case">(facultatif)</span></label>
              <input className="input" placeholder="pseudo" autoCapitalize="none" value={form.snapchat}
                onChange={(e) => setForm({ ...form, snapchat: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-anthracite/50">
            Visibles uniquement par les professionnelles chez qui vous réservez ou à qui vous écrivez.
          </p>
          {message && (
            <p role="alert" className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
          )}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function MyAppointments() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const openConversation = useOpenConversation()

  useEffect(() => {
    setLoading(true)
    api.get<Appointment[]>(`/appointments/mine?upcoming=${tab === 'upcoming'}`).then(({ data }) => {
      setAppointments(data)
      setLoading(false)
    })
  }, [tab])

  async function cancel(id: string) {
    if (!confirm('Annuler ce rendez-vous ?')) return
    await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' })
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a)))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-8">Mes rendez-vous</h1>

      <MyInfoCard />

      <div className="flex gap-2 mb-6">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              tab === t ? 'bg-taupe text-white border-taupe' : 'bg-white border-rose/50 text-anthracite'
            }`}
          >
            {t === 'upcoming' ? 'À venir' : 'Passés'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-anthracite/40">
          <p className="font-serif text-2xl mb-2">Aucun rendez-vous</p>
          <p className="text-sm">
            {tab === 'upcoming' ? 'Réservez votre premier soin !' : 'Votre historique est vide.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const status = STATUS_LABELS[apt.status]
            return (
              <div key={apt.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{apt.service?.name}</p>
                    <p className="text-sm text-anthracite/60 mb-1">
                      avec {apt.pro?.name} · {apt.pro?.city} ·{' '}
                      <button
                        onClick={() => openConversation({ proId: apt.proId }).catch(() => {})}
                        className="text-taupe font-medium hover:underline"
                      >
                        Écrire
                      </button>
                    </p>
                    <p className="text-sm font-medium text-taupe">
                      {format(new Date(apt.date), 'EEEE d MMMM yyyy', { locale: fr })} à {apt.startTime}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge border text-xs ${status.class}`}>{status.label}</span>
                    {apt.status === 'PENDING' && tab === 'upcoming' && (
                      <button onClick={() => cancel(apt.id)} className="text-xs text-red-500 hover:underline">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
