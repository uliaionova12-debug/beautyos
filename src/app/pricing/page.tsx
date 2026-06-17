'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'

type PlanId = 'solo' | 'studio' | 'salon'

const PLANS = [
  {
    id: 'solo' as PlanId,
    name: 'SOLO',
    tagline: 'Для самостоятельных специалистов',
    audience: ['Маникюр и педикюр', 'Брови и ресницы', 'Косметология', 'Массаж', 'Парикмахерский сервис', 'Эпиляция'],
    inheritsFrom: null,
    features: [
      'Beauty Companion',
      'AI-Коуч специалиста',
      'Контроль возвратности клиентов',
      'Анализ отзывов',
      'Контент-помощник',
      'Напоминания клиентам',
    ],
    price: 1990,
    featured: false,
  },
  {
    id: 'studio' as PlanId,
    name: 'STUDIO',
    tagline: 'Для небольших студий и команд',
    audience: [],
    inheritsFrom: 'SOLO',
    features: [
      'Аналитика по специалистам',
      'Загрузка команды',
      'Общая клиентская база',
      'AI-Директор студии',
      'Контроль загрузки специалистов',
    ],
    price: 4990,
    featured: true,
  },
  {
    id: 'salon' as PlanId,
    name: 'SALON',
    tagline: 'Для салонов красоты',
    audience: [],
    inheritsFrom: 'STUDIO',
    features: [
      'Полная бизнес-аналитика',
      'Конкуренты',
      'Репутация и отзывы',
      'Контроль удержания клиентов',
      'Маркетинговые рекомендации',
      'AI-Директор салона',
    ],
    price: 9990,
    featured: false,
  },
]

const PLAN_BUSINESS_TYPE: Record<PlanId, string> = {
  solo: 'solo',
  studio: 'team',
  salon: 'salon',
}

const EARLY_ACCESS_PERKS = [
  'Персональное сопровождение запуска',
  'Помощь с загрузкой данных',
  'Влияние на развитие продукта',
  'Специальные условия запуска',
]

interface ModalForm {
  name: string
  phone: string
  telegram: string
  businessType: string
}

export default function PricingPage() {
  const [modalPlan, setModalPlan] = useState<PlanId | null>(null)
  const [form, setForm] = useState<ModalForm>({ name: '', phone: '', telegram: '', businessType: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const closeModal = useCallback(() => {
    setModalPlan(null)
    setSubmitted(false)
    setSubmitError('')
    setForm({ name: '', phone: '', telegram: '', businessType: '' })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeModal])

  function openModal(planId: PlanId) {
    setModalPlan(planId)
    setSubmitted(false)
    setSubmitError('')
    setForm({ name: '', phone: '', telegram: '', businessType: PLAN_BUSINESS_TYPE[planId] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          telegram: form.telegram,
          business_type: form.businessType,
          plan: modalPlan,
        }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true) // show success regardless
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlan = PLANS.find(p => p.id === modalPlan)

  return (
    <>
      <div className="min-h-screen bg-cream">

        {/* Header */}
        <header className="flex items-center justify-between px-7 md:px-12 py-5 md:py-6 border-b border-parchment/60">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors">
              <ArrowLeft size={14} />
              Назад
            </Link>
            <Link href="/" className="text-base font-semibold tracking-tight text-graphite">
              BeautyOS<sup className="text-rose text-[10px] font-bold ml-0.5 relative -top-1">+</sup>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-rose hidden sm:block">Тарифы</span>
            <Link href="/role" className="text-sm font-medium text-dusk hover:text-rose transition-colors">Войти</Link>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-2xl mx-auto text-center px-6 pt-16 pb-12">
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-rose mb-6">
            Ранний доступ
          </p>
          <h1 className="font-serif text-[2.2rem] md:text-[2.8rem] leading-[1.1] text-graphite mb-5 tracking-tight">
            Выберите формат,<br className="hidden sm:block" /> который подходит именно Вам
          </h1>
          <p className="text-[15px] text-dusk leading-relaxed max-w-md mx-auto">
            Присоединяйтесь к первым пользователям BeautyOS и получите специальные условия запуска.
          </p>
        </section>

        {/* Pricing cards */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-3xl flex flex-col transition-shadow ${
                  plan.featured
                    ? 'bg-card border-2 border-rose/40 shadow-xl shadow-rose/8 md:-mt-3 md:-mb-3'
                    : 'bg-card border border-parchment shadow-sm'
                }`}
              >
                {/* Popular badge */}
                {plan.featured && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                    <span className="bg-rose text-white text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full shadow-sm">
                      Популярный
                    </span>
                  </div>
                )}

                <div className={`p-7 flex flex-col flex-1 ${plan.featured ? 'pt-10' : ''}`}>

                  {/* Plan header */}
                  <div className="mb-6">
                    <p className={`font-serif text-[1.6rem] font-semibold tracking-tight mb-1 ${plan.featured ? 'text-rose' : 'text-graphite'}`}>
                      {plan.name}
                    </p>
                    <p className="text-sm text-dusk leading-snug">{plan.tagline}</p>
                  </div>

                  {/* Audience tags — SOLO only */}
                  {plan.audience.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {plan.audience.map(a => (
                        <span key={a} className="text-[11px] text-dusk bg-parchment/60 px-2.5 py-1 rounded-full">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Inherits note */}
                  {plan.inheritsFrom && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-parchment" />
                      <span className="text-[11px] text-dusk/60 font-medium whitespace-nowrap">
                        Всё из {plan.inheritsFrom}, плюс:
                      </span>
                      <div className="h-px flex-1 bg-parchment" />
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.featured ? 'text-rose' : 'text-sage'}`} />
                        <span className="text-[13px] text-graphite leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price */}
                  <div className="mb-6 pt-5 border-t border-parchment/60">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[2rem] font-bold tracking-tight ${plan.featured ? 'text-rose' : 'text-graphite'}`}>
                        {plan.price.toLocaleString('ru')} ₽
                      </span>
                      <span className="text-sm text-dusk">/ месяц</span>
                    </div>
                    {plan.featured && (
                      <p className="text-[11px] text-dusk/60 mt-1">Наиболее популярный выбор</p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => openModal(plan.id)}
                    className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90 ${
                      plan.featured
                        ? 'bg-rose text-white shadow-sm shadow-rose/20'
                        : 'bg-cream border border-rose/30 text-rose hover:border-rose/60'
                    }`}
                  >
                    Попробовать бесплатно
                  </button>

                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Early access block */}
        <section className="max-w-2xl mx-auto px-6 pb-20">
          <div
            className="rounded-3xl px-8 py-10 text-center"
            style={{ background: 'linear-gradient(135deg, #F5EDE3 0%, #EDE9E2 50%, #F2E8E0 100%)' }}
          >
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-rose/70 mb-4">
              Для первых пользователей
            </p>
            <h2 className="font-serif text-[1.5rem] md:text-[1.8rem] text-graphite leading-tight mb-3 tracking-tight">
              BeautyOS в стадии раннего доступа
            </h2>
            <p className="text-sm text-dusk leading-relaxed mb-8 max-w-sm mx-auto">
              Первые пользователи получают особые условия и помогают формировать продукт.
            </p>
            <ul className="inline-flex flex-col gap-3 text-left mb-8">
              {EARLY_ACCESS_PERKS.map(perk => (
                <li key={perk} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-rose/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-rose" />
                  </div>
                  <span className="text-[13px] text-graphite">{perk}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => openModal('studio')}
              className="inline-flex items-center gap-2 bg-graphite text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              🌸 Получить ранний доступ
            </button>
          </div>
        </section>

      </div>

      {/* Modal */}
      {modalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,25,23,0.25)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md mx-auto relative overflow-hidden">

            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-cream text-dusk hover:text-graphite transition-colors"
            >
              <X size={15} />
            </button>

            <div className="p-8">
              {!submitted ? (
                <>
                  {/* Modal header */}
                  <div className="mb-7">
                    {selectedPlan && (
                      <span className="inline-block text-[10px] font-bold tracking-[0.18em] uppercase text-rose bg-rose/10 px-3 py-1 rounded-full mb-4">
                        {selectedPlan.name} · {selectedPlan.price.toLocaleString('ru')} ₽/мес
                      </span>
                    )}
                    <h2 className="font-serif text-[1.6rem] text-graphite leading-tight tracking-tight">
                      Получить ранний доступ
                    </h2>
                    <p className="text-sm text-dusk mt-2 leading-relaxed">
                      Оставьте контакты, и мы свяжемся с Вами для подключения BeautyOS.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Имя *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Анна"
                        required
                        autoFocus
                        className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Телефон</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+7 900 000 00 00"
                        className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Telegram</label>
                      <input
                        type="text"
                        value={form.telegram}
                        onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))}
                        placeholder="@username"
                        className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-rose/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide">Тип бизнеса</label>
                      <select
                        value={form.businessType}
                        onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                        className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite focus:outline-none focus:border-rose/50 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="solo">Специалист — работаю один</option>
                        <option value="team">Студия — небольшая команда</option>
                        <option value="salon">Салон красоты</option>
                      </select>
                    </div>

                    {submitError && (
                      <p className="text-xs text-terracotta">{submitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !form.name.trim()}
                      className="w-full bg-rose text-white py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 mt-2"
                    >
                      {submitting ? 'Отправляю...' : 'Отправить заявку'}
                    </button>
                  </form>

                  <p className="text-[11px] text-dusk/40 text-center mt-5 leading-relaxed">
                    Никакого спама. Мы напишем только по делу.
                  </p>
                </>
              ) : (
                /* Success state */
                <div className="py-6 text-center">
                  <div className="w-14 h-14 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl">🌸</span>
                  </div>
                  <h2 className="font-serif text-[1.5rem] text-graphite mb-3 tracking-tight">
                    Заявка отправлена
                  </h2>
                  <p className="text-sm text-dusk leading-relaxed mb-8 max-w-xs mx-auto">
                    Спасибо, {form.name}! Мы свяжемся с Вами в ближайшее время для подключения BeautyOS.
                  </p>
                  <button
                    onClick={closeModal}
                    className="text-sm text-dusk/60 hover:text-rose transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}
