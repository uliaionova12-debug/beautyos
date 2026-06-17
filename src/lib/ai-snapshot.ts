// ─── AI Snapshot — единый источник правды для Actions и Execution ─────────────
//
// Правило: одни данные → один снапшот → одни решения.
// Actions и Execution НЕ вычисляют score самостоятельно — только через этот модуль.
//
// ─────────────────────────────────────────────────────────────────────────────

export interface AISnapshot {
  business_context: {
    time_range_days: number
    currency: 'RUB'
  }
  kpis: {
    total_clients: number
    active_clients: number
    lost_clients: number
    at_risk_clients: number
  }
  revenue: {
    total_revenue: number
    avg_check: number
    at_risk_revenue: number
    lost_revenue_estimate: number
  }
  behavior_metrics: {
    return_rate: number   // 0–100, процент возвращающихся клиентов
    churn_rate: number    // 100 - return_rate
  }
  capacity: {
    empty_slots: number   // расчётное количество пустых окон
  }
  actions_seed_data: {
    cash_at_risk_pool: number
    cash_lost_pool: number
    cash_slots_pool: number
    growth_check_pool: number
    growth_freq_pool: number
    growth_ltv_pool: number
    market_comp_pool: number
    market_content_pool: number
    market_rep_pool: number
  }
}

// Тип сырых данных с API /api/summary
export interface SummaryData {
  total_clients: number
  active_clients: number
  at_risk_count: number
  at_risk_revenue: number
  lost_count: number
  lost_impact: number
  avg_check: number
  total_revenue: number
  retention_rate: number
}

// ─── Константы scoring — единственная копия в системе ────────────────────────

const RETURN_PROB = 0.30
const CHECK_LIFT  = 0.15
const FREQ_LIFT   = 0.08

export const ACTION_SPEEDS: Record<string, number> = {
  cash_at_risk:   100, cash_lost:      80,  cash_slots:     100,
  growth_check:    50, growth_freq:    30,  growth_ltv:      20,
  market_comp:     40, market_content: 20,  market_rep:      30,
}

export const ACTION_EASE: Record<string, number> = {
  cash_at_risk:   90,  cash_lost:      70,  cash_slots:      80,
  growth_check:   60,  growth_freq:    50,  growth_ltv:      40,
  market_comp:    60,  market_content: 70,  market_rep:      65,
}

export const ACTION_LAYER: Record<string, 'cash' | 'growth' | 'market'> = {
  cash_at_risk:   'cash',   cash_lost:      'cash',   cash_slots:     'cash',
  growth_check:   'growth', growth_freq:    'growth', growth_ltv:     'growth',
  market_comp:    'market', market_content: 'market', market_rep:     'market',
}

export const ACTION_IDS = [
  'cash_at_risk', 'cash_lost', 'cash_slots',
  'growth_check', 'growth_freq', 'growth_ltv',
  'market_comp', 'market_content', 'market_rep',
] as const

export type ActionId = typeof ACTION_IDS[number]

// ─── buildSnapshot ────────────────────────────────────────────────────────────

export function buildSnapshot(s: SummaryData): AISnapshot {
  const empty_slots = Math.max(2, Math.round((1 - s.retention_rate / 100) * 6))

  return {
    business_context: {
      time_range_days: 90,
      currency: 'RUB',
    },
    kpis: {
      total_clients:  s.total_clients,
      active_clients: s.active_clients,
      lost_clients:   s.lost_count,
      at_risk_clients: s.at_risk_count,
    },
    revenue: {
      total_revenue:        s.total_revenue,
      avg_check:            s.avg_check,
      at_risk_revenue:      s.at_risk_revenue,
      lost_revenue_estimate: s.lost_count * s.avg_check * RETURN_PROB,
    },
    behavior_metrics: {
      return_rate: s.retention_rate,
      churn_rate:  100 - s.retention_rate,
    },
    capacity: {
      empty_slots,
    },
    actions_seed_data: {
      cash_at_risk_pool:   s.at_risk_revenue,
      cash_lost_pool:      s.lost_count * s.avg_check * RETURN_PROB,
      cash_slots_pool:     empty_slots * s.avg_check,
      growth_check_pool:   s.active_clients * s.avg_check * CHECK_LIFT,
      growth_freq_pool:    s.active_clients * s.avg_check * FREQ_LIFT,
      growth_ltv_pool:     s.avg_check * s.total_clients * 0.02,
      market_comp_pool:    s.avg_check * 6,
      market_content_pool: s.avg_check * 4,
      market_rep_pool:     s.avg_check * 3,
    },
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScores(snap: AISnapshot): Record<ActionId, number> {
  const pool = snap.actions_seed_data
  const rawValues: Record<ActionId, number> = {
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

  const maxMoney = Math.max(...Object.values(rawValues), 1)
  const norm = (v: number) => Math.min(100, Math.round((v / maxMoney) * 100))

  const result = {} as Record<ActionId, number>
  for (const id of ACTION_IDS) {
    const m = norm(rawValues[id])
    const sp = ACTION_SPEEDS[id]
    const e  = ACTION_EASE[id]
    result[id] = Math.round(m * 0.5 + sp * 0.3 + e * 0.2)
  }
  return result
}

// Сортировка: CASH-слой первый; внутри cash — at_risk > lost когда есть клиенты
// в зоне риска (они не ушли, конвертируются лучше, поэтому важнее потерянных);
// далее по finalScore.
function cashPriority(a: ActionId, b: ActionId, snap: AISnapshot): number {
  if (snap.kpis.at_risk_clients > 0) {
    if (a === 'cash_at_risk' && b === 'cash_lost') return -1
    if (a === 'cash_lost' && b === 'cash_at_risk') return 1
  }
  return 0
}

export function getPrimaryActionId(snap: AISnapshot): ActionId {
  const scores = computeScores(snap)
  return [...ACTION_IDS]
    .sort((a, b) => {
      const aIsCash = ACTION_LAYER[a] === 'cash'
      const bIsCash = ACTION_LAYER[b] === 'cash'
      if (aIsCash && !bIsCash) return -1
      if (!aIsCash && bIsCash) return 1
      const cp = cashPriority(a, b, snap)
      if (cp !== 0) return cp
      return scores[b] - scores[a]
    })[0]
}

export function getSortedActionIds(snap: AISnapshot): ActionId[] {
  const scores = computeScores(snap)
  return [...ACTION_IDS].sort((a, b) => {
    const aIsCash = ACTION_LAYER[a] === 'cash'
    const bIsCash = ACTION_LAYER[b] === 'cash'
    if (aIsCash && !bIsCash) return -1
    if (!aIsCash && bIsCash) return 1
    const cp = cashPriority(a, b, snap)
    if (cp !== 0) return cp
    return scores[b] - scores[a]
  })
}

// Возвращает нормализованный moneyImpact (0–100) для конкретного action.
export function getMoneyImpact(snap: AISnapshot, id: ActionId): number {
  const pool = snap.actions_seed_data
  const rawValues: Record<ActionId, number> = {
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
  const maxMoney = Math.max(...Object.values(rawValues), 1)
  return Math.min(100, Math.round((rawValues[id] / maxMoney) * 100))
}

// ─── Утилита форматирования (единственная копия) ──────────────────────────────

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}
