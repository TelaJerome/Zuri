import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'

import authRoutes from './routes/auth.routes'
import proRoutes from './routes/pro.routes'
import appointmentRoutes from './routes/appointment.routes'
import productRoutes from './routes/product.routes'
import orderRoutes from './routes/order.routes'
import adminRoutes from './routes/admin.routes'

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'https://zuri-dusky-seven.vercel.app',
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.some(o => origin.startsWith(o))),
  credentials: true,
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/pros', proRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})
