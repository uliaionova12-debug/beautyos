export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export interface TrialStats {
  clients_count: number
  bookings_count: number
  reviews_count: number
  booking_configured: boolean
}

// GET /api/subscription/stats?salon_id=X&since=ISO_DATE
// Returns real usage stats for the trial period.
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  const since   = req.nextUrl.searchParams.get('since')

  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const [clientsRes, bookingsRes, reviewsRes, availabilityRes] = await Promise.all([
    supabaseAdmin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', salonId),

    supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .gte('created_at', since || '1970-01-01'),

    supabaseAdmin
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .gte('created_at', since || '1970-01-01'),

    supabaseAdmin
      .from('availability')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .eq('active', true),
  ])

  const stats: TrialStats = {
    clients_count:       clientsRes.count  ?? 0,
    bookings_count:      bookingsRes.count ?? 0,
    reviews_count:       reviewsRes.count  ?? 0,
    booking_configured:  (availabilityRes.count ?? 0) > 0,
  }

  return NextResponse.json(stats)
}
