'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import { Scissors, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const ROLES = [
  {
    key: 'master',
    Icon: Scissors,
    title: 'Работаю с клиентами',
    description: 'Мастер или стилист — хочу видеть своих клиентов и рекомендации по удержанию.',
    emoji: '✂️',
    href: (salonId: string) => `/master?salon_id=${salonId}`,
  },
  {
    key: 'owner',
    Icon: TrendingUp,
    title: 'Развиваю салон',
    description: 'Владелец или управляющий — хочу видеть аналитику и возможности роста.',
    emoji: '📈',
    href: (salonId: string) => salonId ? `/dashboard?salon_id=${salonId}` : '/join/salon',
  },
]

export default function RolePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const salonId = searchParams.get('salon_id') || ''

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors"
          >
            <ArrowLeft size={14} />
            Главная
          </Link>
        </div>

        <div className="mb-10">
          <p className="text-base font-semibold text-graphite">BeautyOS</p>
          <p className="text-sm text-dusk mt-1">Как вы работаете с красотой?</p>
        </div>

        <div className="space-y-3">
          {ROLES.map(({ key, Icon, title, description, emoji, href }) => (
            <button
              key={key}
              onClick={() => router.push(href(salonId))}
              className="w-full text-left bg-card border border-parchment rounded-2xl p-5 hover:border-sage/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-cream border border-parchment rounded-xl flex items-center justify-center shrink-0 group-hover:border-sage/30 transition-colors">
                  <Icon size={18} className="text-sage" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-graphite">
                    {emoji} {title}
                  </p>
                  <p className="text-xs text-dusk mt-1 leading-snug">{description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-dusk/50 text-center mt-10">
          Клиент салона?{' '}
          <Link href="/client" className="text-sage hover:underline">
            Войти как клиент →
          </Link>
        </p>

      </div>
    </div>
  )
}
