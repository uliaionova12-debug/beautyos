export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
}

function toSlug(name: string): string {
  return name.toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

// POST /api/salon/slug  { salon_id, booking_url? }
// Generates a unique slug for the salon and optionally saves booking_url
export async function POST(req: NextRequest) {
  const { salon_id, booking_url } = await req.json()
  if (!salon_id) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  // Fetch salon name
  const { data: salon, error: fetchErr } = await supabaseAdmin
    .from('salons')
    .select('id, name, salon_slug')
    .eq('id', salon_id)
    .single()

  if (fetchErr || !salon) {
    return NextResponse.json({ error: 'Салон не найден' }, { status: 404 })
  }

  // If already has slug — return it (idempotent)
  if (salon.salon_slug) {
    const update: Record<string, string> = {}
    if (booking_url) update.booking_url = booking_url
    if (Object.keys(update).length) {
      await supabaseAdmin.from('salons').update(update).eq('id', salon_id)
    }
    return NextResponse.json({ slug: salon.salon_slug, salon_id })
  }

  // Generate slug from salon name, add suffix if conflict
  const base = toSlug(salon.name) || 'salon'
  let candidate = base
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabaseAdmin
      .from('salons')
      .select('id')
      .eq('salon_slug', candidate)
      .single()
    if (!existing) break
    attempt++
    candidate = `${base}-${attempt}`
  }

  const update: Record<string, string> = { salon_slug: candidate }
  if (booking_url) update.booking_url = booking_url

  const { error: updateErr } = await supabaseAdmin
    .from('salons')
    .update(update)
    .eq('id', salon_id)

  if (updateErr) {
    // Column probably doesn't exist yet — return helpful message
    return NextResponse.json({
      error: 'Колонки salon_slug/booking_url не найдены в таблице salons. Запустите SQL-миграцию.',
      sql: 'ALTER TABLE salons ADD COLUMN IF NOT EXISTS salon_slug text UNIQUE; ALTER TABLE salons ADD COLUMN IF NOT EXISTS booking_url text;',
    }, { status: 500 })
  }

  return NextResponse.json({ slug: candidate, salon_id })
}
