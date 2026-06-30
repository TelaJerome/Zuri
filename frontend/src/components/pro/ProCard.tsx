import { Link } from 'react-router-dom'
import { ProProfile } from '../../types'
import StarRating from '../ui/StarRating'
import SpecialtyBadge from '../ui/SpecialtyBadge'

interface Props {
  pro: ProProfile & { services?: { price: number }[] }
}

export default function ProCard({ pro }: Props) {
  const minPrice = pro.services?.[0]?.price

  return (
    <Link to={`/professionnelles/${pro.id}`} className="card group hover:shadow-md transition-shadow duration-200 block">
      <div className="aspect-[4/3] bg-rose/30 overflow-hidden">
        {pro.photoUrl ? (
          <img
            src={pro.photoUrl}
            alt={pro.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-taupe/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-lg leading-tight">{pro.name}</h3>
          <StarRating rating={pro.rating} />
        </div>

        <p className="text-xs text-anthracite/50 mb-3 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {pro.city}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {pro.specialties.map((s) => (
            <SpecialtyBadge key={s} specialty={s} />
          ))}
        </div>

        {minPrice && (
          <p className="text-xs text-anthracite/60 font-medium">
            À partir de <span className="text-taupe font-semibold">{minPrice}€</span>
          </p>
        )}
      </div>
    </Link>
  )
}
