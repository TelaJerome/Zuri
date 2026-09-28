import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { ProProfile, Specialty } from '../types'
import ProCard from '../components/pro/ProCard'
import { LABELS } from '../components/ui/SpecialtyBadge'

const SPECIALTIES: Specialty[] = ['COIFFURE', 'ESTHETIQUE', 'NAIL_ART', 'MASSAGE', 'MAQUILLAGE']

export default function ProList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pros, setPros] = useState<ProProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const activeSpecialty = searchParams.get('specialty') as Specialty | null
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeSpecialty) params.set('specialty', activeSpecialty)

    api.get<ProProfile[]>(`/pros?${params}`)
      .then(({ data }) => { setPros(data); setLoading(false) })
      .catch(() => {
        import('../lib/mockData').then(({ MOCK_PROS }) => {
          let filtered = MOCK_PROS
          if (activeSpecialty) filtered = filtered.filter(p => p.specialties.includes(activeSpecialty))
          if (search) filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.city.toLowerCase().includes(search.toLowerCase())
          )
          setPros(filtered)
          setLoading(false)
        })
      })
  }, [search, activeSpecialty])

  function toggleSpecialty(s: Specialty) {
    const next = new URLSearchParams(searchParams)
    if (activeSpecialty === s) {
      next.delete('specialty')
    } else {
      next.set('specialty', s)
    }
    setSearchParams(next)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-2">
        <h1 className="font-serif text-4xl">Nos professionnelles</h1>
        {/* Toggle liste / carte */}
        <div className="flex items-center bg-rose/30 rounded-xl p-1 gap-1">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-anthracite shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Liste
          </button>
          <button
            onClick={() => navigate('/carte')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-anthracite/60 hover:text-anthracite transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Carte
          </button>
        </div>
      </div>
      <p className="text-anthracite/60 mb-8">Trouvez la spécialiste qui vous ressemble</p>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher par nom, ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 max-w-lg"
        />
      </div>

      {/* Filtres spécialité */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SPECIALTIES.map((s) => (
          <button
            key={s}
            onClick={() => toggleSpecialty(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeSpecialty === s
                ? 'bg-taupe text-white border-taupe'
                : 'bg-white border-rose/50 text-anthracite hover:border-taupe'
            }`}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[4/3] bg-rose/30" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-rose/30 rounded w-2/3" />
                <div className="h-3 bg-rose/20 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : pros.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif text-2xl text-anthracite/40 mb-2">Aucun résultat</p>
          <p className="text-sm text-anthracite/40">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {pros.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      )}
    </div>
  )
}
