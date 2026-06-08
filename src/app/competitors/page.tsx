'use client'

// MOCK — данные статические, реальный источник: 2GIS API + Яндекс.Бизнес (V3)

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp, TrendingDown, Minus, MapPin, Star } from 'lucide-react'

const MOCK_COMPETITORS = [
  {
    id: '1',
    name: 'Beauty Lab',
    distance: '0.3 км',
    rating: 4.8,
    reviews: 312,
    avg_check: 3200,
    trend: 'up' as const,
    new_offer: 'Окрашивание + укладка 4500 ₽',
    strength: 'Сильный онлайн-маркетинг',
    weakness: 'Долгое ожидание по записи',
  },
  {
    id: '2',
    name: 'Salon Pro',
    distance: '0.6 км',
    rating: 4.2,
    reviews: 156,
    avg_check: 2400,
    trend: 'down' as const,
    new_offer: null,
    strength: 'Низкие цены',
    weakness: 'Много негативных отзывов',
  },
  {
    id: '3',
    name: 'Hair Story',
    distance: '1.1 км',
    rating: 4.6,
    reviews: 88,
    avg_check: 2800,
    trend: 'stable' as const,
    new_offer: 'Уход Olaplex от 1800 ₽',
    strength: 'Активные в Instagram',
    weakness: 'Нет записи онлайн',
  },
]

const MY_SALON = { avg_check: 2750, rating: 4.4, reviews: 203 }

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp size={12} className="text-red-400" />
  if (trend === 'down') return <TrendingDown size={12} className="text-emerald-400" />
  return <Minus size={12} className="text-zinc-500" />
}

export default function CompetitorsPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  const avgCompCheck = Math.round(MOCK_COMPETITORS.reduce((s, c) => s + c.avg_check, 0) / MOCK_COMPETITORS.length)
  const checkDiff = MY_SALON.avg_check - avgCompCheck

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <Target size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Директор по конкурентам</h1>
            <p className="text-sm text-zinc-500">Анализ рынка и позиционирование</p>
          </div>
          <span className="ml-auto text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1">
            Mock-данные
          </span>
        </div>

        {/* Позиция на рынке */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Позиция на рынке</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-zinc-600 mb-1">Ваш чек</p>
              <p className="text-xl font-bold text-white">{MY_SALON.avg_check.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 mb-1">Среднее по рынку</p>
              <p className="text-xl font-bold text-zinc-400">{avgCompCheck.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 mb-1">Разница</p>
              <p className={`text-xl font-bold ${checkDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {checkDiff > 0 ? '+' : ''}{checkDiff.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-400">
            {checkDiff > 0
              ? `Ваш средний чек выше рынка на ${checkDiff} ₽ — позиционируйте как премиум-сегмент.`
              : `Средний чек ниже рынка на ${Math.abs(checkDiff)} ₽ — есть пространство для роста цен.`
            }
          </div>
        </div>

        {/* Конкуренты */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Конкуренты поблизости</p>
          <div className="space-y-3">
            {MOCK_COMPETITORS.map(comp => (
              <div key={comp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">{comp.name}</span>
                      <TrendIcon trend={comp.trend} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin size={10} />
                      {comp.distance}
                      <span>·</span>
                      <Star size={10} className="text-amber-400" />
                      {comp.rating} ({comp.reviews})
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{comp.avg_check.toLocaleString('ru-RU')} ₽</p>
                    <p className="text-xs text-zinc-600">средний чек</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-2">
                    <p className="text-[10px] text-zinc-500 mb-0.5">Сильная сторона</p>
                    <p className="text-xs text-zinc-300">{comp.strength}</p>
                  </div>
                  <div className="bg-zinc-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-zinc-500 mb-0.5">Слабость</p>
                    <p className="text-xs text-zinc-300">{comp.weakness}</p>
                  </div>
                </div>

                {comp.new_offer && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/20 border border-amber-800/20 rounded-lg px-3 py-2">
                    <TrendingUp size={11} />
                    Новая акция: {comp.new_offer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
