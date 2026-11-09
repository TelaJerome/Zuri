import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { Conversation, Message } from '../types'
import { ClientSocials, clientLabel } from '../components/ui/ClientIdentity'

const LIST_POLL_MS = 15_000
const THREAD_POLL_MS = 10_000

function shortDate(iso: string) {
  const d = new Date(iso)
  return isToday(d) ? format(d, 'HH:mm') : format(d, 'd MMM', { locale: fr })
}

export default function Messages() {
  const { user } = useAuthStore()
  const isPro = user?.role === 'PRO'
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('c')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  // Liste des fils
  useEffect(() => {
    let active = true
    const load = () =>
      api.get<Conversation[]>('/messages/conversations')
        .then(({ data }) => { if (active) setConversations(data) })
        .catch(() => {})
        .finally(() => { if (active) setLoadingList(false) })
    load()
    const timer = setInterval(load, LIST_POLL_MS)
    return () => { active = false; clearInterval(timer) }
  }, [])

  // Messages du fil ouvert (les lire les marque comme lus côté serveur)
  useEffect(() => {
    setMessages([])
    setError('')
    if (!selectedId) return
    let active = true
    const load = () =>
      api.get<Message[]>(`/messages/conversations/${selectedId}/messages`)
        .then(({ data }) => {
          if (!active) return
          setMessages(data)
          setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)))
          window.dispatchEvent(new Event('zuri:messages-read'))
        })
        .catch(() => { if (active) setError('Impossible de charger cette conversation.') })
    load()
    const timer = setInterval(load, THREAD_POLL_MS)
    return () => { active = false; clearInterval(timer) }
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || !selectedId || sending) return
    setSending(true)
    setError('')
    try {
      const { data } = await api.post<Message>(`/messages/conversations/${selectedId}/messages`, { body })
      setMessages((prev) => [...prev, data])
      setDraft('')
      setConversations((prev) =>
        [...prev]
          .map((c) => (c.id === selectedId ? { ...c, lastMessage: data, lastMessageAt: data.createdAt } : c))
          .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'Le message n\'a pas pu être envoyé.')
    } finally {
      setSending(false)
    }
  }

  const otherName = (c: Conversation) => (isPro ? clientLabel(c.client) : c.pro.name)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-6">Messagerie</h1>

      <div className="card overflow-hidden grid md:grid-cols-3 min-h-[60vh]">
        {/* Liste des conversations (cachée sur mobile quand un fil est ouvert) */}
        <aside className={`border-r border-rose/30 ${selectedId ? 'hidden md:block' : ''}`}>
          {loadingList ? (
            <p className="p-6 text-sm text-anthracite/40">Chargement…</p>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-sm text-anthracite/50">
              <p className="mb-2">Aucune conversation pour l'instant.</p>
              {isPro ? (
                <p>Vous pourrez écrire à une cliente depuis votre agenda, dès qu'elle aura réservé avec son compte.</p>
              ) : (
                <p>
                  Pour poser une question, ouvrez la fiche d'une{' '}
                  <Link to="/professionnelles" className="text-taupe underline">professionnelle</Link>{' '}
                  et cliquez sur « Envoyer un message ».
                </p>
              )}
            </div>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSearchParams({ c: c.id })}
                    className={`w-full text-left px-4 py-3 border-b border-rose/20 transition-colors ${
                      c.id === selectedId ? 'bg-cream' : 'hover:bg-rose/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${c.unreadCount ? 'font-semibold' : 'font-medium'}`}>
                        {otherName(c)}
                      </span>
                      <span className="text-[11px] text-anthracite/40 flex-shrink-0">
                        {shortDate(c.lastMessage?.createdAt ?? c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-anthracite/50 truncate">
                        {c.lastMessage ? c.lastMessage.body : 'Nouvelle conversation'}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="bg-taupe text-white text-[10px] min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center font-medium">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Fil ouvert */}
        <section className={`md:col-span-2 flex flex-col ${selectedId ? '' : 'hidden md:flex'}`}>
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-anthracite/40 p-6">
              Sélectionnez une conversation
            </div>
          ) : (
            <>
              <header className="px-4 py-3 border-b border-rose/30 flex items-center gap-3">
                <button
                  onClick={() => setSearchParams({})}
                  className="md:hidden text-taupe text-sm"
                  aria-label="Retour aux conversations"
                >
                  ←
                </button>
                {selected && (
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{otherName(selected)}</p>
                    {isPro && (
                      <p className="text-xs text-anthracite/50">
                        {selected.client.name && <>{selected.client.email} · </>}
                        <ClientSocials client={selected.client} />
                      </p>
                    )}
                    {!isPro && (
                      <Link to={`/professionnelles/${selected.pro.id}`} className="text-xs text-taupe hover:underline">
                        Voir la fiche · {selected.pro.city}
                      </Link>
                    )}
                  </div>
                )}
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
                {messages.length === 0 && !error && (
                  <p className="text-center text-sm text-anthracite/40 py-10">
                    {isPro
                      ? 'Écrivez votre premier message à la cliente.'
                      : 'Posez votre question, la professionnelle vous répondra ici.'}
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.senderId === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                          mine ? 'bg-taupe text-white rounded-br-sm' : 'bg-rose/20 text-anthracite rounded-bl-sm'
                        }`}
                      >
                        {m.body}
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-anthracite/40'}`}>
                          {format(new Date(m.createdAt), 'd MMM HH:mm', { locale: fr })}
                          {mine && m.readAt && ' · Lu'}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div role="alert" className="mx-4 mb-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSend} className="border-t border-rose/30 p-3 flex gap-2 items-end">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  maxLength={2000}
                  rows={2}
                  placeholder="Votre message… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
                  className="input resize-none flex-1"
                />
                <button type="submit" disabled={!draft.trim() || sending} className="btn-primary">
                  {sending ? '…' : 'Envoyer'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
