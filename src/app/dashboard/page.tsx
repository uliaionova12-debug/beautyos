'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCard } from '@/components/dashboard/AlertCard'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { Insight } from '@/types'
import { Users, TrendingDown, BarChart3, Megaphone, Star, Target, Zap, Shield } from 'lucide-react'
import Link from 'next/link'

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
    title: 'Директор по маркетингу',
    description: 'Автоматические кампании возврата и сегментация',
    icon: Megaphone,
    href: '#',
    status: 'soon' as const,
  },
  {
    title: 'Директор по качеству',
    description: 'Мониторинг отзывов и репутации в онлайне',
    icon: Star,
    href: '#',
    status: 'soon' as const,
  },
  {
    title: 'Директор по конкурентам',
    description: 'Цены и рейтинги конкурентов в вашем районе',
    icon: Target,
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
  {
    title: 'Коуч мастера',
    description: 'Личный помощник для каждого мастера',
    icon: Shield,
    href: '#',
    status: 'soon' as const,
  },
]

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!salonId) { setLoading(false); return }

    fetch(`/api/insights?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => { setInsights(d.insights || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [salonId])

  const criticalInsights = insights.filter(i => i.priority === 'critical')
  const otherInsights = insights.filter(i => i.priority !== 'critical')

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BeautyOS</h1>
            <p className="text-zinc-500 text-sm capitalize">{dateStr} · {timeStr}</p>
          </div>
          <Link
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            + Новый салон
          </Link>
        </div>

        {!salonId ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg mb-2">Данные не загружены</p>
            <p className="text-zinc-600 text-sm mb-6">Загрузите данные вашего салона для начала работы</p>
            <Link
              href="/"
              className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
            >
              Загрузить данные
            </Link>
          </div>
        ) : (
          <>
            {/* Сигналы */}
            <div className="mb-8">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
                Сегодня важно
              </p>
              {loading ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              ) : insights.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-500 text-sm">
                  Новых сигналов нет
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalInsights.map(insight => (
                    <AlertCard
                      key={insight.id}
                      insight={insight}
                      onAction={() => window.location.href = `/retention?salon_id=${salonId}`}
                    />
                  ))}
                  {otherInsights.map(insight => (
                    <AlertCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </div>

            {/* AI Директора */}
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
                AI директора
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {AGENTS.map(agent => (
                  <AgentCard
                    key={agent.title}
                    {...agent}
                    href={agent.href === '#' ? '#' : `${agent.href}?salon_id=${salonId}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
