import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, useCartStore } from '../../lib/store'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const cartItems = useCartStore((s) => s.items)
  const navigate = useNavigate()

  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-rose/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl text-anthracite tracking-wide">
          Zuri
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-sans">
          <NavLink
            to="/professionnelles"
            className={({ isActive }) =>
              isActive ? 'text-taupe font-medium' : 'text-anthracite/70 hover:text-anthracite transition-colors'
            }
          >
            Professionnelles
          </NavLink>
          <NavLink
            to="/boutique"
            className={({ isActive }) =>
              isActive ? 'text-taupe font-medium' : 'text-anthracite/70 hover:text-anthracite transition-colors'
            }
          >
            Boutique
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {/* Panier */}
          <Link to="/panier" className="relative p-2 hover:bg-rose rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-taupe text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'CLIENT' && (
                <Link to="/mes-rendez-vous" className="btn-ghost text-xs">
                  Mes RDV
                </Link>
              )}
              {user.role === 'PRO' && (
                <Link to="/pro/dashboard" className="btn-ghost text-xs">
                  Mon espace
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="btn-ghost text-xs">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="btn-secondary text-xs">
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/connexion" className="btn-ghost text-xs">
                Connexion
              </Link>
              <Link to="/inscription" className="btn-primary text-xs">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
