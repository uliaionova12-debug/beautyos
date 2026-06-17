'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, CheckCircle2, ExternalLink, Heart,
  Calendar, Clock, Scissors, ChevronRight, Copy, AlertCircle, Sparkles,
} from 'lucide-react'

interface ClientData {
  id: string
  name: string
  phone: string | null
  status: string
  avg_check: number
  days_since_last_visit: number | null
  avg_interval_days: number | null
  total_visits: number
  total_revenue: number
  last_visit_date: string | null
}

interface VisitRow {
  service_name: string | null
  amount: number | null
  visit_date: string | null
  master_name: string | null
}

interface RepPlatform {
  id: string
  platform: string
  url: string
  label: string
  status: string
  added_at: string
}

interface ProfileData {
  client: ClientData
  salon: { name: string; booking_url: string }
  visits: VisitRow[]
  platforms: RepPlatform[]
}

type Step = 'idle' | 'rating' | 'text' | 'gating_positive' | 'gating_negative' | 'done'

const PLATFORM_COLORS: Record<string, string> = {
  google:    'bg-blue-50 border-blue-200 text-blue-700',
  yandex:    'bg-red-50 border-red-200 text-red-700',
  '2gis':    'bg-emerald-50 border-emerald-200 text-emerald-700',
  instagram: 'bg-pink-50 border-pink-200 text-pink-700',
  vk:        'bg-indigo-50 border-indigo-200 text-indigo-700',
  other:     'bg-gray-50 border-gray-200 text-gray-700',
}

const PLATFORM_HINTS: Record<string, string> = {
  google:    'Нажмите звёзды и вставьте текст',
  yandex:    'Нажмите «Написать отзыв»',
  '2gis':    'Перейдите во вкладку «Отзывы»',
  instagram: 'Оставьте комментарий',
  vk:        'Перейдите в «Отзывы» сообщества',
  other:     'Нажмите «Написать отзыв»',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function UpcomingBooking({ clientId, salonId }: { clientId: string; salonId: string }) {
  const [booking, setBooking] = useState<{
    client_name: string; booking_date: string; booking_time: string; master_id: string
  } | null>(null)

  useEffect(() => {
    if (!clientId) return
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/bookings/client?client_id=${clientId}&from=${today}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.booking) setBooking(data.booking) })
      .catch(() => {})
  }, [clientId])

  if (!booking) return null

  const d = new Date(booking.booking_date + 'T12:00:00')
  const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const timeStr = booking.booking_time.slice(0, 5)

  return (
    <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={13} className="text-rose" />
        <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Ближайшая запись</p>
      </div>
      <p className="text-sm font-semibold text-graphite">{dateStr} в {timeStr}</p>
    </div>
  )
}

function daysUntilNext(avgInterval: number | null, daysSinceLast: number | null): number | null {
  if (!avgInterval || daysSinceLast === null) return null
  return Math.max(0, avgInterval - daysSinceLast)
}

export default function ClientPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('id') || ''
  const salonId  = searchParams.get('salon_id') || ''

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [aiOutput, setAiOutput] = useState<{
    care_message: string
    booking_recommendation: string
    client_insight: string
    retention_explanation: string
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [step, setStep]               = useState<Step>('idle')
  const [rating, setRating]           = useState(0)
  const [hovered, setHovered]         = useState(0)
  const [reviewText, setReviewText]   = useState('')
  const [clientName, setClientName]   = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [publishedTo, setPublishedTo] = useState<string[]>([])
  const [copied, setCopied]           = useState(false)

  useEffect(() => {
    if (!clientId || !salonId) { setLoading(false); setNotFound(true); return }
    fetch(`/api/client-profile?client_id=${clientId}&salon_id=${salonId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setProfile(d); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [clientId, salonId])

  // Load AI layer after profile is ready (non-blocking)
  useEffect(() => {
    if (!profile || !clientId || !salonId) return
    setAiLoading(true)
    fetch(`/api/client-ai?client_id=${clientId}&salon_id=${salonId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.output) setAiOutput(d.output) })
      .catch(() => {})
      .finally(() => setAiLoading(false))
  }, [profile, clientId, salonId])

  const lastVisit  = profile?.visits[0] ?? null
  const daysToNext = daysUntilNext(profile?.client.avg_interval_days ?? null, profile?.client.days_since_last_visit ?? null)

  async function submitReview(platform?: string) {
    setSubmitting(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id:    salonId,
          client_name: clientName || profile?.client.name || 'Анонимный клиент',
          master_name: lastVisit?.master_name ?? null,
          rating,
          text:        reviewText,
          platform:    platform || 'internal',
        }),
      })
    } catch { /* не блокируем UX */ } finally {
      setSubmitting(false)
    }
  }

  async function handleTextSubmit() {
    await submitReview('internal')
    setStep(rating >= 4 ? 'gating_positive' : 'gating_negative')
  }

  function copyReviewText() {
    navigator.clipboard.writeText(reviewText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handlePublish(platform: RepPlatform) {
    if (!publishedTo.includes(platform.id)) {
      await submitReview(platform.platform)
      setPublishedTo(prev => [...prev, platform.id])
    }
    window.open(platform.url, '_blank', 'noopener')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 150, 300].map(delay => (
            <div key={delay} className="w-2 h-2 rounded-full bg-rose/40 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    const hasParams = !!(clientId && salonId)
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-rose" />
          </div>
          {hasParams ? (
            <>
              <p className="text-graphite font-semibold mb-2">Профиль не найден</p>
              <p className="text-dusk text-sm leading-relaxed mb-6">
                Возможно, ссылка устарела или данные не совпадают.<br />
                Попросите салон прислать актуальную ссылку.
              </p>
            </>
          ) : (
            <>
              <p className="text-graphite font-semibold mb-2">Личный профиль</p>
              <p className="text-dusk text-sm leading-relaxed mb-6">
                Чтобы увидеть ваш профиль, откройте ссылку от вашего салона.<br />
                Или попробуйте Beauty Companion — персональные советы по уходу.
              </p>
            </>
          )}
          <Link
            href="/beauty-companion"
            className="inline-flex items-center gap-2 bg-rose text-white font-semibold px-6 py-3 rounded-2xl text-sm hover:opacity-90 transition-opacity"
          >
            <Heart size={14} />
            Открыть Beauty Companion
          </Link>
        </div>
      </div>
    )
  }

  const { client, salon, visits, platforms } = profile

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-4 py-8">

        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          На главную
        </Link>

        {/* Greeting */}
        <div className="mb-6">
          <p className="text-dusk text-sm mb-1">Добрый день</p>
          <h1 className="text-2xl font-bold text-graphite">{client.name}</h1>
          {salon.name && <p className="text-sm text-dusk mt-1">{salon.name}</p>}
        </div>

        {/* Next visit recommendation */}
        {daysToNext !== null && (
          <div className="bg-rose/8 border border-rose/15 rounded-2xl p-5 mb-4">
            <p className="text-xs text-rose font-semibold uppercase tracking-wider mb-2">
              Рекомендуем записаться
            </p>
            {daysToNext === 0 ? (
              <p className="text-graphite font-semibold mb-1">
                Самое время для следующего визита
              </p>
            ) : (
              <p className="text-graphite font-semibold mb-1">
                Следующий визит через <span className="text-rose">{daysToNext} {daysToNext === 1 ? 'день' : daysToNext < 5 ? 'дня' : 'дней'}</span>
              </p>
            )}
            {lastVisit?.master_name && (
              <p className="text-dusk text-sm mb-4">
                {lastVisit.master_name} ждёт вас
              </p>
            )}
            {salon.booking_url ? (
              <a
                href={salon.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-rose text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                <Calendar size={15} />
                Записаться онлайн
              </a>
            ) : (
              <div className="flex items-center gap-2 text-sm text-dusk">
                <Clock size={14} />
                Свяжитесь с салоном для записи
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {salon.booking_url ? (
            <a
              href={salon.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-parchment rounded-xl py-4 flex flex-col items-center gap-2 hover:border-rose/30 transition-colors"
            >
              <Calendar size={18} className="text-dusk" />
              <span className="text-xs text-dusk">Записаться</span>
            </a>
          ) : (
            <div className="bg-card border border-parchment rounded-xl py-4 flex flex-col items-center gap-2 opacity-40">
              <Calendar size={18} className="text-dusk" />
              <span className="text-xs text-dusk">Записаться</span>
            </div>
          )}
          <button className="bg-card border border-parchment rounded-xl py-4 flex flex-col items-center gap-2 hover:border-rose/30 transition-colors">
            <Star size={18} className="text-dusk" />
            <span className="text-xs text-dusk">Мой мастер</span>
          </button>
        </div>

        {/* Review flow */}
        {step === 'idle' && lastVisit && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-3">Последний визит</p>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-graphite font-semibold">{lastVisit.service_name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-dusk">
                  {lastVisit.master_name && <><Scissors size={11} /><span>{lastVisit.master_name}</span><span>·</span></>}
                  <Calendar size={11} />
                  <span>{formatDate(lastVisit.visit_date)}</span>
                </div>
              </div>
              {lastVisit.amount !== null && (
                <p className="text-graphite font-bold">{lastVisit.amount.toLocaleString('ru-RU')} ₽</p>
              )}
            </div>
            <button
              onClick={() => setStep('rating')}
              className="w-full bg-rose text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Star size={15} />
              Оставить отзыв о визите
            </button>
          </div>
        )}

        {step === 'rating' && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <p className="text-sm font-semibold text-graphite mb-1">Как прошёл визит?</p>
            <p className="text-xs text-dusk mb-5">Оцените от 1 до 5 звёзд</p>
            <div className="flex gap-3 justify-center mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => { setRating(n); setStep('text') }}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={38}
                    className={`transition-colors ${n <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-parchment fill-parchment'}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-dusk/60 h-4">
              {hovered === 1 && 'Очень плохо'}{hovered === 2 && 'Плохо'}{hovered === 3 && 'Нормально'}
              {hovered === 4 && 'Хорошо'}{hovered === 5 && 'Отлично!'}
            </p>
          </div>
        )}

        {step === 'text' && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16}
                  className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-parchment fill-parchment'} />
              ))}
            </div>
            <p className="text-sm font-semibold text-graphite mb-4">
              {rating >= 4 ? 'Расскажите, что понравилось' : 'Что можно улучшить?'}
            </p>
            <input
              type="text"
              placeholder="Ваше имя (необязательно)"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 mb-3 outline-none focus:border-rose/40 transition-colors"
            />
            <textarea
              placeholder={rating >= 4
                ? 'Мастер отлично справился! Очень довольна результатом...'
                : 'Расскажите, что не понравилось — мы обязательно исправим...'}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 outline-none focus:border-rose/40 resize-none mb-4 transition-colors"
            />
            <button
              onClick={handleTextSubmit}
              disabled={submitting}
              className="w-full bg-rose text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Отправляю...' : 'Отправить отзыв'}
            </button>
          </div>
        )}

        {step === 'gating_positive' && (
          <div className="space-y-3 mb-4">
            <div className="bg-rose/8 border border-rose/15 rounded-2xl p-5">
              <p className="text-3xl mb-2 text-center">🎉</p>
              <p className="text-graphite font-bold text-center mb-1">Спасибо за тёплые слова!</p>
              {platforms.length > 0 && (
                <p className="text-dusk text-sm text-center">
                  Помогите другим найти нас — 3 простых шага
                </p>
              )}
            </div>

            {platforms.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {['1. Скопируйте текст', '2. Нажмите площадку', '3. Вставьте и отправьте'].map((s, i) => (
                    <div key={i} className="bg-card border border-parchment rounded-xl p-3 text-center">
                      <p className="text-xs text-dusk leading-snug">{s}</p>
                    </div>
                  ))}
                </div>

                {reviewText && (
                  <div className="bg-card border border-parchment rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Ваш отзыв</p>
                      <button
                        onClick={copyReviewText}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border ${
                          copied
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-cream text-dusk hover:bg-rose/8 border-parchment'
                        }`}
                      >
                        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        {copied ? 'Скопировано!' : 'Копировать'}
                      </button>
                    </div>
                    <p className="text-sm text-graphite leading-relaxed">{reviewText}</p>
                  </div>
                )}

                <div className="space-y-2">
                  {platforms.map(platform => {
                    const published = publishedTo.includes(platform.id)
                    const color = PLATFORM_COLORS[platform.platform] || PLATFORM_COLORS.other
                    const hint  = PLATFORM_HINTS[platform.platform]  || PLATFORM_HINTS.other
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handlePublish(platform)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all active:scale-[0.98] ${
                          published ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : color
                        }`}
                      >
                        <span className="flex flex-col items-start gap-0.5">
                          <span>{platform.label}</span>
                          {!published && <span className="text-[11px] opacity-50 font-normal">{hint}</span>}
                        </span>
                        {published
                          ? <CheckCircle2 size={15} />
                          : <ExternalLink size={14} className="opacity-60 shrink-0" />
                        }
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <button
              onClick={() => setStep('done')}
              className="w-full text-sm text-dusk/60 hover:text-dusk transition-colors py-2"
            >
              Готово, закрыть
            </button>
          </div>
        )}

        {step === 'gating_negative' && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4 text-center">
            <p className="text-4xl mb-3">🙏</p>
            <p className="text-graphite font-bold mb-2">Спасибо за честность</p>
            <p className="text-dusk text-sm leading-relaxed mb-5">
              Ваш отзыв получен. Владелец салона лично прочитает его и свяжется с вами. Мы обязательно исправим.
            </p>
            <button
              onClick={() => setStep('done')}
              className="bg-rose text-white font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Хорошо, спасибо
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4 text-center">
            <CheckCircle2 size={32} className="text-rose mx-auto mb-3" />
            <p className="text-graphite font-bold mb-1">Всё готово!</p>
            <p className="text-dusk text-sm">
              {publishedTo.length > 0
                ? `Опубликовано на ${publishedTo.length} площадке${publishedTo.length > 1 ? 'х' : ''}`
                : 'Отзыв сохранён'}
            </p>
          </div>
        )}

        {/* ── AI Layer ── */}

        {/* Insight — one sentence shown as a subtle tag under greeting */}
        {(aiLoading || aiOutput?.client_insight) && (
          <div className="flex items-start gap-2 px-1 mb-4">
            <Sparkles size={13} className={`mt-0.5 shrink-0 ${aiLoading ? 'text-dusk/20 animate-pulse' : 'text-rose/50'}`} />
            <p className={`text-xs leading-relaxed transition-opacity ${aiLoading ? 'text-dusk/20' : 'text-dusk/70'}`}>
              {aiLoading ? 'Формирую персональные советы...' : aiOutput?.client_insight}
            </p>
          </div>
        )}

        {/* Retention explanation — shown only for at_risk / lost */}
        {!aiLoading && aiOutput?.retention_explanation && client.status !== 'active' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-4">
            <p className="text-xs text-amber-800 leading-relaxed">{aiOutput.retention_explanation}</p>
          </div>
        )}

        {/* Care message card */}
        {!aiLoading && aiOutput?.care_message && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={13} className="text-rose" />
              <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Совет по уходу</p>
            </div>
            <p className="text-sm text-graphite leading-relaxed">{aiOutput.care_message}</p>
            {aiOutput.booking_recommendation && (
              <p className="text-xs text-dusk mt-3 pt-3 border-t border-parchment leading-relaxed">
                {aiOutput.booking_recommendation}
              </p>
            )}
          </div>
        )}

        {/* Upcoming booking */}
        <UpcomingBooking clientId={clientId} salonId={salonId} />

        {/* Visit history */}
        {visits.length > 0 && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-3">История визитов</p>
            <div className="space-y-3">
              {visits.map((visit, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-graphite">{visit.service_name || 'Услуга'}</p>
                    <p className="text-xs text-dusk/60 mt-0.5">
                      {visit.master_name && `${visit.master_name} · `}{formatDate(visit.visit_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {visit.amount !== null && (
                      <p className="text-sm text-dusk">{visit.amount.toLocaleString('ru-RU')} ₽</p>
                    )}
                    <ChevronRight size={14} className="text-parchment" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beauty Companion */}
        <Link
          href={`/beauty-companion?id=${clientId}&salon_id=${salonId}`}
          className="block bg-rose/8 border border-rose/20 rounded-2xl p-5 hover:border-rose/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/80 border border-rose/20 rounded-full flex items-center justify-center shrink-0">
                <Heart size={16} className="text-rose" />
              </div>
              <div>
                <p className="text-sm font-semibold text-graphite">Beauty Companion</p>
                <p className="text-xs text-dusk mt-0.5">Персональный советник по уходу</p>
              </div>
            </div>
            <span className="text-rose text-sm font-medium">→</span>
          </div>
          {lastVisit?.service_name && (
            <p className="text-xs text-dusk mt-3 leading-relaxed">
              После «{lastVisit.service_name}» — советы по домашнему уходу
            </p>
          )}
        </Link>

      </div>
    </div>
  )
}
