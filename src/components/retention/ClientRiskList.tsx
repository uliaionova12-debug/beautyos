'use client'

import { useState } from 'react'
import { Client } from '@/types'
import { MessageCircle, ChevronDown, ChevronUp, Clock, TrendingUp } from 'lucide-react'

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

function returnScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 0.7) return { label: `${Math.round(score * 100)}% вернётся`, color: 'text-emerald-700', bg: 'bg-emerald-100' }
  if (score >= 0.4) return { label: `${Math.round(score * 100)}% вернётся`, color: 'text-amber-700', bg: 'bg-amber-100' }
  return { label: `${Math.round(score * 100)}% вернётся`, color: 'text-red-700', bg: 'bg-red-100' }
}

function riskLabel(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: 'Высокий риск', color: 'text-red-600' }
  if (score >= 0.5) return { label: 'Средний риск', color: 'text-amber-600' }
  return { label: 'Под наблюдением', color: 'text-yellow-700' }
}

interface Props {
  clients: Client[]
  salonName: string
  title: string
  emptyText: string
}

export function ClientRiskList({ clients, salonName, title, emptyText }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function generateMessage(client: Client) {
    if (messages[client.id]) {
      setExpanded(expanded === client.id ? null : client.id)
      return
    }
    setLoading(client.id)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, salon_name: salonName }),
      })
      const data = await res.json()
      setMessages(prev => ({ ...prev, [client.id]: data.message }))
      setExpanded(client.id)
    } catch {
      setMessages(prev => ({ ...prev, [client.id]: 'Не удалось сгенерировать сообщение' }))
    } finally {
      setLoading(null)
    }
  }

  if (!clients.length) {
    return (
      <div className="text-center py-12 text-dusk">
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-dusk uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-2">
        {clients.map(client => {
          const { label: rLabel, color: rColor } = riskLabel(client.risk_score)
          const { label: rsLabel, color: rsColor, bg: rsBg } = returnScoreLabel(client.return_score ?? 0)
          const isExpanded = expanded === client.id

          return (
            <div key={client.id} className="bg-card border border-parchment rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-graphite font-medium text-sm">{client.name}</span>
                    <span className={`text-xs font-medium ${rColor}`}>{rLabel}</span>
                  </div>
                  <button
                    onClick={() => generateMessage(client)}
                    disabled={loading === client.id}
                    className="flex items-center gap-1.5 text-xs font-medium text-sage hover:opacity-80 transition-opacity disabled:opacity-50 shrink-0"
                  >
                    <MessageCircle size={13} />
                    {loading === client.id ? 'Генерирую...' : 'Написать'}
                    {messages[client.id] && (isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-dusk flex items-center gap-1">
                    <Clock size={11} />
                    {client.days_since_last_visit} дней
                  </span>
                  <span className="text-xs text-dusk/40">·</span>
                  <span className="text-xs text-dusk">чек {formatMoney(client.avg_check)}</span>

                  {(client.return_score ?? 0) > 0 && (
                    <>
                      <span className="text-xs text-dusk/40">·</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${rsColor} ${rsBg}`}>
                        {rsLabel}
                      </span>
                    </>
                  )}

                  {(client.revenue_opportunity ?? 0) > 0 && (
                    <>
                      <span className="text-xs text-dusk/40">·</span>
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <TrendingUp size={11} />
                        {formatMoney(client.revenue_opportunity)}
                      </span>
                    </>
                  )}

                  {client.phone && (
                    <>
                      <span className="text-xs text-dusk/40">·</span>
                      <span className="text-xs text-dusk">{client.phone}</span>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && messages[client.id] && (
                <div className="px-4 pb-4">
                  <div className="bg-blush rounded-xl p-4 border border-parchment">
                    <p className="text-xs text-dusk mb-2 font-semibold uppercase tracking-wide">
                      Текст для отправки
                    </p>
                    <p className="text-sm text-graphite leading-relaxed">{messages[client.id]}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(messages[client.id])}
                      className="mt-3 text-xs text-sage hover:opacity-80 transition-opacity font-medium"
                    >
                      Скопировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
