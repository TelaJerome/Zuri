import { Specialty } from '../../types'

const LABELS: Record<Specialty, string> = {
  COIFFURE: 'Coiffure',
  ESTHETIQUE: 'Esthétique',
  NAIL_ART: 'Nail Art',
  MASSAGE: 'Massage',
  MAQUILLAGE: 'Maquillage',
}

const COLORS: Record<Specialty, string> = {
  COIFFURE: 'bg-rose text-anthracite',
  ESTHETIQUE: 'bg-cream text-anthracite',
  NAIL_ART: 'bg-taupe/10 text-taupe',
  MASSAGE: 'bg-rose/60 text-anthracite',
  MAQUILLAGE: 'bg-taupe/20 text-anthracite',
}

interface Props {
  specialty: Specialty
  size?: 'sm' | 'md'
}

export default function SpecialtyBadge({ specialty, size = 'sm' }: Props) {
  return (
    <span
      className={`badge ${COLORS[specialty]} ${size === 'md' ? 'px-4 py-1.5 text-sm' : ''}`}
    >
      {LABELS[specialty]}
    </span>
  )
}

export { LABELS }
