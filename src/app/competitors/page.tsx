'use client'

export const dynamic = 'force-dynamic'

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
  if (trend === 'up') return <TrendingUp size={12} className="text-red-500" />
  if (trend === 'down') return <TrendingDown size={12} className="text-emerald-600" />
  return <Minus size={12} className="text-dusk" />
}

export default function CompetitorsPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  const avgCompCheck = Math.round(MOCK_COMPETITORS.reduce((s, c) => s + c.avg_check, 0) / MOCK_COMPETITORS.length)
  const checkDiff = MY_SALON.avg_check - avgCompCheck

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Дашборд
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-terracotta/10 rounded-xl">
            <Target size={20} className="text-terracotta" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Директор по конкурентам</h1>
            <p className="text-sm text-dusk">Анализ рынка и позиционирование</p>
          </div>
          <span className="ml-auto text-xs text-dusk/60 bg-cream border border-parchment rounded-full px-2.5 py-1">
            Mock-данные
          </span>
        </div>

        {/* Позиция на рынке */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-6">
          <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-4">Позиция на рынке</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-dusk/60 mb-1">Ваш чек</p>
              <p className="text-xl font-bold text-graphite">{MY_SALON.avg_check.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-xs text-dusk/60 mb-1">Среднее по рынку</p>
              <p className="text-xl font-bold text-dusk">{avgCompCheck.toLocaleString('ru-RU')} ₽</p>
            </div>
            <div>
              <p className="text-xs text-dusk/60 mb-1">Разница</p>
              <p className={`text-xl font-bold ${checkDiff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {checkDiff > 0 ? '+' : ''}{checkDiff.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-parchment text-sm text-dusk">
            {checkDiff > 0
              ? `Ваш средний чек выше рынка на ${checkDiff} ₽ — позиционируйте как премиум-сегмент.`
              : `Средний чек ниже рынка на ${Math.abs(checkDiff)} ₽ — есть пространство для роста цен.`
            }
          </div>
        </div>

        {/* Конкуренты */}
        <div>
          <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-3">Конкуренты поблизости</p>
          <div className="space-y-3">
            {MOCK_COMPETITORS.map(comp => (
              <div key={comp.id} className="bg-card border border-parchment rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-graphite font-semibold text-sm">{comp.name}</span>
                      <TrendIcon trend={comp.trend} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dusk">
                      <MapPin size={10} />
                      {comp.distance}
                      <span>·</span>
                      <Star size={10} className="text-amber-500" />
                      {comp.rating} ({comp.reviews})
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-graphite">{comp.avg_check.toLocaleString('ru-RU')} ₽</p>
                    <p className="text-xs text-dusk/60">средний чек</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                    <p className="text-[10px] text-dusk mb-0.5">Сильная сторона</p>
                    <p className="text-xs text-graphite">{comp.strength}</p>
                  </div>
                  <div className="bg-cream border border-parchment rounded-lg p-2">
                    <p className="text-[10px] text-dusk mb-0.5">Слабость</p>
                    <p className="text-xs text-graphite">{comp.weakness}</p>
                  </div>
                </div>

                {comp.new_offer && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
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
