'use client'

import { useState } from 'react'
import { X, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  daysLeft: number
  status: 'trial' | 'expired'
  salonId: string
  onDismiss: () => void
}

export function TrialBanner({ daysLeft, status, salonId, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    onDismiss()
  }

  // Expired banner — sticky, no dismiss
  if (status === 'expired') {
    return (
      <div className="w-full bg-graphite text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock size={15} className="text-white/60 shrink-0" />
          <p className="text-sm truncate">Пробный период завершён. Доступ к AI-функциям и созданию записей ограничен.</p>
        </div>
        <Link
          href={`/subscription?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          Оформить
          <ArrowRight size={13} />
        </Link>
      </div>
    )
  }

  // 0 days — today is last day
  if (daysLeft === 0) {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 mb-0.5">Сегодня последний день пробного периода</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Сегодня у вас ещё есть полный доступ ко всем функциям. Завтра приложение перейдёт на платную подписку.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/subscription?salon_id=${salonId}`}
            className="text-xs font-semibold text-amber-900 underline underline-offset-2 whitespace-nowrap"
          >
            Подробнее
          </Link>
          <button onClick={dismiss} className="text-amber-600 hover:text-amber-900 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>
    )
  }

  // 1 day left
  if (daysLeft === 1) {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 mb-0.5">Завтра завершается пробный период</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Вы уже начали собирать клиентскую базу и автоматизировать рабочие процессы. Чтобы сохранить доступ, потребуется подписка.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/subscription?salon_id=${salonId}`}
            className="text-xs font-semibold text-amber-900 underline underline-offset-2 whitespace-nowrap"
          >
            Продолжить работу
          </Link>
          <button onClick={dismiss} className="text-amber-600 hover:text-amber-900 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>
    )
  }

  // 2–3 days left
  if (daysLeft <= 3) {
    return (
      <div className="w-full bg-cream border-b border-parchment px-4 py-3 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-graphite mb-0.5">Пробный период скоро завершится</p>
          <p className="text-xs text-dusk leading-relaxed">
            До окончания осталось {daysLeft} {daysLeft === 2 ? 'дня' : 'дня'}. Вы уже используете BeautyOS для работы с клиентами и развития бизнеса.
          </p>
        </div>
        <button onClick={dismiss} className="text-dusk/50 hover:text-graphite transition-colors shrink-0 mt-0.5">
          <X size={15} />
        </button>
      </div>
    )
  }

  return null
}
