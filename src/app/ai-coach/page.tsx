'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Scissors, TrendingUp, Star, AlertCircle } from 'lucide-react'
import { VoiceButton } from '@/components/ui/VoiceButton'
import { Master } from '@/types'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTED = [
  'Кому написать сегодня?',
  'Как повысить возвратность?',
  'Что предложить клиентам?',
  'Как вырасти в доходе?',
  'Кто мои лучшие клиенты?',
  'Что улучшить в практике?',
]

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export default function AiCoachPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [masters, setMasters] = useState<Master[]>([])
  const [selected, setSelected] = useState<Master | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!salonId) { setContextLoading(false); return }
    fetch(`/api/masters?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => {
        const list: Master[] = d.masters || []
        setMasters(list)
        if (list.length > 0) setSelected(list[0])
        setContextLoading(false)
      })
      .catch(() => setContextLoading(false))
  }, [salonId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset conversation when master changes
  useEffect(() => {
    setMessages([])
  }, [selected?.id])

  async function send(text: string) {
    if (!text.trim() || loading || !selected) return
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, master: selected }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Не удалось получить ответ. Попробуйте ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-6 pb-4">
        <Link
          href={`/master?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Кабинет мастера
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sage/10 rounded-xl">
            <Scissors size={20} className="text-sage" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-graphite">AI Коуч</h1>
            <p className="text-xs text-dusk">Советник по развитию практики</p>
          </div>
        </div>

        {/* Master selector */}
        {masters.length > 1 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {masters.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  selected?.id === m.id
                    ? 'bg-sage text-white'
                    : 'bg-card border border-parchment text-dusk hover:text-graphite'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* Context card */}
        {!contextLoading && selected && (
          <div className="mt-4 bg-card border border-parchment rounded-2xl p-4 grid grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-dusk mb-0.5">Клиентов</p>
              <p className="text-base font-bold text-graphite">{selected.active_clients_count}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp size={10} className="text-emerald-600" />
                <p className="text-xs text-dusk">Возврат</p>
              </div>
              <p className={`text-base font-bold ${selected.retention_rate >= 0.65 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {Math.round(selected.retention_rate * 100)}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <AlertCircle size={10} className="text-amber-500" />
                <p className="text-xs text-dusk">Риск</p>
              </div>
              <p className="text-base font-bold text-amber-600">{selected.at_risk_clients_count}</p>
            </div>
            <div>
              <p className="text-xs text-dusk mb-0.5">Чек</p>
              <p className="text-base font-bold text-graphite">{formatMoney(selected.avg_check)}</p>
            </div>
          </div>
        )}

        {/* Suggested */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading || !selected}
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
              <Scissors size={24} className="text-sage" />
            </div>
            <p className="text-sm font-medium text-graphite mb-1">
              {selected ? `Привет, ${selected.name.split(' ')[0]}!` : 'AI Коуч готов'}
            </p>
            <p className="text-xs text-dusk max-w-xs leading-relaxed">
              Выберите вопрос выше или задайте свой
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
                  <p className="text-[10px] text-sage font-semibold uppercase tracking-wider mb-1.5">AI Коуч</p>
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
            placeholder="Спросите о вашей практике..."
            disabled={loading || !selected}
            className="flex-1 bg-card border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors disabled:opacity-50"
          />
          <VoiceButton
            onTranscript={t => setInput(prev => prev ? prev + ' ' + t : t)}
            disabled={loading || !selected}
            variant="sage"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading || !selected}
            className="w-11 h-11 bg-sage text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
