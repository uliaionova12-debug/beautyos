export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const [salonRes, clientsRes, mastersRes] = await Promise.all([
    supabaseAdmin.from('salons').select('name').eq('id', salonId).single(),
    supabaseAdmin
      .from('clients')
      .select('name, phone, status, avg_check, days_since_last_visit, avg_interval_days, total_visits, total_revenue, return_score, revenue_opportunity, last_visit_date')
      .eq('salon_id', salonId)
      .order('return_score', { ascending: false }),
    supabaseAdmin
      .from('masters')
      .select('name, retention_rate, avg_check, total_revenue, active_clients_count, at_risk_clients_count, lost_clients_count')
      .eq('salon_id', salonId)
      .order('total_revenue', { ascending: false }),
  ])

  const allClients = clientsRes.data || []
  const masters = mastersRes.data || []
  const salonName = salonRes.data?.name

  const atRisk = allClients.filter(c => c.status === 'at_risk')
  const lost = allClients.filter(c => c.status === 'lost')
  const active = allClients.filter(c => c.status === 'active')

  const totalRevenue = allClients.reduce((s, c) => s + (c.total_revenue || 0), 0)
  const avgCheck = allClients.length > 0
    ? Math.round(allClients.reduce((s, c) => s + (c.avg_check || 0), 0) / allClients.length)
    : 0
  const retentionRate = allClients.length > 0 ? active.length / allClients.length : 0

  const atRiskRevenue = atRisk.reduce((s, c) => s + (c.avg_check || 0), 0)
  const lostImpact = lost.reduce((s, c) => {
    const interval = c.avg_interval_days || 30
    const monthsLost = Math.max(0, (c.days_since_last_visit || 0) - interval) / 30
    const visitsLost = monthsLost / (interval / 30)
    return s + Math.round((c.avg_check || 0) * visitsLost)
  }, 0)

  // Реальные деньги потерянных клиентов (поле "Потрачено" из Dikidi)
  const lostTotalRevenue = lost.reduce((s, c) => s + (c.total_revenue || 0), 0)
  const lostDates = lost.map(c => c.last_visit_date).filter(Boolean).sort() as string[]
  const lostFromDate = lostDates[0] || null
  const lostToDate = lostDates[lostDates.length - 1] || null

  // Топ клиентов в риске — по вероятности возврата (return_score)
  const atRiskTop = atRisk.slice(0, 8).map(c => ({
    name: c.name,
    phone: c.phone || null,
    days_since: c.days_since_last_visit,
    avg_interval: Math.round(c.avg_interval_days || 30),
    avg_check: Math.round(c.avg_check || 0),
    visits: c.total_visits,
  }))

  // Топ потерянных — по revenue_opportunity
  const lostTop = [...lost]
    .sort((a, b) => (b.revenue_opportunity || 0) - (a.revenue_opportunity || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      phone: c.phone || null,
      days_since: c.days_since_last_visit,
      avg_check: Math.round(c.avg_check || 0),
      revenue_opportunity: c.revenue_opportunity || 0,
    }))

  return NextResponse.json({
    salon_name: salonName,
    total_clients: allClients.length,
    active_clients: active.length,
    at_risk_count: atRisk.length,
    at_risk_revenue: Math.round(atRiskRevenue),
    lost_count: lost.length,
    lost_impact: lostImpact,
    lost_total_revenue: Math.round(lostTotalRevenue),
    lost_from_date: lostFromDate,
    lost_to_date: lostToDate,
    retention_rate: Math.round(retentionRate * 100),
    avg_check: avgCheck,
    total_revenue: Math.round(totalRevenue),
    at_risk_top: atRiskTop,
    lost_top: lostTop,
    masters,
  })
}
