import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../lib/store'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import { useState } from 'react'

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleOrder() {
    if (!user) {
      navigate('/connexion')
      return
    }
    setLoading(true)
    try {
      await api.post('/orders', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      })
      clearCart()
      setSuccess(true)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-rose rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl mb-3">Commande confirmée !</h1>
        <p className="text-anthracite/60 mb-6">Merci pour votre commande. Les professionnelles vous contacteront pour la livraison.</p>
        <button onClick={() => navigate('/boutique')} className="btn-primary">
          Continuer mes achats
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl mb-3">Votre panier est vide</h1>
        <p className="text-anthracite/60 mb-6">Découvrez nos produits et ajoutez-en à votre panier.</p>
        <button onClick={() => navigate('/boutique')} className="btn-primary">
          Explorer la boutique
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-8">Mon panier</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.product.id} className="card p-4 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-rose/30 flex-shrink-0 overflow-hidden">
              {item.product.photoUrl ? (
                <img src={item.product.photoUrl} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.product.name}</p>
              <p className="text-xs text-anthracite/50">{item.product.price.toFixed(2)}€ / unité</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className="w-7 h-7 rounded-full border border-rose/50 flex items-center justify-center text-sm hover:border-taupe"
              >
                −
              </button>
              <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                disabled={item.quantity >= item.product.stock}
                className="w-7 h-7 rounded-full border border-rose/50 flex items-center justify-center text-sm hover:border-taupe disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="font-serif text-taupe text-lg w-16 text-right">
              {(item.product.price * item.quantity).toFixed(2)}€
            </p>
            <button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-rose/20">
          <span className="font-medium">Total</span>
          <span className="font-serif text-2xl text-taupe">{total().toFixed(2)}€</span>
        </div>
        <button onClick={handleOrder} disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Commande en cours...' : 'Passer la commande'}
        </button>
        {!user && (
          <p className="text-xs text-center text-anthracite/50 mt-3">
            Vous devrez vous connecter pour finaliser la commande.
          </p>
        )}
      </div>
    </div>
  )
}
