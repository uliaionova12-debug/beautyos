'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Heart, Calendar, Sparkles, AlertCircle, UserPlus } from 'lucide-react'

interface SalonInfo {
  id: string
  name: string
  booking_url?: string | null
}

export default function JoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const salonId  = searchParams.get('salon_id')  || ''
  const masterId = searchParams.get('master_id') || ''

  const [salon, setSalon]             = useState<SalonInfo | null>(null)
  const [salonStatus, setSalonStatus] = useState<'loading' | 'found' | 'not_found'>('loading')
  const [phone, setPhone]             = useState('')
  const [name, setName]               = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [notFound, setNotFound]       = useState(false)

  const isRegisterMode = Boolean(masterId)

  useEffect(() => {
    if (!salonId) { setSalonStatus('not_found'); return }
    fetch(`/api/salon?id=${salonId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setSalonStatus('not_found'); return }
        setSalon(data)
        setSalonStatus('found')
      })
      .catch(() => setSalonStatus('not_found'))
  }, [salonId])

  async function handleSubmit() {
    if (isRegisterMode ? !name.trim() : (!phone.trim() && !name.trim())) return
    setSubmitting(true)
    setNotFound(false)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          phone: phone.trim() || undefined,
          name: name.trim() || undefined,
          master_id: masterId || undefined,
        }),
      })
      const data = await res.json()
      if (data.client_id) {
        router.push(`/client?id=${data.client_id}&salon_id=${salonId}`)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (salonStatus === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-parchment rounded-2xl animate-pulse" />
          <div className="h-4 w-40 bg-parchment rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (salonStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-rose" />
          </div>
          <h1 className="text-xl font-semibold text-graphite mb-2">Ссылка не найдена</h1>
          <p className="text-sm text-dusk leading-relaxed">
            Возможно, ссылка устарела.<br />Попросите мастера прислать актуальную ссылку.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3 ${
            isRegisterMode
              ? 'bg-gradient-to-br from-sage/20 to-terracotta/20'
              : 'bg-gradient-to-br from-terracotta/20 to-rose/20'
          }`}>
            {isRegisterMode
              ? <UserPlus size={28} className="text-sage" />
              : <Heart size={28} className="text-terracotta" />
            }
          </div>
          <p className="text-xs font-bold text-dusk/50 uppercase tracking-widest mb-4">BeautyOS</p>
          <h1 className="text-2xl font-bold text-graphite text-center leading-snug">
            {salon!.name}
          </h1>
          <p className="text-sm text-dusk text-center mt-2">
            {isRegisterMode
              ? 'Введите имя и телефон — мастер вас увидит'
              : 'Войдите, чтобы увидеть ваш профиль'
            }
          </p>
        </div>

        {/* Value props */}
        {!isRegisterMode && (
          <div className="space-y-2 mb-7">
            {[
              { icon: Calendar, text: 'Ваша история визитов' },
              { icon: Heart,    text: 'Советы по уходу от мастера' },
              { icon: Sparkles, text: 'Персональные рекомендации' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-card border border-parchment rounded-xl px-4 py-3">
                <div className="p-1.5 bg-terracotta/10 rounded-lg shrink-0">
                  <Icon size={14} className="text-terracotta" />
                </div>
                <p className="text-sm text-graphite/80">{text}</p>
              </div>
            ))}
          </div>
        )}

        {isRegisterMode && (
          <div className="space-y-2 mb-7">
            {[
              { icon: Calendar, text: 'Мастер запомнит историю ваших визитов' },
              { icon: Sparkles, text: 'Персональные рекомендации по уходу' },
              { icon: Heart,    text: 'Напомним, когда пора снова прийти' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-card border border-parchment rounded-xl px-4 py-3">
                <div className="p-1.5 bg-sage/10 rounded-lg shrink-0">
                  <Icon size={14} className="text-sage" />
                </div>
                <p className="text-sm text-graphite/80">{text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">
              Ваше имя {isRegisterMode && <span className="text-rose">*</span>}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNotFound(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Юлия"
              className="w-full bg-card border border-parchment rounded-xl px-4 py-3.5 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-terracotta/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">
              Телефон {!isRegisterMode && <span className="text-dusk/40">(или имя)</span>}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setNotFound(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="+7 999 999 99 99"
              className="w-full bg-card border border-parchment rounded-xl px-4 py-3.5 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-terracotta/40 transition-colors"
            />
          </div>
        </div>

        {notFound && !isRegisterMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-amber-700 font-medium mb-1">Не нашли вас в базе</p>
            <p className="text-xs text-amber-600/80 leading-relaxed">
              Возможно, вы ещё не были в этом салоне. Можно открыть Beauty Companion без личного профиля.
            </p>
          </div>
        )}

        {notFound && isRegisterMode && (
          <div className="bg-rose/5 border border-rose/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-rose font-medium mb-1">Не удалось сохранить</p>
            <p className="text-xs text-dusk leading-relaxed">
              Введите имя — это обязательно для регистрации.
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || (isRegisterMode ? !name.trim() : (!phone.trim() && !name.trim()))}
          className={`w-full font-semibold text-base rounded-2xl py-4 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-lg mb-3 ${
            isRegisterMode
              ? 'bg-sage text-white shadow-sage/20'
              : 'bg-terracotta text-white shadow-terracotta/20'
          }`}
        >
          {submitting
            ? (isRegisterMode ? 'Регистрирую...' : 'Ищу...')
            : (isRegisterMode ? 'Зарегистрироваться' : 'Открыть мой профиль')
          }
        </button>

        {!isRegisterMode && (
          <>
            <button
              onClick={() => router.push(`/beauty-companion?salon_id=${salonId}`)}
              className="w-full flex items-center justify-center gap-2 border border-parchment bg-card rounded-2xl py-3.5 text-sm font-medium text-graphite/70 hover:border-terracotta/40 transition-colors"
            >
              <Heart size={14} className="text-terracotta" />
              Открыть Beauty Companion
            </button>

            {salon!.booking_url && (
              <a
                href={salon!.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 border border-parchment bg-card rounded-2xl py-3.5 text-sm font-medium text-graphite/70 hover:border-terracotta/40 transition-colors"
              >
                <Calendar size={14} className="text-terracotta" />
                Записаться на процедуру
              </a>
            )}
          </>
        )}

        <p className="mt-6 text-[11px] text-dusk/30 text-center leading-relaxed">
          Данные используются только для отображения вашего профиля
        </p>

      </div>
    </div>
  )
}
