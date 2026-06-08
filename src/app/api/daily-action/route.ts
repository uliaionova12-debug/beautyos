import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DailyAction } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  // Берём мастера с наибольшим финансовым потенциалом среди at_risk клиентов
  const { data: masters, error: mastersError } = await supabase
    .from('masters')
    .select('id, name, at_risk_clients_count, avg_check, retention_rate')
    .eq('salon_id', salonId)
    .gt('at_risk_clients_count', 0)
    .order('at_risk_clients_count', { ascending: false })
    .limit(10)

  if (mastersError || !masters?.length) {
    return NextResponse.json({ action: null })
  }

  // Сортируем по at_risk_clients_count × avg_check
  const best = [...masters].sort(
    (a, b) => (b.at_risk_clients_count * b.avg_check) - (a.at_risk_clients_count * a.avg_check)
  )[0]

  const potentialRevenue = Math.round(best.at_risk_clients_count * best.avg_check)
  // Вероятность: мастера с высокой возвратностью — выше шанс на успех
  const probability = Math.min(Math.max(best.retention_rate * 1.3, 0.55), 0.95)

  const action: DailyAction = {
    master_name: best.name,
    client_count: best.at_risk_clients_count,
    potential_revenue: potentialRevenue,
    probability: parseFloat(probability.toFixed(2)),
    client_ids: [],
  }

  return NextResponse.json({ action })
}
