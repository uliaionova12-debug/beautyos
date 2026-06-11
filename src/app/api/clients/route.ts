export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateReturnMessage } from '@/lib/claude'

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  const status = req.nextUrl.searchParams.get('status') // active | at_risk | lost
  const masterName = req.nextUrl.searchParams.get('master_name')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  if (!salonId) {
    return NextResponse.json({ error: 'salon_id required' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('clients')
    .select('*')
    .eq('salon_id', salonId)
    .order('risk_score', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  if (masterName) {
    query = query.eq('primary_master_name', masterName)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ clients: data })
}

export async function POST(req: NextRequest) {
  const { client_id, salon_name } = await req.json()

  if (!client_id) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  }

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
  }

  const { data: lastVisit } = await supabaseAdmin
    .from('visits')
    .select('service_name')
    .eq('salon_id', client.salon_id)
    .order('visit_date', { ascending: false })
    .limit(1)
    .single()

  const message = await generateReturnMessage(
    client.name,
    client.avg_check,
    lastVisit?.service_name || '',
    salon_name || 'Салон красоты'
  )

  return NextResponse.json({ message })
}
