'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Copy, CheckCircle2, QrCode, Calendar, Clock,
  Check, X, Plus, ChevronRight, Banknote, UserX,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Booking {
  id: string
  client_name: string
  client_phone: string | null
  booking_date: string
  booking_time: string
  duration: number
  status: 'booked' | 'completed' | 'cancelled' | 'no_show'
  service_name: string | null
  service_price: number | null
  next_visit_date: string | null
  notes: string | null
}

interface Service { id: string; name: string; duration_min: number; price: number | null }
interface DaySchedule { day_of_week: number; start_time: string; end_time: string; slot_duration: number; active: boolean }

const DAY_LABELS      = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DAY_LABELS_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
const MONTH_NAMES     = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const DEFAULT_SCHEDULE: DaySchedule[] = [1,2,3,4,5].map(d => ({
  day_of_week: d, start_time: '10:00', end_time: '18:00', slot_duration: 60, active: true,
}))

type Period = 'today' | 'week' | 'month'
const PERIOD_LABELS: Record<Period, string> = { today: 'Сегодня', week: 'Неделя', month: 'Месяц' }

function todayIso(): string { return new Date().toISOString().slice(0, 10) }
function periodRange(p: Period): { from: string; to: string } {
  const d = new Date()
  const from = d.toISOString().slice(0, 10)
  if (p === 'today') return { from, to: from }
  if (p === 'week') {
    const t = new Date(d); t.setDate(t.getDate() + 6)
    return { from, to: t.toISOString().slice(0, 10) }
  }
  const t = new Date(d); t.setDate(t.getDate() + 29)
  return { from, to: t.toISOString().slice(0, 10) }
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${DAY_LABELS_FULL[d.getDay()]}`
}
function fmtMoney(n: number): string {
  return n >= 1000 ? Math.round(n / 1000) + ' тыс ₽' : n.toLocaleString('ru-RU') + ' ₽'
}

const STATUS_LABEL: Record<string, string> = {
  booked: 'Ожидает', completed: 'Завершён', cancelled: 'Отменён', no_show: 'Не пришёл',
}
const STATUS_COLOR: Record<string, string> = {
  booked:    'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  no_show:   'bg-amber-50 text-amber-700 border-amber-200',
}

// ─── Complete Modal ────────────────────────────────────────────────────────────

interface CompleteModalProps {
  booking: Booking
  services: Service[]
  onClose: () => void
  onSave: (id: string, data: Partial<Booking>) => void
}

function CompleteModal({ booking, services, onClose, onSave }: CompleteModalProps) {
  const [serviceName, setServiceName]   = useState(booking.service_name || '')
  const [servicePrice, setServicePrice] = useState(booking.service_price?.toString() || '')
  const [nextDate, setNextDate]         = useState(booking.next_visit_date || '')
  const [notes, setNotes]               = useState(booking.notes || '')
  const [saving, setSaving]             = useState(false)

  function selectService(s: Service) {
    setServiceName(s.name)
    if (s.price !== null) setServicePrice(String(s.price))
  }

  async function save() {
    setSaving(true)
    await onSave(booking.id, {
      status:          'completed',
      service_name:    serviceName.trim() || null,
      service_price:   servicePrice ? parseFloat(servicePrice) : null,
      next_visit_date: nextDate || null,
      notes:           notes.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-graphite/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-dusk uppercase tracking-wider">Завершить визит</p>
            <p className="text-base font-semibold text-graphite mt-0.5">{booking.client_name}</p>
            <p className="text-xs text-dusk">{formatDate(booking.booking_date)} · {booking.booking_time.slice(0,5)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-cream hover:bg-parchment transition-colors">
            <X size={15} className="text-dusk" />
          </button>
        </div>

        {services.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-dusk uppercase tracking-wider mb-2">Услуга</p>
            <div className="flex flex-wrap gap-1.5">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => selectService(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    serviceName === s.name ? 'bg-graphite text-white border-graphite' : 'bg-cream border-parchment text-graphite hover:border-graphite/30'
                  }`}
                >
                  {s.name}{s.price !== null ? ` · ${s.price} ₽` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Услуга</label>
            <input
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              placeholder="Маникюр с покрытием"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Стоимость, ₽</label>
            <input
              type="number"
              value={servicePrice}
              onChange={e => setServicePrice(e.target.value)}
              placeholder="2500"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Следующий визит (необязательно)</label>
            <input
              type="date"
              value={nextDate}
              onChange={e => setNextDate(e.target.value)}
              min={todayIso()}
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite focus:outline-none focus:border-graphite/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Комментарий</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Заметка для следующего визита..."
              rows={2}
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors resize-none"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-graphite text-white font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all"
        >
          <CheckCircle2 size={15} />
          {saving ? 'Сохраняю...' : 'Завершить визит'}
        </button>
      </div>
    </div>
  )
}

// ─── Create Booking Modal ──────────────────────────────────────────────────────

interface CreateModalProps {
  masterId: string
  salonId: string
  services: Service[]
  onClose: () => void
  onCreated: () => void
}

function CreateModal({ masterId, salonId, services, onClose, onCreated }: CreateModalProps) {
  const [clientName,    setClientName]    = useState('')
  const [clientPhone,   setClientPhone]   = useState('')
  const [date,          setDate]          = useState(todayIso())
  const [time,          setTime]          = useState('10:00')
  const [serviceName,   setServiceName]   = useState('')
  const [servicePrice,  setServicePrice]  = useState('')
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  function selectService(s: Service) {
    setServiceName(s.name)
    if (s.price !== null) setServicePrice(String(s.price))
  }

  async function save() {
    if (!clientName.trim() || !date || !time) { setError('Укажите имя, дату и время'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/bookings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        master_id:    masterId,
        salon_id:     salonId,
        client_name:  clientName.trim(),
        client_phone: clientPhone.trim() || null,
        booking_date: date,
        booking_time: time + ':00',
        duration:     60,
        service_name: serviceName.trim() || null,
        service_price: servicePrice ? parseFloat(servicePrice) : null,
        notes:        notes.trim() || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-graphite/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-semibold text-graphite">Добавить запись</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-cream hover:bg-parchment transition-colors">
            <X size={15} className="text-dusk" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Имя клиента *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Анна"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Телефон</label>
            <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+7 999 000 00 00" type="tel"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={todayIso()}
                className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite focus:outline-none focus:border-graphite/40 transition-colors" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Время</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite focus:outline-none focus:border-graphite/40 transition-colors" />
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Выбрать услугу</label>
              <div className="flex flex-wrap gap-1.5">
                {services.map(s => (
                  <button key={s.id} onClick={() => selectService(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      serviceName === s.name ? 'bg-graphite text-white border-graphite' : 'bg-cream border-parchment text-graphite hover:border-graphite/30'
                    }`}>
                    {s.name}{s.price !== null ? ` · ${s.price} ₽` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Услуга</label>
            <input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Маникюр с покрытием"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Стоимость, ₽</label>
            <input type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="2500"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-dusk uppercase tracking-wider block mb-1.5">Комментарий</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Пожелания клиента..."
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button onClick={save} disabled={saving}
          className="w-full bg-graphite text-white font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition-all">
          {saving ? 'Создаю...' : 'Добавить запись'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BookingManagementPage() {
  const searchParams = useSearchParams()
  const masterId = searchParams.get('master_id') || ''
  const salonId  = searchParams.get('salon_id')  || ''

  const [masterName,  setMasterName]  = useState('')
  const [bookings,    setBookings]    = useState<Booking[]>([])
  const [services,    setServices]    = useState<Service[]>([])
  const [schedule,    setSchedule]    = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [loading,     setLoading]     = useState(true)
  const [period,      setPeriod]      = useState<Period>('week')
  const [revenue,     setRevenue]     = useState(0)
  const [copied,      setCopied]      = useState(false)
  const [showQr,      setShowQr]      = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saveDone,    setSaveDone]    = useState(false)
  const [completeTarget, setCompleteTarget] = useState<Booking | null>(null)
  const [showCreate,  setShowCreate]  = useState(false)

  const bookingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/book/${masterId}`
    : `https://beautyos-bice.vercel.app/book/${masterId}`

  const loadBookings = useCallback(async () => {
    if (!masterId) return
    const { from, to } = periodRange(period)
    const res = await fetch(`/api/bookings?master_id=${masterId}&from=${from}&to=${to}`)
    const data = await res.json().catch(() => [])
    const list: Booking[] = Array.isArray(data) ? data : []
    setBookings(list)
    const rev = list.filter(b => b.status === 'completed').reduce((s, b) => s + (b.service_price ?? 0), 0)
    setRevenue(rev)
  }, [masterId, period])

  useEffect(() => {
    if (!masterId) { setLoading(false); return }
    Promise.all([
      fetch(`/api/booking/master?master_id=${masterId}`).then(r => r.json()).catch(() => null),
      fetch(`/api/availability?master_id=${masterId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/services?master_id=${masterId}`).then(r => r.json()).catch(() => []),
    ]).then(([masterData, availData, servicesData]) => {
      if (masterData?.master?.name) setMasterName(masterData.master.name)
      if (Array.isArray(availData) && availData.length > 0) {
        setSchedule(prev => prev.map(day => {
          const found = (availData as DaySchedule[]).find(l => l.day_of_week === day.day_of_week)
          return found ? { ...found } : day
        }))
      }
      if (Array.isArray(servicesData)) setServices(servicesData)
      setLoading(false)
    })
  }, [masterId])

  useEffect(() => { loadBookings() }, [loadBookings])

  async function patchBooking(id: string, update: Partial<Booking>) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...update } : b))
    const res = await fetch(`/api/bookings/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(update),
    })
    await loadBookings() // refresh revenue
    return res
  }

  function toggleDay(dow: number) {
    setSchedule(prev => {
      const exists = prev.find(d => d.day_of_week === dow)
      if (exists) return prev.map(d => d.day_of_week === dow ? { ...d, active: !d.active } : d)
      return [...prev, { day_of_week: dow, start_time: '10:00', end_time: '18:00', slot_duration: 60, active: true }]
    })
  }
  function updateDayField(dow: number, field: keyof DaySchedule, value: string | number | boolean) {
    setSchedule(prev => prev.map(d => d.day_of_week === dow ? { ...d, [field]: value } : d))
  }
  async function saveSchedule() {
    if (!masterId || !salonId) return
    setSaving(true)
    await fetch('/api/availability', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ master_id: masterId, salon_id: salonId, schedule }),
    })
    setSaving(false); setSaveDone(true)
    setTimeout(() => setSaveDone(false), 2500)
  }

  if (!masterId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center"><p className="text-graphite font-semibold mb-2">Мастер не выбран</p></div>
      </div>
    )
  }

  const completedCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="min-h-screen bg-cream">
      {/* Modals */}
      {completeTarget && (
        <CompleteModal
          booking={completeTarget}
          services={services}
          onClose={() => setCompleteTarget(null)}
          onSave={async (id, data) => { await patchBooking(id, data) }}
        />
      )}
      {showCreate && (
        <CreateModal
          masterId={masterId}
          salonId={salonId}
          services={services}
          onClose={() => setShowCreate(false)}
          onCreated={loadBookings}
        />
      )}

      <div className="max-w-md mx-auto px-4 py-8">
        <Link href={`/master?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors mb-6">
          <ArrowLeft size={14} /> Назад
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-1">Запись клиентов</p>
            <h1 className="text-2xl font-bold text-graphite">{masterName || 'Мастер'}</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-graphite text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={14} /> Добавить
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="bg-card border border-parchment rounded-2xl h-24" />)}
          </div>
        ) : (
          <div className="space-y-4">

            {/* Period filter + revenue */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <div className="flex gap-1.5 mb-4">
                {(['today', 'week', 'month'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                      period === p ? 'bg-graphite text-white' : 'bg-cream text-dusk hover:text-graphite border border-parchment'
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Banknote size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-dusk">Выручка · завершённые</p>
                  <p className="text-lg font-bold text-graphite">{fmtMoney(revenue)}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-dusk">Визитов</p>
                  <p className="text-lg font-bold text-graphite">{completedCount}</p>
                </div>
              </div>
            </div>

            {/* Bookings list */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-graphite">Записи</p>
                <span className="text-xs text-dusk/50">{PERIOD_LABELS[period].toLowerCase()}</span>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={24} className="text-dusk/30 mx-auto mb-2" />
                  <p className="text-sm text-dusk">Записей нет</p>
                  <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-graphite font-medium underline underline-offset-2">
                    Добавить запись
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div key={b.id} className="border border-parchment rounded-xl overflow-hidden">
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-graphite truncate">{b.client_name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Calendar size={10} className="text-dusk/50 shrink-0" />
                            <span className="text-xs text-dusk">{formatDate(b.booking_date)}</span>
                            <Clock size={10} className="text-dusk/50 shrink-0" />
                            <span className="text-xs text-dusk font-medium">{b.booking_time.slice(0,5)}</span>
                          </div>
                          {b.service_name && (
                            <p className="text-xs text-dusk/70 mt-1 truncate">
                              {b.service_name}{b.service_price ? ` · ${b.service_price.toLocaleString('ru-RU')} ₽` : ''}
                            </p>
                          )}
                          {b.next_visit_date && (
                            <p className="text-xs text-sage mt-0.5">
                              Следующий: {formatDate(b.next_visit_date)}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[b.status]}`}>
                            {STATUS_LABEL[b.status]}
                          </span>
                          {b.status === 'booked' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setCompleteTarget(b)}
                                title="Завершить визит"
                                className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                              >
                                <Check size={12} className="text-emerald-600" />
                              </button>
                              <button
                                onClick={() => patchBooking(b.id, { status: 'no_show' })}
                                title="Не пришёл"
                                className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                              >
                                <UserX size={12} className="text-amber-600" />
                              </button>
                              <button
                                onClick={() => patchBooking(b.id, { status: 'cancelled' })}
                                title="Отменить"
                                className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors"
                              >
                                <X size={12} className="text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking link */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <p className="text-sm font-semibold text-graphite mb-1">Ссылка для записи</p>
              <p className="text-xs text-dusk mb-3">Отправьте клиенту — он выберет время и запишется сам.</p>
              <div className="flex items-center gap-2 bg-parchment/60 rounded-xl px-3 py-2.5 border border-parchment mb-3">
                <code className="text-xs text-graphite/70 flex-1 truncate">{bookingLink}</code>
                <button onClick={() => { navigator.clipboard.writeText(bookingLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="shrink-0 text-dusk/50 hover:text-graphite transition-colors">
                  {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(bookingLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-graphite text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity">
                  {copied ? <><CheckCircle2 size={12} />Скопировано</> : <><Copy size={12} />Скопировать</>}
                </button>
                <button onClick={() => setShowQr(v => !v)}
                  className={`flex items-center justify-center gap-1.5 text-xs font-semibold border rounded-xl px-4 py-2.5 transition-colors ${
                    showQr ? 'bg-graphite/10 border-graphite/40 text-graphite' : 'border-parchment text-graphite/60 hover:border-graphite/30'
                  }`}>
                  <QrCode size={12} /> QR-код
                </button>
              </div>
              {showQr && (
                <div className="flex flex-col items-center gap-3 bg-white border border-parchment rounded-2xl py-6 px-4 mt-3">
                  <QRCodeSVG value={bookingLink} size={180} bgColor="#ffffff" fgColor="#2d2d2d" level="M" />
                  <p className="text-xs text-dusk text-center">Покажите клиенту для быстрой записи</p>
                </div>
              )}
            </div>

            {/* Availability schedule */}
            <div className="bg-card border border-parchment rounded-2xl p-5">
              <p className="text-sm font-semibold text-graphite mb-1">Рабочие часы</p>
              <p className="text-xs text-dusk mb-4">Клиенты смогут записываться только в эти окна.</p>
              <div className="space-y-3">
                {[0,1,2,3,4,5,6].map(dow => {
                  const day = schedule.find(d => d.day_of_week === dow) ?? {
                    day_of_week: dow, start_time: '10:00', end_time: '18:00', slot_duration: 60, active: false,
                  }
                  return (
                    <div key={dow} className={`border rounded-xl p-3 transition-colors ${day.active ? 'border-parchment bg-cream' : 'border-parchment/40 bg-parchment/20 opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleDay(dow)}
                          className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${day.active ? 'bg-graphite' : 'bg-parchment'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${day.active ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-sm font-semibold text-graphite w-7">{DAY_LABELS[dow]}</span>
                        {day.active && (
                          <div className="flex items-center gap-2 flex-1">
                            <input type="time" value={day.start_time}
                              onChange={e => updateDayField(dow, 'start_time', e.target.value)}
                              className="flex-1 text-xs bg-card border border-parchment rounded-lg px-2 py-1.5 text-graphite focus:outline-none focus:border-graphite/40" />
                            <span className="text-dusk/40 text-xs">—</span>
                            <input type="time" value={day.end_time}
                              onChange={e => updateDayField(dow, 'end_time', e.target.value)}
                              className="flex-1 text-xs bg-card border border-parchment rounded-lg px-2 py-1.5 text-graphite focus:outline-none focus:border-graphite/40" />
                          </div>
                        )}
                      </div>
                      {day.active && (
                        <div className="flex items-center gap-2 mt-2 pl-[52px]">
                          <span className="text-[10px] text-dusk/60">Слот:</span>
                          {[30,45,60,90].map(min => (
                            <button key={min} onClick={() => updateDayField(dow, 'slot_duration', min)}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                day.slot_duration === min ? 'bg-graphite text-white border-graphite' : 'bg-card text-dusk border-parchment hover:border-graphite/30'
                              }`}>{min}м</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <button onClick={saveSchedule} disabled={saving}
                className="w-full mt-5 flex items-center justify-center gap-2 bg-graphite text-white font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
                {saveDone ? <><CheckCircle2 size={15} />Сохранено</> : saving ? 'Сохраняю...' : <><Check size={15} />Сохранить расписание</>}
              </button>
            </div>

            {/* Services management */}
            <Link href={`/booking/services?master_id=${masterId}&salon_id=${salonId}`}
              className="flex items-center justify-between bg-card border border-parchment rounded-2xl px-5 py-4 hover:border-graphite/30 transition-colors">
              <div>
                <p className="text-sm text-graphite font-medium">Мои услуги</p>
                <p className="text-xs text-dusk">{services.length > 0 ? `${services.length} услуг` : 'Добавьте услуги с ценами'}</p>
              </div>
              <ChevronRight size={16} className="text-dusk/40" />
            </Link>

          </div>
        )}
      </div>
    </div>
  )
}
