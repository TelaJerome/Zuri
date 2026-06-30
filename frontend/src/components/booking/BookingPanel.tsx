import { useState } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ProProfile, Service, TimeSlot } from '../../types'
import { useAuthStore } from '../../lib/store'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'

interface Props {
  pro: ProProfile
}

export default function BookingPanel({ pro }: Props) {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const today = startOfDay(new Date())
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1))

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    const dateStr = format(date, 'yyyy-MM-dd')
    const { data } = await api.get<TimeSlot[]>(`/pros/${pro.id}/slots?date=${dateStr}`)
    setSlots(data)
  }

  async function handleBook() {
    if (!selectedService || !selectedDate || !selectedSlot) return
    if (!user) {
      navigate('/connexion')
      return
    }
    setLoading(true)
    try {
      await api.post('/appointments', {
        proId: pro.id,
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedSlot,
        notes: notes || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la réservation')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card p-6 text-center">
        <div className="w-12 h-12 bg-rose rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-xl mb-2">Rendez-vous réservé !</h3>
        <p className="text-sm text-anthracite/60 mb-4">
          Votre demande a été envoyée à {pro.name}. Vous recevrez une confirmation prochainement.
        </p>
        <button onClick={() => navigate('/mes-rendez-vous')} className="btn-primary">
          Voir mes rendez-vous
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-6">
      <h2 className="font-serif text-xl">Prendre rendez-vous</h2>

      {/* Choix prestation */}
      <div>
        <label className="label">Prestation</label>
        <div className="space-y-2">
          {pro.services?.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedService(s)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                selectedService?.id === s.id
                  ? 'border-taupe bg-cream'
                  : 'border-rose/30 hover:border-taupe/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{s.name}</span>
                <span className="text-taupe font-semibold">{s.price}€</span>
              </div>
              <span className="text-xs text-anthracite/50">{s.durationMinutes} min</span>
            </button>
          ))}
        </div>
      </div>

      {/* Choix date */}
      {selectedService && (
        <div>
          <label className="label">Date</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.map((date) => {
              const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateSelect(date)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs transition-all ${
                    isSelected ? 'border-taupe bg-cream' : 'border-rose/30 hover:border-taupe/50'
                  }`}
                >
                  <span className="text-anthracite/50 capitalize">
                    {format(date, 'EEE', { locale: fr })}
                  </span>
                  <span className="font-semibold text-sm">{format(date, 'd')}</span>
                  <span className="text-anthracite/50">{format(date, 'MMM', { locale: fr })}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Créneaux */}
      {selectedDate && (
        <div>
          <label className="label">Créneau</label>
          {slots.length === 0 ? (
            <p className="text-sm text-anthracite/50">Aucune disponibilité ce jour</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                  disabled={!slot.available}
                  className={`py-2 rounded-xl border text-sm transition-all ${
                    !slot.available
                      ? 'border-rose/20 text-anthracite/30 bg-rose/10 cursor-not-allowed line-through'
                      : selectedSlot === slot.time
                      ? 'border-taupe bg-cream font-medium'
                      : 'border-rose/30 hover:border-taupe/50'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {selectedSlot && (
        <div>
          <label className="label">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Précisions sur votre demande..."
            className="input resize-none h-20"
          />
        </div>
      )}

      {/* Bouton réserver */}
      <button
        onClick={handleBook}
        disabled={!selectedService || !selectedDate || !selectedSlot || loading}
        className="btn-primary w-full"
      >
        {loading ? 'Réservation...' : 'Confirmer la réservation'}
      </button>

      {!user && (
        <p className="text-xs text-center text-anthracite/50">
          Vous devrez vous{' '}
          <button onClick={() => navigate('/connexion')} className="text-taupe underline">
            connecter
          </button>{' '}
          pour finaliser la réservation.
        </p>
      )}
    </div>
  )
}
