export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')

  if (!salonId) {
    return NextResponse.json({ error: 'salon_id required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('insights')
    .select('*')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ insights: data })
}
