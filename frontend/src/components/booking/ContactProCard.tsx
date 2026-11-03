import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../lib/store'
import { useOpenConversation } from '../../lib/messages'
import { ProProfile } from '../../types'

// Encart « Une question ? » de la fiche pro : messagerie pour les clientes avec compte,
// invitation à créer un compte pour les visiteuses
export default function ContactProCard({ pro }: { pro: ProProfile }) {
  const { user } = useAuthStore()
  const openConversation = useOpenConversation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Les pros et l'admin n'écrivent pas aux pros depuis une fiche
  if (user && user.role !== 'CLIENT') return null

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      await openConversation({ proId: pro.id })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible d\'ouvrir la conversation.')
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 space-y-3">
      <h2 className="font-serif text-xl">Une question ?</h2>
      {user ? (
        <>
          <p className="text-sm text-anthracite/60">
            Écrivez à {pro.name} avant de réserver : prestation, tarif, déroulé…
          </p>
          <button onClick={handleClick} disabled={loading} className="btn-secondary w-full">
            {loading ? 'Ouverture…' : 'Envoyer un message'}
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </>
      ) : (
        <>
          <p className="text-sm text-anthracite/60">
            Créez un compte cliente pour envoyer un message à {pro.name} et suivre vos échanges.
          </p>
          <div className="flex gap-2">
            <Link to="/inscription" className="btn-primary flex-1 text-center">Créer un compte</Link>
            <Link to="/connexion" className="btn-secondary flex-1 text-center">Se connecter</Link>
          </div>
        </>
      )}
    </div>
  )
}
