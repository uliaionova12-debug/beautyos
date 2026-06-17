export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10)
}

// POST /api/join
// Body: { salon_id, phone?, name?, master_id? }
// Returns: { client_id: string | null, found: boolean, created?: boolean, method: string }
//
// Strategy:
//   1. Try phone match (last 10 digits)
//   2. Try name match (first word)
//   3. If master_id provided → CREATE new client record
//   4. No match → client_id null (new client → beauty-companion)

export async function POST(req: NextRequest) {
  const { salon_id, phone, name, master_id } = await req.json() as {
    salon_id: string
    phone?: string
    name?: string
    master_id?: string
  }

  if (!salon_id) {
    return NextResponse.json({ error: 'salon_id required' }, { status: 400 })
  }

  // ── 1. Phone lookup ────────────────────────────────────────────────────────
  if (phone?.trim()) {
    const digits = normalizePhone(phone)
    if (digits.length >= 7) {
      const { data: byPhone } = await supabaseAdmin
        .from('clients')
        .select('id, name')
        .eq('salon_id', salon_id)
        .ilike('phone', `%${digits}%`)
        .limit(1)

      if (byPhone && byPhone.length > 0) {
        return NextResponse.json({ client_id: byPhone[0].id, found: true, method: 'phone' })
      }
    }
  }

  // ── 2. Name lookup ─────────────────────────────────────────────────────────
  if (name?.trim()) {
    const firstName = name.trim().split(/\s+/)[0]

    const { data: byName } = await supabaseAdmin
      .from('clients')
      .select('id, name')
      .eq('salon_id', salon_id)
      .ilike('name', `%${firstName}%`)
      .limit(5)

    if (byName && byName.length > 0) {
      const exact = byName.find(c =>
        c.name.toLowerCase().startsWith(firstName.toLowerCase())
      )
      const match = exact ?? byName[0]
      return NextResponse.json({ client_id: match.id, found: true, method: 'name' })
    }
  }

  // ── 3. Master link → create new client ────────────────────────────────────
  if (master_id && name?.trim()) {
    let masterName: string | null = null
    const { data: masterData } = await supabaseAdmin
      .from('masters')
      .select('name')
      .eq('id', master_id)
      .single()
    if (masterData) masterName = masterData.name

    const today = new Date().toISOString().slice(0, 10)
    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        salon_id,
        name: name.trim(),
        phone: phone?.trim() || null,
        first_visit_date: today,
        last_visit_date: today,
        total_visits: 0,
        total_revenue: 0,
        avg_check: 0,
        avg_interval_days: 0,
        status: 'active',
        risk_score: 0,
        return_score: 0,
        revenue_opportunity: 0,
        days_since_last_visit: 0,
        primary_master_name: masterName,
      })
      .select('id')
      .single()

    if (!createError && newClient) {
      return NextResponse.json({ client_id: newClient.id, found: false, created: true, method: 'master_link' })
    }
  }

  // ── 4. Not found ───────────────────────────────────────────────────────────
  return NextResponse.json({ client_id: null, found: false, method: 'none' })
}
