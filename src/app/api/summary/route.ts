import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const [atRiskRes, lostRes, totalRes] = await Promise.all([
    supabaseAdmin
      .from('clients')
      .select('avg_check, days_since_last_visit, avg_interval_days')
      .eq('salon_id', salonId)
      .eq('status', 'at_risk'),
    supabaseAdmin
      .from('clients')
      .select('avg_check, days_since_last_visit, avg_interval_days')
      .eq('salon_id', salonId)
      .eq('status', 'lost'),
    supabaseAdmin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', salonId),
  ])

  const atRisk = atRiskRes.data || []
  const lost = lostRes.data || []

  // Потенциальная выручка = сумма avg_check клиентов в риске (один возвратный визит)
  const atRiskRevenue = atRisk.reduce((s, c) => s + (c.avg_check || 0), 0)

  // Финансовый ущерб от потерянных
  const lostImpact = lost.reduce((s, c) => {
    const interval = c.avg_interval_days || 30
    const monthsLost = Math.max(0, (c.days_since_last_visit || 0) - interval) / 30
    const visitsLost = monthsLost / (interval / 30)
    return s + Math.round((c.avg_check || 0) * visitsLost)
  }, 0)

  return NextResponse.json({
    at_risk_count: atRisk.length,
    at_risk_revenue: Math.round(atRiskRevenue),
    lost_count: lost.length,
    lost_impact: lostImpact,
    total_clients: totalRes.count || 0,
  })
}
