import { Client, ClientStatus, Master, RetentionAnalysis, CSVRow } from '@/types'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function daysBetween(dateStr: string, reference: Date = TODAY): number {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.floor((reference.getTime() - d.getTime()) / 86_400_000)
}

function average(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

interface RawClient {
  name: string
  phone: string
  visits: { date: string; amount: number; master: string; service: string }[]
}

// Группируем CSV-строки в клиентов
function groupByClient(rows: CSVRow[]): RawClient[] {
  const map = new Map<string, RawClient>()

  for (const row of rows) {
    const cleanPhone = row.phone?.replace(/[^\d+]/g, '') || ''
    const key = cleanPhone || row.client_name.toLowerCase().trim()
    if (!map.has(key)) {
      map.set(key, { name: row.client_name, phone: cleanPhone, visits: [] })
    }
    const amount = parseFloat(row.amount.replace(/[^\d.]/g, '')) || 0
    map.get(key)!.visits.push({
      date: row.visit_date,
      amount,
      master: row.master_name,
      service: row.service_name,
    })
  }

  return Array.from(map.values())
}

// Вычисляем среднее окно между визитами для клиента
function calcAvgInterval(dates: string[]): number {
  if (dates.length < 2) return 0
  const sorted = [...dates].sort()
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(daysBetween(sorted[i - 1], new Date(sorted[i])))
  }
  return Math.round(average(gaps))
}

// Определяем статус и risk_score
function calcStatus(
  daysSinceLast: number,
  avgInterval: number
): { status: ClientStatus; riskScore: number } {
  if (avgInterval === 0) {
    // Клиент с одним визитом — даём ему средний интервал 30 дней
    const assumedInterval = 30
    const lostThreshold = assumedInterval * 2.5
    const riskThreshold = assumedInterval * 1.5
    if (daysSinceLast > lostThreshold) return { status: 'lost', riskScore: 1.0 }
    if (daysSinceLast > riskThreshold) return { status: 'at_risk', riskScore: parseFloat((daysSinceLast / lostThreshold).toFixed(3)) }
    return { status: 'active', riskScore: parseFloat((daysSinceLast / riskThreshold).toFixed(3)) }
  }

  const riskThreshold = avgInterval * 1.5
  const lostThreshold = avgInterval * 2.5

  if (daysSinceLast >= lostThreshold) {
    return { status: 'lost', riskScore: 1.0 }
  }
  if (daysSinceLast >= riskThreshold) {
    const score = (daysSinceLast - riskThreshold) / (lostThreshold - riskThreshold)
    return { status: 'at_risk', riskScore: parseFloat(Math.min(score, 0.999).toFixed(3)) }
  }
  return {
    status: 'active',
    riskScore: parseFloat((daysSinceLast / riskThreshold).toFixed(3)),
  }
}

// Рассчитываем финансовый ущерб от потерянного клиента
function calcLostRevenue(client: {
  avgCheck: number
  avgInterval: number
  daysSinceLast: number
}): number {
  const interval = client.avgInterval || 30
  const monthsLost = Math.max(0, client.daysSinceLast - interval) / 30
  const visitsLost = monthsLost / (interval / 30)
  return Math.round(client.avgCheck * visitsLost)
}

// Вероятность возврата: 0.0–1.0
// Факторы: лояльность (кол-во визитов) + насколько просрочен
function calcReturnScore(client: {
  totalVisits: number
  daysSinceLast: number
  avgInterval: number
}): number {
  const interval = client.avgInterval || 30
  const overdueRatio = client.daysSinceLast / interval

  // Лояльность: растёт до 10 визитов
  const loyaltyScore = Math.min(client.totalVisits / 10, 1.0)

  // Просрочка: 1.0 при overdueRatio=1.5, падает до 0 при overdueRatio=3.5
  const overdueScore = Math.max(0, 1 - (overdueRatio - 1.5) / 2)

  const raw = loyaltyScore * 0.4 + overdueScore * 0.6
  return parseFloat(Math.min(Math.max(raw, 0), 1).toFixed(3))
}

// Потенциал выручки: ожидаемая выручка за год × вероятность возврата
function calcRevenueOpportunity(client: {
  avgCheck: number
  returnScore: number
  avgInterval: number
}): number {
  const interval = client.avgInterval || 30
  const visitsPerYear = 365 / interval
  return Math.round(client.avgCheck * visitsPerYear * client.returnScore)
}

export interface AnalysisInput {
  salonId: string
  rows: CSVRow[]
}

export interface AnalysisOutput {
  clients: Omit<Client, 'id' | 'created_at' | 'updated_at'>[]
  masters: Omit<Master, 'id'>[]
  summary: RetentionAnalysis
}

export function runRetentionAnalysis(input: AnalysisInput): AnalysisOutput {
  const { salonId, rows } = input
  const rawClients = groupByClient(rows)

  const clients: Omit<Client, 'id' | 'created_at' | 'updated_at'>[] = []
  const masterMap = new Map<string, {
    totalRevenue: number
    checks: number[]
    clientStatuses: ClientStatus[]
  }>()

  for (const rc of rawClients) {
    const sortedDates = [...rc.visits.map(v => v.date)].sort()
    const lastVisitDate = sortedDates[sortedDates.length - 1]
    const firstVisitDate = sortedDates[0]
    const daysSinceLast = daysBetween(lastVisitDate)
    const avgInterval = calcAvgInterval(sortedDates)
    const totalRevenue = rc.visits.reduce((s, v) => s + v.amount, 0)
    const avgCheck = totalRevenue / rc.visits.length

    const { status, riskScore } = calcStatus(daysSinceLast, avgInterval)
    const returnScore = calcReturnScore({
      totalVisits: rc.visits.length,
      daysSinceLast,
      avgInterval,
    })
    const revenueOpportunity = calcRevenueOpportunity({
      avgCheck: Math.round(avgCheck),
      returnScore,
      avgInterval,
    })

    // Основной мастер — тот, у кого больше всего визитов с этим клиентом
    const masterCount = new Map<string, number>()
    for (const v of rc.visits) {
      if (v.master) masterCount.set(v.master, (masterCount.get(v.master) ?? 0) + 1)
    }
    const primaryMaster = masterCount.size > 0
      ? [...masterCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : 'Не указан'

    clients.push({
      salon_id: salonId,
      name: rc.name,
      phone: rc.phone || null,
      first_visit_date: firstVisitDate,
      last_visit_date: lastVisitDate,
      total_visits: rc.visits.length,
      total_revenue: Math.round(totalRevenue),
      avg_check: Math.round(avgCheck),
      avg_interval_days: avgInterval,
      status,
      risk_score: riskScore,
      return_score: returnScore,
      revenue_opportunity: revenueOpportunity,
      days_since_last_visit: daysSinceLast,
      primary_master_name: primaryMaster !== 'Не указан' ? primaryMaster : null,
    })

    if (!masterMap.has(primaryMaster)) {
      masterMap.set(primaryMaster, { totalRevenue: 0, checks: [], clientStatuses: [] })
    }
    const m = masterMap.get(primaryMaster)!
    m.totalRevenue += totalRevenue
    m.checks.push(avgCheck)
    m.clientStatuses.push(status)
  }

  // Строим список мастеров
  const masters: Omit<Master, 'id'>[] = []
  for (const [name, data] of masterMap.entries()) {
    const total = data.clientStatuses.length
    const active = data.clientStatuses.filter(s => s === 'active').length
    const atRisk = data.clientStatuses.filter(s => s === 'at_risk').length
    const lost = data.clientStatuses.filter(s => s === 'lost').length
    const retentionRate = total > 0 ? parseFloat((active / total).toFixed(4)) : 0

    masters.push({
      salon_id: salonId,
      name,
      retention_rate: retentionRate,
      avg_check: Math.round(average(data.checks)),
      total_revenue: Math.round(data.totalRevenue),
      active_clients_count: active,
      at_risk_clients_count: atRisk,
      lost_clients_count: lost,
    })
  }

  masters.sort((a, b) => b.retention_rate - a.retention_rate)

  // Итоги
  const lostClients = clients.filter(c => c.status === 'lost')
  const atRiskClients = clients.filter(c => c.status === 'at_risk')
  const activeClients = clients.filter(c => c.status === 'active')

  const totalFinancialImpact = lostClients.reduce((sum, c) => {
    return sum + calcLostRevenue({
      avgCheck: c.avg_check,
      avgInterval: c.avg_interval_days,
      daysSinceLast: c.days_since_last_visit,
    })
  }, 0)

  const retentionRate = clients.length > 0
    ? parseFloat((activeClients.length / clients.length).toFixed(4))
    : 0

  const atRiskSorted = [...atRiskClients].sort((a, b) => b.risk_score - a.risk_score)
  const lostSorted = [...lostClients].sort((a, b) => b.avg_check - a.avg_check)

  const summary: RetentionAnalysis = {
    salon_id: salonId,
    period_days: 90,
    total_clients: clients.length,
    active_clients: activeClients.length,
    at_risk_clients: atRiskClients.length,
    lost_clients: lostClients.length,
    total_financial_impact: totalFinancialImpact,
    retention_rate: retentionRate,
    at_risk_list: atRiskSorted as Client[],
    lost_list: lostSorted as Client[],
    masters: masters as Master[],
    ai_insights: [],
    ai_recommendation: '',
    analyzed_at: new Date().toISOString(),
  }

  return { clients, masters, summary }
}
