import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../lib/api'
import { ProProfile, Specialty } from '../types'
import { LABELS } from '../components/ui/SpecialtyBadge'

// Fix Leaflet default icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const SPECIALTIES: Specialty[] = ['COIFFURE', 'ESTHETIQUE', 'NAIL_ART', 'MASSAGE', 'MAQUILLAGE']

const SPECIALTY_COLORS: Record<Specialty, string> = {
  COIFFURE: '#b5813d',
  ESTHETIQUE: '#e87e9a',
  NAIL_ART: '#9b59b6',
  MASSAGE: '#27ae60',
  MAQUILLAGE: '#e74c3c',
}

function createProIcon(specialty: Specialty, photoUrl?: string, name?: string) {
  const color = SPECIALTY_COLORS[specialty] || '#b5813d'
  const initial = name ? name[0].toUpperCase() : '?'
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<span style="color:white;font-size:15px;font-weight:700;line-height:42px;">${initial}</span>`
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${photoUrl ? '#fff' : color};
      width:44px;height:44px;
      border-radius:50%;
      border:3px solid ${color};
      box-shadow:0 2px 10px rgba(0,0,0,0.25);
      overflow:hidden;
      display:flex;align-items:center;justify-content:center;
      text-align:center;
    ">${inner}</div>
    <div style="
      width:10px;height:10px;
      background:${color};
      border-radius:50%;
      margin:-4px auto 0;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -56],
  })
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#3b82f6;
      width:16px;height:16px;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function FlyToLocation({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo(coords, 13, { duration: 1.2 })
  }, [coords, map])
  return null
}

// Mock coordinates for demo (Paris area)
const MOCK_COORDS: Record<string, [number, number]> = {
  'pro-1': [48.8566, 2.3522],
  'pro-2': [48.8606, 2.3376],
  'pro-3': [48.8737, 2.2950],
  'pro-4': [48.8496, 2.3088],
  'pro-5': [48.8420, 2.3212],
  'pro-6': [48.8650, 2.3750],
}

export default function MapView() {
  const [pros, setPros] = useState<ProProfile[]>([])
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [activeSpecialty, setActiveSpecialty] = useState<Specialty | null>(null)
  const [selectedPro, setSelectedPro] = useState<ProProfile | null>(null)
  const [locating, setLocating] = useState(false)
  const [radius, setRadius] = useState(5000)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<ProProfile[]>('/pros')
      .then(({ data }) => {
        const withCoords = data.map((p, i) => ({
          ...p,
          lat: p.lat ?? (48.8566 + (Math.random() - 0.5) * 0.08),
          lng: p.lng ?? (2.3522 + (Math.random() - 0.5) * 0.08),
        }))
        setPros(withCoords)
      })
      .catch(() => {
        import('../lib/mockData').then(({ MOCK_PROS }) => {
          const withCoords = MOCK_PROS.map((p) => ({
            ...p,
            lat: MOCK_COORDS[p.id]?.[0] ?? (48.8566 + (Math.random() - 0.5) * 0.08),
            lng: MOCK_COORDS[p.id]?.[1] ?? (2.3522 + (Math.random() - 0.5) * 0.08),
          }))
          setPros(withCoords)
        })
      })
  }, [])

  function locateMe() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserCoords(coords)
        setFlyTo(coords)
        setLocating(false)
      },
      () => {
        // fallback to Paris if geolocation denied
        const paris: [number, number] = [48.8566, 2.3522]
        setUserCoords(paris)
        setFlyTo(paris)
        setLocating(false)
      }
    )
  }

  const filtered = pros.filter(p => {
    if (activeSpecialty && !p.specialties.includes(activeSpecialty)) return false
    if (userCoords && p.lat && p.lng) {
      const dist = L.latLng(userCoords).distanceTo(L.latLng(p.lat, p.lng))
      if (dist > radius) return false
    }
    return true
  })

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Barre de contrôles */}
      <div className="bg-white border-b border-rose/30 px-4 py-3 flex flex-wrap items-center gap-3 z-10">
        {/* Toggle liste / carte */}
        <div className="flex items-center bg-rose/30 rounded-xl p-1 gap-1 mr-2">
          <button
            onClick={() => navigate('/professionnelles')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-anthracite/60 hover:text-anthracite transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Liste
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-anthracite shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Carte
          </button>
        </div>

        <button
          onClick={locateMe}
          disabled={locating}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {locating ? 'Localisation...' : 'Me localiser'}
        </button>

        {userCoords && (
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="input text-xs py-1.5 w-auto"
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        )}

        <div className="flex flex-wrap gap-1.5">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSpecialty(activeSpecialty === s ? null : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeSpecialty === s
                  ? 'text-white border-transparent'
                  : 'bg-white border-rose/40 text-anthracite/70 hover:border-taupe'
              }`}
              style={activeSpecialty === s ? { background: SPECIALTY_COLORS[s], borderColor: SPECIALTY_COLORS[s] } : {}}
            >
              {LABELS[s]}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-anthracite/50">
          {filtered.length} professionnelle{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Carte + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Carte */}
        <div className="flex-1 relative">
          <MapContainer
            center={[48.8566, 2.3522]}
            zoom={12}
            className="w-full h-full"
            style={{ zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToLocation coords={flyTo} />

            {/* Position utilisateur */}
            {userCoords && (
              <>
                <Marker position={userCoords} icon={userIcon()} />
                <Circle
                  center={userCoords}
                  radius={radius}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.06, weight: 1 }}
                />
              </>
            )}

            {/* Markers pros */}
            {filtered.map((pro) =>
              pro.lat && pro.lng ? (
                <Marker
                  key={pro.id}
                  position={[pro.lat, pro.lng]}
                  icon={createProIcon(pro.specialties[0], pro.photoUrl, pro.name)}
                  eventHandlers={{ click: () => setSelectedPro(pro) }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        {pro.photoUrl && (
                          <img src={pro.photoUrl} className="w-10 h-10 rounded-full object-cover" alt={pro.name} />
                        )}
                        <div>
                          <p className="font-semibold text-sm">{pro.name}</p>
                          <p className="text-xs text-gray-500">{pro.city}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pro.specialties.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                            style={{ background: SPECIALTY_COLORS[s] }}>
                            {LABELS[s]}
                          </span>
                        ))}
                      </div>
                      {pro.rating && (
                        <p className="text-xs text-yellow-600 mb-2">★ {pro.rating.toFixed(1)}</p>
                      )}
                      <Link
                        to={`/professionnelles/${pro.id}`}
                        className="block text-center text-xs bg-taupe text-white rounded-lg py-1.5 px-3 hover:opacity-90 transition-opacity"
                      >
                        Voir le profil
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>

        {/* Sidebar liste */}
        <div className="w-72 bg-white border-l border-rose/30 overflow-y-auto hidden md:block">
          <div className="p-3 border-b border-rose/20">
            <p className="text-xs font-medium text-anthracite/60 uppercase tracking-wide">
              Professionnelles ({filtered.length})
            </p>
          </div>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-anthracite/40">
              Aucune professionnelle dans cette zone
            </div>
          ) : (
            filtered.map((pro) => (
              <button
                key={pro.id}
                onClick={() => {
                  setSelectedPro(pro)
                  if (pro.lat && pro.lng) setFlyTo([pro.lat, pro.lng])
                }}
                className={`w-full text-left p-3 border-b border-rose/10 hover:bg-rose/20 transition-colors ${
                  selectedPro?.id === pro.id ? 'bg-rose/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {pro.photoUrl ? (
                    <img src={pro.photoUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={pro.name} />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: SPECIALTY_COLORS[pro.specialties[0]] }}>
                      {pro.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-anthracite truncate">{pro.name}</p>
                    <p className="text-xs text-anthracite/50">{pro.city}</p>
                    <div className="flex gap-1 mt-0.5">
                      {pro.specialties.slice(0, 2).map(s => (
                        <span key={s} className="text-[9px] px-1 py-0.5 rounded-full text-white"
                          style={{ background: SPECIALTY_COLORS[s] }}>
                          {LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {pro.rating && (
                    <span className="ml-auto text-xs text-yellow-600 flex-shrink-0">★{pro.rating.toFixed(1)}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
