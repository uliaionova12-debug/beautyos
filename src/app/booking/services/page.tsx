'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react'

interface Service { id: string; name: string; duration_min: number; price: number | null }

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const masterId = searchParams.get('master_id') || ''
  const salonId  = searchParams.get('salon_id')  || ''

  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(true)
  const [name,     setName]     = useState('')
  const [price,    setPrice]    = useState('')
  const [duration, setDuration] = useState('60')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    if (!masterId) { setLoading(false); return }
    fetch(`/api/services?master_id=${masterId}`)
      .then(r => r.json()).then(data => { setServices(Array.isArray(data) ? data : []) })
      .finally(() => setLoading(false))
  }, [masterId])

  async function addService() {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/services', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ master_id: masterId, salon_id: salonId, name: name.trim(), duration_min: parseInt(duration) || 60, price: price ? parseFloat(price) : null }),
    })
    const data = await res.json()
    if (data.service) {
      setServices(prev => [...prev, data.service])
      setName(''); setPrice(''); setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function removeService(id: string) {
    setServices(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-4 py-8">
        <Link href={`/booking?master_id=${masterId}&salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-graphite transition-colors mb-6">
          <ArrowLeft size={14} /> Назад
        </Link>

        <div className="mb-7">
          <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-1">Каталог услуг</p>
          <h1 className="text-2xl font-bold text-graphite">Мои услуги</h1>
          <p className="text-sm text-dusk mt-1">Клиенты смогут выбрать услугу при онлайн-записи.</p>
        </div>

        {/* Add form */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-graphite mb-4">Добавить услугу</p>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Название услуги"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
            <div className="flex gap-3">
              <div className="flex-1">
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Стоимость, ₽"
                  className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-graphite/40 transition-colors" />
              </div>
              <div className="flex-1">
                <select value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite focus:outline-none focus:border-graphite/40 transition-colors">
                  {[30,45,60,90,120].map(m => <option key={m} value={m}>{m} мин</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={addService} disabled={!name.trim() || saving}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-graphite text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
            {saved ? <><CheckCircle2 size={14} />Добавлено</> : saving ? 'Сохраняю...' : <><Plus size={14} />Добавить</>}
          </button>
        </div>

        {/* Services list */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="bg-card border border-parchment rounded-xl h-14" />)}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-10 text-dusk text-sm">Услуг пока нет</div>
        ) : (
          <div className="space-y-2">
            {services.map(s => (
              <div key={s.id} className="bg-card border border-parchment rounded-xl flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-graphite truncate">{s.name}</p>
                  <p className="text-xs text-dusk">
                    {s.duration_min} мин{s.price !== null ? ` · ${s.price.toLocaleString('ru-RU')} ₽` : ''}
                  </p>
                </div>
                <button onClick={() => removeService(s.id)}
                  className="w-7 h-7 flex items-center justify-center text-dusk/40 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
