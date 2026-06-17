export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/booking/master?master_id=X
// Public — returns master info for the booking page
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  if (!masterId) return NextResponse.json({ error: 'master_id required' }, { status: 400 })

  const { data: master, error } = await supabaseAdmin
    .from('masters')
    .select('id, name, salon_id')
    .eq('id', masterId)
    .single()

  if (error || !master) return NextResponse.json({ error: 'Мастер не найден' }, { status: 404 })

  // Optionally get salon name
  const { data: salon } = await supabaseAdmin
    .from('salons')
    .select('name')
    .eq('id', master.salon_id)
    .single()

  return NextResponse.json({ master: { ...master, salon_name: salon?.name ?? null } })
}
