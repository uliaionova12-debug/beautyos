'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { RetentionTrend } from '@/components/dashboard/RetentionTrend'
import { Users, ArrowRight, Phone, Star, Target, Megaphone, Sparkles } from 'lucide-react'
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
  const [snapshots, setSnapshots] = useState<Array<{ snapshot_date: string; retention_rate: number; total_clients: number; active_clients: number; at_risk_clients: number; lost_clients: number }>>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!salonId) { setLoading(false); return }
    Promise.all([
      fetch(`/api/summary?salon_id=${salonId}`).then(r => r.json()),
      fetch(`/api/daily-action?salon_id=${salonId}`).then(r => r.json()),
      fetch(`/api/snapshots?salon_id=${salonId}`).then(r => r.json()),
    ])
      .then(([summaryData, actionData, snapshotData]) => {
        setSummary(summaryData)
        setDailyAction(actionData.action ?? null)
        setSnapshots(snapshotData.snapshots ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [salonId])

  if (!salonId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-dusk mb-4">Данные не загружены</p>
          <Link href="/join/salon" className="bg-sage text-white font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Загрузить данные
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-graphite tracking-tight">BeautyOS</h1>
            <p className="text-dusk text-sm capitalize mt-0.5">{dateStr} · {timeStr}</p>
          </div>
          <Link href={`/role?salon_id=${salonId}`} className="text-xs text-dusk hover:text-sage transition-colors">
            Сменить роль
          </Link>
        </div>

        {/* DAILY AI BRIEF */}
        {!loading && dailyAction && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
              <p className="text-xs text-sage font-semibold uppercase tracking-wider">
                Главное действие на сегодня
              </p>
            </div>
            <p className="text-graphite font-semibold text-base leading-snug mb-1">
              Позвонить {dailyAction.client_count} клиентам мастера {dailyAction.master_name.split(' ')[0]}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-emerald-600 font-bold">{formatMoney(dailyAction.potential_revenue)}</span>
              <span className="text-dusk/40">·</span>
              <span className="text-dusk text-sm">{Math.round(dailyAction.probability * 100)}% вероятность</span>
            </div>
            <button
              onClick={() => router.push(`/master?salon_id=${salonId}&master=${encodeURIComponent(dailyAction.master_name)}`)}
              className="flex items-center gap-2 text-sm font-semibold text-sage hover:opacity-80 transition-opacity"
            >
              <Phone size={14} />
              Открыть мастера
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ТРЕНД ВОЗВРАТНОСТИ */}
        <RetentionTrend snapshots={snapshots} />

        {/* ГЛАВНЫЙ БЛОК */}
        {loading ? (
          <div className="bg-card border border-parchment rounded-2xl p-6 mb-6 animate-pulse">
            <div className="h-5 bg-parchment rounded w-1/3 mb-4" />
            <div className="h-12 bg-parchment rounded w-1/2 mb-2" />
            <div className="h-4 bg-parchment rounded w-2/3 mb-6" />
            <div className="h-12 bg-parchment rounded" />
          </div>
        ) : summary && summary.at_risk_count > 0 ? (
          <div className="bg-blush border border-terracotta/20 rounded-2xl p-6 mb-6">
            <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-3">
              Сегодня можно вернуть
            </p>
            <div className="flex items-end gap-3 mb-1">
              <span className="text-5xl font-bold text-graphite tracking-tight">
                {summary.at_risk_count}
              </span>
              <span className="text-xl text-dusk pb-1">клиентов</span>
            </div>
            <p className="text-dusk text-sm mb-2">Потенциальная выручка</p>
            <p className="text-2xl font-bold text-emerald-600 mb-6">
              {formatMoney(summary.at_risk_revenue)}
            </p>
            <button
              onClick={() => router.push(`/retention?salon_id=${salonId}`)}
              className="w-full bg-sage text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base"
            >
              Вернуть клиентов
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bg-card border border-parchment rounded-2xl p-6 mb-6">
            <p className="text-dusk text-sm">Нет клиентов, требующих внимания</p>
          </div>
        )}

        {/* Вторичные метрики */}
        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-card border border-parchment rounded-xl p-4">
              <p className="text-xl font-bold text-graphite">{summary.total_clients}</p>
              <p className="text-xs text-dusk mt-1">Всего клиентов</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xl font-bold text-red-600">{summary.lost_count}</p>
              <p className="text-xs text-dusk mt-1">Потеряно</p>
            </div>
            <div className="bg-card border border-parchment rounded-xl p-4">
              <p className="text-xl font-bold text-terracotta">−{formatMoney(summary.lost_impact)}</p>
              <p className="text-xs text-dusk mt-1">Ущерб</p>
            </div>
          </div>
        )}

        {/* AI Director CTA */}
        <Link
          href={`/ai-director?salon_id=${salonId}`}
          className="flex items-center justify-between bg-sage text-white rounded-2xl p-5 mb-6 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="opacity-80 shrink-0" />
            <div>
              <p className="text-sm font-semibold">AI Директор</p>
              <p className="text-xs opacity-70">Задайте любой вопрос о бизнесе</p>
            </div>
          </div>
          <span className="text-sm font-medium opacity-80">→</span>
        </Link>

        {/* AI Директора */}
        <div>
          <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-3">
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
