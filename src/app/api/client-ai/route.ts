export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateClientAI, type ClientSnapshot } from '@/lib/ai/client-ai'

// GET /api/client-ai?client_id=X&salon_id=Y
//
// 1. Fetches client + visits + salon from Supabase (same source as /api/client-profile)
// 2. Passes read-only snapshot to generateClientAI()
// 3. Returns ClientAIOutput — human-language interpretation only
//
// AI layer contract:
//   - Never modifies client data
//   - Never recomputes business metrics
//   - Falls back gracefully if OpenAI is unavailable

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  const salonId  = req.nextUrl.searchParams.get('salon_id')

  if (!clientId || !salonId) {
    return NextResponse.json({ error: 'client_id and salon_id required' }, { status: 400 })
  }

  // ─ Fetch all data in parallel (same as client-profile, no HTTP round-trip) ─
  const [clientRes, salonRes] = await Promise.all([
    supabaseAdmin
      .from('clients')
      .select('id, name, status, avg_check, days_since_last_visit, avg_interval_days, total_visits, total_revenue, last_visit_date')
      .eq('id', clientId)
      .eq('salon_id', salonId)
      .single(),
    supabaseAdmin
      .from('salons')
      .select('id, name, booking_url')
      .eq('id', salonId)
      .single(),
  ])

  if (clientRes.error || !clientRes.data) {
    return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
  }

  const client = clientRes.data
  const salon  = salonRes.data

  const { data: visits } = await supabaseAdmin
    .from('visits')
    .select('service_name, amount, visit_date, master_name')
    .eq('salon_id', salonId)
    .eq('client_name', client.name)
    .order('visit_date', { ascending: false })
    .limit(6)

  // ─ Build read-only snapshot (AI reads this, never modifies) ─────────────────
  const snapshot: ClientSnapshot = {
    client: {
      name:                  client.name,
      status:                client.status,
      avg_check:             client.avg_check            ?? 0,
      days_since_last_visit: client.days_since_last_visit ?? null,
      avg_interval_days:     client.avg_interval_days    ?? null,
      total_visits:          client.total_visits         ?? 0,
      total_revenue:         client.total_revenue        ?? 0,
      last_visit_date:       client.last_visit_date      ?? null,
    },
    salon: {
      name:        salon?.name        ?? '',
      booking_url: salon?.booking_url ?? '',
    },
    visits: (visits ?? []).map(v => ({
      service_name: v.service_name ?? null,
      amount:       v.amount       ?? null,
      visit_date:   v.visit_date   ?? null,
      master_name:  v.master_name  ?? null,
    })),
  }

  const output = await generateClientAI(snapshot)

  return NextResponse.json({
    output,
    snapshot_meta: {
      client_name:   client.name,
      status:        client.status,
      total_visits:  client.total_visits ?? 0,
      visits_loaded: (visits ?? []).length,
    },
  })
}
