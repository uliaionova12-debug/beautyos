'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react'
import {
  buildSnapshot, getSortedActionIds, getMoneyImpact, fmtMoney,
  ACTION_LAYER, ACTION_SPEEDS, ACTION_EASE,
  type SummaryData, type ActionId,
} from '@/lib/ai-snapshot'

// ─── Types ───────────────────────────────────────────────────────────────────

type Layer = 'cash' | 'growth' | 'market'

interface ScoredAction {
  id: string
  layer: Layer
  text: string
  sub: string
  cta: string
  href: string
  rawMoney: number
  clients: number
  moneyImpact: number
  speedOfMoney: number
  easeOfExecution: number
  finalScore: number
  selectionReason: string
}

// ─── Action display copy — единственная копия текстов ────────────────────────
// Scoring делегирован в /lib/ai-snapshot. Здесь только UX-текст.

function buildScoredActions(s: SummaryData, q: string): ScoredAction[] {
  const snap = buildSnapshot(s)
  const pool = snap.actions_seed_data
  const slots = snap.capacity.empty_slots

  const ACTION_COPY: Record<ActionId, Pick<ScoredAction, 'text' | 'sub' | 'cta' | 'clients' | 'selectionReason'>> = {
    cash_at_risk: {
      text: `Написать ${s.at_risk_count} клиентам, которые могут уйти`,
      sub: `Не приходили 90–180 дней · ещё не ушли · один контакт возвращает запись`,
      cta: 'Открыть список клиентов',
      clients: s.at_risk_count,
      selectionReason: `${s.at_risk_count} клиентов ещё не ушли — максимальный эффект при минимальном усилии`,
    },
    cash_lost: {
      text: `Вернуть ${s.lost_count} ушедших клиентов личным сообщением`,
      sub: `Давно не были · ~30% возвращаются при прямом контакте · потенциал ${fmtMoney(pool.cash_lost_pool)}`,
      cta: 'Открыть ушедших',
      clients: s.lost_count,
      selectionReason: `${s.lost_count} ушедших — самый дешёвый способ вернуть выручку`,
    },
    cash_slots: {
      text: `Заполнить ~${slots} пустых окна в расписании мастеров`,
      sub: `Каждое незаполненное окно — деньги, которые сгорят сегодня`,
      cta: 'Открыть расписание',
      clients: slots,
      selectionReason: `Пустые окна сегодня = прямая потеря ${fmtMoney(pool.cash_slots_pool)}`,
    },
    growth_check: {
      text: `Поднять средний чек на 15% через дополнительные услуги`,
      sub: `${s.active_clients} активных клиентов · ${fmtMoney(pool.growth_check_pool)} прироста без новых клиентов`,
      cta: 'Разобраться с чеком',
      clients: s.active_clients,
      selectionReason: 'Доп. услуги к уже записанным — быстрый прирост без рекламы',
    },
    growth_freq: {
      text: `Увеличить частоту визитов активных клиентов`,
      sub: `${s.active_clients} активных · каждый дополнительный визит = ${fmtMoney(s.avg_check)}`,
      cta: 'Посмотреть нагрузку мастеров',
      clients: s.active_clients,
      selectionReason: 'Более частые визиты постоянных клиентов = стабильный рост',
    },
    growth_ltv: {
      text: `Повысить системную возвратность клиентов`,
      sub: `Сейчас возвращается ${s.retention_rate}% · каждый +1% = ${fmtMoney(s.avg_check * s.total_clients * 0.01)} в год`,
      cta: 'Открыть стратегию роста',
      clients: s.total_clients,
      selectionReason: 'Системное удержание — долгосрочный рост без затрат на рекламу',
    },
    market_comp: {
      text: `Найти слабые стороны конкурентов и забрать их клиентов`,
      sub: `Введите ссылку на конкурента · получите конкретные уязвимости и точки входа`,
      cta: 'Открыть разбор конкурентов',
      clients: 0,
      selectionReason: 'Зная слабые стороны конкурентов — перехватываете их клиентов',
    },
    market_content: {
      text: `Создать контент, который приводит клиентов на запись`,
      sub: `Формулы продающих постов под ваши услуги, сезон и аудиторию`,
      cta: 'Открыть маркетинг',
      clients: 0,
      selectionReason: 'Правильный контент конвертирует подписчиков в записи',
    },
    market_rep: {
      text: `Проверить репутацию в интернете и исправить слабые места`,
      sub: `Отзывы и рейтинг влияют на выбор клиентов — это внешний поток`,
      cta: 'Открыть анализ репутации',
      clients: 0,
      selectionReason: 'Репутация — первое, что видит новый клиент перед записью',
    },
  }

  const POOL_MAP: Record<ActionId, number> = {
    cash_at_risk:   pool.cash_at_risk_pool,
    cash_lost:      pool.cash_lost_pool,
    cash_slots:     pool.cash_slots_pool,
    growth_check:   pool.growth_check_pool,
    growth_freq:    pool.growth_freq_pool,
    growth_ltv:     pool.growth_ltv_pool,
    market_comp:    pool.market_comp_pool,
    market_content: pool.market_content_pool,
    market_rep:     pool.market_rep_pool,
  }

  return getSortedActionIds(snap).map(id => {
    const copy = ACTION_COPY[id]
    const mi = getMoneyImpact(snap, id)
    const sp = ACTION_SPEEDS[id]
    const e  = ACTION_EASE[id]
    return {
      id,
      layer: ACTION_LAYER[id],
      ...copy,
      href: `/execution/${id}${q}`,
      rawMoney: POOL_MAP[id],
      moneyImpact: mi,
      speedOfMoney: sp,
      easeOfExecution: e,
      finalScore: Math.round(mi * 0.5 + sp * 0.3 + e * 0.2),
    }
  })
}

// ─── Layer config ─────────────────────────────────────────────────────────────

const LAYER_META: Record<Layer, { label: string; accentBorder: string; headerBg: string; badge: string }> = {
  cash:   { label: 'Деньги сегодня',  accentBorder: 'border-l-red-400',   headerBg: 'bg-red-50',   badge: 'bg-red-100 text-red-700' },
  growth: { label: 'Рост дохода',     accentBorder: 'border-l-amber-400', headerBg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  market: { label: 'Рынок',           accentBorder: 'border-l-blue-400',  headerBg: 'bg-blue-50',  badge: 'bg-blue-100 text-blue-700' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActionsPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const q = salonId ? `?salon_id=${salonId}` : ''

  const [actions, setActions] = useState<ScoredAction[]>([])
  const [loading, setLoading] = useState(!!salonId)

  useEffect(() => {
    if (!salonId) return
    fetch(`/api/summary?salon_id=${salonId}`)
      .then(r => r.json())
      .then((s: SummaryData) => { setActions(buildScoredActions(s, q)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [salonId, q])

  const primary   = actions[0] ?? null
  const secondary = actions.slice(1)

  // Group secondary by layer (preserve sorted order within)
  const byLayer = (['cash', 'growth', 'market'] as Layer[]).map(layer => ({
    layer,
    meta: LAYER_META[layer],
    items: secondary.filter(a => a.layer === layer),
  })).filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">

        {/* Nav */}
        <div className="mb-7">
          <Link
            href={`/dashboard${q}`}
            className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors -ml-2 px-2 py-3 rounded-xl"
          >
            <ArrowLeft size={16} />
            Карта бизнеса
          </Link>
        </div>

        {/* Header */}
        <div className="mb-7">
          <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-2">BeautyOS</p>
          <h1 className="text-2xl font-bold text-graphite mb-3">Что делать дальше</h1>
          <p className="text-sm text-dusk/70 leading-relaxed border-l-2 border-sage/40 pl-3">
            Здесь собраны действия, которые напрямую влияют на ваш доход: сегодня, в росте и на рынке
          </p>
        </div>

        {/* ── PRIMARY ACTION ──────────────────────────────────────── */}
        {salonId && (
          <div className="mb-5">
            {loading ? (
              <div className="bg-graphite rounded-2xl p-6 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-1/3 mb-5" />
                <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2 mb-8" />
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[1,2,3].map(i => <div key={i} className="h-8 bg-white/10 rounded" />)}
                </div>
                <div className="h-12 bg-white/10 rounded-xl" />
              </div>
            ) : primary ? (
              <div className="bg-graphite rounded-2xl p-6 shadow-lg shadow-graphite/15">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      Главное действие · сделать сейчас
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${LAYER_META[primary.layer].badge}`}>
                    {LAYER_META[primary.layer].label}
                  </span>
                </div>

                {/* Text */}
                <p className="text-white font-bold text-lg leading-snug mb-2">{primary.text}</p>
                <p className="text-white/40 text-sm leading-relaxed mb-1">{primary.sub}</p>
                <p className="text-amber-400/70 text-xs italic mb-6">↳ {primary.selectionReason}</p>

                {/* Score bars */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Финансовый эффект', value: primary.moneyImpact },
                    { label: 'Скорость денег',    value: primary.speedOfMoney },
                    { label: 'Лёгкость',          value: primary.easeOfExecution },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider leading-none">{label}</p>
                        <p className="text-[10px] font-bold text-white/50">{value}</p>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400/60 rounded-full" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Money + CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">потенциал</p>
                    <p className="text-2xl font-bold text-emerald-400">{fmtMoney(primary.rawMoney)}</p>
                    {primary.clients > 0 && (
                      <p className="text-xs text-white/30 mt-0.5">{primary.clients} клиентов</p>
                    )}
                  </div>
                  <Link
                    href={primary.href}
                    className="flex items-center gap-2 bg-white text-graphite font-bold text-sm px-5 py-3 rounded-xl hover:bg-cream transition-colors"
                  >
                    {primary.cta}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── SECONDARY — grouped by layer ───────────────────────── */}
        <div className="space-y-4">
          {salonId && !loading ? (
            byLayer.map(({ layer, meta, items }) => (
              <div key={layer} className={`rounded-2xl overflow-hidden border border-parchment border-l-4 ${meta.accentBorder}`}>
                <div className={`px-5 pt-4 pb-3 ${meta.headerBg}`}>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="bg-white divide-y divide-parchment/60">
                  {items.map(action => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="flex items-start justify-between px-5 py-4 hover:bg-cream/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        {/* score mini-bar */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-14 h-0.5 bg-parchment rounded-full overflow-hidden">
                            <div className="h-full bg-sage/50 rounded-full" style={{ width: `${action.finalScore}%` }} />
                          </div>
                          <span className="text-[9px] text-dusk/25 font-mono tabular-nums">{action.finalScore}</span>
                        </div>
                        <p className="text-sm font-medium text-graphite leading-snug mb-0.5">{action.text}</p>
                        <p className="text-xs text-dusk/45 leading-snug">{action.sub}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {action.rawMoney > 0 && (
                          <p className="text-xs font-bold text-emerald-600 whitespace-nowrap">{fmtMoney(action.rawMoney)}</p>
                        )}
                        <ArrowRight size={14} className="text-dusk/20 group-hover:text-graphite/40 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : !salonId ? (
            /* No salon_id — static placeholder */
            (['cash', 'growth', 'market'] as Layer[]).map(layer => {
              const meta = LAYER_META[layer]
              const placeholder: Record<Layer, { text: string; sub: string; href: string }[]> = {
                cash: [
                  { text: 'Написать клиентам в зоне риска', sub: 'Загрузите данные, чтобы узнать кому', href: `/execution/cash_at_risk` },
                  { text: 'Вернуть потерянных клиентов', sub: 'Расчёт потенциала после загрузки', href: `/execution/cash_lost` },
                  { text: 'Заполнить пустые окна в расписании', sub: 'Нужны данные по записям', href: `/execution/cash_slots` },
                ],
                growth: [
                  { text: 'Поднять средний чек через дополнительные услуги', sub: 'Расчёт прироста после загрузки данных', href: `/execution/growth_check` },
                  { text: 'Увеличить частоту визитов активных клиентов', sub: 'Долгосрочный рост без рекламы', href: `/execution/growth_freq` },
                  { text: 'Повысить системную возвратность', sub: 'Удержание = стабильный поток дохода', href: `/execution/growth_ltv` },
                ],
                market: [
                  { text: 'Найти слабые стороны конкурентов', sub: 'Введите ссылку — получите уязвимости', href: `/execution/market_comp` },
                  { text: 'Создать контент, который приводит на запись', sub: 'Формулы продающих постов под ваши услуги', href: `/execution/market_content` },
                  { text: 'Проверить репутацию в интернете', sub: 'Отзывы влияют на выбор клиентов', href: `/execution/market_rep` },
                ],
              }
              return (
                <div key={layer} className={`rounded-2xl overflow-hidden border border-parchment border-l-4 ${meta.accentBorder}`}>
                  <div className={`px-5 pt-4 pb-3 ${meta.headerBg}`}>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="bg-white divide-y divide-parchment/60">
                    {placeholder[layer].map((item, i) => (
                      <Link key={i} href={item.href} className="flex items-start justify-between px-5 py-4 hover:bg-cream/50 transition-colors group">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-graphite leading-snug mb-0.5">{item.text}</p>
                          <p className="text-xs text-dusk/45 leading-snug">{item.sub}</p>
                        </div>
                        <ArrowRight size={14} className="text-dusk/20 shrink-0 mt-0.5 group-hover:text-graphite/40 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            /* Loading skeleton for secondary */
            <div className="rounded-2xl border border-parchment animate-pulse">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="px-5 py-4 border-b border-parchment/40">
                  <div className="h-3 bg-parchment rounded w-1/4 mb-2" />
                  <div className="h-4 bg-parchment rounded w-3/4" />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
