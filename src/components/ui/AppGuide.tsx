'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { VoiceButton } from './VoiceButton'

interface Message { role: 'user' | 'assistant'; content: string }

const PAGE_CHIPS: Record<string, string[]> = {
  '/dashboard':        ['Что такое дефициты?', 'Где найти действия на сегодня?', 'Что значат точки роста?', 'Как поделиться ссылкой с клиентом?'],
  '/actions':          ['Почему это действие первое?', 'Как выполнить действие?', 'Что делать после звонка?', 'Как работает приоритет?'],
  '/execution':        ['Где взять текст сообщения?', 'Что писать клиенту?', 'Как зафиксировать результат?'],
  '/reputation':       ['Как добавить площадку отзывов?', 'Как попросить клиента оставить отзыв?', 'Что такое гейтинг отзывов?'],
  '/client':           ['Как работает история визитов?', 'Где кнопка записи?', 'Что такое Beauty Companion?'],
  '/beauty-companion': ['Как активировать персональный режим?', 'Почему чипы заблокированы?', 'Как получить ссылку от мастера?'],
  '/join':             ['Что ввести в форму?', 'Что делать, если меня нет в базе?', 'Что открывается после входа?'],
  '/marketing':        ['Как выбрать цель контента?', 'Что значит формат?', 'Как создать изображение?'],
  '/retention':        ['Как понять статус клиента?', 'Что значит "в зоне риска"?', 'Как работает список клиентов?'],
  '/booking':          ['Как настроить рабочие часы?', 'Как отправить ссылку клиенту?', 'Как изменить длительность слота?'],
  '/book':             ['Как выбрать время?', 'Что вводить в форму?', 'Что получит клиент после записи?'],
  'default':           ['Я не понимаю, с чего начать', 'Как принимать запись клиентов?', 'Как загрузить клиентскую базу?', 'Как работает система?'],
}

const GREETING = `Привет! Я AI-консультант BeautyOS.

Помогу разобраться с любым разделом приложения: что где находится, что означают показатели и что нужно сделать дальше.

Спросите что угодно — или выберите быстрый вопрос ниже.`

function formatMessage(text: string) {
  return text.split('\n').map((line, i) => {
    const isNumbered = /^\d+\.\s/.test(line)
    const isBullet   = /^[•\-]\s/.test(line)
    return (
      <p key={i} className={`${isNumbered || isBullet ? 'pl-2' : ''} ${line === '' ? 'h-2' : ''} leading-relaxed`}>
        {line}
      </p>
    )
  })
}

interface AppGuideProps { currentPage?: string }

export function AppGuide({ currentPage = '' }: AppGuideProps) {
  const pathname   = usePathname()
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [pulse, setPulse]       = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const page     = currentPage || pathname || ''
  const chipKey  = Object.keys(PAGE_CHIPS).find(k => page.startsWith(k)) || 'default'
  const chips    = PAGE_CHIPS[chipKey]
  const showChips = messages.length <= 1 && chips.length > 0

  // Greet on open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETING }])
    }
  }, [open, messages.length])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Kill pulse once opened
  useEffect(() => {
    if (open) setPulse(false)
  }, [open])

  // Close on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/app-guide', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history, context: { page } }),
      })
      const data = await res.json()
      setMessages([...history, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...history, {
        role: 'assistant',
        content: 'Сейчас не могу ответить. Попробуйте обновить страницу или задайте вопрос позже.',
      }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9997] bg-black/40"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        onClick={() => setOpen(false)}
      />

      {/* ── Bottom sheet chat ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-[9998] bg-card rounded-t-3xl shadow-2xl shadow-graphite/20 flex flex-col overflow-hidden"
        style={{
          height: '72vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-parchment rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-parchment shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sage/10 rounded-xl flex items-center justify-center">
              <Sparkles size={14} className="text-sage" />
            </div>
            <div>
              <p className="text-sm font-semibold text-graphite leading-tight">AI-консультант</p>
              <p className="text-[10px] text-dusk/40 mt-px">BeautyOS · помогает разобраться</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center text-dusk/40 hover:text-graphite hover:bg-parchment/60 rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 bg-sage/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={11} className="text-sage" />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-graphite text-white rounded-br-sm'
                  : 'bg-cream border border-parchment text-graphite rounded-bl-sm space-y-0.5'
              }`}>
                {m.role === 'assistant' ? formatMessage(m.content) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-sage/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <Sparkles size={11} className="text-sage" />
              </div>
              <div className="bg-cream border border-parchment rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-graphite/30 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick chips */}
        {showChips && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-[10px] text-dusk/40 uppercase tracking-wider mb-2">Быстрые вопросы</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  disabled={loading}
                  className="text-[11px] bg-cream border border-parchment text-dusk px-3 py-1.5 rounded-full hover:border-sage/60 hover:text-sage transition-colors disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 shrink-0 border-t border-parchment">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Напишите вопрос..."
              disabled={loading}
              className="flex-1 bg-cream border border-parchment rounded-xl px-4 py-2.5 text-sm text-graphite placeholder:text-dusk/40 outline-none focus:border-sage/50 transition-colors disabled:opacity-50"
            />
            <VoiceButton
              onTranscript={t => setInput(prev => prev ? prev + ' ' + t : t)}
              disabled={loading}
              variant="graphite"
              size="md"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-sage text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      {!open && (
        <div
          className="fixed right-5 z-[9999]"
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={() => setOpen(true)}
            className="relative w-14 h-14 bg-sage text-white rounded-full shadow-lg shadow-sage/30 flex items-center justify-center hover:bg-sage/90 active:scale-95 transition-all"
          >
            {pulse && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose/80 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-rose" />
              </span>
            )}
            <Sparkles size={22} />
          </button>
        </div>
      )}
    </>
  )
}
