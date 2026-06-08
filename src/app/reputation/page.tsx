'use client'

// Внешние отзывы (Яндекс/Google/2GIS) — MOCK, реальный источник: API площадок (V3)
// Внутренние отзывы — РЕАЛЬНЫЕ данные из Supabase reviews

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, MessageSquare, TrendingUp,
  AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react'

interface InternalReview {
  id: string
  client_name: string
  master_name: string | null
  rating: number
  text: string | null
  is_public: boolean
  platform: string | null
  created_at: string
}

const MOCK_EXTERNAL = [
  {
    id: 'e1',
    author: 'Анна К.',
    rating: 5,
    text: 'Потрясающий результат! Наталья — волшебница. Приду ещё.',
    date: '3 дня назад',
    platform: 'Яндекс',
    answered: true,
    master: 'Наталья',
  },
  {
    id: 'e2',
    author: 'Мария П.',
    rating: 2,
    text: 'Ждала запись 40 минут. Мастер не извинился. Очень расстроена.',
    date: '5 дней назад',
    platform: 'Google',
    answered: false,
    master: 'Ольга',
  },
  {
    id: 'e3',
    author: 'Светлана В.',
    rating: 5,
    text: 'Салон стал моим любимым местом. Всегда отличная атмосфера и результат.',
    date: '1 неделю назад',
    platform: '2GIS',
    answered: false,
    master: 'Наталья',
  },
]

const AI_RESPONSE =
  'Мария, добрый день! Приносим искренние извинения за ожидание — это недопустимо. ' +
  'Свяжитесь с нами по телефону или в директ, и мы предложим вам скидку на следующий визит. ' +
  'Обязательно поговорим с мастером. Надеемся снова увидеть вас!'

function platformLabel(platform: string | null): string {
  if (!platform || platform === 'internal') return 'Внутренний'
  if (platform === 'yandex') return 'Яндекс'
  if (platform === 'google') return 'Google'
  if (platform === '2gis') return '2GIS'
  if (platform === 'vk') return 'ВКонтакте'
  return platform
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  const d = Math.floor(h / 24)
  return `${d} дн назад`
}

export default function ReputationPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [internalReviews, setInternalReviews] = useState<InternalReview[]>([])
  const [loadingInternal, setLoadingInternal] = useState(true)

  useEffect(() => {
    if (!salonId) { setLoadingInternal(false); return }
    fetch(`/api/reviews?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => { setInternalReviews(d.reviews || []); setLoadingInternal(false) })
      .catch(() => setLoadingInternal(false))
  }, [salonId])

  const externalAvg = MOCK_EXTERNAL.reduce((s, r) => s + r.rating, 0) / MOCK_EXTERNAL.length
  const externalUnanswered = MOCK_EXTERNAL.filter(r => !r.answered)

  const internalNegative = internalReviews.filter(r => r.rating <= 3)
  const internalPositive = internalReviews.filter(r => r.rating >= 4)

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
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Star size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Директор по репутации</h1>
            <p className="text-sm text-zinc-500">Рейтинг, отзывы и ответы</p>
          </div>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 col-span-1">
            <div className="flex items-baseline gap-1 mb-1">
              <p className="text-2xl font-bold text-amber-400">{externalAvg.toFixed(1)}</p>
              <Star size={12} className="text-amber-400 mb-0.5" />
            </div>
            <p className="text-xs text-zinc-500">Рейтинг</p>
          </div>
          <div className={`rounded-xl p-4 border ${externalUnanswered.length > 0 ? 'bg-red-950/30 border-red-800/30' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className={`text-2xl font-bold ${externalUnanswered.length > 0 ? 'text-red-400' : 'text-white'}`}>
              {externalUnanswered.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Без ответа</p>
          </div>
          <div className={`rounded-xl p-4 border ${internalNegative.length > 0 ? 'bg-orange-950/30 border-orange-800/30' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className={`text-2xl font-bold ${internalNegative.length > 0 ? 'text-orange-400' : 'text-white'}`}>
              {internalNegative.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Жалоб</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{internalPositive.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Хвалят</p>
          </div>
        </div>

        {/* Динамика */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Динамика</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <TrendingUp size={14} />
              +0.3 за месяц
            </div>
            <span className="text-zinc-700">·</span>
            <span className="text-sm text-zinc-400">Было 4.1 → стало 4.4</span>
          </div>
          {externalUnanswered.some(r => r.rating <= 2) && (
            <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/30 rounded-xl p-3">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300">
                {externalUnanswered.filter(r => r.rating <= 2).length} негативных отзыва без ответа на внешних площадках.
                Каждый негативный без ответа отпугивает ~8 потенциальных клиентов.
              </p>
            </div>
          )}
        </div>

        {/* Внутренние отзывы (реальные) */}
        {!loadingInternal && internalReviews.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={14} className="text-orange-400" />
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Внутренние отзывы (из приложения)
              </p>
              <span className="text-xs text-zinc-600">— не публичные</span>
            </div>
            <div className="space-y-2">
              {internalReviews.map(review => (
                <div
                  key={review.id}
                  className={`rounded-xl p-4 border ${
                    review.rating <= 3
                      ? 'bg-orange-950/20 border-orange-800/30'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={11}
                            className={i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-white">{review.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600 shrink-0">
                      <span>{platformLabel(review.platform)}</span>
                      <span>·</span>
                      <span>{timeAgo(review.created_at)}</span>
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-sm text-zinc-300 leading-relaxed mb-1">{review.text}</p>
                  )}
                  {review.master_name && (
                    <p className="text-xs text-zinc-600">Мастер: {review.master_name}</p>
                  )}
                  {review.rating <= 3 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-400">
                      <AlertCircle size={11} />
                      Требует внимания — клиент не доволен
                    </div>
                  )}
                  {review.is_public && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 size={11} />
                      Опубликован на внешней площадке
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Внешние отзывы (mock) */}
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
            Внешние площадки
            <span className="text-zinc-700 ml-2 normal-case">· mock-данные</span>
          </p>
          <div className="space-y-3">
            {MOCK_EXTERNAL.map(review => (
              <div key={review.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={11}
                          className={i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-white">{review.author}</span>
                    <span className="text-xs text-zinc-600">{review.platform}</span>
                  </div>
                  <div className="shrink-0">
                    {review.answered
                      ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={11} />Отвечено</span>
                      : <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={11} />Без ответа</span>
                    }
                  </div>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-2">{review.text}</p>
                <p className="text-xs text-zinc-600">{review.master} · {review.date}</p>

                {!review.answered && review.rating <= 2 && (
                  <div className="mt-3 bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                      <MessageSquare size={10} />
                      AI-ответ (готов к отправке)
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{AI_RESPONSE}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(AI_RESPONSE)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Скопировать ответ
                    </button>
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
