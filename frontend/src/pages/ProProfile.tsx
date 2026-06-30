import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import { ProProfile as ProProfileType } from '../types'
import SpecialtyBadge from '../components/ui/SpecialtyBadge'
import StarRating from '../components/ui/StarRating'
import BookingPanel from '../components/booking/BookingPanel'
import ProductCard from '../components/shop/ProductCard'

export default function ProProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [pro, setPro] = useState<ProProfileType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ProProfileType>(`/pros/${id}`)
      .then(({ data }) => { setPro(data); setLoading(false) })
      .catch(() => {
        import('../lib/mockData').then(({ MOCK_PROS }) => {
          const found = MOCK_PROS.find(p => p.id === id) || null
          setPro(found)
          setLoading(false)
        })
      })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-48 bg-rose/30 rounded-2xl mb-6" />
        <div className="h-8 bg-rose/30 rounded w-1/3 mb-3" />
        <div className="h-4 bg-rose/20 rounded w-1/4" />
      </div>
    )
  }

  if (!pro) return <div className="text-center py-20 text-anthracite/40">Professionnel introuvable</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* En-tête profil */}
      <div className="card mb-8 overflow-visible">
        <div className="h-48 bg-rose/30 rounded-t-2xl" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 -mt-12 items-end sm:items-start">
            <div className="w-24 h-24 rounded-2xl border-4 border-white bg-rose/40 overflow-hidden flex-shrink-0">
              {pro.photoUrl ? (
                <img src={pro.photoUrl} alt={pro.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-taupe/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-3xl">{pro.name}</h1>
                <StarRating rating={pro.rating} size="md" />
              </div>
              <p className="text-anthracite/50 text-sm mb-3 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {pro.city}
              </p>
              <div className="flex flex-wrap gap-2">
                {pro.specialties.map((s) => (
                  <SpecialtyBadge key={s} specialty={s} size="md" />
                ))}
              </div>
            </div>
          </div>

          {pro.bio && (
            <p className="mt-4 text-anthracite/70 leading-relaxed text-sm border-t border-rose/20 pt-4">
              {pro.bio}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Colonne gauche : infos + produits */}
        <div className="md:col-span-3 space-y-8">
          {/* Prestations */}
          {pro.services && pro.services.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl mb-4">Prestations</h2>
              <div className="space-y-3">
                {pro.services.map((s) => (
                  <div key={s.id} className="card px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-anthracite/50">{s.durationMinutes} min</p>
                      {s.description && <p className="text-xs text-anthracite/50 mt-0.5">{s.description}</p>}
                    </div>
                    <span className="font-serif text-lg text-taupe ml-4">{s.price}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produits du pro */}
          {pro.products && pro.products.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl mb-4">Produits vendus</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pro.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : réservation */}
        <div className="md:col-span-2">
          <div className="sticky top-24">
            <BookingPanel pro={pro} />
          </div>
        </div>
      </div>
    </div>
  )
}
