import { useState } from 'react'
import {
  addDays, addMonths, endOfMonth, format, isAfter, isBefore, isSameDay, isSameMonth,
  startOfDay, startOfMonth, startOfWeek, endOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Availability, UnavailablePeriod } from '../../types'

// Les clientes peuvent réserver de demain jusqu'à 1 mois à l'avance (même limite côté serveur)
export const BOOKING_HORIZON_MONTHS = 1

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface Props {
  selected: Date | null
  onSelect: (date: Date) => void
  availabilities: Pick<Availability, 'dayOfWeek'>[]
  unavailableDates?: Pick<UnavailablePeriod, 'startDate' | 'endDate'>[]
}

export default function BookingCalendar({ selected, onSelect, availabilities, unavailableDates = [] }: Props) {
  const today = startOfDay(new Date())
  const firstDay = addDays(today, 1)
  const lastDay = addMonths(today, BOOKING_HORIZON_MONTHS)
  const [month, setMonth] = useState(startOfMonth(firstDay))

  const workDays = new Set(availabilities.map((a) => a.dayOfWeek))
  const isOff = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    return unavailableDates.some((p) => key >= p.startDate.slice(0, 10) && key <= p.endDate.slice(0, 10))
  }
  const isBookable = (date: Date) =>
    !isBefore(date, firstDay) && !isAfter(date, lastDay) && workDays.has(date.getDay()) && !isOff(date)

  // Grille du lundi au dimanche couvrant tout le mois affiché
  const days: Date[] = []
  for (let d = startOfWeek(month, { weekStartsOn: 1 }); !isAfter(d, endOfWeek(endOfMonth(month), { weekStartsOn: 1 })); d = addDays(d, 1)) {
    days.push(d)
  }

  const canGoBack = isAfter(month, startOfMonth(firstDay))
  const canGoForward = isBefore(endOfMonth(month), lastDay)

  return (
    <div className="rounded-xl border border-rose/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          disabled={!canGoBack}
          aria-label="Mois précédent"
          className="w-8 h-8 rounded-lg hover:bg-rose/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ‹
        </button>
        <span className="text-sm font-medium capitalize">{format(month, 'MMMM yyyy', { locale: fr })}</span>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={!canGoForward}
          aria-label="Mois suivant"
          className="w-8 h-8 rounded-lg hover:bg-rose/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[11px] text-anthracite/40 py-1">{d}</span>
        ))}
        {days.map((date) => {
          if (!isSameMonth(date, month)) return <span key={date.toISOString()} />
          const bookable = isBookable(date)
          const isSelected = !!selected && isSameDay(date, selected)
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={!bookable}
              onClick={() => onSelect(date)}
              aria-label={format(date, 'EEEE d MMMM', { locale: fr })}
              aria-pressed={isSelected}
              className={`h-9 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-taupe text-white font-medium'
                  : bookable
                  ? 'hover:bg-cream border border-rose/30 font-medium'
                  : 'text-anthracite/25 cursor-not-allowed'
              }`}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-anthracite/40 mt-2">
        Réservation possible jusqu'au {format(lastDay, 'd MMMM', { locale: fr })}. Les jours grisés sont indisponibles.
      </p>
    </div>
  )
}
