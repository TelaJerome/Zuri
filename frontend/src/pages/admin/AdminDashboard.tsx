import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { ProProfile } from '../../types'

export default function AdminDashboard() {
  const [pros, setPros] = useState<ProProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ProProfile[]>('/admin/pros').then(({ data }) => {
      setPros(data)
      setLoading(false)
    })
  }, [])

  async function toggleStatus(id: string, isActive: boolean) {
    await api.patch(`/admin/pros/${id}/status`, { isActive })
    setPros((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)))
  }

  async function verifySiret(id: string) {
    await api.patch(`/admin/pros/${id}/verify-siret`)
    setPros((prev) => prev.map((p) => (p.id === id ? { ...p, siretVerified: true } : p)))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-8">Espace administration</h1>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-rose/20">
          <h2 className="font-serif text-xl">Professionnelles inscrites ({pros.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-rose/20 rounded-xl" />)}
          </div>
        ) : (
          <div className="divide-y divide-rose/10">
            {pros.map((pro) => (
              <div key={pro.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{pro.name}</p>
                    <span className={`badge text-xs ${pro.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {pro.isActive ? 'Actif' : 'Suspendu'}
                    </span>
                  </div>
                  <p className="text-xs text-anthracite/50">{(pro as any).user?.email} · {pro.city}</p>
                  <p className="text-xs text-anthracite/50 font-mono mt-0.5">
                    SIRET : {pro.siret}{' '}
                    {pro.siretVerified ? (
                      <span className="text-green-600">✓ Vérifié</span>
                    ) : (
                      <button onClick={() => verifySiret(pro.id)} className="text-taupe underline ml-1">
                        Vérifier
                      </button>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => toggleStatus(pro.id, !pro.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    pro.isActive
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {pro.isActive ? 'Suspendre' : 'Réactiver'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
