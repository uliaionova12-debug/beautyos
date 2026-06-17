'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Send, Sparkles, Lock } from 'lucide-react'
import { VoiceButton } from '@/components/ui/VoiceButton'

interface Message { role: 'user' | 'assistant'; content: string }

interface ClientContext {
  client_name: string
  last_service: string
  last_master: string
  last_date: string
  history: { service: string; date: string }[]
  season: string
  scenario?: string
}

const SCENARIOS = [
  { id: 'after_coloring',  label: 'После окрашивания', emoji: '🎨', scenario: 'после окрашивания волос' },
  { id: 'after_manicure',  label: 'После маникюра',    emoji: '💅', scenario: 'после маникюра' },
  { id: 'before_holiday',  label: 'Перед праздником',  emoji: '✨', scenario: 'перед важным праздником или мероприятием' },
  { id: 'before_vacation', label: 'Перед отпуском',    emoji: '☀️', scenario: 'перед летним отпуском' },
  { id: 'between_visits',  label: 'Между визитами',    emoji: '🌿', scenario: 'в период между визитами в салон' },
  { id: 'season_care',     label: 'Уход летом',        emoji: '💧', scenario: 'уход за волосами и кожей в летний период' },
]

function getSeason(): string {
  const m = new Date().getMonth() + 1
  if (m >= 3 && m <= 5) return 'весна'
  if (m >= 6 && m <= 8) return 'лето'
  if (m >= 9 && m <= 11) return 'осень'
  return 'зима'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Guest onboarding screen ──────────────────────────────────────────────────

function GuestOnboarding() {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Top bar — client-only, no business routes */}
      <div className="max-w-md w-full mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose/10 border border-rose/20 rounded-full flex items-center justify-center">
              <Heart size={15} className="text-rose" />
            </div>
            <span className="text-sm font-semibold text-graphite">Beauty Companion</span>
          </div>
          <Link href="/" className="flex items-center gap-1 text-xs text-dusk hover:text-rose transition-colors">
            <ArrowLeft size={12} />
            На главную
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto px-5 pb-10">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose/20 to-terracotta/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Heart size={36} className="text-rose" />
          </div>
          <h1 className="text-2xl font-bold text-graphite leading-snug mb-3">
            Ваш персональный<br />помощник по красоте
          </h1>
          <p className="text-sm text-dusk leading-relaxed">
            Beauty Companion помогает сохранять результат между визитами: напоминает об уходе,
            помогает не забывать о себе и даёт рекомендации персонально для вас.
          </p>
        </div>

        {/* Access card */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-xl">🌸</span>
            <div>
              <p className="text-sm font-semibold text-graphite mb-1">Чтобы начать пользоваться</p>
              <p className="text-xs text-dusk leading-relaxed">
                Попросите персональную ссылку у вашего мастера или администратора салона.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              'Видеть историю посещений',
              'Получать рекомендации по уходу',
              'Записываться на следующий визит',
              'Получать персональные советы',
              'Оставлять отзывы после посещения',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose/50 shrink-0 mt-px" />
                <p className="text-xs text-dusk">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 mb-7">
          <button
            onClick={() => setShowHint(v => !v)}
            className="w-full bg-rose text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-rose/20"
          >
            Получить ссылку у мастера
          </button>

          {showHint && (
            <div className="bg-rose/5 border border-rose/20 rounded-xl px-4 py-3 text-xs text-dusk/80 leading-relaxed">
              Покажите эту страницу мастеру или напишите ему: «Отправь мне ссылку на Beauty Companion». Мастер пришлёт персональную ссылку из своего кабинета.
            </div>
          )}

          <button
            onClick={() => {
              const linkEl = document.getElementById('paste-link-input')
              linkEl?.scrollIntoView({ behavior: 'smooth' })
              linkEl?.focus()
            }}
            className="w-full border border-parchment bg-card text-graphite/70 font-medium py-3.5 rounded-2xl text-sm hover:border-rose/30 active:scale-[0.98] transition-all"
          >
            У меня уже есть ссылка
          </button>
        </div>

        {/* Paste link input */}
        <div className="mb-7">
          <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-2">Вставить ссылку</p>
          <div className="flex gap-2">
            <input
              id="paste-link-input"
              type="url"
              placeholder="https://beautyos-bice.vercel.app/join?salon_id=..."
              className="flex-1 bg-card border border-parchment rounded-xl px-4 py-3 text-xs text-graphite placeholder-dusk/30 focus:outline-none focus:border-rose/40 transition-colors"
              onPaste={e => {
                const text = e.clipboardData.getData('text')
                if (text.includes('/join') || text.includes('/client')) {
                  setTimeout(() => { window.location.href = text }, 100)
                }
              }}
            />
          </div>
          <p className="text-[10px] text-dusk/40 mt-1.5">Вставьте ссылку и страница откроется автоматически</p>
        </div>

        {/* Disabled chips */}
        <div>
          <p className="text-xs text-dusk/50 mb-3">Темы советов — будут доступны после подключения</p>
          <div className="flex gap-2 flex-wrap">
            {SCENARIOS.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-parchment bg-card text-dusk/30 cursor-not-allowed select-none"
              >
                <Lock size={9} className="text-dusk/20" />
                {s.label}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-dusk/30 mt-2.5">
            Функции станут доступны после подключения к салону.
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Connected companion (with client context) ────────────────────────────────

export default function BeautyCompanionPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('id') || ''
  const salonId  = searchParams.get('salon_id') || ''

  const isConnected = !!(clientId && salonId)

  const [context, setContext]               = useState<ClientContext | null>(null)
  const [messages, setMessages]             = useState<Message[]>([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [greeted, setGreeted]               = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const season    = getSeason()

  useEffect(() => {
    if (!isConnected) return
    fetch(`/api/client-profile?client_id=${clientId}&salon_id=${salonId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setContext({ client_name: 'Гость', last_service: '', last_master: '', last_date: '', history: [], season }); return }
        const visits = d.visits || []
        const last   = visits[0]
        setContext({
          client_name:  d.client.name || 'Гость',
          last_service: last?.service_name || '',
          last_master:  last?.master_name  || '',
          last_date:    formatDate(last?.visit_date || null),
          history: visits.slice(1, 4).map((v: { service_name: string | null; visit_date: string | null }) => ({
            service: v.service_name || 'Услуга',
            date:    formatDate(v.visit_date),
          })),
          season,
        })
      })
      .catch(() => setContext({ client_name: 'Гость', last_service: '', last_master: '', last_date: '', history: [], season }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, salonId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!context || greeted) return
    setGreeted(true)
    const prompt = context.last_service
      ? `Поприветствуй ${context.client_name} и дай один короткий персональный совет по уходу после процедуры «${context.last_service}», учитывая текущий сезон.`
      : `Поприветствуй ${context.client_name} и дай один короткий совет по уходу этим ${context.season}.`
    askCompanion(prompt, undefined, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context])

  async function askCompanion(userText: string, scenario?: string, hideUserMsg = false) {
    if (loading || !context) return
    const userMsg: Message = { role: 'user', content: userText }
    if (!hideUserMsg) setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await fetch('/api/beauty-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], context: { ...context, scenario } }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Что-то пошло не так. Попробуйте ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleScenario(s: typeof SCENARIOS[0]) {
    setActiveScenario(s.id)
    askCompanion(`${s.emoji} ${s.label} — дай совет`, s.scenario)
  }

  function handleSend() {
    if (!input.trim() || loading) return
    askCompanion(input)
    setInput('')
  }

  // Guest → show onboarding
  if (!isConnected) return <GuestOnboarding />

  // Connected → show companion chat
  return (
    <div className="min-h-screen bg-cream flex flex-col">

      <div className="max-w-md w-full mx-auto px-4 pt-6 pb-4">

        {/* Top bar — back to client cabinet, never to business routes */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href={`/client?id=${clientId}&salon_id=${salonId}`}
            className="flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors"
          >
            <ArrowLeft size={14} />
            Мой профиль
          </Link>
          <Link href="/" className="text-xs text-dusk/40 hover:text-dusk transition-colors">
            На главную
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-rose/10 border border-rose/20 rounded-full flex items-center justify-center">
            <Heart size={18} className="text-rose" />
          </div>
          <div>
            <p className="text-base font-semibold text-graphite">Beauty Companion</p>
            <p className="text-xs text-dusk">
              Персональный советник по уходу
              {context?.client_name && context.client_name !== 'Гость' && ` · ${context.client_name}`}
            </p>
          </div>
        </div>

        {context?.last_service && (
          <div className="bg-card border border-parchment rounded-2xl px-4 py-3 mb-5">
            <p className="text-[10px] text-dusk font-semibold uppercase tracking-wider mb-2">Последний визит</p>
            <p className="text-sm font-medium text-graphite">{context.last_service}</p>
            {(context.last_master || context.last_date) && (
              <p className="text-xs text-dusk mt-0.5">
                {[context.last_master, context.last_date].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => handleScenario(s)}
              disabled={loading || !context}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border transition-all disabled:opacity-40 ${
                activeScenario === s.id
                  ? 'bg-rose text-white border-rose'
                  : 'bg-card border-parchment text-dusk hover:border-rose/50 hover:text-rose'
              }`}
            >
              <span>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto px-4">
        <div className="space-y-4 py-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' ? (
                <div className="max-w-[90%]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Heart size={11} className="text-rose" />
                    <p className="text-[10px] text-rose font-semibold uppercase tracking-wider">Beauty Companion</p>
                  </div>
                  <div className="bg-blush border border-rose/15 rounded-2xl rounded-tl-sm px-5 py-4">
                    <p className="text-sm text-graphite leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[75%] bg-cream border border-parchment rounded-full px-4 py-2 text-xs text-dusk">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-blush border border-rose/15 rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="flex gap-1.5 items-center">
                  <Sparkles size={12} className="text-rose/50" />
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <div key={delay} className="w-1.5 h-1.5 rounded-full bg-rose/40 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {messages.length > 0 && (
        <div className="max-w-md w-full mx-auto px-4 py-4 border-t border-parchment bg-cream">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Спросить что-то ещё..."
              disabled={loading}
              className="flex-1 bg-card border border-parchment rounded-full px-4 py-2.5 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/40 transition-colors disabled:opacity-50"
            />
            <VoiceButton
              onTranscript={t => setInput(prev => prev ? prev + ' ' + t : t)}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-rose text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
