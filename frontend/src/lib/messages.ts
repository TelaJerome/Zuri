import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api'
import { useAuthStore } from './store'
import { Conversation } from '../types'

const POLL_MS = 30_000

// Nombre de messages non lus, rafraîchi régulièrement (clientes et pros connectées)
export function useUnreadCount() {
  const { user } = useAuthStore()
  const [count, setCount] = useState(0)
  const canMessage = user?.role === 'CLIENT' || user?.role === 'PRO'

  useEffect(() => {
    if (!canMessage) {
      setCount(0)
      return
    }
    let active = true
    const load = () =>
      api.get<{ count: number }>('/messages/unread-count')
        .then(({ data }) => { if (active) setCount(data.count) })
        .catch(() => {})
    load()
    const timer = setInterval(load, POLL_MS)
    // Remet le compteur à jour quand la page Messagerie lit un fil
    window.addEventListener('zuri:messages-read', load)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('zuri:messages-read', load)
    }
  }, [canMessage])

  return count
}

// Ouvre (ou retrouve) un fil puis affiche la messagerie dessus
export function useOpenConversation() {
  const navigate = useNavigate()
  return async (target: { proId: string } | { clientId: string }) => {
    const { data } = await api.post<Conversation>('/messages/conversations', target)
    navigate(`/messages?c=${data.id}`)
  }
}
