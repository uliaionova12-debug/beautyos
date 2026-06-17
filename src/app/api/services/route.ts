export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/services?master_id=X
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  if (!masterId) return NextResponse.json({ error: 'master_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('master_id', masterId)
    .eq('active', true)
    .order('sort_order')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/services — create or update service
// Body: { master_id, salon_id, name, duration_min?, price?, sort_order? }
export async function POST(req: NextRequest) {
  const { master_id, salon_id, name, duration_min = 60, price, sort_order = 0 } = await req.json()

  if (!master_id || !salon_id || !name?.trim()) {
    return NextResponse.json({ error: 'master_id, salon_id, name required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({ master_id, salon_id, name: name.trim(), duration_min, price: price ?? null, sort_order })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}

// DELETE /api/services?id=X
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await supabaseAdmin.from('services').update({ active: false }).eq('id', id)
  return NextResponse.json({ ok: true })
}
