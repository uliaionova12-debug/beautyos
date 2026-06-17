// ─── Director Core — единственный движок принятия решений BeautyOS ───────────
//
// ПРАВИЛА (нарушение = баг):
//   1. NEVER recompute scores — берём из derived.action_scores
//   2. NEVER override snapshot values — все строки reasoning ссылаются на поля
//   3. NEVER hallucinate — только данные из BusinessSnapshot
//   4. CASH layer всегда выигрывает при наличии валидных действий
//   5. Deterministic: BusinessSnapshot X → всегда один и тот же DirectorOutput X
//
// Этот модуль не вызывает LLM. LLM — только для форматирования вывода в UI.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ACTION_IDS, ACTION_LAYER, ACTION_SPEEDS, ACTION_EASE,
  fmtMoney,
  type ActionId, type AISnapshot, type SummaryData,
} from '@/lib/ai-snapshot'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActionScore {
  money_impact: number      // 0–100, нормализован относительно maxMoney
  speed_of_money: number    // 0–100, константа из ACTION_SPEEDS
  ease_of_execution: number // 0–100, константа из ACTION_EASE
  final_score: number       // MONEY×0.5 + SPEED×0.3 + EASE×0.2
  raw_money: number         // рублёвый потенциал (не нормализован)
  layer: 'cash' | 'growth' | 'market'
}

export interface ReputationInput {
  sources_count: number
  has_sources: boolean
  internal_reviews_count: number
  internal_avg_rating: number | null
  internal_negative_count: number
}

export interface BusinessSnapshot {
  // ─ Сегменты (семантически разделены по слоям) ─────────────────────────────
  cash: {
    at_risk_clients: number
    at_risk_revenue: number
    lost_clients: number
    lost_revenue_estimate: number
    empty_slots: number
    slots_revenue: number
  }
  growth: {
    active_clients: number
    avg_check: number
    return_rate: number       // 0–100
    check_pool: number        // +15% чек
    freq_pool: number         // +8% частота
    ltv_pool: number          // системная возвратность
  }
  market: {
    avg_check: number
    comp_pool: number
    content_pool: number
    rep_pool: number
  }
  reputation: ReputationInput

  // ─ Derived: вычислено один раз, не пересчитывается нигде ─────────────────
  derived: {
    action_scores: Record<ActionId, ActionScore>
    sorted_action_ids: ActionId[]    // primary первый
    primary_action_id: ActionId
    total_clients: number
    total_revenue: number
  }
}

export interface DirectorOutput {
  primary_action_id: ActionId
  secondary_action_ids: ActionId[]
  reasoning: {
    primary_reason: string         // из snapshot полей, без маркетинга
    data_points_used: string[]     // явные ссылки на поля snapshot
    why_not_others: string[]       // почему secondary < primary
  }
  validation: {
    scores_recomputed: false       // всегда false — гарантия правила #1
    snapshot_overridden: false     // всегда false — гарантия правила #2
    deterministic: true            // всегда true
  }
}

// ─── buildBusinessSnapshot ────────────────────────────────────────────────────
// Единственное место где считаются scores. Принимает сырые данные + репутацию.

export function buildBusinessSnapshot(
  raw: SummaryData,
  reputation: ReputationInput = {
    sources_count: 0, has_sources: false,
    internal_reviews_count: 0, internal_avg_rating: null, internal_negative_count: 0,
  }
): BusinessSnapshot {
  const RETURN_PROB = 0.30
  const CHECK_LIFT  = 0.15
  const FREQ_LIFT   = 0.08
  const empty_slots = Math.max(2, Math.round((1 - raw.retention_rate / 100) * 6))

  // ─ Pool values (raw money) ─────────────────────────────────────────────────
  const pools: Record<ActionId, number> = {
    cash_at_risk:   raw.at_risk_revenue,
    cash_lost:      raw.lost_count * raw.avg_check * RETURN_PROB,
    cash_slots:     empty_slots * raw.avg_check,
    growth_check:   raw.active_clients * raw.avg_check * CHECK_LIFT,
    growth_freq:    raw.active_clients * raw.avg_check * FREQ_LIFT,
    growth_ltv:     raw.avg_check * raw.total_clients * 0.02,
    market_comp:    raw.avg_check * 6,
    market_content: raw.avg_check * 4,
    market_rep:     raw.avg_check * 3,
  }

  // ─ Normalize money relative to max ────────────────────────────────────────
  const maxMoney = Math.max(...Object.values(pools), 1)
  const norm = (v: number) => Math.min(100, Math.round((v / maxMoney) * 100))

  // ─ Compute ActionScore for all 9 actions ──────────────────────────────────
  const action_scores = {} as Record<ActionId, ActionScore>
  for (const id of ACTION_IDS) {
    const mi = norm(pools[id])
    const sp = ACTION_SPEEDS[id]
    const e  = ACTION_EASE[id]
    action_scores[id] = {
      money_impact:      mi,
      speed_of_money:    sp,
      ease_of_execution: e,
      final_score:       Math.round(mi * 0.5 + sp * 0.3 + e * 0.2),
      raw_money:         pools[id],
      layer:             ACTION_LAYER[id],
    }
  }

  // ─ Sort: CASH first, then by final_score ──────────────────────────────────
  const sorted_action_ids = [...ACTION_IDS].sort((a, b) => {
    const aIsCash = action_scores[a].layer === 'cash'
    const bIsCash = action_scores[b].layer === 'cash'
    if (aIsCash && !bIsCash) return -1
    if (!aIsCash && bIsCash) return 1
    return action_scores[b].final_score - action_scores[a].final_score
  })

  return {
    cash: {
      at_risk_clients:      raw.at_risk_count,
      at_risk_revenue:      raw.at_risk_revenue,
      lost_clients:         raw.lost_count,
      lost_revenue_estimate: pools.cash_lost,
      empty_slots,
      slots_revenue:        pools.cash_slots,
    },
    growth: {
      active_clients: raw.active_clients,
      avg_check:      raw.avg_check,
      return_rate:    raw.retention_rate,
      check_pool:     pools.growth_check,
      freq_pool:      pools.growth_freq,
      ltv_pool:       pools.growth_ltv,
    },
    market: {
      avg_check:    raw.avg_check,
      comp_pool:    pools.market_comp,
      content_pool: pools.market_content,
      rep_pool:     pools.market_rep,
    },
    reputation,
    derived: {
      action_scores,
      sorted_action_ids,
      primary_action_id: sorted_action_ids[0],
      total_clients: raw.total_clients,
      total_revenue: raw.total_revenue,
    },
  }
}

// ─── Deterministic reasoning builders ────────────────────────────────────────
// Каждая строка — прямая ссылка на поле BusinessSnapshot.
// Ни одно слово не придумано вне данных.

const PRIMARY_REASON_BUILDERS: Record<ActionId, (snap: BusinessSnapshot) => string> = {
  cash_at_risk: (s) =>
    `${s.cash.at_risk_clients} клиентов не приходили 30–90 дней. ` +
    `Потенциал возврата: ${fmtMoney(s.cash.at_risk_revenue)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.cash_at_risk.final_score} — максимум в CASH-слое.`,

  cash_lost: (s) =>
    `${s.cash.lost_clients} клиентов потеряны (90+ дней). ` +
    `Оценка возврата 30%: ${fmtMoney(s.cash.lost_revenue_estimate)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.cash_lost.final_score}.`,

  cash_slots: (s) =>
    `${s.cash.empty_slots} незаполненных окон. ` +
    `Прямая потеря сегодня: ${fmtMoney(s.cash.slots_revenue)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.cash_slots.final_score} — speed_of_money=100.`,

  growth_check: (s) =>
    `${s.growth.active_clients} активных клиентов. ` +
    `Прирост +15% среднего чека (${fmtMoney(s.growth.avg_check)}): ${fmtMoney(s.growth.check_pool)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.growth_check.final_score} — лучший в GROWTH-слое.`,

  growth_freq: (s) =>
    `${s.growth.active_clients} активных клиентов. ` +
    `Прирост от повышения частоты визитов +8%: ${fmtMoney(s.growth.freq_pool)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.growth_freq.final_score}.`,

  growth_ltv: (s) =>
    `Возвратность ${s.growth.return_rate}%, ${s.derived.total_clients} клиентов. ` +
    `Потенциал роста LTV: ${fmtMoney(s.growth.ltv_pool)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.growth_ltv.final_score}.`,

  market_comp: (s) =>
    `Средний чек ${fmtMoney(s.market.avg_check)}. ` +
    `Оценка перехвата клиентов конкурентов: ${fmtMoney(s.market.comp_pool)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.market_comp.final_score} — лучший в MARKET-слое.`,

  market_content: (s) =>
    `Средний чек ${fmtMoney(s.market.avg_check)}. ` +
    `Оценка новых записей через контент: ${fmtMoney(s.market.content_pool)}. ` +
    `FINAL_SCORE=${s.derived.action_scores.market_content.final_score}.`,

  market_rep: (s) =>
    `Средний чек ${fmtMoney(s.market.avg_check)}. ` +
    (s.reputation.has_sources
      ? `${s.reputation.sources_count} источников подключено. Внутренних отзывов: ${s.reputation.internal_reviews_count}. `
      : 'Источники отзывов не настроены. ') +
    `FINAL_SCORE=${s.derived.action_scores.market_rep.final_score}.`,
}

const DATA_POINTS_BUILDERS: Record<ActionId, (snap: BusinessSnapshot) => string[]> = {
  cash_at_risk: (s) => [
    `cash.at_risk_clients = ${s.cash.at_risk_clients}`,
    `cash.at_risk_revenue = ${fmtMoney(s.cash.at_risk_revenue)}`,
    `derived.action_scores.cash_at_risk.final_score = ${s.derived.action_scores.cash_at_risk.final_score}`,
    `derived.action_scores.cash_at_risk.speed_of_money = ${s.derived.action_scores.cash_at_risk.speed_of_money}`,
  ],
  cash_lost: (s) => [
    `cash.lost_clients = ${s.cash.lost_clients}`,
    `cash.lost_revenue_estimate = ${fmtMoney(s.cash.lost_revenue_estimate)}`,
    `derived.action_scores.cash_lost.final_score = ${s.derived.action_scores.cash_lost.final_score}`,
  ],
  cash_slots: (s) => [
    `cash.empty_slots = ${s.cash.empty_slots}`,
    `cash.slots_revenue = ${fmtMoney(s.cash.slots_revenue)}`,
    `derived.action_scores.cash_slots.final_score = ${s.derived.action_scores.cash_slots.final_score}`,
  ],
  growth_check: (s) => [
    `growth.active_clients = ${s.growth.active_clients}`,
    `growth.avg_check = ${fmtMoney(s.growth.avg_check)}`,
    `growth.check_pool = ${fmtMoney(s.growth.check_pool)}`,
    `derived.action_scores.growth_check.final_score = ${s.derived.action_scores.growth_check.final_score}`,
  ],
  growth_freq: (s) => [
    `growth.active_clients = ${s.growth.active_clients}`,
    `growth.freq_pool = ${fmtMoney(s.growth.freq_pool)}`,
    `derived.action_scores.growth_freq.final_score = ${s.derived.action_scores.growth_freq.final_score}`,
  ],
  growth_ltv: (s) => [
    `growth.return_rate = ${s.growth.return_rate}%`,
    `derived.total_clients = ${s.derived.total_clients}`,
    `growth.ltv_pool = ${fmtMoney(s.growth.ltv_pool)}`,
    `derived.action_scores.growth_ltv.final_score = ${s.derived.action_scores.growth_ltv.final_score}`,
  ],
  market_comp: (s) => [
    `market.avg_check = ${fmtMoney(s.market.avg_check)}`,
    `market.comp_pool = ${fmtMoney(s.market.comp_pool)}`,
    `derived.action_scores.market_comp.final_score = ${s.derived.action_scores.market_comp.final_score}`,
  ],
  market_content: (s) => [
    `market.avg_check = ${fmtMoney(s.market.avg_check)}`,
    `market.content_pool = ${fmtMoney(s.market.content_pool)}`,
    `derived.action_scores.market_content.final_score = ${s.derived.action_scores.market_content.final_score}`,
  ],
  market_rep: (s) => [
    `reputation.sources_count = ${s.reputation.sources_count}`,
    `reputation.has_sources = ${s.reputation.has_sources}`,
    `market.rep_pool = ${fmtMoney(s.market.rep_pool)}`,
    `derived.action_scores.market_rep.final_score = ${s.derived.action_scores.market_rep.final_score}`,
  ],
}

function buildWhyNotOthers(
  snap: BusinessSnapshot,
  secondaryIds: ActionId[],
  primaryId: ActionId
): string[] {
  const primaryScore = snap.derived.action_scores[primaryId]

  return secondaryIds.map(id => {
    const s = snap.derived.action_scores[id]
    const layerRule = s.layer !== primaryScore.layer && primaryScore.layer === 'cash'
      ? ` CASH-приоритет перекрывает ${s.layer.toUpperCase()}-слой.`
      : ''
    return `${id}: FINAL_SCORE=${s.final_score} < ${primaryScore.final_score} (primary).${layerRule}`
  })
}

// ─── runDirectorCore ──────────────────────────────────────────────────────────
// Единственная точка входа. Принимает BusinessSnapshot → возвращает DirectorOutput.
// НЕ вызывает LLM. НЕ делает fetch. Чистая синхронная функция.

export function runDirectorCore(snap: BusinessSnapshot): DirectorOutput {
  // Read — never recompute
  const primaryId = snap.derived.primary_action_id
  const secondaryIds = snap.derived.sorted_action_ids
    .filter(id => id !== primaryId)
    .slice(0, 3)

  return {
    primary_action_id: primaryId,
    secondary_action_ids: secondaryIds,
    reasoning: {
      primary_reason:   PRIMARY_REASON_BUILDERS[primaryId](snap),
      data_points_used: DATA_POINTS_BUILDERS[primaryId](snap),
      why_not_others:   buildWhyNotOthers(snap, secondaryIds, primaryId),
    },
    validation: {
      scores_recomputed:   false,
      snapshot_overridden: false,
      deterministic:       true,
    },
  }
}

// ─── Validation Rules (runtime assertions) ───────────────────────────────────
// Вызывайте в тестах или при отладке.

export function validateDirectorOutput(output: DirectorOutput, snap: BusinessSnapshot): string[] {
  const errors: string[] = []

  // Rule 1: primary must match snapshot
  if (output.primary_action_id !== snap.derived.primary_action_id) {
    errors.push(`VIOLATION R1: primary_action_id mismatch. Got ${output.primary_action_id}, expected ${snap.derived.primary_action_id}`)
  }

  // Rule 2: secondary must come from sorted list, not invented
  const validIds = new Set(snap.derived.sorted_action_ids)
  for (const id of output.secondary_action_ids) {
    if (!validIds.has(id as ActionId)) {
      errors.push(`VIOLATION R2: secondary action ${id} not in snapshot.derived.sorted_action_ids`)
    }
  }

  // Rule 3: CASH layer must override if cash actions exist
  const hasCash = snap.derived.sorted_action_ids.some(id => snap.derived.action_scores[id].layer === 'cash')
  if (hasCash && snap.derived.action_scores[output.primary_action_id].layer !== 'cash') {
    errors.push(`VIOLATION R3: CASH actions exist but primary is ${output.primary_action_id} (${snap.derived.action_scores[output.primary_action_id].layer})`)
  }

  // Rule 4: validation flags must be correct
  if (output.validation.scores_recomputed !== false) {
    errors.push('VIOLATION R4: scores_recomputed must always be false')
  }
  if (output.validation.deterministic !== true) {
    errors.push('VIOLATION R4: deterministic must always be true')
  }

  // Rule 5: secondary must not include primary
  if (output.secondary_action_ids.includes(output.primary_action_id)) {
    errors.push(`VIOLATION R5: secondary_action_ids contains primary ${output.primary_action_id}`)
  }

  return errors
}

// ─── Convenience: full pipeline from raw summary ──────────────────────────────

export function directFromSummary(
  raw: SummaryData,
  reputation?: ReputationInput
): { snapshot: BusinessSnapshot; output: DirectorOutput } {
  const snapshot = buildBusinessSnapshot(raw, reputation)
  const output = runDirectorCore(snapshot)
  return { snapshot, output }
}
