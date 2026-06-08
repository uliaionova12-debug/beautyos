'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Scissors, TrendingUp, Trophy, Star } from 'lucide-react'
import { Master } from '@/types'

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
  { name: 'Новичок',     minRate: 0,    maxRate: 0.40, color: 'text-dusk',        bg: 'bg-cream',        border: 'border-parchment', bar: 'bg-dusk/40' },
  { name: 'Развивается', minRate: 0.40, maxRate: 0.55, color: 'text-blue-600',    bg: 'bg-blue-50',      border: 'border-blue-200',  bar: 'bg-blue-500' },
  { name: 'Про',         minRate: 0.55, maxRate: 0.70, color: 'text-violet-600',  bg: 'bg-violet-50',    border: 'border-violet-200', bar: 'bg-violet-500' },
  { name: 'Эксперт',    minRate: 0.70, maxRate: 0.85, color: 'text-amber-600',   bg: 'bg-amber-50',     border: 'border-amber-200', bar: 'bg-amber-500' },
  { name: 'Мастер',     minRate: 0.85, maxRate: 1.01, color: 'text-emerald-600', bg: 'bg-emerald-50',   border: 'border-emerald-200', bar: 'bg-emerald-500' },
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

export default function MasterPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [masters, setMasters] = useState<Master[]>([])
  const [selected, setSelected] = useState<Master | null>(null)
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!salonId) { setLoading(false); return }
    fetch(`/api/masters?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => {
        const list: Master[] = d.masters || []
        setMasters(list)
        if (list.length > 0) setSelected(list[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [salonId])

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
        <div className="w-8 h-8 border-2 border-parchment border-t-sage rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/role?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Сменить роль
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sage/10 rounded-xl">
            <Scissors size={20} className="text-sage" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Кабинет мастера</h1>
            <p className="text-sm text-dusk">Ваша практика и рекомендации</p>
          </div>
        </div>

        {/* Выбор мастера */}
        {masters.length > 1 && (
          <div className="mb-6">
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-2">Мастер</p>
            <div className="flex gap-2 flex-wrap">
              {masters.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selected?.id === m.id
                      ? 'bg-sage text-white'
                      : 'bg-card border border-parchment text-dusk hover:text-graphite'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <>
            {/* Главные цифры */}
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

            {/* Геймификация */}
            {(() => {
              const level = getLevel(selected.retention_rate)
              const nextLevel = LEVELS[level.index + 1]
              const worseCount = masters.filter(m => m.id !== selected.id && m.retention_rate < selected.retention_rate).length
              const rankPct = masters.length > 1 ? Math.round((worseCount / (masters.length - 1)) * 100) : 100
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
                    {masters.length > 1 && (
                      <div className="flex items-center gap-1.5 text-xs text-dusk">
                        <Star size={11} className="text-amber-500" />
                        Лучше чем у {rankPct}% мастеров
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-dusk mb-1.5">
                      <span>Возвратность {Math.round(selected.retention_rate * 100)}%</span>
                      {nextLevel && <span>до «{nextLevel.name}» — ещё +{neededPct}%</span>}
                    </div>
                    <div className="h-2 bg-parchment rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${level.bar}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {LEVELS.map((l, i) => (
                      <div
                        key={l.name}
                        className={`flex-1 h-1 rounded-full ${
                          i < level.index ? 'bg-graphite/30' :
                          i === level.index ? 'bg-graphite' : 'bg-parchment'
                        }`}
                      />
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

            {/* Финансы */}
            <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dusk uppercase tracking-wider mb-1">Выручка</p>
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
                    Не записались повторно: <span className="font-bold">{selected.at_risk_clients_count} клиентов</span>
                  </p>
                  <p className="text-xs text-dusk mt-0.5">
                    Потенциальная потеря: ~{formatMoney(selected.at_risk_clients_count * selected.avg_check)}
                  </p>
                </div>
              )}
            </div>

            {/* AI Coach */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sage/10 rounded-lg">
                    <TrendingUp size={14} className="text-sage" />
                  </div>
                  <p className="text-sm font-semibold text-graphite">AI-коуч мастера</p>
                </div>
                {!messages[selected.id] && (
                  <button
                    onClick={() => generateRecommendation(selected)}
                    disabled={msgLoading === selected.id}
                    className="text-xs text-sage hover:opacity-80 transition-opacity disabled:opacity-50 font-medium"
                  >
                    {msgLoading === selected.id ? 'Анализирую...' : 'Получить совет'}
                  </button>
                )}
              </div>

              {messages[selected.id] ? (
                <p className="text-sm text-graphite leading-relaxed">{messages[selected.id]}</p>
              ) : (
                <div className="space-y-2 text-sm text-dusk">
                  <p>Нажмите «Получить совет» — AI-коуч проанализирует вашу практику и подскажет:</p>
                  <ul className="space-y-1 pl-3">
                    <li>· кому написать для повторной записи</li>
                    <li>· кому предложить дополнительную услугу</li>
                    <li>· кто в зоне риска ухода</li>
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {masters.length === 0 && (
          <div className="text-center py-12 text-dusk">
            <p>Данные мастеров не найдены</p>
            <Link href="/join/salon" className="text-sage hover:opacity-80 transition-opacity text-sm mt-2 inline-block">
              Загрузить данные
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
