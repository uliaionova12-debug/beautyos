export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/bookings/[id]
// Body: { status?, service_name?, service_price?, next_visit_date?, notes? }
// When status=completed: bridges the visit into the visits table for Dashboard/Retention.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const allowed_statuses = ['booked', 'completed', 'cancelled', 'no_show']
  if (body.status && !allowed_statuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Build update payload from allowed fields only
  const update: Record<string, unknown> = {}
  if (body.status        !== undefined) update.status         = body.status
  if (body.service_name  !== undefined) update.service_name   = body.service_name  || null
  if (body.service_price !== undefined) update.service_price  = body.service_price ?? null
  if (body.next_visit_date !== undefined) update.next_visit_date = body.next_visit_date || null
  if (body.notes         !== undefined) update.notes          = body.notes          || null

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Bridge completed booking → visits table (for Dashboard/Retention/Analytics)
  if (body.status === 'completed' && data) {
    const { data: master } = await supabaseAdmin
      .from('masters')
      .select('name')
      .eq('id', data.master_id)
      .single()

    await supabaseAdmin.from('visits').insert({
      salon_id:     data.salon_id,
      client_id:    data.client_id ?? null,
      master_name:  master?.name ?? null,
      service_name: data.service_name ?? null,
      visit_date:   data.booking_date,
      amount:       parseFloat(String(data.service_price ?? 0)) || 0,
    })
  }

  return NextResponse.json({ booking: data })
}
