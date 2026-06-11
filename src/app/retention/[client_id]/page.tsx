'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Clock, TrendingUp, Calendar,
  MessageCircle, Loader2, Copy, CheckCircle2,
} from 'lucide-react'
import { Client } from '@/types'

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

function statusInfo(status: string, riskScore: number) {
  if (status === 'active')
    return { label: 'Активный', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  if (status === 'lost')
    return { label: 'Потерянный', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  if (riskScore >= 0.8)
    return { label: 'Высокий риск', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  if (riskScore >= 0.5)
    return { label: 'Средний риск', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { label: 'Под наблюдением', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' }
}

function returnScoreColors(score: number) {
  if (score >= 0.7)
    return { text: 'text-emerald-600', bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  if (score >= 0.4)
    return { text: 'text-amber-600', bar: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { text: 'text-red-600', bar: 'bg-red-400', bg: 'bg-red-50', border: 'border-red-200' }
}

export default function ClientDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.client_id as string
  const salonId = searchParams.get('salon_id') || ''

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!clientId || !salonId) { setLoading(false); return }
    fetch(`/api/clients/${clientId}?salon_id=${salonId}`)
      .then(r => r.json())
      .then(data => { setClient(data.client ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId, salonId])

  async function generateMessage() {
    if (!client) return
    setMsgLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, salon_name: 'Салон красоты' }),
      })
      const data = await res.json()
      setMessage(data.message || '')
    } catch {
      // ignore
    } finally {
      setMsgLoading(false)
    }
  }

  function copyMessage() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openSms() {
    if (!client?.phone) return
    window.location.href = `sms:${formatPhone(client.phone)}?body=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-parchment border-t-rose rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-dusk mb-4">Клиент не найден</p>
          <Link href={`/retention?salon_id=${salonId}`} className="text-sage text-sm hover:opacity-80 transition-opacity">
            ← Вернуться к списку
          </Link>
        </div>
      </div>
    )
  }

  const status = statusInfo(client.status, client.risk_score)
  const retScore = returnScoreColors(client.return_score ?? 0)
  const phone = client.phone ? formatPhone(client.phone) : null

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-8">

        <Link
          href={`/retention?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Список клиентов
        </Link>

        {/* Шапка */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-semibold text-graphite leading-tight">{client.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${status.color} ${status.bg} ${status.border}`}>
              {status.label}
            </span>
          </div>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-sm text-rose font-medium hover:opacity-80 transition-opacity"
            >
              <Phone size={14} />
              {phone}
            </a>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-dusk/50">
              <Phone size={12} />
              Телефон не указан
            </p>
          )}
        </div>

        {/* Вероятность возврата */}
        <div className={`rounded-2xl p-5 mb-4 border ${retScore.bg} ${retScore.border}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-dusk mb-3">
            Вероятность возврата
          </p>
          <div className="flex items-end gap-3 mb-3">
            <span className={`text-5xl font-bold tracking-tight ${retScore.text}`}>
              {Math.round((client.return_score ?? 0) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-white/70 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full ${retScore.bar}`}
              style={{ width: `${Math.round((client.return_score ?? 0) * 100)}%` }}
            />
          </div>
          {(client.revenue_opportunity ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                {formatMoney(client.revenue_opportunity)} потенциал / год
              </span>
            </div>
          )}
        </div>

        {/* Метрики */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-dusk mb-4">История</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dusk flex items-center gap-2">
                <Clock size={13} /> Последний визит
              </span>
              <span className="text-sm font-medium text-graphite text-right">
                {client.days_since_last_visit} дн. назад
                <span className="text-xs text-dusk font-normal ml-1">
                  · {formatDate(client.last_visit_date)}
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dusk flex items-center gap-2">
                <Calendar size={13} /> Интервал между визитами
              </span>
              <span className="text-sm font-medium text-graphite">
                {client.avg_interval_days > 0
                  ? `каждые ${client.avg_interval_days} дн.`
                  : 'один визит'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dusk">Всего визитов</span>
              <span className="text-sm font-medium text-graphite">{client.total_visits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dusk">Средний чек</span>
              <span className="text-sm font-medium text-graphite">{formatMoney(client.avg_check)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dusk">Первый визит</span>
              <span className="text-sm font-medium text-graphite">{formatDate(client.first_visit_date)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-parchment">
              <span className="text-sm text-dusk">Общая выручка</span>
              <span className="text-sm font-bold text-graphite">{formatMoney(client.total_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Написать клиенту */}
        <div className="bg-card border border-parchment rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-dusk mb-4">
            Написать клиенту
          </p>

          {!message ? (
            <button
              onClick={generateMessage}
              disabled={msgLoading}
              className="w-full flex items-center justify-center gap-2 bg-rose text-white py-4 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {msgLoading
                ? <><Loader2 size={15} className="animate-spin" /> Генерирую сообщение...</>
                : <><MessageCircle size={15} /> Сгенерировать сообщение</>
              }
            </button>
          ) : (
            <div>
              <div className="bg-cream border border-parchment rounded-xl p-4 mb-3">
                <p className="text-sm text-graphite leading-relaxed">{message}</p>
              </div>
              <div className="flex flex-col gap-2">
                {phone && (
                  <button
                    onClick={openSms}
                    className="w-full flex items-center justify-center gap-2 bg-rose text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle size={15} />
                    Отправить · {phone}
                  </button>
                )}
                <button
                  onClick={copyMessage}
                  className="w-full flex items-center justify-center gap-2 bg-cream border border-parchment text-graphite py-3 rounded-xl text-sm font-medium hover:border-rose/30 transition-colors"
                >
                  {copied
                    ? <><CheckCircle2 size={14} className="text-emerald-500" /> Скопировано!</>
                    : <><Copy size={14} /> Скопировать текст</>
                  }
                </button>
                <button
                  onClick={() => setMessage('')}
                  className="text-xs text-dusk/50 hover:text-dusk transition-colors py-1 text-center"
                >
                  Сгенерировать заново
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
