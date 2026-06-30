import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../lib/api'
import { Appointment } from '../types'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'En attente', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Confirmé', class: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Annulé', class: 'bg-red-50 text-red-700 border-red-200' },
}

export default function MyAppointments() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

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
                    <p className="text-sm text-anthracite/60 mb-1">avec {apt.pro?.name} · {apt.pro?.city}</p>
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
