'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, Send, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const CLIENT_CONTEXT = {
  client_name: 'Юлия',
  last_service: 'Окрашивание + укладка',
  last_master: 'Наталья',
  last_date: '15 мая 2026',
  history: [
    { service: 'Стрижка + уход', date: 'март 2026' },
    { service: 'Ламинирование волос', date: 'январь 2026' },
  ],
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

export default function BeautyCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [greeted, setGreeted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const season = getSeason()

  // Auto-greeting on mount
  useEffect(() => {
    if (greeted) return
    setGreeted(true)
    askCompanion(
      `Поприветствуй ${CLIENT_CONTEXT.client_name} и дай один короткий персональный совет по уходу, учитывая её последний визит и текущий сезон.`,
      undefined,
      true // greeting — не отображаем вопрос пользователя
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function askCompanion(userText: string, scenario?: string, hideUserMsg = false) {
    if (loading) return

    const userMsg: Message = { role: 'user', content: userText }
    const withUser = hideUserMsg ? messages : [...messages, userMsg]
    if (!hideUserMsg) setMessages(withUser)
    setLoading(true)

    try {
      const res = await fetch('/api/beauty-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: { ...CLIENT_CONTEXT, season, scenario },
        }),
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
    askCompanion(
      `${s.emoji} ${s.label} — дай совет`,
      s.scenario
    )
  }

  function handleSend() {
    if (!input.trim() || loading) return
    askCompanion(input)
    setInput('')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Header */}
      <div className="max-w-md w-full mx-auto px-4 pt-6 pb-4">
        <Link
          href="/client"
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Назад
        </Link>

        {/* Identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-rose/10 border border-rose/20 rounded-full flex items-center justify-center">
            <Heart size={18} className="text-rose" />
          </div>
          <div>
            <p className="text-base font-semibold text-graphite">Beauty Companion</p>
            <p className="text-xs text-dusk">Персональный советник по уходу · {CLIENT_CONTEXT.client_name}</p>
          </div>
        </div>

        {/* Last visit context */}
        <div className="bg-card border border-parchment rounded-2xl px-4 py-3 mb-5">
          <p className="text-[10px] text-dusk font-semibold uppercase tracking-wider mb-2">Последний визит</p>
          <p className="text-sm font-medium text-graphite">{CLIENT_CONTEXT.last_service}</p>
          <p className="text-xs text-dusk mt-0.5">{CLIENT_CONTEXT.last_master} · {CLIENT_CONTEXT.last_date}</p>
        </div>

        {/* Scenarios */}
        <div className="flex gap-2 flex-wrap">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => handleScenario(s)}
              disabled={loading}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto px-4">
        <div className="space-y-4 py-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' ? (
                // Beauty Companion response — editorial card style
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
                // User message — subtle chip
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
                    <div className="w-1.5 h-1.5 rounded-full bg-rose/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-rose/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-rose/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input — appears after first message */}
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
