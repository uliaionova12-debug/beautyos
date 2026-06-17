'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Plus, X, Loader2, CheckCircle, User } from 'lucide-react'
import Link from 'next/link'

type SalonType = 'solo' | 'team' | 'salon'

interface ManualClient {
  id: number
  name: string
  phone: string
  last_visit_date: string
  service_name: string
  amount: string
}

const EMPTY_FORM = { name: '', phone: '', last_visit_date: '', service_name: '', amount: '' }

const SALON_TYPES: { key: SalonType; emoji: string; title: string; hint: string }[] = [
  { key: 'solo',  emoji: '💅', title: 'Работаю одна',           hint: 'Мастер, косметолог, инъекционист, лэшмейкер и другие' },
  { key: 'team',  emoji: '✂️', title: 'У нас небольшая команда', hint: '2–5 мастеров, студия или кабинет' },
  { key: 'salon', emoji: '🏠', title: 'У нас салон',             hint: '6 и более мастеров, полноценный салон красоты' },
]

const DEFAULT_NAMES: Record<SalonType, string> = {
  solo:  'Мой кабинет',
  team:  'Наша студия',
  salon: 'Мой салон',
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {[1, 2, 3].map(n => (
        <div key={n} className={`h-1.5 rounded-full transition-all ${n === current ? 'w-8 bg-rose' : n < current ? 'w-4 bg-rose/40' : 'w-4 bg-parchment'}`} />
      ))}
      <span className="text-xs text-dusk/50 ml-1">Шаг {current} из 3</span>
    </div>
  )
}

export default function ManualStartPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [salonType, setSalonType] = useState<SalonType | null>(null)
  const [salonName, setSalonName] = useState('')
  const [clients, setClients] = useState<ManualClient[]>([])
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDone, setLoadingDone] = useState(false)
  const [error, setError] = useState('')
  const nextId = () => Date.now()

  // ── Step 1: Who are you ──
  function step1Valid() { return salonType !== null }

  function goToStep2() {
    if (!step1Valid()) return
    setStep(2)
  }

  // ── Step 2: First client form ──
  function step2Valid() {
    return form.name.trim().length > 0 && form.last_visit_date.length > 0
  }

  function addFirstClient() {
    if (!step2Valid()) return
    setClients([{ id: nextId(), ...form }])
    setForm({ ...EMPTY_FORM })
    setStep(3)
  }

  // ── Step 3: More clients + analyze ──
  function addMoreClient() {
    if (!form.name.trim() || !form.last_visit_date) return
    setClients(prev => [...prev, { id: nextId(), ...form }])
    setForm({ ...EMPTY_FORM })
    setShowAddForm(false)
  }

  function removeClient(id: number) {
    setClients(prev => prev.filter(c => c.id !== id))
  }

  async function runAnalysis() {
    if (clients.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/manual-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: salonName.trim() || DEFAULT_NAMES[salonType || 'solo'],
          salon_type: salonType,
          clients: clients.map(({ id: _id, ...c }) => c),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка'); setLoading(false); return }
      setLoadingDone(true)
      setTimeout(() => router.push(`/dashboard?salon_id=${data.salon_id}`), 1500)
    } catch {
      setError('Ошибка подключения. Проверьте интернет.')
      setLoading(false)
    }
  }

  // ── Loading overlay ──
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 gap-5">
        {loadingDone
          ? <CheckCircle size={40} className="text-rose" />
          : <Loader2 size={40} className="text-rose animate-spin" />
        }
        <div className="text-center">
          <p className="text-graphite font-semibold text-base">
            {loadingDone ? 'Готово!' : 'Создаю первый анализ...'}
          </p>
          <p className="text-dusk text-sm mt-1">
            {loadingDone ? 'Формирую карту бизнеса...' : 'Анализирую возвратность клиентов'}
          </p>
        </div>
      </div>
    )
  }

  // ── Client form block ──
  function ClientForm({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) {
    return (
      <div className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Имя клиента *</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Анна Иванова" autoFocus
            className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Телефон</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+7 900 000 00 00"
            className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Последний визит *</label>
          <input type="date" value={form.last_visit_date} onChange={e => setForm(f => ({ ...f, last_visit_date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite focus:outline-none focus:border-rose/50 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Услуга</label>
            <input type="text" value={form.service_name} onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}
              placeholder="Маникюр"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Стоимость, ₽</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="2500"
              className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors" />
          </div>
        </div>

        <button onClick={onSubmit} disabled={!form.name.trim() || !form.last_visit_date}
          className="w-full flex items-center justify-center gap-2 bg-rose text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30">
          {submitLabel}
          <ArrowRight size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        <div className="mb-8">
          {step === 1
            ? <Link href="/join/salon" className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors"><ArrowLeft size={14} />Назад</Link>
            : <button onClick={() => { setStep(s => (s - 1) as 1 | 2 | 3); setError('') }} className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors"><ArrowLeft size={14} />Назад</button>
          }
        </div>

        <StepDots current={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-semibold text-graphite mb-1">Кто Вы?</h1>
            <p className="text-sm text-dusk mb-8">Это поможет настроить BeautyOS под Вас.</p>

            <div className="space-y-2.5 mb-8">
              {SALON_TYPES.map(({ key, emoji, title, hint }) => (
                <button key={key} onClick={() => setSalonType(key)}
                  className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${salonType === key ? 'border-rose bg-rose/5' : 'border-parchment bg-card hover:border-rose/30'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-graphite">{title}</p>
                      <p className="text-xs text-dusk mt-0.5 leading-snug">{hint}</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-colors ${salonType === key ? 'border-rose bg-rose' : 'border-parchment'}`} />
                  </div>
                </button>
              ))}
            </div>

            {salonType && (
              <div className="mb-8">
                <label className="block text-xs font-semibold text-dusk mb-2 tracking-wide">
                  Название {salonType === 'solo' ? 'кабинета' : salonType === 'team' ? 'студии' : 'салона'}
                  <span className="text-dusk/40 font-normal ml-1">(необязательно)</span>
                </label>
                <input type="text" value={salonName} onChange={e => setSalonName(e.target.value)}
                  placeholder={DEFAULT_NAMES[salonType]}
                  className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors" />
              </div>
            )}

            <button onClick={goToStep2} disabled={!step1Valid()}
              className="w-full flex items-center justify-center gap-2 bg-rose text-white py-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30">
              Далее
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <h1 className="text-xl font-semibold text-graphite mb-1">Добавьте первого клиента</h1>
            <p className="text-sm text-dusk mb-8">Нам нужны имя и дата последнего визита — всё остальное опционально.</p>
            <div className="bg-card border border-parchment rounded-2xl p-6">
              <ClientForm onSubmit={addFirstClient} submitLabel="Добавить и продолжить" />
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div>
            <h1 className="text-xl font-semibold text-graphite mb-1">Добавьте ещё клиентов</h1>
            <p className="text-sm text-dusk mb-6">Чем больше клиентов — тем точнее анализ.</p>

            {/* Client list */}
            <div className="space-y-2 mb-4">
              {clients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 bg-card border border-parchment rounded-xl px-4 py-3">
                  <div className="w-7 h-7 bg-rose/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={12} className="text-rose" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-graphite truncate">{c.name}</p>
                    <p className="text-[11px] text-dusk">
                      {c.last_visit_date}{c.service_name ? ` · ${c.service_name}` : ''}{c.amount ? ` · ${c.amount} ₽` : ''}
                    </p>
                  </div>
                  {i > 0 && (
                    <button onClick={() => removeClient(c.id)} className="text-dusk/30 hover:text-terracotta transition-colors p-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add more */}
            {showAddForm
              ? (
                <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-graphite">Ещё один клиент</p>
                    <button onClick={() => { setShowAddForm(false); setForm({ ...EMPTY_FORM }) }} className="text-dusk/40 hover:text-dusk transition-colors"><X size={16} /></button>
                  </div>
                  <ClientForm onSubmit={addMoreClient} submitLabel="Добавить" />
                </div>
              )
              : (
                <button onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-parchment hover:border-rose/40 text-dusk hover:text-rose rounded-xl py-3 text-sm font-medium transition-all mb-6">
                  <Plus size={15} />
                  Добавить клиента
                </button>
              )
            }

            {error && <p className="text-xs text-terracotta text-center mb-4">{error}</p>}

            {/* Analyze button */}
            <div className="bg-rose/5 border border-rose/20 rounded-2xl p-5">
              <p className="text-sm text-graphite font-medium mb-0.5">
                У Вас {clients.length} {clients.length === 1 ? 'клиент' : clients.length < 5 ? 'клиента' : 'клиентов'}
              </p>
              <p className="text-xs text-dusk mb-4">
                BeautyOS определит, кто давно не возвращался, и покажет потенциальную выручку.
              </p>
              <button onClick={runAnalysis}
                className="w-full flex items-center justify-center gap-2 bg-rose text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                🌸 Создать первый анализ
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
