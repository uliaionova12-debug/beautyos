'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, Plus, X, Link2, CheckCircle2,
  AlertCircle, Clock, Settings2, ShieldAlert, ExternalLink,
} from 'lucide-react'

// ─── Data Schema ──────────────────────────────────────────────────────────────

type Platform = 'google' | 'yandex' | '2gis' | 'instagram' | 'vk' | 'other'

interface ReputationSource {
  id: string
  platform: Platform
  url: string
  label: string
  status: 'pending' | 'active' | 'error'
  added_at: string
}

interface InternalReview {
  id: string
  client_name: string
  master_name: string | null
  rating: number
  text: string | null
  is_public: boolean
  platform: string | null
  created_at: string
}

interface ReputationSnapshot {
  salon_id: string
  sources: ReputationSource[]
  internal_reviews: InternalReview[]
  internal_avg_rating: number | null
  internal_total: number
  internal_negative: number
  internal_positive: number
  generated_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, { label: string; color: string; hint: string }> = {
  google:    { label: 'Google Maps',  color: 'bg-blue-50 text-blue-700 border-blue-200',   hint: 'google.com/maps' },
  yandex:    { label: 'Яндекс Карты', color: 'bg-red-50 text-red-700 border-red-200',      hint: 'yandex.ru/maps' },
  '2gis':    { label: '2GIS',         color: 'bg-green-50 text-green-700 border-green-200', hint: '2gis.ru' },
  instagram: { label: 'Instagram',    color: 'bg-pink-50 text-pink-700 border-pink-200',    hint: 'instagram.com' },
  vk:        { label: 'ВКонтакте',    color: 'bg-indigo-50 text-indigo-700 border-indigo-200', hint: 'vk.com' },
  other:     { label: 'Другое',       color: 'bg-gray-50 text-gray-600 border-gray-200',   hint: 'любая платформа' },
}

function detectPlatform(url: string): Platform {
  const u = url.toLowerCase()
  if (u.includes('google.com/maps') || u.includes('maps.google')) return 'google'
  if (u.includes('yandex.ru/maps') || u.includes('yandex.com/maps')) return 'yandex'
  if (u.includes('2gis.ru') || u.includes('2gis.com')) return '2gis'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('vk.com')) return 'vk'
  return 'other'
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function storageKey(salonId: string) {
  return `rep_sources_${salonId}`
}

function loadSources(salonId: string): ReputationSource[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(storageKey(salonId)) || '[]')
  } catch {
    return []
  }
}

function saveSources(salonId: string, sources: ReputationSource[]) {
  localStorage.setItem(storageKey(salonId), JSON.stringify(sources))
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  const d = Math.floor(h / 24)
  return `${d} дн назад`
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

interface SetupScreenProps {
  initialSources: ReputationSource[]
  onSave: (sources: ReputationSource[]) => void
}

function SetupScreen({ initialSources, onSave }: SetupScreenProps) {
  const [sources, setSources] = useState<ReputationSource[]>(initialSources)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [addingMore, setAddingMore] = useState(sources.length === 0)

  function addSource() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (!isValidUrl(trimmed)) {
      setUrlError('Введите корректный URL (начинается с https://)')
      return
    }
    if (sources.some(s => s.url === trimmed)) {
      setUrlError('Этот источник уже добавлен')
      return
    }
    const platform = detectPlatform(trimmed)
    const newSource: ReputationSource = {
      id: Date.now().toString(),
      platform,
      url: trimmed,
      label: PLATFORM_META[platform].label,
      status: 'pending',
      added_at: new Date().toISOString(),
    }
    setSources(prev => [...prev, newSource])
    setUrlInput('')
    setUrlError('')
    setAddingMore(false)
  }

  function removeSource(id: string) {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addSource()
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Empty state — no sources yet */}
      {sources.length === 0 && !addingMore && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={24} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-graphite mb-2">Добавьте источники отзывов</h2>
          <p className="text-sm text-dusk max-w-xs mx-auto leading-relaxed mb-6">
            Укажите ссылки на ваши страницы — Google Maps, Яндекс, 2GIS, Instagram и другие. Только реальные данные.
          </p>
          <button
            onClick={() => setAddingMore(true)}
            className="flex items-center gap-2 bg-graphite text-white px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mx-auto"
          >
            <Plus size={15} />
            Добавить первый источник
          </button>
        </div>
      )}

      {/* Source list */}
      {sources.length > 0 && (
        <div className="space-y-2 mb-4">
          {sources.map(source => {
            const meta = PLATFORM_META[source.platform]
            return (
              <div key={source.id} className="flex items-center gap-3 bg-card border border-parchment rounded-xl px-4 py-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${meta.color}`}>
                  {meta.label}
                </span>
                <p className="text-sm text-graphite/70 truncate flex-1 font-mono text-xs">{source.url}</p>
                <button onClick={() => removeSource(source.id)} className="text-dusk/30 hover:text-red-400 transition-colors p-1 shrink-0">
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add URL input */}
      {(addingMore || sources.length === 0) && (
        <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-dusk uppercase tracking-wider mb-3">
            {sources.length === 0 ? 'Первый источник' : 'Ещё один источник'}
          </p>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(Object.entries(PLATFORM_META) as [Platform, typeof PLATFORM_META[Platform]][]).map(([key, meta]) => (
              <span key={key} className={`text-[10px] font-medium px-2 py-1 rounded-full border ${meta.color}`}>
                {meta.hint}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
                onKeyDown={handleKey}
                placeholder="https://maps.google.com/..."
                autoFocus
                className="w-full bg-cream border border-parchment rounded-xl px-4 py-3 text-sm text-graphite placeholder-dusk/40 focus:outline-none focus:border-sage/50 transition-colors font-mono"
              />
              {urlError && <p className="text-xs text-red-500 mt-1.5">{urlError}</p>}
            </div>
            <button
              onClick={addSource}
              disabled={!urlInput.trim()}
              className="px-4 bg-graphite text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>

          {addingMore && sources.length > 0 && (
            <button
              onClick={() => { setAddingMore(false); setUrlInput(''); setUrlError('') }}
              className="mt-3 text-xs text-dusk/50 hover:text-dusk transition-colors"
            >
              Отмена
            </button>
          )}
        </div>
      )}

      {/* Add more + Save */}
      {sources.length > 0 && !addingMore && (
        <div className="space-y-3">
          <button
            onClick={() => setAddingMore(true)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-parchment hover:border-sage/40 text-dusk hover:text-sage rounded-xl py-3 text-sm font-medium transition-all"
          >
            <Plus size={14} />
            Добавить ещё источник
          </button>
          <button
            onClick={() => onSave(sources)}
            className="w-full flex items-center justify-center gap-2 bg-graphite text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 size={15} />
            Сохранить источники и продолжить
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Analytics Screen ─────────────────────────────────────────────────────────

interface AnalyticsScreenProps {
  snapshot: ReputationSnapshot
  onEditSources: () => void
}

function AnalyticsScreen({ snapshot, onEditSources }: AnalyticsScreenProps) {
  const internalNegative = snapshot.internal_reviews.filter(r => r.rating <= 3)
  const internalPositive = snapshot.internal_reviews.filter(r => r.rating >= 4)

  return (
    <div className="space-y-6">

      {/* Sources header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-0.5">Источники мониторинга</p>
          <p className="text-sm text-graphite">{snapshot.sources.length} {snapshot.sources.length === 1 ? 'платформа' : 'платформы'} подключено</p>
        </div>
        <button
          onClick={onEditSources}
          className="flex items-center gap-1.5 text-xs text-dusk hover:text-graphite transition-colors border border-parchment px-3 py-2 rounded-xl"
        >
          <Settings2 size={12} />
          Изменить
        </button>
      </div>

      {/* Sources list */}
      <div className="space-y-2">
        {snapshot.sources.map(source => {
          const meta = PLATFORM_META[source.platform]
          return (
            <div key={source.id} className="flex items-center gap-3 bg-card border border-parchment rounded-xl px-4 py-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border shrink-0 ${meta.color}`}>
                {meta.label}
              </span>
              <p className="text-xs text-graphite/60 truncate flex-1 font-mono">{source.url}</p>
              <a href={source.url} target="_blank" rel="noreferrer" className="text-dusk/30 hover:text-sage transition-colors shrink-0">
                <ExternalLink size={13} />
              </a>
              <div className="flex items-center gap-1 shrink-0">
                <Clock size={11} className="text-amber-400" />
                <span className="text-[10px] text-amber-600 font-medium">Ожидает данных</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Metrics — internal reviews only */}
      {snapshot.internal_total > 0 ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 col-span-2">
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-2xl font-bold text-amber-600">
                  {snapshot.internal_avg_rating?.toFixed(1) ?? '—'}
                </p>
                <Star size={12} className="text-amber-500 mb-0.5" />
              </div>
              <p className="text-xs text-dusk">Средний рейтинг</p>
            </div>
            <div className="bg-card border border-parchment rounded-xl p-4">
              <p className="text-2xl font-bold text-graphite">{snapshot.internal_total}</p>
              <p className="text-xs text-dusk mt-1">Отзывов</p>
            </div>
            <div className={`rounded-xl p-4 border ${internalNegative.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-2xl font-bold ${internalNegative.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {internalNegative.length}
              </p>
              <p className="text-xs text-dusk mt-1">Жалоб</p>
            </div>
          </div>

          {/* Internal reviews */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={13} className="text-dusk/60" />
              <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Внутренние отзывы</p>
              <span className="text-xs text-dusk/40">— от клиентов салона</span>
            </div>
            <div className="space-y-2">
              {snapshot.internal_reviews.map(review => (
                <div
                  key={review.id}
                  className={`rounded-xl p-4 border ${review.rating <= 3 ? 'bg-red-50 border-red-200' : 'bg-card border-parchment'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={11}
                            className={i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-parchment fill-parchment'} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-graphite">{review.client_name}</span>
                    </div>
                    <span className="text-[10px] text-dusk/50 shrink-0">{timeAgo(review.created_at)}</span>
                  </div>
                  {review.text && <p className="text-sm text-graphite leading-relaxed">{review.text}</p>}
                  {review.master_name && <p className="text-xs text-dusk mt-1">Мастер: {review.master_name}</p>}
                  {review.rating <= 3 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle size={11} />
                      Требует ответа
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card border border-parchment rounded-2xl p-6 text-center">
          <p className="text-sm text-dusk mb-1">Внутренних отзывов пока нет</p>
          <p className="text-xs text-dusk/50">Отзывы появятся после первых визитов клиентов</p>
        </div>
      )}

      {/* External: pending per source */}
      <div>
        <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-3">Внешние площадки</p>
        <div className="space-y-2">
          {snapshot.sources.map(source => {
            const meta = PLATFORM_META[source.platform]
            return (
              <div key={source.id} className="bg-card border border-parchment rounded-xl px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-dusk/60 font-mono truncate max-w-[160px]">{source.url}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-amber-400" />
                    <span className="text-[10px] text-amber-600">Ожидает загрузки данных</span>
                  </div>
                </div>
                <p className="text-xs text-dusk/40 mt-2">
                  Отзывы с этой платформы появятся после интеграции. Источник добавлен {timeAgo(source.added_at)}.
                </p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReputationPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  const [sources, setSources] = useState<ReputationSource[] | null>(null)
  const [snapshot, setSnapshot] = useState<ReputationSnapshot | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Load sources from localStorage on mount
  useEffect(() => {
    if (!salonId) { setSources([]); return }
    const stored = loadSources(salonId)
    setSources(stored)
  }, [salonId])

  // When sources are set (and non-empty), load internal reviews to build snapshot
  useEffect(() => {
    if (!salonId || !sources || sources.length === 0) return
    setLoadingReviews(true)
    fetch(`/api/reviews?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => {
        const reviews: InternalReview[] = d.reviews || []
        const ratings = reviews.map(r => r.rating).filter(Boolean)
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
        setSnapshot({
          salon_id: salonId,
          sources,
          internal_reviews: reviews,
          internal_avg_rating: avg,
          internal_total: reviews.length,
          internal_negative: reviews.filter(r => r.rating <= 3).length,
          internal_positive: reviews.filter(r => r.rating >= 4).length,
          generated_at: new Date().toISOString(),
        })
        setLoadingReviews(false)
      })
      .catch(() => {
        setSnapshot({
          salon_id: salonId,
          sources,
          internal_reviews: [],
          internal_avg_rating: null,
          internal_total: 0,
          internal_negative: 0,
          internal_positive: 0,
          generated_at: new Date().toISOString(),
        })
        setLoadingReviews(false)
      })
  }, [salonId, sources])

  function handleSaveSources(newSources: ReputationSource[]) {
    saveSources(salonId, newSources)
    setSources(newSources)
    setEditMode(false)
    setSnapshot(null)
    if (salonId) {
      fetch('/api/rep-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_id: salonId, platforms: newSources }),
      }).catch(() => { /* non-blocking */ })
    }
  }

  const showSetup = sources !== null && (sources.length === 0 || editMode)
  const showAnalytics = sources !== null && sources.length > 0 && !editMode && !!snapshot

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/actions?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Действия
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Star size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Директор по репутации</h1>
            <p className="text-sm text-dusk">
              {showSetup ? 'Настройка источников отзывов' : 'Мониторинг на основе ваших источников'}
            </p>
          </div>
        </div>

        {/* No salon_id */}
        {!salonId && (
          <div className="text-center py-12">
            <p className="text-dusk text-sm mb-4">Данные не загружены</p>
            <Link href="/explain" className="text-sage hover:opacity-80 transition-opacity text-sm">
              ← Загрузить данные
            </Link>
          </div>
        )}

        {/* Loading sources */}
        {salonId && sources === null && (
          <div className="flex items-center gap-3 py-12 justify-center text-dusk text-sm">
            <Link2 size={16} className="animate-pulse" />
            Загружаю источники...
          </div>
        )}

        {/* Setup screen */}
        {salonId && showSetup && (
          <SetupScreen
            initialSources={editMode ? (sources ?? []) : []}
            onSave={handleSaveSources}
          />
        )}

        {/* Loading reviews after sources saved */}
        {salonId && sources && sources.length > 0 && !editMode && !snapshot && (
          <div className="flex items-center gap-3 py-12 justify-center text-dusk text-sm">
            <Star size={16} className="animate-pulse text-amber-500" />
            Формирую снапшот репутации...
          </div>
        )}

        {/* Analytics screen */}
        {showAnalytics && (
          <AnalyticsScreen
            snapshot={snapshot!}
            onEditSources={() => setEditMode(true)}
          />
        )}

      </div>
    </div>
  )
}
