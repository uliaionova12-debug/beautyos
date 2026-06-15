'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Scissors, TrendingUp, Trophy, Star,
  CalendarDays, Users, Plus, Sparkles,
  Phone, MessageCircle, Loader2, Copy, CheckCircle2, ChevronRight,
} from 'lucide-react'
import { Master, Client } from '@/types'

interface MasterLevel {
  name: string
  minRate: number
  maxRate: number
  color: string
  bg: string
  border: string
  bar: string
}

const LEVELS: MasterLevel[] = [
  { name: 'Новичок',     minRate: 0,    maxRate: 0.40, color: 'text-dusk',        bg: 'bg-cream',       border: 'border-parchment',  bar: 'bg-dusk/40'     },
  { name: 'Развивается', minRate: 0.40, maxRate: 0.55, color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',   bar: 'bg-blue-500'    },
  { name: 'Про',         minRate: 0.55, maxRate: 0.70, color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200', bar: 'bg-violet-500'  },
  { name: 'Эксперт',    minRate: 0.70, maxRate: 0.85, color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',  bar: 'bg-amber-500'   },
  { name: 'Мастер',     minRate: 0.85, maxRate: 1.01, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', bar: 'bg-emerald-500' },
]

function getLevel(rate: number): MasterLevel & { index: number } {
  const idx = LEVELS.findIndex(l => rate >= l.minRate && rate < l.maxRate)
  const level = LEVELS[Math.max(0, idx)]
  return { ...level, index: Math.max(0, idx) }
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

function formatPct(n: number): string {
  return Math.round(n * 100) + '%'
}

// ── Onboarding empty state for masters ──────────────────────────────────────
function MasterOnboarding() {
  const router = useRouter()
  const [loadingDemo, setLoadingDemo] = useState(false)

  async function startDemo() {
    setLoadingDemo(true)
    try {
      const res = await fetch('/sample_salon.csv')
      const blob = await res.blob()
      const file = new File([blob], 'sample_salon.csv', { type: 'text/csv' })
      const form = new FormData()
      form.append('file', file)
      form.append('salon_name', 'Демо-студия')
      const data = await (await fetch('/api/upload', { method: 'POST', body: form })).json()
      if (data.salon_id) router.push(`/master?salon_id=${data.salon_id}`)
    } catch {
      setLoadingDemo(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="max-w-md mx-auto px-6 pt-12 pb-16 w-full flex-1 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-rose/10 rounded-xl flex items-center justify-center">
            <Scissors size={16} className="text-rose" />
          </div>
          <div>
            <p className="text-sm font-semibold text-graphite">BeautyOS</p>
            <p className="text-xs text-dusk">Кабинет мастера</p>
          </div>
        </div>

        {/* Visual */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">

          <div className="relative mb-8">
            <div className="w-20 h-20 bg-rose/10 rounded-3xl flex items-center justify-center mx-auto">
              <CalendarDays size={32} className="text-rose" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-sage/15 rounded-xl flex items-center justify-center">
              <Users size={13} className="text-sage" />
            </div>
          </div>

          <h1 className="font-serif text-[1.8rem] text-graphite leading-tight mb-3 tracking-tight">
            Кабинет готов
          </h1>
          <p className="text-sm text-dusk leading-relaxed mb-10 max-w-[280px]">
            Добавьте первых клиентов, чтобы начать отслеживать возвратность и получать AI-рекомендации.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full mb-10">
            <Link
              href="/join/manual"
              className="flex items-center justify-center gap-2 bg-rose text-white py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-rose/20"
            >
              <Plus size={16} />
              Добавить клиентов
            </Link>

            <button
              onClick={startDemo}
              disabled={loadingDemo}
              className="flex items-center justify-center gap-2 bg-cream border border-parchment text-dusk hover:border-sage/40 hover:text-graphite py-4 rounded-2xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <Sparkles size={15} />
              {loadingDemo ? 'Загружаю демо...' : 'Посмотреть на демо-данных'}
            </button>
          </div>

          {/* What will appear */}
          <div className="w-full bg-card border border-parchment rounded-2xl p-5 text-left">
            <p className="text-xs font-semibold text-dusk uppercase tracking-wider mb-4">
              После добавления клиентов появится:
            </p>
            <ul className="space-y-3">
              {[
                { icon: '📊', text: 'Показатель возвратности клиентов' },
                { icon: '⚠️', text: 'Клиенты в группе риска — кто давно не приходил' },
                { icon: '✨', text: 'AI-Коуч с персональными рекомендациями' },
                { icon: '📈', text: 'Динамика выручки и средний чек' },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">{item.icon}</span>
                  <span className="text-[13px] text-dusk leading-snug">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MasterPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const preselectedMaster = searchParams.get('master') || ''
  const [masters, setMasters] = useState<Master[]>([])
  const [selected, setSelected] = useState<Master | null>(null)
  const [period, setPeriod] = useState<{ from: string; to: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [atRiskClients, setAtRiskClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [smsModal, setSmsModal] = useState<{ client: Client; text: string } | null>(null)
  const [smsCopied, setSmsCopied] = useState(false)
  const [showAllAtRisk, setShowAllAtRisk] = useState(false)

  useEffect(() => {
    if (!salonId) { setLoading(false); return }
    fetch(`/api/masters?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => {
        const list: Master[] = d.masters || []
        setMasters(list)
        if (list.length > 0) {
          const match = preselectedMaster
            ? list.find(m => m.name === preselectedMaster) ?? list[0]
            : list[0]
          setSelected(match)
        }
        if (d.period_from && d.period_to) {
          const fmt = (s: string) => new Date(s).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
          const from = fmt(d.period_from)
          const to = fmt(d.period_to)
          setPeriod({ from, to: from === to ? '' : to })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [salonId, preselectedMaster])

  useEffect(() => {
    if (!selected || !salonId) { setAtRiskClients([]); return }
    setClientsLoading(true)
    setShowAllAtRisk(false)
    fetch(`/api/clients?salon_id=${salonId}&status=at_risk&master_name=${encodeURIComponent(selected.name)}&limit=50`)
      .then(r => r.json())
      .then(d => { setAtRiskClients(d.clients || []); setClientsLoading(false) })
      .catch(() => setClientsLoading(false))
  }, [selected, salonId])

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
    if (digits.startsWith('7') && digits.length === 11) return '+' + digits
    if (digits.length === 10) return '+7' + digits
    return '+' + digits
  }

  async function openSmsForClient(client: Client) {
    setSmsModal(null)
    setMsgLoading(client.id)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, salon_name: 'Салон красоты' }),
      })
      const data = await res.json()
      setSmsModal({ client, text: data.message || '' })
    } catch {
      // ignore
    } finally {
      setMsgLoading(null)
    }
  }

  function sendSms() {
    if (!smsModal?.client.phone) return
    window.location.href = `sms:${formatPhone(smsModal.client.phone)}?body=${encodeURIComponent(smsModal.text)}`
  }

  function copySms() {
    if (!smsModal) return
    navigator.clipboard.writeText(smsModal.text)
    setSmsCopied(true)
    setTimeout(() => setSmsCopied(false), 2000)
  }

  async function generateRecommendation(master: Master) {
    if (messages[master.id]) return
    setMsgLoading(master.id)
    try {
      const res = await fetch('/api/master-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master }),
      })
      const data = await res.json()
      setMessages(prev => ({ ...prev, [master.id]: data.message }))
    } catch {
      setMessages(prev => ({ ...prev, [master.id]: 'Не удалось получить рекомендацию' }))
    } finally {
      setMsgLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-parchment border-t-rose rounded-full animate-spin" />
      </div>
    )
  }

  // No salon_id OR no data → onboarding for masters (not "данные не найдены")
  if (!salonId || masters.length === 0) {
    return <MasterOnboarding />
  }

  // ── Master analytics (data exists) ──
  const isSolo = masters.length === 1

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/role?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Сменить роль
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose/10 rounded-xl">
            <Scissors size={20} className="text-rose" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">
              {isSolo ? 'Мои клиенты' : 'Кабинет мастера'}
            </h1>
            <p className="text-sm text-dusk">
              {isSolo ? 'Возвратность и рекомендации' : 'Ваша практика и рекомендации'}
            </p>
          </div>
        </div>

        {/* Выбор мастера — только если несколько */}
        {masters.length > 1 && (
          <div className="mb-6">
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-2">Специалист</p>
            <div className="flex gap-2 flex-wrap">
              {masters.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selected?.id === m.id
                      ? 'bg-rose text-white'
                      : 'bg-card border border-parchment text-dusk hover:text-graphite'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SMS Модал */}
        {smsModal && (
          <div
            className="fixed inset-0 bg-graphite/40 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSmsModal(null)}
          >
            <div
              className="bg-cream rounded-2xl p-5 w-full max-w-sm shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-graphite mb-1">{smsModal.client.name}</p>
              {smsModal.client.phone ? (
                <a
                  href={`tel:${formatPhone(smsModal.client.phone)}`}
                  className="flex items-center gap-2 text-sm text-rose font-medium mb-4"
                >
                  <Phone size={13} />
                  {formatPhone(smsModal.client.phone)}
                </a>
              ) : (
                <p className="text-xs text-dusk/50 mb-4">Телефон не указан</p>
              )}
              <div className="bg-card border border-parchment rounded-xl p-4 mb-4">
                <p className="text-sm text-graphite leading-relaxed">{smsModal.text}</p>
              </div>
              <div className="flex flex-col gap-2">
                {smsModal.client.phone && (
                  <button
                    onClick={sendSms}
                    className="flex items-center justify-center gap-2 bg-rose text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle size={14} />
                    Отправить сообщение
                  </button>
                )}
                <button
                  onClick={copySms}
                  className="flex items-center justify-center gap-2 bg-card border border-parchment text-graphite py-3 rounded-xl text-sm font-medium hover:border-rose/30 transition-colors"
                >
                  {smsCopied
                    ? <><CheckCircle2 size={13} className="text-emerald-500" /> Скопировано!</>
                    : <><Copy size={13} /> Скопировать текст</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {selected && (
          <>
            {/* Ключевые метрики клиентов */}
            <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
              <div className="bg-card border border-parchment rounded-xl p-4">
                <p className="text-2xl font-bold text-graphite">{selected.active_clients_count}</p>
                <p className="text-xs text-dusk mt-1">Активных клиентов</p>
              </div>
              <div className={`rounded-xl p-4 border ${
                selected.retention_rate >= 0.65
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-2xl font-bold ${
                  selected.retention_rate >= 0.65 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {formatPct(selected.retention_rate)}
                </p>
                <p className="text-xs text-dusk mt-1">Возвратность</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-600">{selected.at_risk_clients_count}</p>
                <p className="text-xs text-dusk mt-1">В группе риска</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-600">{selected.lost_clients_count}</p>
                <p className="text-xs text-dusk mt-1">Потеряно</p>
              </div>
            </div>

            {/* Геймификация уровня */}
            {(() => {
              const level = getLevel(selected.retention_rate)
              const nextLevel = LEVELS[level.index + 1]
              // Сравнение с коллегами — только если несколько мастеров
              const worseCount = masters.filter(m => m.id !== selected.id && m.retention_rate < selected.retention_rate).length
              const rankPct = masters.length > 1 ? Math.round((worseCount / (masters.length - 1)) * 100) : null
              const progressPct = nextLevel
                ? Math.round(((selected.retention_rate - level.minRate) / (nextLevel.minRate - level.minRate)) * 100)
                : 100
              const neededPct = nextLevel ? Math.round((nextLevel.minRate - selected.retention_rate) * 100) : 0

              return (
                <div className={`rounded-2xl p-5 mb-4 border ${level.bg} ${level.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className={level.color} />
                      <span className={`text-sm font-bold ${level.color}`}>{level.name}</span>
                    </div>
                    {rankPct !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-dusk">
                        <Star size={11} className="text-amber-500" />
                        Лучше чем у {rankPct}% коллег
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-dusk mb-1.5">
                      <span>Возвратность {Math.round(selected.retention_rate * 100)}%</span>
                      {nextLevel && <span>до «{nextLevel.name}» — ещё +{neededPct}%</span>}
                    </div>
                    <div className="h-2 bg-parchment rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${level.bar}`} style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {LEVELS.map((l, i) => (
                      <div key={l.name} className={`flex-1 h-1 rounded-full ${
                        i < level.index ? 'bg-graphite/30' : i === level.index ? 'bg-graphite' : 'bg-parchment'
                      }`} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {LEVELS.map((l, i) => (
                      <span key={l.name} className={`text-[10px] ${i === level.index ? 'text-graphite font-semibold' : 'text-dusk/40'}`}>
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Финансы — переформулировано под мастера */}
            <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dusk uppercase tracking-wider mb-1">
                    Выручка{period ? ` · ${period.from}${period.to ? ' — ' + period.to : ''}` : ''}
                  </p>
                  <p className="text-2xl font-bold text-graphite">{formatMoney(selected.total_revenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-dusk uppercase tracking-wider mb-1">Средний чек</p>
                  <p className="text-2xl font-bold text-graphite">{formatMoney(selected.avg_check)}</p>
                </div>
              </div>
              {selected.at_risk_clients_count > 0 && (
                <div className="mt-4 pt-4 border-t border-parchment">
                  <p className="text-sm text-amber-600">
                    Давно не записывались: <span className="font-bold">{selected.at_risk_clients_count} клиентов</span>
                  </p>
                  <p className="text-xs text-dusk mt-0.5">
                    Потенциальная потеря: ~{formatMoney(selected.at_risk_clients_count * selected.avg_check)}
                  </p>
                </div>
              )}
            </div>

            {/* Клиенты в группе риска */}
            {(clientsLoading || atRiskClients.length > 0) && (
              <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-dusk uppercase tracking-wider">
                    Давно не приходили
                  </p>
                  {atRiskClients.length > 0 && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {atRiskClients.length}
                    </span>
                  )}
                </div>

                {clientsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-14 bg-parchment/60 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {(showAllAtRisk ? atRiskClients : atRiskClients.slice(0, 5)).map(client => {
                        const isGenerating = msgLoading === client.id
                        const phone = client.phone ? formatPhone(client.phone) : null
                        return (
                          <div
                            key={client.id}
                            className="flex items-center justify-between gap-3 bg-cream border border-parchment rounded-xl px-4 py-3"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-graphite truncate">{client.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {phone ? (
                                  <a
                                    href={`tel:${phone}`}
                                    className="flex items-center gap-1 text-xs text-rose hover:opacity-80 transition-opacity"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Phone size={10} />
                                    {phone}
                                  </a>
                                ) : (
                                  <span className="text-xs text-dusk/40">нет телефона</span>
                                )}
                                <span className="text-xs text-dusk/30">·</span>
                                <span className="text-xs text-amber-600">
                                  {client.days_since_last_visit} дн.
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => openSmsForClient(client)}
                              disabled={isGenerating}
                              className="flex items-center gap-1.5 shrink-0 bg-rose text-white text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {isGenerating
                                ? <Loader2 size={11} className="animate-spin" />
                                : <MessageCircle size={11} />
                              }
                              {isGenerating ? 'Пишу...' : 'Написать'}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {atRiskClients.length > 5 && (
                      <button
                        onClick={() => setShowAllAtRisk(v => !v)}
                        className="flex items-center gap-1.5 text-xs text-dusk hover:text-graphite transition-colors mt-3 w-full justify-center"
                      >
                        {showAllAtRisk
                          ? 'Свернуть'
                          : `Показать всех ${atRiskClients.length} →`
                        }
                        {!showAllAtRisk && <ChevronRight size={12} />}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* AI Coach */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose/10 rounded-lg">
                    <TrendingUp size={14} className="text-rose" />
                  </div>
                  <p className="text-sm font-semibold text-graphite">AI Коуч</p>
                </div>
                {!messages[selected.id] && (
                  <button
                    onClick={() => generateRecommendation(selected)}
                    disabled={msgLoading === selected.id}
                    className="text-xs text-rose hover:opacity-80 transition-opacity disabled:opacity-50 font-medium"
                  >
                    {msgLoading === selected.id ? 'Анализирую...' : 'Быстрый совет'}
                  </button>
                )}
              </div>

              {messages[selected.id] ? (
                <p className="text-sm text-graphite leading-relaxed mb-4">{messages[selected.id]}</p>
              ) : (
                <p className="text-sm text-dusk mb-4 leading-relaxed">
                  Нажмите «Быстрый совет» или откройте полный AI Коуч — задавайте вопросы о клиентах и развитии практики.
                </p>
              )}

              <Link
                href={`/ai-coach?salon_id=${salonId}`}
                className="flex items-center justify-between w-full bg-rose/8 border border-rose/20 rounded-xl px-4 py-3 hover:bg-rose/12 transition-colors"
              >
                <span className="text-sm font-medium text-rose">Открыть AI Коуч</span>
                <span className="text-rose text-sm">→</span>
              </Link>
            </div>

          </>
        )}

      </div>
    </div>
  )
}
