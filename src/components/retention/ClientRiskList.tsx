'use client'

import { useState } from 'react'
import { Client } from '@/types'
import { MessageCircle, Clock, TrendingUp, Loader2, Phone } from 'lucide-react'

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

function returnScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 0.7) return { label: `${Math.round(score * 100)}% вернётся`, color: 'text-emerald-700', bg: 'bg-emerald-100' }
  if (score >= 0.4) return { label: `${Math.round(score * 100)}% вернётся`, color: 'text-amber-700', bg: 'bg-amber-100' }
  return { label: `${Math.round(score * 100)}% вернётся`, color: 'text-red-700', bg: 'bg-red-100' }
}

function statusLabel(status: string, riskScore: number): { label: string; color: string } {
  if (status === 'active') return { label: 'Активный', color: 'text-emerald-600' }
  if (status === 'lost') return { label: 'Потерянный', color: 'text-red-500' }
  if (riskScore >= 0.8) return { label: 'Высокий риск', color: 'text-red-600' }
  if (riskScore >= 0.5) return { label: 'Средний риск', color: 'text-amber-600' }
  return { label: 'Под наблюдением', color: 'text-yellow-700' }
}

interface Props {
  clients: Client[]
  salonName: string
  title: string
  emptyText: string
}

export function ClientRiskList({ clients, salonName, title, emptyText }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [noPhoneMsg, setNoPhoneMsg] = useState<{ name: string; text: string } | null>(null)

  async function handleWrite(client: Client) {
    setLoadingId(client.id)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, salon_name: salonName }),
      })
      const data = await res.json()
      const message: string = data.message || ''

      if (client.phone) {
        const phone = formatPhone(client.phone)
        const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`
        window.location.href = smsUrl
      } else {
        // Нет телефона — показываем текст для ручной отправки
        setNoPhoneMsg({ name: client.name, text: message })
      }
    } catch {
      // ignore
    } finally {
      setLoadingId(null)
    }
  }

  if (!clients.length) {
    return <div className="text-center py-12 text-dusk"><p>{emptyText}</p></div>
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-dusk uppercase tracking-wider mb-4">{title}</h3>

      {/* Модал для клиентов без телефона */}
      {noPhoneMsg && (
        <div className="fixed inset-0 bg-graphite/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setNoPhoneMsg(null)}>
          <div className="bg-cream rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-1">Нет телефона</p>
            <p className="text-sm font-medium text-graphite mb-3">{noPhoneMsg.name}</p>
            <div className="bg-card border border-parchment rounded-xl p-4 mb-4">
              <p className="text-sm text-graphite leading-relaxed">{noPhoneMsg.text}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(noPhoneMsg.text); setNoPhoneMsg(null) }}
              className="w-full bg-rose text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Скопировать текст
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {clients.map(client => {
          const { label: sLabel, color: sColor } = statusLabel(client.status, client.risk_score)
          const { label: rsLabel, color: rsColor, bg: rsBg } = returnScoreLabel(client.return_score ?? 0)
          const isLoading = loadingId === client.id

          return (
            <div key={client.id} className="bg-card border border-parchment rounded-xl p-4">
              {/* Верхняя строка: имя + статус + кнопка */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold text-graphite">{client.name}</span>
                    <span className={`text-xs font-medium ${sColor}`}>{sLabel}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-1 text-xs text-dusk/60">
                      <Phone size={10} />
                      {client.phone}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleWrite(client)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 shrink-0 bg-rose text-white text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading
                    ? <><Loader2 size={12} className="animate-spin" /> Пишу...</>
                    : <><MessageCircle size={12} /> Написать</>
                  }
                </button>
              </div>

              {/* Метрики */}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="text-xs text-dusk flex items-center gap-1">
                  <Clock size={11} />
                  {client.last_visit_date ? formatDate(client.last_visit_date) : `${client.days_since_last_visit} дн. назад`}
                </span>
                <span className="text-xs text-dusk/30">·</span>
                <span className="text-xs text-dusk">чек {formatMoney(client.avg_check)}</span>

                {(client.return_score ?? 0) > 0 && (
                  <>
                    <span className="text-xs text-dusk/30">·</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${rsColor} ${rsBg}`}>
                      {rsLabel}
                    </span>
                  </>
                )}

                {(client.revenue_opportunity ?? 0) > 0 && (
                  <>
                    <span className="text-xs text-dusk/30">·</span>
                    <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                      <TrendingUp size={11} />
                      {formatMoney(client.revenue_opportunity)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
