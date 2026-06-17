'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { VoiceButton } from '@/components/ui/VoiceButton'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING = 'Привет! Я нейроконсультант BeautyOS 👋\n\nРасскажи про свой салон — и я скажу, подойдёт ли вам наш продукт и сколько вы сможете вернуть.'

const CHIPS = [
  'У меня база в Excel',
  'Срок окупаемости?',
  'Интеграция с DIKIDI',
  'Безопасность данных',
  'Не разбираюсь в IT',
]

export function NeuroConsultant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETING }])
    }
  }, [open, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setPulse(false)
  }, [open])

  function appendTranscript(text: string) {
    setInput(prev => prev ? prev + ' ' + text : text)
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json()
      setMessages([...history, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Ошибка соединения. Попробуй ещё раз или напиши нам в Telegram @beautyos_ai' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
          <button
            data-consultant-open="true"
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2.5 bg-sage text-white px-5 py-3.5 rounded-full shadow-xl shadow-sage/30 hover:opacity-90 transition-opacity font-semibold text-sm"
          >
            {pulse && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-terracotta">
                <span className="absolute inset-0 rounded-full bg-terracotta animate-ping opacity-75" />
              </span>
            )}
            <Sparkles size={16} className="shrink-0" />
            Нейроконсультант
          </button>
        )}
      </div>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col bg-card border border-parchment rounded-3xl shadow-2xl shadow-graphite/15 overflow-hidden"
          style={{ height: 520 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-sage text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Нейроконсультант</p>
                <p className="text-[10px] opacity-70">BeautyOS · отвечает мгновенно</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 bg-sage/10 rounded-lg flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Sparkles size={11} className="text-sage" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-sage text-white rounded-br-sm'
                    : 'bg-cream border border-parchment text-graphite rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-sage/10 rounded-lg flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Sparkles size={11} className="text-sage" />
                </div>
                <div className="bg-cream border border-parchment rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-sage/50 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chips */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  className="text-[11px] bg-cream border border-parchment text-dusk px-3 py-1.5 rounded-full hover:border-sage hover:text-sage transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 shrink-0 border-t border-parchment">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                placeholder="Напишите вопрос или спросите голосом"
                className="flex-1 bg-cream border border-parchment rounded-xl px-4 py-2.5 text-sm text-graphite placeholder:text-dusk/50 outline-none focus:border-sage transition-colors"
              />
              <VoiceButton onTranscript={appendTranscript} variant="sage" />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-sage text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline teaser after FAQ — rendered as portal target */}
      <div id="consultant-anchor" />
    </>
  )
}

// Inline teaser block — placed after FAQ in page.tsx
export function ConsultantTeaser({ onOpen }: { onOpen?: () => void }) {
  return (
    <div className="mt-10 bg-sage/5 border border-sage/20 rounded-2xl p-7 flex flex-col md:flex-row items-center gap-5 max-w-2xl mx-auto">
      <div className="w-12 h-12 bg-sage/10 rounded-2xl flex items-center justify-center shrink-0">
        <Sparkles size={22} className="text-sage" />
      </div>
      <div className="flex-1 text-center md:text-left">
        <p className="text-sm font-semibold text-graphite mb-1">Не нашли ответ в FAQ?</p>
        <p className="text-sm text-dusk">Спросите нейроконсультанта — ответит мгновенно, знает все детали о тарифах, интеграциях и кейсах.</p>
      </div>
      <button
        onClick={() => {
          const btn = document.querySelector('[data-consultant-open]') as HTMLButtonElement
          btn?.click()
        }}
        className="bg-sage text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap"
      >
        Спросить AI →
      </button>
    </div>
  )
}
