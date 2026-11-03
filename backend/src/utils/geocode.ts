// Géocodage des adresses françaises avec le service de l'IGN (Géoplateforme, ex-API Adresse) :
// gratuit et sans clé. Doc : https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
const GEOCODE_URL = 'https://data.geopf.fr/geocodage/search'

// En dessous de ce score, le résultat ressemble trop peu à l'adresse saisie
const MIN_SCORE = 0.5

export interface GeocodeResult {
  lat: number
  lng: number
  label: string
  postalCode?: string
  city?: string
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const q = query.trim()
  if (q.length < 3) return null
  try {
    const res = await fetch(`${GEOCODE_URL}?q=${encodeURIComponent(q)}&limit=1`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data: any = await res.json()
    const feature = data?.features?.[0]
    if (!feature || (feature.properties?.score ?? 0) < MIN_SCORE) return null
    const [lng, lat] = feature.geometry.coordinates
    return {
      lat,
      lng,
      label: feature.properties.label,
      postalCode: feature.properties.postcode,
      city: feature.properties.city,
    }
  } catch {
    // Service injoignable ou trop lent : on n'empêche pas l'enregistrement du profil
    return null
  }
}
