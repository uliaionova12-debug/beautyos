export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('analysis_snapshots')
    .select('snapshot_date, retention_rate, total_clients, active_clients, at_risk_clients, lost_clients')
    .eq('salon_id', salonId)
    .order('snapshot_date', { ascending: true })
    .limit(12)

  if (error) return NextResponse.json({ snapshots: [] })

  return NextResponse.json({ snapshots: data || [] })
}
