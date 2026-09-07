import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-anthracite text-white/70 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-serif text-2xl text-white mb-3">Zuri</p>
          <p className="text-sm leading-relaxed">
            La plateforme qui met en relation les clientes avec les professionnelles de la beauté.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-3">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/professionnelles" className="hover:text-white transition-colors">Professionnelles</Link></li>
            <li><Link to="/boutique" className="hover:text-white transition-colors">Boutique</Link></li>
            <li><Link to="/inscription?role=pro" className="hover:text-white transition-colors">Devenir professionnelle</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-3">Professionnelles</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.autoentrepreneur.urssaf.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Créer son statut auto-entrepreneur →
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-4 text-xs text-white/40">
        © {new Date().getFullYear()} Zuri — Tous droits réservés
      </div>
    </footer>
  )
}
