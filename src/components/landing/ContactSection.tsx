'use client'

import { useState } from 'react'
import { Send, CheckCircle, MessageCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'done' | 'error'

export function ContactSection() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
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
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-blush border border-terracotta/15 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left — copy */}
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-4">Живой человек</p>
              <h2 className="text-2xl md:text-3xl font-bold text-graphite mb-4 leading-tight">
                Написать Юлии напрямую
              </h2>
              <p className="text-dusk leading-relaxed mb-8">
                Если хотите спросить о продукте, обсудить свою ситуацию или просто познакомиться —
                заполните форму. Отвечаю лично, обычно в течение часа.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-terracotta/10 rounded-xl flex items-center justify-center shrink-0">
                    <MessageCircle size={15} className="text-terracotta" />
                  </div>
                  <span className="text-sm text-dusk">Отвечаю лично, пн–пт 9:00–20:00</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-terracotta/10 rounded-xl flex items-center justify-center shrink-0">
                    <Send size={15} className="text-terracotta" />
                  </div>
                  <a href="https://t.me/beautyos_ai" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-terracotta hover:underline font-medium">
                    или напишите в Telegram @beautyos_ai
                  </a>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-card p-10 md:p-14 flex flex-col justify-center">
              {status === 'done' ? (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="text-sage mx-auto mb-4" />
                  <p className="text-lg font-semibold text-graphite mb-2">Получила, спасибо!</p>
                  <p className="text-sm text-dusk">Отвечу вам в ближайшее время.</p>
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
                    <label className="block text-xs font-semibold text-dusk mb-1.5 tracking-wide uppercase">Коротко о вашем салоне или вопросе</label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Работаю одна, база 200 клиентов в Excel, хочу попробовать..."
                      rows={3}
                      className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage transition-colors resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-xs text-terracotta">Что-то пошло не так. Напишите напрямую в Telegram @beautyos_ai</p>
                  )}

                  <button
                    type="submit"
                    disabled={!name.trim() || !contact.trim() || status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-sage text-white py-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {status === 'loading' ? (
                      <span className="flex gap-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                        ))}
                      </span>
                    ) : (
                      <>Написать Юлии <Send size={15} /></>
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
      </div>
    </section>
  )
}
