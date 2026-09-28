export type Role = 'CLIENT' | 'PRO' | 'ADMIN'
export type Specialty = 'COIFFURE' | 'ESTHETIQUE' | 'NAIL_ART' | 'MASSAGE' | 'MAQUILLAGE'
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type ProductCategory = 'SOIN' | 'MAQUILLAGE' | 'PARFUM' | 'ACCESSOIRE' | 'AUTRE'

export interface User {
  id: string
  email: string
  phone?: string
  role: Role
  proProfile?: ProProfile
}

export interface UnavailablePeriod {
  id: string
  proId: string
  startDate: string
  endDate: string
  reason?: string
}

export interface ProProfile {
  id: string
  userId: string
  name: string
  specialties: Specialty[]
  bio?: string
  city: string
  lat?: number
  lng?: number
  photoUrl?: string
  siret: string
  siretVerified: boolean
  isActive: boolean
  rating?: number
  services?: Service[]
  availabilities?: Availability[]
  unavailableDates?: UnavailablePeriod[]
  products?: Product[]
}

export interface Service {
  id: string
  proId: string
  name: string
  price: number
  durationMinutes: number
  description?: string
}

export interface Availability {
  id: string
  proId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface Appointment {
  id: string
  clientId: string
  proId: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes?: string
  service?: Service
  pro?: ProProfile
  client?: User
}

export interface Product {
  id: string
  proId: string
  name: string
  category: ProductCategory
  price: number
  description?: string
  photoUrl?: string
  stock: number
  isActive: boolean
  pro?: { name: string; city: string }
}

export interface Order {
  id: string
  clientId: string
  total: number
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  priceAtPurchase: number
  product?: { name: string; photoUrl?: string }
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface TimeSlot {
  time: string
  available: boolean
}
