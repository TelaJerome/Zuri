import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { mockLogin } from '../lib/mockAuth'
import { User } from '../types'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      setAuth(data.user, data.token)
      if (data.user.role === 'PRO') navigate('/pro/dashboard')
      else if (data.user.role === 'ADMIN') navigate('/admin')
      else navigate('/')
    } catch {
      // Fallback mode démo sans backend
      const mockUser = mockLogin(email, password)
      if (mockUser) {
        setAuth(mockUser, 'mock-token')
        if (mockUser.role === 'PRO') navigate('/pro/dashboard')
        else if (mockUser.role === 'ADMIN') navigate('/admin')
        else navigate('/')
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl mb-2">Connexion</h1>
          <p className="text-anthracite/50 text-sm">Bienvenue sur Zuri</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="votre@email.fr"
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-anthracite/50 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-taupe font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
