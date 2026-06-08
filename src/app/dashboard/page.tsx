'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { Users, BarChart3, TrendingDown, Zap, ArrowRight, Phone, Star, Target, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { DailyAction } from '@/types'

interface Summary {
  at_risk_count: number
  at_risk_revenue: number
  lost_count: number
  lost_impact: number
  total_clients: number
}

const AGENTS = [
  {
    title: 'Директор по возврату',
    description: 'Возвратность клиентов и финансовые потери от оттока',
    icon: Users,
    href: '/retention',
    status: 'active' as const,
  },
  {
    title: 'Директор по репутации',
    description: 'Рейтинг, неотвеченные отзывы и AI-ответы',
    icon: Star,
    href: '/reputation',
    status: 'active' as const,
  },
  {
    title: 'Директор по конкурентам',
    description: 'Анализ рынка, чек и акции конкурентов',
    icon: Target,
    href: '/competitors',
    status: 'active' as const,
  },
  {
    title: 'Директор по маркетингу',
    description: 'Контент-план, акции и идеи для роста',
    icon: Megaphone,
    href: '/marketing',
    status: 'active' as const,
  },
]

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const salonId = searchParams.get('salon_id') || ''
  const [summary, setSummary] = useState<Summary | null>(null)
  const [dailyAction, setDailyAction] = useState<DailyAction | null>(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!salonId) { setLoading(false); return }
    Promise.all([
      fetch(`/api/summary?salon_id=${salonId}`).then(r => r.json()),
      fetch(`/api/daily-action?salon_id=${salonId}`).then(r => r.json()),
    ])
      .then(([summaryData, actionData]) => {
        setSummary(summaryData)
        setDailyAction(actionData.action ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [salonId])

  if (!salonId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Данные не загружены</p>
          <Link href="/" className="bg-white text-black font-semibold px-6 py-3 rounded-xl text-sm">
            Загрузить данные
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BeautyOS</h1>
            <p className="text-zinc-500 text-sm capitalize">{dateStr} · {timeStr}</p>
          </div>
          <Link href={`/role?salon_id=${salonId}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Сменить роль
          </Link>
        </div>

        {/* DAILY AI BRIEF */}
        {!loading && dailyAction && (
          <div className="bg-gradient-to-r from-violet-950/50 to-purple-950/40 border border-violet-700/30 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wider">
                Главное действие на сегодня
              </p>
            </div>
            <p className="text-white font-semibold text-base leading-snug mb-1">
              Позвонить {dailyAction.client_count} клиентам мастера {dailyAction.master_name.split(' ')[0]}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-emerald-400 font-bold">{formatMoney(dailyAction.potential_revenue)}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 text-sm">{Math.round(dailyAction.probability * 100)}% вероятность</span>
            </div>
            <button
              onClick={() => router.push(`/retention?salon_id=${salonId}&tab=at_risk`)}
              className="flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors"
            >
              <Phone size={14} />
              Открыть список
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ГЛАВНЫЙ БЛОК — ACTION FIRST */}
        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 animate-pulse">
            <div className="h-5 bg-zinc-800 rounded w-1/3 mb-4" />
            <div className="h-12 bg-zinc-800 rounded w-1/2 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-2/3 mb-6" />
            <div className="h-12 bg-zinc-800 rounded" />
          </div>
        ) : summary && summary.at_risk_count > 0 ? (
          <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/40 border border-blue-700/30 rounded-2xl p-6 mb-6">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-3">
              Сегодня можно вернуть
            </p>
            <div className="flex items-end gap-3 mb-1">
              <span className="text-5xl font-bold text-white tracking-tight">
                {summary.at_risk_count}
              </span>
              <span className="text-xl text-zinc-400 pb-1">клиентов</span>
            </div>
            <p className="text-zinc-400 text-sm mb-2">
              Потенциальная выручка
            </p>
            <p className="text-2xl font-bold text-emerald-400 mb-6">
              {formatMoney(summary.at_risk_revenue)}
            </p>
            <button
              onClick={() => router.push(`/retention?salon_id=${salonId}`)}
              className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-base"
            >
              Вернуть клиентов
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
            <p className="text-zinc-400 text-sm">Нет клиентов требующих внимания</p>
          </div>
        )}

        {/* Вторичные метрики */}
        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xl font-bold text-white">{summary.total_clients}</p>
              <p className="text-xs text-zinc-500 mt-1">Всего клиентов</p>
            </div>
            <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
              <p className="text-xl font-bold text-red-400">{summary.lost_count}</p>
              <p className="text-xs text-zinc-500 mt-1">Потеряно</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xl font-bold text-red-400">−{formatMoney(summary.lost_impact)}</p>
              <p className="text-xs text-zinc-500 mt-1">Ущерб</p>
            </div>
          </div>
        )}

        {/* AI Директора */}
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
            AI директора
          </p>
          <div className="grid grid-cols-2 gap-3">
            {AGENTS.map(agent => (
              <AgentCard
                key={agent.title}
                {...agent}
                href={agent.href === '#' ? '#' : `${agent.href}?salon_id=${salonId}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
