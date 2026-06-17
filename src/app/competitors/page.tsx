'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Target, Plus, Loader2, Trash2,
  ExternalLink, ChevronDown, ChevronUp, X,
  Wifi, Calendar, MessageSquare, AlertTriangle,
} from 'lucide-react'

interface PriceRow {
  service: string
  their_price: string | null
  vs_note: string | null
}

interface OnlinePresence {
  has_online_booking: boolean | null
  social_media_active: boolean | null
  responds_to_reviews: boolean | null
  notes: string
}

interface CompetitorAnalysis {
  price_comparison: PriceRow[]
  online_presence: OnlinePresence
  threat_score: number
  threat_reason: string
  strengths: string[]
  weaknesses: string[]
  services_highlight: string
  services_we_lack: string[]
  recommendation: string
  page_loaded: boolean
}

interface Competitor {
  id: string
  name: string
  urls: string[]
  analysis: CompetitorAnalysis | null
  loading: boolean
  error: string | null
  expanded: boolean
}

const URL_HINTS = [
  { icon: '✅', label: 'Сайт салона', example: 'beauty-studio.ru' },
  { icon: '✅', label: '2ГИС', example: '2gis.ru/firm/...' },
  { icon: '✅', label: 'Яндекс.Карты', example: 'yandex.ru/maps/org/...' },
  { icon: '⚠️', label: 'Instagram / VK', example: 'могут не загрузиться' },
]

const THREAT_CONFIG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'Не опасны',     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  2: { label: 'Слабая угроза', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  3: { label: 'Средняя угроза',color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  4: { label: 'Серьёзная угроза', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  5: { label: 'Высокая угроза',color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200'     },
}

function normalizeUrl(raw: string): string {
  const t = raw.trim()
  return /^https?:\/\//i.test(t) ? t : 'https://' + t
}

function storageKey(salonId: string) {
  return `beautyos_competitors_v2_${salonId}`
}

function OnlineFlag({ value, icon: Icon, label }: { value: boolean | null; icon: React.ElementType; label: string }) {
  if (value === null) return null
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${value ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-cream text-dusk border border-parchment'}`}>
      <Icon size={11} />
      {label}
      <span className="font-semibold">{value ? '✓' : '✗'}</span>
    </div>
  )
}

export default function CompetitorsPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || 'demo'
  const salonAvgCheck = parseInt(searchParams.get('avg_check') || '0') || undefined

  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [name, setName] = useState('')
  const [urlInputs, setUrlInputs] = useState([''])
  const [hintsOpen, setHintsOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(salonId))
      if (saved) setCompetitors(JSON.parse(saved).map((c: Competitor) => ({ ...c, loading: false })))
    } catch {}
  }, [salonId])

  function save(list: Competitor[]) {
    try { localStorage.setItem(storageKey(salonId), JSON.stringify(list)) } catch {}
  }

  function update(id: string, patch: Partial<Competitor>) {
    setCompetitors(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...patch } : c)
      save(next)
      return next
    })
  }

  async function analyze(competitor: Competitor) {
    update(competitor.id, { loading: true, error: null })
    try {
      const res = await fetch('/api/analyze-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: competitor.urls,
          competitor_name: competitor.name,
          salon_avg_check: salonAvgCheck,
        }),
      })
      const data = await res.json()
      if (data.success) {
        update(competitor.id, { analysis: data.analysis, loading: false, expanded: true })
      } else {
        update(competitor.id, { error: data.error || 'Ошибка анализа', loading: false })
      }
    } catch {
      update(competitor.id, { error: 'Нет соединения', loading: false })
    }
  }

  function addCompetitor() {
    const validUrls = urlInputs.map(normalizeUrl).filter(u => u.length > 10)
    if (!name.trim() || !validUrls.length) return
    const c: Competitor = {
      id: Date.now().toString(),
      name: name.trim(),
      urls: validUrls,
      analysis: null,
      loading: false,
      error: null,
      expanded: false,
    }
    const next = [...competitors, c]
    setCompetitors(next)
    save(next)
    setName('')
    setUrlInputs([''])
    analyze(c)
  }

  function addUrlInput() {
    if (urlInputs.length < 3) setUrlInputs(prev => [...prev, ''])
  }

  function removeUrlInput(i: number) {
    setUrlInputs(prev => prev.filter((_, idx) => idx !== i))
  }

  function setUrl(i: number, val: string) {
    setUrlInputs(prev => prev.map((u, idx) => idx === i ? val : u))
  }

  function remove(id: string) {
    const next = competitors.filter(c => c.id !== id)
    setCompetitors(next)
    save(next)
  }

  const threatCfg = (score: number) => THREAT_CONFIG[Math.min(5, Math.max(1, score))] ?? THREAT_CONFIG[3]

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link href={`/actions?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors mb-6">
          <ArrowLeft size={14} /> Действия
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose/10 rounded-xl">
            <Target size={20} className="text-rose" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Директор по конкурентам</h1>
            <p className="text-sm text-dusk">AI читает сайт и делает глубокий анализ</p>
          </div>
        </div>

        {/* URL hints */}
        <div className="mb-6">
          <button onClick={() => setHintsOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-dusk hover:text-graphite transition-colors mt-3">
            {hintsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Какие ссылки работают?
          </button>
          {hintsOpen && (
            <div className="mt-2 bg-card border border-parchment rounded-xl p-4 grid grid-cols-2 gap-3">
              {URL_HINTS.map(h => (
                <div key={h.label} className="flex items-start gap-2">
                  <span className="text-sm leading-none mt-0.5">{h.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-graphite">{h.label}</p>
                    <p className="text-[11px] text-dusk/60">{h.example}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add form */}
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-graphite mb-4">Добавить конкурента</p>
          <div className="flex flex-col gap-3">
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Название салона"
              className="w-full border border-parchment rounded-xl px-4 py-3 text-sm bg-cream placeholder-dusk/40 focus:outline-none focus:border-rose/40" />

            {urlInputs.map((u, i) => (
              <div key={i} className="flex gap-2">
                <input value={u} onChange={e => setUrl(i, e.target.value)}
                  placeholder={i === 0 ? 'Сайт, 2ГИС или Яндекс.Карты' : 'Ещё один источник (необязательно)'}
                  className="flex-1 border border-parchment rounded-xl px-4 py-3 text-sm bg-cream placeholder-dusk/40 focus:outline-none focus:border-rose/40"
                  onKeyDown={e => e.key === 'Enter' && i === urlInputs.length - 1 && addCompetitor()} />
                {i > 0 && (
                  <button onClick={() => removeUrlInput(i)}
                    className="text-dusk/40 hover:text-red-400 transition-colors px-2">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            {urlInputs.length < 3 && (
              <button onClick={addUrlInput}
                className="flex items-center gap-1.5 text-xs text-dusk hover:text-rose transition-colors self-start">
                <Plus size={11} /> Добавить ещё источник
              </button>
            )}

            <button onClick={addCompetitor}
              disabled={!name.trim() || !urlInputs[0].trim()}
              className="flex items-center justify-center gap-2 bg-rose text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mt-1">
              <Target size={15} /> Проанализировать
            </button>
          </div>
        </div>

        {/* Empty state */}
        {competitors.length === 0 && (
          <div className="text-center py-12 text-dusk/50">
            <Target size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Добавьте первого конкурента выше</p>
          </div>
        )}

        {/* Competitors list */}
        <div className="space-y-3">
          {competitors.map(comp => {
            const tc = comp.analysis ? threatCfg(comp.analysis.threat_score) : null
            return (
              <div key={comp.id} className="bg-card border border-parchment rounded-2xl overflow-hidden">

                {/* Card header */}
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-graphite">{comp.name}</p>
                      {tc && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tc.color} ${tc.bg} ${tc.border}`}>
                          {'▲'.repeat(Math.min(comp.analysis!.threat_score, 5))} {tc.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {comp.urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-dusk/60 hover:text-rose transition-colors">
                          <ExternalLink size={9} />
                          {u.replace(/^https?:\/\//, '').slice(0, 35)}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {comp.loading && <Loader2 size={15} className="text-rose animate-spin" />}
                    {comp.analysis && (
                      <button onClick={() => update(comp.id, { expanded: !comp.expanded })}
                        className="text-dusk hover:text-graphite transition-colors">
                        {comp.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                    <button onClick={() => remove(comp.id)}
                      className="text-dusk/40 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Loading */}
                {comp.loading && (
                  <div className="px-4 pb-4 text-xs text-dusk/60 flex items-center gap-2">
                    <Loader2 size={11} className="animate-spin" />
                    Загружаю страницы и анализирую...
                  </div>
                )}

                {/* Error */}
                {comp.error && !comp.loading && (
                  <div className="px-4 pb-4">
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {comp.error}.{' '}
                      <button onClick={() => analyze(comp)} className="underline hover:no-underline">Попробовать снова</button>
                    </div>
                  </div>
                )}

                {/* Analysis */}
                {comp.analysis && comp.expanded && (
                  <div className="border-t border-parchment px-4 py-4 space-y-5">

                    {!comp.analysis.page_loaded && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Страницу не удалось загрузить — анализ на основе названия и URL
                      </p>
                    )}

                    {/* Threat */}
                    {tc && (
                      <div className={`rounded-xl p-4 border ${tc.bg} ${tc.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={13} className={tc.color} />
                          <p className={`text-xs font-bold uppercase tracking-wider ${tc.color}`}>
                            Угроза {comp.analysis.threat_score}/5 — {tc.label}
                          </p>
                        </div>
                        <p className="text-sm text-graphite">{comp.analysis.threat_reason}</p>
                      </div>
                    )}

                    {/* Specialization */}
                    {comp.analysis.services_highlight && (
                      <div>
                        <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-1">Специализация</p>
                        <p className="text-sm text-graphite">{comp.analysis.services_highlight}</p>
                      </div>
                    )}

                    {/* Price comparison */}
                    {comp.analysis.price_comparison?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-2">Цены конкурента</p>
                        <div className="space-y-1.5">
                          {comp.analysis.price_comparison.map((row, i) => (
                            <div key={i} className="flex items-center justify-between bg-cream border border-parchment rounded-lg px-3 py-2">
                              <span className="text-xs text-graphite">{row.service}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-graphite">{row.their_price ?? '—'}</span>
                                {row.vs_note && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    row.vs_note.includes('дешевле') || row.vs_note.includes('ниже')
                                      ? 'bg-red-50 text-red-600'
                                      : row.vs_note.includes('дороже') || row.vs_note.includes('выше')
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-parchment text-dusk'
                                  }`}>{row.vs_note}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Online presence */}
                    {comp.analysis.online_presence && (
                      <div>
                        <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-2">Онлайн-присутствие</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <OnlineFlag value={comp.analysis.online_presence.has_online_booking} icon={Calendar} label="Онлайн-запись" />
                          <OnlineFlag value={comp.analysis.online_presence.social_media_active} icon={Wifi} label="Соцсети активны" />
                          <OnlineFlag value={comp.analysis.online_presence.responds_to_reviews} icon={MessageSquare} label="Отвечают на отзывы" />
                        </div>
                        {comp.analysis.online_presence.notes && (
                          <p className="text-xs text-dusk">{comp.analysis.online_presence.notes}</p>
                        )}
                      </div>
                    )}

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-2">
                      {comp.analysis.strengths.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-2">Сильные стороны</p>
                          <ul className="space-y-1">
                            {comp.analysis.strengths.map((s, i) => (
                              <li key={i} className="text-[12px] text-graphite leading-snug">· {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {comp.analysis.weaknesses.length > 0 && (
                        <div className="bg-cream border border-parchment rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-2">Слабые стороны</p>
                          <ul className="space-y-1">
                            {comp.analysis.weaknesses.map((w, i) => (
                              <li key={i} className="text-[12px] text-graphite leading-snug">· {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Services we lack */}
                    {comp.analysis.services_we_lack?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2">
                          Есть у них — нет у нас
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.analysis.services_we_lack.map((s, i) => (
                            <span key={i} className="text-xs bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded-lg">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {comp.analysis.recommendation && (
                      <div className="bg-rose/5 border border-rose/20 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-rose uppercase tracking-wider mb-2">Рекомендация</p>
                        <p className="text-sm text-graphite leading-relaxed">{comp.analysis.recommendation}</p>
                      </div>
                    )}

                    <button onClick={() => analyze(comp)} className="text-xs text-dusk hover:text-rose transition-colors">
                      Обновить анализ
                    </button>

                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
