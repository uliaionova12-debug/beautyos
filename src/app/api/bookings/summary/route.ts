export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/bookings/summary?master_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns count and total revenue for completed bookings in the period.
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  const from     = req.nextUrl.searchParams.get('from')
  const to       = req.nextUrl.searchParams.get('to')

  if (!masterId) return NextResponse.json({ error: 'master_id required' }, { status: 400 })

  let query = supabaseAdmin
    .from('bookings')
    .select('service_price, status')
    .eq('master_id', masterId)
    .eq('status', 'completed')

  if (from) query = query.gte('booking_date', from)
  if (to)   query = query.lte('booking_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  const revenue = rows.reduce((sum, r) => sum + (parseFloat(String(r.service_price ?? 0)) || 0), 0)

  return NextResponse.json({ count: rows.length, revenue })
}
