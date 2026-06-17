'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles, ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface TrialStats {
  clients_count: number
  bookings_count: number
  reviews_count: number
  booking_configured: boolean
}

const FEATURES = [
  'Dashboard — карта вашего бизнеса',
  'AI Marketing Director',
  'AI Consultant',
  'Smart Booking — онлайн-запись',
  'Beauty Companion для клиентов',
  'Репутация и отзывы',
  'Клиентский кабинет',
  'Неограниченное количество клиентов',
]

function StatItem({ count, label }: { count: number; label: string }) {
  if (count === 0) return null
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 size={18} className="text-sage shrink-0 mt-0.5" />
      <span className="text-sm text-graphite">{label.replace('{n}', String(count))}</span>
    </div>
  )
}

function PlanDetails() {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-parchment rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-graphite">Что входит в подписку</span>
        <ChevronDown size={16} className={`text-dusk transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2.5 border-t border-parchment pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dusk uppercase tracking-wider">BeautyOS · Starter</span>
            <span className="text-sm font-semibold text-graphite">3 990 ₽ / мес</span>
          </div>
          {FEATURES.map(f => (
            <div key={f} className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-sage shrink-0 mt-0.5" />
              <span className="text-sm text-graphite">{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const salonId = searchParams.get('salon_id') || ''
  const [stats, setStats] = useState<TrialStats | null>(null)
  const [trialSince, setTrialSince] = useState<string | null>(null)

  useEffect(() => {
    if (!salonId) return
    // Get subscription info for trial_started_at
    fetch(`/api/subscription?salon_id=${salonId}`)
      .then(r => r.json())
      .then(data => { setTrialSince(data.trialStartedAt ?? null) })
      .catch(() => {})
  }, [salonId])

  useEffect(() => {
    if (!salonId) return
    const since = trialSince ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    fetch(`/api/subscription/stats?salon_id=${salonId}&since=${since}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [salonId, trialSince])

  const hasStats = stats && (stats.clients_count > 0 || stats.bookings_count > 0 || stats.reviews_count > 0 || stats.booking_configured)

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-5 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-graphite rounded-xl flex items-center justify-center">
            <Sparkles size={17} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-graphite">BeautyOS</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-graphite mb-3 leading-tight">
            Ваш пробный период завершён
          </h1>
          <p className="text-sm text-dusk leading-relaxed">
            За последние 7 дней BeautyOS уже помог вам организовать работу с клиентами и автоматизировать часть ежедневных задач.
          </p>
        </div>

        {/* Real stats */}
        {hasStats && (
          <div className="bg-white border border-parchment rounded-2xl p-5 mb-5">
            <p className="text-xs text-dusk uppercase tracking-wider mb-4">За время пробного периода</p>
            <div className="space-y-3">
              <StatItem count={stats!.clients_count}  label="Добавлено {n} клиентов" />
              <StatItem count={stats!.bookings_count} label="Создано {n} записей" />
              <StatItem count={stats!.reviews_count}  label="Получено {n} отзывов" />
              {stats!.booking_configured && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-sage shrink-0 mt-0.5" />
                  <span className="text-sm text-graphite">Настроена онлайн-запись клиентов</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-dusk text-center mb-6 leading-relaxed">
          Продолжайте пользоваться всеми возможностями BeautyOS без ограничений.
        </p>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-graphite">3 990 <span className="text-lg font-normal text-dusk">₽ / месяц</span></div>
          <p className="text-xs text-dusk mt-1">Полный доступ · Без ограничений</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            // Phase 2: YooKassa integration
            // For now, show a temporary message
            alert('Оплата через YooKassa будет подключена в ближайшее время. Пожалуйста, свяжитесь с поддержкой для активации подписки.')
          }}
          className="w-full bg-graphite text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-graphite/90 active:scale-[0.98] transition-all mb-3"
        >
          Продолжить работу
          <ArrowRight size={18} />
        </button>

        <PlanDetails />

        {/* Back to data */}
        {salonId && (
          <div className="text-center mt-6">
            <Link
              href={`/dashboard?salon_id=${salonId}`}
              className="text-sm text-dusk underline underline-offset-2 hover:text-graphite transition-colors"
            >
              Просмотреть данные
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
