export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { salon_id, client_name, master_name, rating, text, platform } = body

  if (!salon_id || !rating) {
    return NextResponse.json({ error: 'salon_id и rating обязательны' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      salon_id,
      client_name: client_name || 'Анонимный клиент',
      master_name: master_name || null,
      rating,
      text: text || null,
      is_public: (platform && platform !== 'internal') ? true : false,
      platform: platform || 'internal',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data })
}

export async function GET(request: NextRequest) {
  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reviews: data || [] })
}
