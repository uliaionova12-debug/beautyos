export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('client_id')
  const salonId  = req.nextUrl.searchParams.get('salon_id')

  if (!clientId || !salonId) {
    return NextResponse.json({ error: 'client_id and salon_id required' }, { status: 400 })
  }

  const [clientRes, salonRes, platformsRes] = await Promise.all([
    supabaseAdmin
      .from('clients')
      .select('id, name, phone, status, avg_check, days_since_last_visit, avg_interval_days, total_visits, total_revenue, last_visit_date, primary_master_name')
      .eq('id', clientId)
      .eq('salon_id', salonId)
      .single(),
    supabaseAdmin
      .from('salons')
      .select('id, name, booking_url')
      .eq('id', salonId)
      .single(),
    supabaseAdmin
      .from('insights')
      .select('value')
      .eq('salon_id', salonId)
      .eq('type', 'rep_platforms')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (clientRes.error || !clientRes.data) {
    return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
  }

  const client = clientRes.data
  const salon  = salonRes.data
  const platforms = (platformsRes.data?.value as { platforms?: unknown[] } | null)?.platforms || []

  // Priority booking URL: master's external URL → salon's booking_url → null
  let bookingUrl: string = salon?.booking_url || ''

  if (client.primary_master_name) {
    const { data: masterRec } = await supabaseAdmin
      .from('masters')
      .select('external_booking_url')
      .eq('salon_id', salonId)
      .eq('name', client.primary_master_name)
      .maybeSingle()

    if (masterRec?.external_booking_url) {
      bookingUrl = masterRec.external_booking_url
    }
  }

  const { data: visits } = await supabaseAdmin
    .from('visits')
    .select('service_name, amount, visit_date, master_name')
    .eq('salon_id', salonId)
    .eq('client_name', client.name)
    .order('visit_date', { ascending: false })
    .limit(10)

  return NextResponse.json({
    client,
    salon: {
      name:        salon?.name || '',
      booking_url: bookingUrl,
    },
    visits:    visits || [],
    platforms,
  })
}
