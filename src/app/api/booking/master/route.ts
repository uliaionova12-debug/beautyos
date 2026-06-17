export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/booking/master?master_id=X
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  if (!masterId) return NextResponse.json({ error: 'master_id required' }, { status: 400 })

  const { data: master, error } = await supabaseAdmin
    .from('masters')
    .select('id, name, salon_id, external_booking_url')
    .eq('id', masterId)
    .single()

  if (error || !master) return NextResponse.json({ error: 'Мастер не найден' }, { status: 404 })

  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('name, booking_url')
    .eq('id', master.salon_id)
    .single()

  return NextResponse.json({
    master: { ...master, salon_name: salon?.name ?? null },
    salon_booking_url: salon?.booking_url ?? null,
  })
}

// PATCH /api/booking/master
// Body: { master_id, external_booking_url }
// Saves external booking URL for a master (DIKIDI / YClients / WhatsApp / etc.)
export async function PATCH(req: NextRequest) {
  try {
    const { master_id, external_booking_url } = await req.json()

    if (!master_id) {
      return NextResponse.json({ error: 'master_id required' }, { status: 400 })
    }

    const url = external_booking_url?.trim() || null

    const { error } = await supabaseAdmin
      .from('masters')
      .update({ external_booking_url: url })
      .eq('id', master_id)

    if (error) {
      // Column may not exist yet — return migration hint
      if (error.message.includes('external_booking_url')) {
        return NextResponse.json({
          error: 'Колонка external_booking_url не найдена. Запустите SQL-миграцию.',
          sql: 'ALTER TABLE masters ADD COLUMN IF NOT EXISTS external_booking_url text;',
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, external_booking_url: url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
