'use client'

import { useState } from 'react'
import { Send, CheckCircle, Clock } from 'lucide-react'

type Status = 'idle' | 'loading' | 'done' | 'error'

export function ContactSection() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !contact.trim()) return
    setStatus('loading')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: contact.includes('@') || contact.includes('t.me') ? null : contact.trim(),
          telegram: contact.includes('@') || contact.includes('t.me') ? contact.trim() : null,
          business_type: message.trim() || null,
          plan: 'landing_contact',
        }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10">
          <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-3">Остался вопрос?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-graphite">Покажем, сколько клиентов вы теряете прямо сейчас</h2>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2">

          {/* Left — dark panel */}
          <div className="bg-graphite p-10 md:p-14 flex flex-col justify-between gap-8">
            <div>
              <p className="text-xs text-sage/70 font-semibold uppercase tracking-widest mb-5">Команда BeautyOS</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                Разберём вашу ситуацию лично
              </h3>
              <p className="text-white/60 leading-relaxed text-sm mb-6">
                Расскажите о салоне — покажем, сколько клиентов можно вернуть именно у вас
              </p>

              {/* Team avatars */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  {['Ю', 'А', 'М'].map((initial, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-graphite flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: ['#8B5CF6', '#10B981', '#F59E0B'][i] }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                  <span className="text-xs text-white/50">3 эксперта онлайн</span>
                </div>
              </div>

              {/* Response time */}
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Clock size={13} />
                <span>Отвечаем за 15 минут · пн–пт 9:00–20:00</span>
              </div>
            </div>

            {/* Founder story */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-sm text-white/50 leading-relaxed italic mb-3">
                «Я не управляла салоном — я 30 лет наблюдала бьюти-индустрию глазами клиента и предпринимателя.
                И каждый раз видела одно и то же: мастера не перезванивают, клиенты уходят молча, а владелец не знает почему.
                Я сделала BeautyOS, чтобы это изменить.»
              </p>
              <p className="text-xs text-white/30 font-medium uppercase tracking-wider">
                20 лет в бизнесе · основатель BeautyOS
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-card p-10 md:p-14 flex flex-col justify-center">
            {status === 'done' ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-sage mx-auto mb-4" />
                <p className="text-lg font-semibold text-graphite mb-2">Получили, спасибо!</p>
                <p className="text-sm text-dusk">Ответим вам в ближайшее время.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide uppercase">Ваше имя *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ольга"
                    required
                    className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide uppercase">Телефон или Telegram *</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder="+7 900 000 00 00 или @username"
                    required
                    className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide uppercase">Коротко о салоне</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="2 мастера, база 300 клиентов в Excel..."
                    rows={3}
                    className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage transition-colors resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-sage w-4 h-4"
                  />
                  <span className="text-xs text-dusk/60 leading-relaxed">
                    Я согласен(-на) с{' '}
                    <a href="/privacy" className="underline hover:text-dusk transition-colors">политикой обработки персональных данных</a>
                  </span>
                </label>

                {status === 'error' && (
                  <p className="text-xs text-terracotta">Что-то пошло не так. Напишите напрямую в Telegram{' '}
                    <a href="https://t.me/beautyos_ai" target="_blank" rel="noopener noreferrer" className="underline">@beautyos_ai</a>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!name.trim() || !contact.trim() || !agreed || status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 bg-sage text-white py-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {status === 'loading' ? (
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  ) : (
                    <>Получить персональный разбор <Send size={14} /></>
                  )}
                </button>

                <p className="text-[10px] text-dusk/40 text-center leading-relaxed">
                  Нажимая кнопку, вы соглашаетесь с{' '}
                  <a href="/privacy" className="underline">политикой обработки данных</a>
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
