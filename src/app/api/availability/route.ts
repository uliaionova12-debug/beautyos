export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/availability?master_id=X
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  if (!masterId) return NextResponse.json({ error: 'master_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('availability')
    .select('*')
    .eq('master_id', masterId)
    .eq('active', true)
    .order('day_of_week')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/availability
// Body: { master_id, salon_id, schedule: [{ day_of_week, start_time, end_time, slot_duration, active }] }
export async function POST(req: NextRequest) {
  const { master_id, salon_id, schedule } = await req.json()

  if (!master_id || !salon_id || !Array.isArray(schedule)) {
    return NextResponse.json({ error: 'master_id, salon_id, schedule required' }, { status: 400 })
  }

  const rows = schedule.map((s: {
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration?: number
    active?: boolean
  }) => ({
    master_id,
    salon_id,
    day_of_week:   s.day_of_week,
    start_time:    s.start_time,
    end_time:      s.end_time,
    slot_duration: s.slot_duration ?? 60,
    active:        s.active ?? true,
  }))

  const { error } = await supabaseAdmin
    .from('availability')
    .upsert(rows, { onConflict: 'master_id,day_of_week' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
