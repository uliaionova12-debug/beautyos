'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Target, Plus, Loader2, CheckCircle2,
  AlertCircle, Trash2, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'

interface CompetitorAnalysis {
  price_range: string | null
  strengths: string[]
  weaknesses: string[]
  services_highlight: string
  recommendation: string
  page_loaded: boolean
}

interface Competitor {
  id: string
  name: string
  url: string
  analysis: CompetitorAnalysis | null
  loading: boolean
  error: string | null
  expanded: boolean
}

const URL_HINTS = [
  { icon: '✅', label: 'Сайт салона', example: 'beauty-studio.ru' },
  { icon: '✅', label: '2ГИС', example: '2gis.ru/moscow/firm/...' },
  { icon: '✅', label: 'Яндекс.Карты', example: 'yandex.ru/maps/org/...' },
  { icon: '⚠️', label: 'Instagram / VK', example: 'могут не загрузиться' },
]

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function storageKey(salonId: string) {
  return `beautyos_competitors_${salonId}`
}

export default function CompetitorsPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || 'demo'
  const salonAvgCheck = parseInt(searchParams.get('avg_check') || '0') || undefined

  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [hintsOpen, setHintsOpen] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(salonId))
      if (saved) {
        const parsed: Competitor[] = JSON.parse(saved)
        setCompetitors(parsed.map(c => ({ ...c, loading: false })))
      }
    } catch {}
  }, [salonId])

  function save(list: Competitor[]) {
    try {
      localStorage.setItem(storageKey(salonId), JSON.stringify(list))
    } catch {}
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
          url: competitor.url,
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
    if (!name.trim() || !url.trim()) return
    const c: Competitor = {
      id: Date.now().toString(),
      name: name.trim(),
      url: normalizeUrl(url),
      analysis: null,
      loading: false,
      error: null,
      expanded: false,
    }
    const next = [...competitors, c]
    setCompetitors(next)
    save(next)
    setName('')
    setUrl('')
    analyze(c)
  }

  function remove(id: string) {
    const next = competitors.filter(c => c.id !== id)
    setCompetitors(next)
    save(next)
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-rose transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Дашборд
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose/10 rounded-xl">
            <Target size={20} className="text-rose" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Директор по конкурентам</h1>
            <p className="text-sm text-dusk">AI читает сайт и выдаёт анализ</p>
          </div>
        </div>

        {/* URL hints */}
        <div className="mb-6">
          <button
            onClick={() => setHintsOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-dusk hover:text-graphite transition-colors mt-3"
          >
            {hintsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Какие ссылки можно вставлять?
          </button>
          {hintsOpen && (
            <div className="mt-2 bg-card border border-parchment rounded-xl p-4 grid grid-cols-2 gap-2">
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
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Название салона"
              className="w-full border border-parchment rounded-xl px-4 py-3 text-sm bg-cream placeholder-dusk/40 focus:outline-none focus:border-rose/40"
            />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Ссылка: сайт, 2ГИС, Яндекс.Карты"
              className="w-full border border-parchment rounded-xl px-4 py-3 text-sm bg-cream placeholder-dusk/40 focus:outline-none focus:border-rose/40"
              onKeyDown={e => e.key === 'Enter' && addCompetitor()}
            />
            <button
              onClick={addCompetitor}
              disabled={!name.trim() || !url.trim()}
              className="flex items-center justify-center gap-2 bg-rose text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={15} />
              Проанализировать
            </button>
          </div>
        </div>

        {/* Competitors list */}
        {competitors.length === 0 && (
          <div className="text-center py-12 text-dusk/50">
            <Target size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Добавьте первого конкурента выше</p>
          </div>
        )}

        <div className="space-y-3">
          {competitors.map(comp => (
            <div key={comp.id} className="bg-card border border-parchment rounded-2xl overflow-hidden">

              {/* Card header */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-graphite truncate">{comp.name}</p>
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-dusk/60 hover:text-rose transition-colors truncate"
                  >
                    <ExternalLink size={10} />
                    {comp.url.replace(/^https?:\/\//, '').slice(0, 50)}
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {comp.loading && <Loader2 size={15} className="text-rose animate-spin" />}
                  {!comp.loading && comp.analysis && (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  )}
                  {!comp.loading && comp.error && (
                    <AlertCircle size={15} className="text-amber-500" />
                  )}
                  {comp.analysis && (
                    <button
                      onClick={() => update(comp.id, { expanded: !comp.expanded })}
                      className="text-dusk hover:text-graphite transition-colors"
                    >
                      {comp.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  )}
                  <button
                    onClick={() => remove(comp.id)}
                    className="text-dusk/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Loading state */}
              {comp.loading && (
                <div className="px-4 pb-4 text-xs text-dusk/60 flex items-center gap-2">
                  <Loader2 size={11} className="animate-spin" />
                  Загружаю страницу и анализирую...
                </div>
              )}

              {/* Error */}
              {comp.error && !comp.loading && (
                <div className="px-4 pb-4">
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {comp.error}. &nbsp;
                    <button onClick={() => analyze(comp)} className="underline hover:no-underline">
                      Попробовать снова
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis */}
              {comp.analysis && comp.expanded && (
                <div className="border-t border-parchment px-4 py-4 space-y-4">

                  {!comp.analysis.page_loaded && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Страницу не удалось загрузить — анализ на основе URL и названия
                    </p>
                  )}

                  {comp.analysis.services_highlight && (
                    <div>
                      <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-1">Специализация</p>
                      <p className="text-sm text-graphite">{comp.analysis.services_highlight}</p>
                    </div>
                  )}

                  {comp.analysis.price_range && (
                    <div>
                      <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-1">Цены</p>
                      <p className="text-sm text-graphite">{comp.analysis.price_range}</p>
                    </div>
                  )}

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

                  {comp.analysis.recommendation && (
                    <div className="bg-rose/5 border border-rose/20 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-rose uppercase tracking-wider mb-2">Рекомендация</p>
                      <p className="text-sm text-graphite leading-relaxed">{comp.analysis.recommendation}</p>
                    </div>
                  )}

                  <button
                    onClick={() => analyze(comp)}
                    className="text-xs text-dusk hover:text-rose transition-colors"
                  >
                    Обновить анализ
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
