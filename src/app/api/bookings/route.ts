export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isSubscriptionActive } from '@/lib/subscription'

// GET /api/bookings?master_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  const from     = req.nextUrl.searchParams.get('from')
  const to       = req.nextUrl.searchParams.get('to')

  if (!masterId) return NextResponse.json({ error: 'master_id required' }, { status: 400 })

  let query = supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('master_id', masterId)
    .order('booking_date')
    .order('booking_time')

  if (from) query = query.gte('booking_date', from)
  if (to)   query = query.lte('booking_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/bookings
// Body: { master_id, salon_id, client_name, client_phone?, booking_date, booking_time, duration? }
// Optionally tries to link to existing client by phone
export async function POST(req: NextRequest) {
  const {
    master_id, salon_id,
    client_name, client_phone,
    booking_date, booking_time,
    duration = 60,
    service_name, service_price, next_visit_date, notes,
  } = await req.json()

  if (!master_id || !salon_id || !client_name || !booking_date || !booking_time) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const allowed = await isSubscriptionActive(salon_id)
  if (!allowed) {
    return NextResponse.json({ error: 'subscription_expired', redirect: '/subscription' }, { status: 403 })
  }

  // Check slot is not already taken
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('master_id', master_id)
    .eq('booking_date', booking_date)
    .eq('booking_time', booking_time)
    .neq('status', 'cancelled')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Это время уже занято' }, { status: 409 })
  }

  // Try to match existing client by phone (last 10 digits)
  let clientId: string | null = null
  if (client_phone?.trim()) {
    const digits = client_phone.replace(/\D/g, '').slice(-10)
    if (digits.length >= 7) {
      const { data: matched } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('salon_id', salon_id)
        .ilike('phone', `%${digits}%`)
        .limit(1)
      clientId = matched?.[0]?.id ?? null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      master_id,
      salon_id,
      client_id:       clientId,
      client_name:     client_name.trim(),
      client_phone:    client_phone?.trim() || null,
      booking_date,
      booking_time,
      duration,
      status:          'booked',
      service_name:    service_name?.trim() || null,
      service_price:   service_price ?? null,
      next_visit_date: next_visit_date || null,
      notes:           notes?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booking: data, client_id: clientId })
}
