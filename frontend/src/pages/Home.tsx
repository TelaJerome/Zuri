import { Link } from 'react-router-dom'

const SPECIALTIES = [
  { label: 'Coiffure', emoji: '✂️', path: '/professionnelles?specialty=COIFFURE' },
  { label: 'Esthétique', emoji: '🌸', path: '/professionnelles?specialty=ESTHETIQUE' },
  { label: 'Nail Art', emoji: '💅', path: '/professionnelles?specialty=NAIL_ART' },
  { label: 'Massage', emoji: '🕯️', path: '/professionnelles?specialty=MASSAGE' },
  { label: 'Maquillage', emoji: '💄', path: '/professionnelles?specialty=MAQUILLAGE' },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl text-anthracite leading-tight mb-6">
              Votre beauté,<br />
              <em className="text-taupe not-italic">entre de bonnes mains</em>
            </h1>
            <p className="text-anthracite/60 text-lg leading-relaxed mb-8 font-light">
              Découvrez des professionnelles passionnées près de chez vous et réservez votre soin en quelques clics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/professionnelles" className="btn-primary text-base px-8 py-3">
                Trouver une professionnelle
              </Link>
              <Link to="/inscription?role=pro" className="btn-secondary text-base px-8 py-3">
                Rejoindre la plateforme
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-square rounded-3xl bg-rose/50 flex items-center justify-center">
              <span className="text-9xl">🌸</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spécialités */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-center mb-10">Explorez par spécialité</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {SPECIALTIES.map((s) => (
            <Link
              key={s.label}
              to={s.path}
              className="card p-6 text-center hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">{s.emoji}</div>
              <span className="text-sm font-medium text-anthracite group-hover:text-taupe transition-colors">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-rose/20 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-serif text-3xl text-center mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Recherchez', desc: 'Parcourez les profils de professionnelles par spécialité ou ville.' },
              { step: '2', title: 'Réservez', desc: 'Choisissez votre prestation, votre date et votre créneau directement en ligne.' },
              { step: '3', title: 'Profitez', desc: 'Rendez-vous confirmé, il ne vous reste plus qu\'à vous détendre !' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-taupe text-white rounded-full flex items-center justify-center font-serif text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-serif text-xl mb-2">{item.title}</h3>
                <p className="text-anthracite/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Boutique */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="card p-8 md:p-12 bg-anthracite text-white text-center">
          <h2 className="font-serif text-3xl mb-4">Découvrez aussi notre boutique</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Soins, maquillage, accessoires… Les professionnelles partagent leurs produits favoris.
          </p>
          <Link to="/boutique" className="inline-block bg-taupe text-white px-8 py-3 rounded-xl font-medium hover:bg-taupe/90 transition-colors">
            Explorer la boutique
          </Link>
        </div>
      </section>
    </div>
  )
}
