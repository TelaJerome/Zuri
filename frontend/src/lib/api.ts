import axios from 'axios'

// Données fictives uniquement en dev, ou si VITE_DEMO_MODE=true est défini au build
export const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zuri_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zuri_token')
      window.location.href = '/connexion'
    }
    return Promise.reject(err)
  }
)

export default api
