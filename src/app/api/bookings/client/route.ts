export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/bookings/client?client_id=X&from=YYYY-MM-DD
// Returns the next upcoming booking for a client
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  const from     = req.nextUrl.searchParams.get('from') || new Date().toISOString().slice(0, 10)

  if (!clientId) return NextResponse.json({ booking: null })

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('client_name, booking_date, booking_time, master_id')
    .eq('client_id', clientId)
    .eq('status', 'booked')
    .gte('booking_date', from)
    .order('booking_date')
    .order('booking_time')
    .limit(1)

  return NextResponse.json({ booking: data?.[0] ?? null })
}
