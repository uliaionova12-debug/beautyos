'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Scissors, TrendingUp, UserX, Users, MessageCircle } from 'lucide-react'
import { Master } from '@/types'

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/role?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Сменить роль
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl">
            <Scissors size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Кабинет мастера</h1>
            <p className="text-sm text-zinc-500">Ваша практика и рекомендации</p>
          </div>
        </div>

        {/* Выбор мастера */}
        {masters.length > 1 && (
          <div className="mb-6">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Мастер</p>
            <div className="flex gap-2 flex-wrap">
              {masters.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selected?.id === m.id
                      ? 'bg-white text-black'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{selected.active_clients_count}</p>
                <p className="text-xs text-zinc-500 mt-1">Активных клиентов</p>
              </div>
              <div className={`rounded-xl p-4 border ${
                selected.retention_rate >= 0.65
                  ? 'bg-emerald-950/30 border-emerald-800/30'
                  : 'bg-amber-950/30 border-amber-800/30'
              }`}>
                <p className={`text-2xl font-bold ${
                  selected.retention_rate >= 0.65 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {formatPct(selected.retention_rate)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Возвратность</p>
              </div>
              <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-400">{selected.at_risk_clients_count}</p>
                <p className="text-xs text-zinc-500 mt-1">В группе риска</p>
              </div>
              <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-400">{selected.lost_clients_count}</p>
                <p className="text-xs text-zinc-500 mt-1">Потеряно</p>
              </div>
            </div>

            {/* Финансы */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Выручка</p>
                  <p className="text-2xl font-bold text-white">{formatMoney(selected.total_revenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Средний чек</p>
                  <p className="text-2xl font-bold text-white">{formatMoney(selected.avg_check)}</p>
                </div>
              </div>
              {/* Потенциальные потери */}
              {selected.at_risk_clients_count > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-sm text-amber-400">
                    Не записались повторно: <span className="font-bold">{selected.at_risk_clients_count} клиентов</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Потенциальная потеря: ~{formatMoney(selected.at_risk_clients_count * selected.avg_check)}
                  </p>
                </div>
              )}
            </div>

            {/* AI Coach */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg">
                    <TrendingUp size={14} className="text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">AI-коуч мастера</p>
                </div>
                {!messages[selected.id] && (
                  <button
                    onClick={() => generateRecommendation(selected)}
                    disabled={msgLoading === selected.id}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                  >
                    {msgLoading === selected.id ? 'Анализирую...' : 'Получить совет'}
                  </button>
                )}
              </div>

              {messages[selected.id] ? (
                <p className="text-sm text-zinc-300 leading-relaxed">{messages[selected.id]}</p>
              ) : (
                <div className="space-y-2 text-sm text-zinc-500">
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
          <div className="text-center py-12 text-zinc-500">
            <p>Данные мастеров не найдены</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
              Загрузить данные
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
