export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const [mastersRes, minDateRes, maxDateRes] = await Promise.all([
    supabaseAdmin.from('masters').select('*').eq('salon_id', salonId).order('total_revenue', { ascending: false }),
    supabaseAdmin.from('visits').select('visit_date').eq('salon_id', salonId).order('visit_date', { ascending: true }).limit(1),
    supabaseAdmin.from('visits').select('visit_date').eq('salon_id', salonId).order('visit_date', { ascending: false }).limit(1),
  ])

  if (mastersRes.error) return NextResponse.json({ error: mastersRes.error.message }, { status: 500 })

  return NextResponse.json({
    masters: mastersRes.data,
    period_from: minDateRes.data?.[0]?.visit_date || null,
    period_to: maxDateRes.data?.[0]?.visit_date || null,
  })
}
