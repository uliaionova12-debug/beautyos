'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Clock, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'

interface MasterInfo {
  id: string
  name: string
  salon_id: string
  salon_name?: string
}

interface Service { id: string; name: string; duration_min: number; price: number | null }

type Step = 'service' | 'date' | 'slot' | 'form' | 'confirmed'

const DAY_NAMES = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function BookingPage() {
  const { masterId } = useParams() as { masterId: string }

  const [master, setMaster]           = useState<MasterInfo | null>(null)
  const [masterStatus, setMasterStatus] = useState<'loading' | 'found' | 'not_found'>('loading')
  const [services, setServices]       = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const [step, setStep]               = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [slots, setSlots]             = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [name, setName]               = useState('')
  const [phone, setPhone]             = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [confirmedBooking, setConfirmedBooking] = useState<{ date: string; time: string; clientId: string | null } | null>(null)

  // Next 14 days for date picker
  const today = new Date()
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1))

  // Load master info
  useEffect(() => {
    if (!masterId) { setMasterStatus('not_found'); return }
    supabaseLoadMaster(masterId)
  }, [masterId])

  async function supabaseLoadMaster(id: string) {
    try {
      const res = await fetch(`/api/booking/master?master_id=${id}`)
      const data = await res.json()
      if (data.error || !data.master) { setMasterStatus('not_found'); return }
      setMaster(data.master)
      setMasterStatus('found')
      // Load services — if any exist, start from service selection
      const svcRes = await fetch(`/api/services?master_id=${id}`)
      const svcData = await svcRes.json().catch(() => [])
      if (Array.isArray(svcData) && svcData.length > 0) {
        setServices(svcData)
        setStep('service')
      }
    } catch {
      setMasterStatus('not_found')
    }
  }

  async function selectDate(iso: string) {
    setSelectedDate(iso)
    setSelectedSlot('')
    setSlots([])
    setSlotsLoading(true)
    setStep('slot')

    try {
      const res = await fetch(`/api/bookings/slots?master_id=${masterId}&date=${iso}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlots([])
    }
    setSlotsLoading(false)
  }

  function selectSlot(slot: string) {
    setSelectedSlot(slot)
    setStep('form')
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          master_id:    masterId,
          salon_id:     master!.salon_id,
          client_name:  name.trim(),
          client_phone: phone.trim() || null,
          booking_date: selectedDate,
          booking_time: selectedSlot,
          duration:     selectedService?.duration_min ?? 60,
          service_name: selectedService?.name ?? null,
          service_price: selectedService?.price ?? null,
        }),
      })
      const data = await res.json()
      if (data.error) { setSubmitError(data.error); setSubmitting(false); return }
      setConfirmedBooking({ date: selectedDate, time: selectedSlot, clientId: data.client_id })
      setStep('confirmed')
    } catch {
      setSubmitError('Ошибка соединения. Попробуйте ещё раз.')
    }
    setSubmitting(false)
  }

  // ─── States ───────────────────────────────────────────────────────────────

  if (masterStatus === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2 h-2 rounded-full bg-terracotta/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  if (masterStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={32} className="text-dusk/40 mx-auto mb-3" />
          <p className="text-graphite font-semibold mb-1">Ссылка не найдена</p>
          <p className="text-dusk text-sm">Попросите мастера прислать актуальную ссылку на запись.</p>
        </div>
      </div>
    )
  }

  // ─── Confirmed ────────────────────────────────────────────────────────────

  if (step === 'confirmed' && confirmedBooking) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-graphite mb-2">Запись подтверждена</h1>
          <p className="text-dusk text-sm mb-6">
            {master?.name} ждёт вас {formatDate(confirmedBooking.date)} в {confirmedBooking.time}
          </p>

          <div className="bg-card border border-parchment rounded-2xl p-5 text-left mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={15} className="text-terracotta" />
              <span className="text-sm text-graphite font-medium">{formatDate(confirmedBooking.date)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={15} className="text-terracotta" />
              <span className="text-sm text-graphite font-medium">{confirmedBooking.time}</span>
            </div>
          </div>

          {confirmedBooking.clientId && (
            <a
              href={`/client?id=${confirmedBooking.clientId}&salon_id=${master?.salon_id}`}
              className="block w-full bg-terracotta text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition-opacity mb-3"
            >
              Открыть мой профиль
            </a>
          )}

          <p className="text-xs text-dusk/50 leading-relaxed">
            Если планы изменятся — свяжитесь с мастером напрямую.
          </p>
        </div>
      </div>
    )
  }

  // ─── Main booking flow ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-7">
          {step !== 'date' && step !== 'service' && (
            <button
              onClick={() => {
                if (step === 'slot') setStep(services.length > 0 ? 'service' : 'date')
                if (step === 'form') setStep('slot')
              }}
              className="flex items-center gap-1.5 text-sm text-dusk hover:text-terracotta transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              Назад
            </button>
          )}
          <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-1">BeautyOS</p>
          <h1 className="text-2xl font-bold text-graphite">{master?.name}</h1>
          {master?.salon_name && <p className="text-sm text-dusk mt-0.5">{master.salon_name}</p>}
        </div>

        {/* Progress dots */}
        {(() => {
          const progressSteps = services.length > 0
            ? ['service', 'date', 'slot', 'form'] as Step[]
            : ['date', 'slot', 'form'] as Step[]
          const idx = progressSteps.indexOf(step)
          return (
            <div className="flex gap-1.5 mb-7">
              {progressSteps.map((s, i) => (
                <div key={s} className={`h-1 rounded-full flex-1 transition-colors ${idx >= i ? 'bg-terracotta' : 'bg-parchment'}`} />
              ))}
            </div>
          )
        })()}

        {/* Step: Service */}
        {step === 'service' && (
          <div>
            <p className="text-sm font-semibold text-graphite mb-4">Выберите услугу</p>
            <div className="space-y-2.5">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep('date') }}
                  className="w-full flex items-center justify-between bg-card border border-parchment rounded-2xl px-5 py-4 hover:border-terracotta/50 hover:bg-terracotta/5 active:scale-[0.98] transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-graphite">{s.name}</p>
                    <p className="text-xs text-dusk mt-0.5">{s.duration_min} мин</p>
                  </div>
                  {s.price !== null && (
                    <span className="text-base font-bold text-graphite">{s.price.toLocaleString('ru-RU')} ₽</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => { setSelectedService(null); setStep('date') }}
                className="w-full text-center text-sm text-dusk hover:text-graphite transition-colors py-3"
              >
                Другое — выбрать время без услуги
              </button>
            </div>
          </div>
        )}

        {/* Step: Date */}
        {step === 'date' && (
          <div>
            <p className="text-sm font-semibold text-graphite mb-4">Выберите дату</p>
            <div className="grid grid-cols-4 gap-2">
              {dates.map(d => {
                const iso = toISODate(d)
                const dow = DAY_NAMES[d.getDay()]
                return (
                  <button
                    key={iso}
                    onClick={() => selectDate(iso)}
                    className="flex flex-col items-center bg-card border border-parchment rounded-2xl py-3.5 hover:border-terracotta/50 hover:bg-terracotta/5 active:scale-95 transition-all"
                  >
                    <span className="text-[10px] text-dusk/50 uppercase tracking-wider">{dow}</span>
                    <span className="text-lg font-bold text-graphite mt-0.5">{d.getDate()}</span>
                    <span className="text-[10px] text-dusk/50">{MONTH_NAMES[d.getMonth()]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step: Slot */}
        {step === 'slot' && (
          <div>
            <p className="text-sm font-semibold text-graphite mb-1">Выберите время</p>
            <p className="text-xs text-dusk mb-4">{formatDate(selectedDate)}</p>

            {slotsLoading ? (
              <div className="flex gap-1.5 py-8 justify-center">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full bg-terracotta/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <Clock size={28} className="text-dusk/30 mx-auto mb-3" />
                <p className="text-sm text-dusk">В этот день нет свободного времени</p>
                <button
                  onClick={() => setStep('date')}
                  className="mt-4 text-sm text-terracotta font-medium"
                >
                  Выбрать другую дату
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => selectSlot(slot)}
                    className="bg-card border border-parchment rounded-xl py-3.5 text-base font-semibold text-graphite hover:border-terracotta hover:text-terracotta active:scale-95 transition-all"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && (
          <div>
            <p className="text-sm font-semibold text-graphite mb-1">Ваши данные</p>
            <div className="flex flex-wrap items-center gap-2 mb-5 bg-terracotta/5 border border-terracotta/20 rounded-xl px-4 py-3">
              <Calendar size={14} className="text-terracotta shrink-0" />
              <span className="text-sm text-graphite">{formatDate(selectedDate)}</span>
              <span className="text-dusk/40">·</span>
              <Clock size={14} className="text-terracotta shrink-0" />
              <span className="text-sm font-semibold text-graphite">{selectedSlot}</span>
              {selectedService && (
                <><span className="text-dusk/40">·</span>
                <span className="text-sm text-graphite">{selectedService.name}</span></>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">
                  Ваше имя <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Юлия"
                  className="w-full bg-card border border-parchment rounded-xl px-4 py-3.5 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-terracotta/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7 999 000 00 00"
                  className="w-full bg-card border border-parchment rounded-xl px-4 py-3.5 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-terracotta/50 transition-colors"
                />
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              className="w-full bg-terracotta text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-terracotta/20"
            >
              {submitting ? 'Записываю...' : 'Записаться'}
            </button>

            <p className="text-[11px] text-dusk/40 text-center mt-4 leading-relaxed">
              Нажимая «Записаться», вы соглашаетесь с обработкой ваших данных для подтверждения визита.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
