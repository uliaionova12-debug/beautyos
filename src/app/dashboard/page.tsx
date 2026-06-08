'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { Users, BarChart3, TrendingDown, Zap, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
    title: 'Директор по загрузке',
    description: 'Простои мастеров и незаполненные слоты',
    icon: BarChart3,
    href: '#',
    status: 'soon' as const,
  },
  {
    title: 'Директор по прибыли',
    description: 'Маржинальность услуг и доходность по мастерам',
    icon: TrendingDown,
    href: '#',
    status: 'soon' as const,
  },
  {
    title: 'AI-ассистент клиента',
    description: 'Персональный бот для клиентов в Telegram',
    icon: Zap,
    href: '#',
    status: 'soon' as const,
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
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!salonId) { setLoading(false); return }
    fetch(`/api/summary?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => { setSummary(d); setLoading(false) })
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
