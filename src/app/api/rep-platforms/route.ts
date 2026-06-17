export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RepPlatform {
  id: string
  platform: string
  url: string
  label: string
  status: string
  added_at: string
}

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ platforms: [] })

  const { data } = await supabaseAdmin
    .from('insights')
    .select('value')
    .eq('salon_id', salonId)
    .eq('type', 'rep_platforms')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const platforms: RepPlatform[] = (data?.value as { platforms?: RepPlatform[] })?.platforms || []
  return NextResponse.json({ platforms })
}

export async function POST(req: NextRequest) {
  const { salon_id, platforms } = await req.json() as { salon_id: string; platforms: RepPlatform[] }
  if (!salon_id) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  await supabaseAdmin
    .from('insights')
    .delete()
    .eq('salon_id', salon_id)
    .eq('type', 'rep_platforms')

  if (platforms.length > 0) {
    await supabaseAdmin.from('insights').insert({
      salon_id,
      type: 'rep_platforms',
      value: { platforms },
      agent_type: 'reputation',
      title: `Источники отзывов (${platforms.length})`,
      body: platforms.map((p: RepPlatform) => p.url).join(', '),
      priority: 'info',
    })
  }

  return NextResponse.json({ ok: true })
}
