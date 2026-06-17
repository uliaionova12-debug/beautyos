'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Send, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { VoiceButton } from '@/components/ui/VoiceButton'
import { type SummaryData } from '@/lib/ai-snapshot'

interface Message { role: 'user' | 'assistant'; content: string }

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <p key={i} className="text-[10px] font-bold text-dusk/50 uppercase tracking-widest mt-5 mb-2 first:mt-0">
          {line.replace('## ', '')}
        </p>
      )
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 my-1">
          <span className="text-sage shrink-0 mt-0.5">·</span>
          <span className="text-sm text-graphite leading-relaxed">{line.replace(/^[•\-] /, '')}</span>
        </div>
      )
    }
    if (/^\d+\. /.test(line)) {
      return (
        <div key={i} className="flex gap-2 my-1">
          <span className="text-sage font-bold text-sm shrink-0 w-4">{line.match(/^\d+/)?.[0]}.</span>
          <span className="text-sm text-graphite leading-relaxed">{line.replace(/^\d+\. /, '')}</span>
        </div>
      )
    }
    if (line.startsWith('Название:') || line.startsWith('Почему') || line.startsWith('Потенциал:') || line.startsWith('Факт:')) {
      const [label, ...rest] = line.split(':')
      return (
        <p key={i} className="text-sm text-graphite my-1">
          <span className="text-dusk/60 font-medium">{label}:</span>{rest.join(':')}
        </p>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1" />
    return <p key={i} className="text-sm text-graphite leading-relaxed my-0.5">{line}</p>
  })
}

function BriefBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="bg-card border border-parchment rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sage/10 rounded-lg">
            <Sparkles size={13} className="text-sage" />
          </div>
          <span className="text-[10px] font-bold text-sage uppercase tracking-widest">AI Director · Бриф</span>
        </div>
        <button onClick={copy} className="flex items-center gap-1 text-[11px] text-dusk/40 hover:text-dusk transition-colors">
          {copied ? <><CheckCircle2 size={11} className="text-emerald-500" />Скопировано</> : <><Copy size={11} />Копировать</>}
        </button>
      </div>
      <div className="space-y-0.5">{renderMarkdown(content)}</div>
    </div>
  )
}

export default function AiDirectorPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [brief, setBrief] = useState<string | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Загружаем summary → строим brief
  useEffect(() => {
    if (!salonId) return
    fetch(`/api/summary?salon_id=${salonId}`)
      .then(r => r.json())
      .then(async (s: SummaryData) => {
        setSummary(s)
        setBriefLoading(true)
        try {
          const res = await fetch('/api/ai-director', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [], summary: s }),
          })
          const data = await res.json()
          setBrief(data.message)
        } catch {
          setBrief('Не удалось сформировать бриф. Попробуйте позже.')
        } finally {
          setBriefLoading(false)
        }
      })
      .catch(() => setBriefLoading(false))
  }, [salonId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  async function send(text: string) {
    if (!text.trim() || chatLoading || !summary) return
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai-director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, summary }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Ошибка подключения.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Nav */}
        <Link
          href={`/actions?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Действия
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-sage/10 rounded-xl">
            <Sparkles size={20} className="text-sage" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-graphite">AI Director</h1>
            <p className="text-xs text-dusk">Финансовый и операционный директор салона</p>
          </div>
        </div>

        {/* No salon_id */}
        {!salonId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-amber-700 mb-3">Данные салона не загружены</p>
            <Link href="/explain" className="text-sm text-sage hover:opacity-80 transition-opacity">
              ← Загрузить данные
            </Link>
          </div>
        )}

        {/* Brief */}
        {salonId && (
          <div className="mb-6">
            {briefLoading && (
              <div className="bg-card border border-parchment rounded-2xl p-6 flex items-center gap-3">
                <Loader2 size={16} className="text-sage animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-graphite">Формирую бриф...</p>
                  <p className="text-xs text-dusk mt-0.5">Анализирую данные через scoring engine</p>
                </div>
              </div>
            )}
            {!briefLoading && brief && <BriefBlock content={brief} />}
          </div>
        )}

        {/* Follow-up chat */}
        {salonId && brief && !briefLoading && (
          <>
            {/* Chat messages */}
            {messages.length > 0 && (
              <div className="space-y-3 mb-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sage text-white rounded-br-sm'
                        : 'bg-card border border-parchment text-graphite rounded-bl-sm'
                    }`}>
                      {msg.role === 'assistant'
                        ? <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                        : msg.content
                      }
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-parchment rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-2 h-2 rounded-full bg-sage/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={bottomRef} />

            {/* Suggested follow-ups */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  'Кого вернуть в первую очередь?',
                  'Почему клиенты уходят?',
                  'Как увеличить средний чек?',
                  'Что делать с пустыми окнами?',
                ].map(q => (
                  <button key={q} onClick={() => send(q)} disabled={chatLoading}
                    className="text-xs bg-card border border-parchment text-dusk hover:border-sage/50 hover:text-sage px-3 py-2 rounded-full transition-colors disabled:opacity-40">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 sticky bottom-4">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Уточните любой вопрос по данным..."
                disabled={chatLoading}
                className="flex-1 bg-card border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/60 transition-colors disabled:opacity-50"
              />
              <VoiceButton
                onTranscript={t => setInput(prev => prev ? prev + ' ' + t : t)}
                disabled={chatLoading}
                variant="sage"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || chatLoading}
                className="w-11 h-11 bg-sage text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
