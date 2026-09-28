import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProList from './pages/ProList'
import ProProfilePage from './pages/ProProfile'
import MyAppointments from './pages/MyAppointments'
import ProDashboard from './pages/ProDashboard'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import AdminDashboard from './pages/admin/AdminDashboard'
import MapView from './pages/MapView'
import { useAuthStore } from './lib/store'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/connexion" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="connexion" element={<Login />} />
          <Route path="inscription" element={<Register />} />
          <Route path="professionnelles" element={<ProList />} />
          <Route path="professionnelles/:id" element={<ProProfilePage />} />
          <Route path="carte" element={<MapView />} />
          <Route path="boutique" element={<Shop />} />
          <Route path="panier" element={<Cart />} />
          <Route
            path="mes-rendez-vous"
            element={
              <ProtectedRoute role="CLIENT">
                <MyAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="pro/dashboard"
            element={
              <ProtectedRoute role="PRO">
                <ProDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
