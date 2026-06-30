import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Product, ProductCategory } from '../types'
import ProductCard from '../components/shop/ProductCard'

const CATEGORIES: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'Tout' },
  { value: 'SOIN', label: 'Soins' },
  { value: 'MAQUILLAGE', label: 'Maquillage' },
  { value: 'PARFUM', label: 'Parfums' },
  { value: 'ACCESSOIRE', label: 'Accessoires' },
  { value: 'AUTRE', label: 'Autre' },
]

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (sort !== 'recent') params.set('sort', sort)
    api.get<Product[]>(`/products?${params}`)
      .then(({ data }) => { setProducts(data); setLoading(false) })
      .catch(() => {
        import('../lib/mockData').then(({ MOCK_PRODUCTS }) => {
          let filtered = MOCK_PRODUCTS
          if (category) filtered = filtered.filter(p => p.category === category)
          if (sort === 'price_asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
          if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
          setProducts(filtered)
          setLoading(false)
        })
      })
  }, [category, sort])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-2">Boutique</h1>
      <p className="text-anthracite/60 mb-8">Produits sélectionnés par nos professionnelles</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Filtres catégorie */}
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                category === c.value
                  ? 'bg-taupe text-white border-taupe'
                  : 'bg-white border-rose/50 text-anthracite hover:border-taupe'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Tri */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input w-auto min-w-[160px]"
        >
          <option value="recent">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-rose/30" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-rose/30 rounded w-3/4" />
                <div className="h-3 bg-rose/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-anthracite/40">
          <p className="font-serif text-2xl mb-2">Aucun produit</p>
          <p className="text-sm">Revenez bientôt, de nouveaux produits arrivent !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
