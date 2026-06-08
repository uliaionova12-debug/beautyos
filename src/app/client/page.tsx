'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, CheckCircle2, ExternalLink, Heart,
  Calendar, Clock, Scissors, ChevronRight, Gift, Copy
} from 'lucide-react'

const SALON_PLATFORMS = [
  {
    id: 'yandex',
    name: 'Яндекс Карты',
    emoji: '🗺️',
    color: 'bg-red-50 border-red-200 text-red-700',
    hint: 'Нажмите «Написать отзыв»',
    url: 'https://yandex.ru/maps/org/beauty_salon/reviews/',
  },
  {
    id: 'google',
    name: 'Google Maps',
    emoji: '🌐',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    hint: 'Нажмите звёзды и вставьте текст',
    url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  },
  {
    id: '2gis',
    name: '2GIS',
    emoji: '📍',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    hint: 'Перейдите во вкладку «Отзывы»',
    url: 'https://2gis.ru/moscow/firm/70000001082270604/tab/reviews',
  },
  {
    id: 'vk',
    name: 'ВКонтакте',
    emoji: '💙',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    hint: 'Перейдите в «Отзывы» сообщества',
    url: 'https://vk.com/topic-000000_000000',
  },
]

const NEXT_SLOTS = [
  { date: '12 июня', time: '17:00', master: 'Наталья' },
  { date: '13 июня', time: '19:00', master: 'Наталья' },
  { date: '14 июня', time: '11:00', master: 'Ольга' },
]

const MOCK_HISTORY = [
  { date: '15 мая 2026', service: 'Окрашивание + укладка', master: 'Наталья', amount: 4200 },
  { date: '22 марта 2026', service: 'Стрижка + уход', master: 'Наталья', amount: 2800 },
  { date: '10 января 2026', service: 'Ламинирование волос', master: 'Ирина', amount: 3500 },
]

type Step = 'idle' | 'rating' | 'text' | 'gating_positive' | 'gating_negative' | 'done'

export default function ClientPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  const [step, setStep] = useState<Step>('idle')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [clientName, setClientName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [publishedTo, setPublishedTo] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const lastVisit = MOCK_HISTORY[0]

  async function submitReview(platform?: string) {
    setSubmitting(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          client_name: clientName || 'Анонимный клиент',
          master_name: lastVisit.master,
          rating,
          text: reviewText,
          platform: platform || 'internal',
        }),
      })
    } catch {
      // не блокируем UX при сетевой ошибке
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTextSubmit() {
    if (rating >= 4) {
      await submitReview('internal')
      setStep('gating_positive')
    } else {
      await submitReview('internal')
      setStep('gating_negative')
    }
  }

  function copyReviewText() {
    navigator.clipboard.writeText(reviewText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handlePublish(platform: typeof SALON_PLATFORMS[number]) {
    if (!publishedTo.includes(platform.id)) {
      await submitReview(platform.id)
      setPublishedTo(prev => [...prev, platform.id])
    }
    window.open(platform.url, '_blank', 'noopener')
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-4 py-8">

        <Link
          href={`/role?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Сменить роль
        </Link>

        {/* Приветствие */}
        <div className="mb-6">
          <p className="text-dusk text-sm mb-1">Добрый день</p>
          <h1 className="text-2xl font-bold text-graphite">Юлия</h1>
        </div>

        {/* Следующая запись */}
        <div className="bg-sage/10 border border-sage/20 rounded-2xl p-5 mb-4">
          <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-2">
            Рекомендуем записаться
          </p>
          <p className="text-graphite font-semibold mb-1">
            Следующий визит через <span className="text-sage">8 дней</span>
          </p>
          <p className="text-dusk text-sm mb-4">
            Наталья ждёт вас — лучший результат раз в 4 недели
          </p>
          <div className="space-y-2">
            {NEXT_SLOTS.map((slot, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between bg-white/70 hover:bg-white border border-parchment rounded-xl px-4 py-2.5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-sage" />
                  <span className="text-sm text-graphite">{slot.date}, {slot.time}</span>
                </div>
                <span className="text-xs text-dusk">{slot.master}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Calendar, label: 'Записаться' },
            { icon: Star, label: 'Мой мастер' },
            { icon: Gift, label: 'Бонусы' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="bg-card border border-parchment rounded-xl py-4 flex flex-col items-center gap-2 hover:border-sage/40 transition-colors"
            >
              <Icon size={18} className="text-dusk" />
              <span className="text-xs text-dusk">{label}</span>
            </button>
          ))}
        </div>

        {/* ---- БЛОК ОТЗЫВА ---- */}

        {step === 'idle' && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-3">Последний визит</p>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-graphite font-semibold">{lastVisit.service}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-dusk">
                  <Scissors size={11} />
                  <span>{lastVisit.master}</span>
                  <span>·</span>
                  <Calendar size={11} />
                  <span>{lastVisit.date}</span>
                </div>
              </div>
              <p className="text-graphite font-bold">{lastVisit.amount.toLocaleString('ru-RU')} ₽</p>
            </div>
            <button
              onClick={() => setStep('rating')}
              className="w-full bg-sage text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
                    className={`transition-colors ${
                      n <= (hovered || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-parchment fill-parchment'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-dusk/60 h-4">
              {hovered === 1 && 'Очень плохо'}
              {hovered === 2 && 'Плохо'}
              {hovered === 3 && 'Нормально'}
              {hovered === 4 && 'Хорошо'}
              {hovered === 5 && 'Отлично!'}
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
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 mb-3 outline-none focus:border-sage/60 transition-colors"
            />
            <textarea
              placeholder={
                rating >= 4
                  ? 'Мастер Наталья — настоящий профессионал! Цвет получился именно таким...'
                  : 'Расскажите, что не понравилось — мы обязательно исправим...'
              }
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 outline-none focus:border-sage/60 resize-none mb-4 transition-colors"
            />
            <button
              onClick={handleTextSubmit}
              disabled={submitting}
              className="w-full bg-sage text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Отправляю...' : 'Отправить отзыв'}
            </button>
          </div>
        )}

        {step === 'gating_positive' && (
          <div className="space-y-3 mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-3xl mb-2 text-center">🎉</p>
              <p className="text-graphite font-bold text-center mb-1">Спасибо за тёплые слова!</p>
              <p className="text-dusk text-sm text-center">
                Помогите другим найти нас — 3 простых шага
              </p>
            </div>

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
                        : 'bg-cream text-dusk hover:bg-blush border-parchment'
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
              {SALON_PLATFORMS.map(platform => {
                const published = publishedTo.includes(platform.id)
                return (
                  <button
                    key={platform.id}
                    onClick={() => handlePublish(platform)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all active:scale-[0.98] ${
                      published
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : platform.color
                    }`}
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="flex items-center gap-2">
                        <span>{platform.emoji}</span>
                        {platform.name}
                      </span>
                      {!published && (
                        <span className="text-[11px] opacity-50 font-normal pl-6">{platform.hint}</span>
                      )}
                    </span>
                    {published
                      ? <CheckCircle2 size={15} />
                      : <ExternalLink size={14} className="opacity-60 shrink-0" />
                    }
                  </button>
                )
              })}
            </div>

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
              Ваш отзыв получен. Владелец салона лично прочитает его
              и свяжется с вами. Мы обязательно исправим.
            </p>
            <button
              onClick={() => setStep('done')}
              className="bg-sage text-white font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Хорошо, спасибо
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-card border border-parchment rounded-2xl p-5 mb-4 text-center">
            <CheckCircle2 size={32} className="text-sage mx-auto mb-3" />
            <p className="text-graphite font-bold mb-1">Всё готово!</p>
            <p className="text-dusk text-sm">
              {publishedTo.length > 0
                ? `Опубликовано на ${publishedTo.length} площадке${publishedTo.length > 1 ? 'х' : ''}`
                : 'Отзыв сохранён'}
            </p>
          </div>
        )}

        {/* ---- / БЛОК ОТЗЫВА ---- */}

        {/* История визитов */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
          <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-3">История визитов</p>
          <div className="space-y-3">
            {MOCK_HISTORY.map((visit, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-graphite">{visit.service}</p>
                  <p className="text-xs text-dusk/60 mt-0.5">{visit.master} · {visit.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-dusk">{visit.amount.toLocaleString('ru-RU')} ₽</p>
                  <ChevronRight size={14} className="text-parchment" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Beauty AI */}
        <div className="bg-card border border-parchment rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className="text-terracotta" />
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Beauty AI</p>
          </div>
          <p className="text-sm text-graphite leading-relaxed">
            Наталья специализируется на сложном окрашивании. После 3 визитов ваши волосы
            заметно здоровее — продолжайте регулярный уход!
          </p>
        </div>

      </div>
    </div>
  )
}
