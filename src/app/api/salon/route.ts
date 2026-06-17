export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/salon?slug=rose-nails  → salon info for client invite page
// GET /api/salon?id=uuid           → salon info by id (for dashboard invite block)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const id   = req.nextUrl.searchParams.get('id')

  if (!slug && !id) {
    return NextResponse.json({ error: 'slug or id required' }, { status: 400 })
  }

  try {
    let query = supabaseAdmin
      .from('salons')
      .select('*')

    if (slug) query = query.eq('salon_slug', slug)
    else      query = query.eq('id', id!)

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json({ error: 'Салон не найден' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Ошибка получения данных' }, { status: 500 })
  }
}
