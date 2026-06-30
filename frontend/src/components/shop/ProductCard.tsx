import { Product } from '../../types'
import { useCartStore } from '../../lib/store'

interface Props {
  product: Product
}

const CATEGORY_LABELS: Record<string, string> = {
  SOIN: 'Soin',
  MAQUILLAGE: 'Maquillage',
  PARFUM: 'Parfum',
  ACCESSOIRE: 'Accessoire',
  AUTRE: 'Autre',
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="card group">
      <div className="aspect-square bg-rose/20 overflow-hidden">
        {product.photoUrl ? (
          <img
            src={product.photoUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-taupe/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <span className="badge bg-cream text-anthracite/60 mb-2">
          {CATEGORY_LABELS[product.category]}
        </span>
        <h3 className="font-serif text-base leading-tight mb-1">{product.name}</h3>
        {product.pro && (
          <p className="text-xs text-anthracite/50 mb-2">par {product.pro.name}</p>
        )}
        {product.description && (
          <p className="text-xs text-anthracite/60 mb-3 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="font-serif text-lg text-taupe">{product.price.toFixed(2)}€</span>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="btn-primary text-xs py-2 px-4"
          >
            {product.stock === 0 ? 'Épuisé' : 'Ajouter'}
          </button>
        </div>

        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-amber-600 mt-2">Plus que {product.stock} en stock</p>
        )}
      </div>
    </div>
  )
}
