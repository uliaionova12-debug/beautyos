'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Send, TrendingDown, Users, AlertCircle } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }
interface Summary {
  salon_name?: string
  total_clients: number
  active_clients: number
  at_risk_count: number
  at_risk_revenue: number
  lost_count: number
  lost_impact: number
  retention_rate: number
  avg_check: number
  total_revenue: number
  at_risk_top: { name: string; phone: string | null; days_since: number; avg_interval: number; avg_check: number; visits: number }[]
  lost_top: { name: string; phone: string | null; days_since: number; avg_check: number; revenue_opportunity: number }[]
  masters: { name: string; retention_rate: number; avg_check: number; total_revenue: number; active_clients_count: number; at_risk_clients_count: number }[]
}

const SUGGESTED = [
  'Кого вернуть в первую очередь?',
  'Почему клиенты уходят?',
  'Как увеличить средний чек?',
  'С чего начать реактивацию?',
  'Как поднять рейтинг?',
  'Что делают конкуренты?',
]

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export default function AiDirectorPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [summary, setSummary] = useState<Summary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!salonId) { setContextLoading(false); return }
    fetch(`/api/summary?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => { setSummary(d); setContextLoading(false) })
      .catch(() => setContextLoading(false))
  }, [salonId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          context: summary ?? {},
        }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Не удалось получить ответ. Проверьте подключение.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-6 pb-4">
        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Дашборд
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sage/10 rounded-xl">
            <Sparkles size={20} className="text-sage" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-graphite">AI Директор</h1>
            <p className="text-xs text-dusk">Бизнес-советник салона</p>
          </div>
        </div>

        {/* Context card */}
        {!contextLoading && summary && (
          <div className="mt-4 bg-card border border-parchment rounded-2xl p-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-dusk mb-0.5">Клиентов</p>
              <p className="text-lg font-bold text-graphite">{summary.total_clients}</p>
            </div>
            <div>
              <p className="text-xs text-dusk mb-0.5">Возвратность</p>
              <p className={`text-lg font-bold ${summary.retention_rate >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {summary.retention_rate}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <AlertCircle size={11} className="text-amber-500" />
                <p className="text-xs text-dusk">В риске</p>
              </div>
              <p className="text-lg font-bold text-amber-600">{summary.at_risk_count}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingDown size={11} className="text-terracotta" />
                <p className="text-xs text-dusk">Ущерб</p>
              </div>
              <p className="text-lg font-bold text-terracotta">{formatMoney(summary.lost_impact)}</p>
            </div>
          </div>
        )}

        {/* Suggested questions */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="shrink-0 text-xs bg-card border border-parchment text-dusk hover:border-sage/50 hover:text-sage px-3 py-2 rounded-full transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-sage/10 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-sage" />
            </div>
            <p className="text-sm font-medium text-graphite mb-1">Готов к работе</p>
            <p className="text-xs text-dusk max-w-xs leading-relaxed">
              Задайте вопрос о бизнесе или выберите один из вариантов выше
            </p>
          </div>
        )}

        <div className="space-y-4 py-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sage text-white rounded-br-md'
                  : 'bg-card border border-parchment text-graphite rounded-bl-md'
              }`}>
                {msg.role === 'assistant' && (
                  <p className="text-[10px] text-sage font-semibold uppercase tracking-wider mb-1.5">AI Директор</p>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-parchment rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="max-w-2xl w-full mx-auto px-4 py-4 border-t border-parchment bg-cream">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Спросите о бизнесе..."
            disabled={loading}
            className="flex-1 bg-card border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-sage text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
