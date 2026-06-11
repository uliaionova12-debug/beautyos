export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const salonId = request.nextUrl.searchParams.get('salon_id')

  if (!salonId) {
    return NextResponse.json({ error: 'salon_id required' }, { status: 400 })
  }

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('salon_id', salonId)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
  }

  return NextResponse.json({ client })
}
