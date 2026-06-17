'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Heart, Calendar, Sparkles, ExternalLink, AlertCircle } from 'lucide-react'

interface SalonInfo {
  id: string
  name: string
  salon_slug: string
  booking_url: string | null
}

export default function ClientInvitePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const slug = params.slug as string
  const masterParam = searchParams.get('master') // for future master-specific links

  const [salon, setSalon] = useState<SalonInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'found' | 'not_found'>('loading')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!slug) { setStatus('not_found'); return }
    // Try slug first, then fall back to treating slug as a salon UUID
    fetch(`/api/salon?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) { setSalon(data); setStatus('found'); return }
        // Slug not found — try as direct salon_id (UUID)
        return fetch(`/api/salon?id=${encodeURIComponent(slug)}`)
          .then(r => r.json())
          .then(d2 => {
            if (d2.error) { setStatus('not_found'); return }
            setSalon(d2)
            setStatus('found')
          })
      })
      .catch(() => setStatus('not_found'))
  }, [slug])

  function handleJoin() {
    if (!salon) return
    setJoining(true)
    // Route to client identification flow, not directly to beauty-companion
    setTimeout(() => {
      router.push(`/join?salon_id=${salon.id}`)
    }, 400)
  }

  // Loading skeleton
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-parchment rounded-2xl animate-pulse" />
          <div className="h-4 w-40 bg-parchment rounded-lg animate-pulse" />
          <div className="h-3 w-28 bg-parchment rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Salon not found
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-rose" />
          </div>
          <h1 className="text-xl font-semibold text-graphite mb-2">Ссылка не найдена</h1>
          <p className="text-sm text-dusk leading-relaxed">
            Возможно, ссылка устарела или была изменена.<br />
            Попросите ваш салон прислать актуальную ссылку.
          </p>
        </div>
      </div>
    )
  }

  // Found — show invite screen
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        {/* Logo / brand */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-terracotta/20 to-rose/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <Heart size={28} className="text-terracotta" />
          </div>
          <p className="text-xs font-bold text-dusk/50 uppercase tracking-widest">BeautyOS</p>
        </div>

        {/* Salon invite headline */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-graphite leading-snug mb-2">
            {salon!.name}
          </h1>
          <p className="text-base text-dusk">приглашает вас в BeautyOS</p>
          <div className="mt-4 inline-flex items-center gap-1.5 bg-terracotta/8 text-terracotta text-xs font-semibold px-3 py-1.5 rounded-full">
            <Sparkles size={12} />
            Ваш спутник красоты между визитами
          </div>
        </div>

        {/* Value props */}
        <div className="w-full space-y-2.5 mb-10">
          {[
            { icon: Calendar, text: 'Напомним о следующем визите' },
            { icon: Heart, text: 'Советы по уходу от вашего мастера' },
            { icon: Sparkles, text: 'Персональные рекомендации' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-card border border-parchment rounded-xl px-4 py-3 text-left">
              <div className="p-1.5 bg-terracotta/10 rounded-lg shrink-0">
                <Icon size={14} className="text-terracotta" />
              </div>
              <p className="text-sm text-graphite/80">{text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full bg-terracotta text-white font-semibold text-base rounded-2xl py-4 hover:bg-terracotta/90 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-terracotta/25"
        >
          {joining ? '...' : 'Забочусь о себе'}
        </button>

        {/* Optional booking link */}
        {salon!.booking_url && (
          <a
            href={salon!.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full border border-parchment bg-card rounded-2xl py-3.5 text-sm font-semibold text-graphite hover:border-terracotta/40 transition-colors"
          >
            <Calendar size={15} className="text-terracotta" />
            Записаться на процедуру
            <ExternalLink size={12} className="text-dusk/40" />
          </a>
        )}

        {masterParam && (
          <p className="mt-5 text-xs text-dusk/50">
            Мастер: {masterParam}
          </p>
        )}

        <p className="mt-8 text-[11px] text-dusk/30 text-center leading-relaxed">
          Нажимая «Забочусь о себе», вы принимаете<br />
          условия использования BeautyOS
        </p>

      </div>
    </div>
  )
}
