export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'
import {
  extractEventsFromSnapshot,
  extractEventsFromVisits,
  extractEventsFromReviews,
  extractSeasonalEvent,
  selectPrimaryEvent,
  buildContentPrompt,
  EVENT_TO_CONTENT_TYPE,
  CONTENT_TYPE_LABELS,
  type VisitRow,
  type ReviewRow,
} from '@/lib/content-engine'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

function detectSalonType(services: string[]): string {
  const names = services.join(' ').toLowerCase()
  if (/маникюр|педикюр|гель.лак|ногт|наращ/.test(names)) return 'ногтевой сервис'
  if (/брови|brow/.test(names)) return 'студия бровей'
  if (/ресниц|lash/.test(names)) return 'студия ресниц'
  if (/чистк.*лиц|пилинг|косметолог/.test(names)) return 'косметология'
  if (/стрижк|окрас|балаяж|волос/.test(names)) return 'парикмахерская'
  return 'салон красоты'
}

export async function POST(req: NextRequest) {
  const { salon_id } = await req.json() as { salon_id: string }

  if (!salon_id) {
    return NextResponse.json({ error: 'salon_id required' }, { status: 400 })
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString().split('T')[0]

  // ─ Fetch all data sources in parallel ─────────────────────────────────────
  const [summaryRes, recentVisitsRes, allVisitsRes, mastersRes, reviewsRes] = await Promise.all([
    supabaseAdmin.from('clients')
      .select('status, avg_check, days_since_last_visit')
      .eq('salon_id', salon_id)
      .limit(1000),

    supabaseAdmin.from('visits')
      .select('service_name, amount, visit_date, master_name')
      .eq('salon_id', salon_id)
      .gte('visit_date', cutoff)
      .order('visit_date', { ascending: false })
      .limit(200),

    supabaseAdmin.from('visits')
      .select('service_name, amount')
      .eq('salon_id', salon_id)
      .order('visit_date', { ascending: false })
      .limit(500),

    supabaseAdmin.from('masters')
      .select('name, active_clients_count')
      .eq('salon_id', salon_id)
      .order('active_clients_count', { ascending: false })
      .limit(5),

    supabaseAdmin.from('insights')
      .select('type, value, created_at')
      .eq('salon_id', salon_id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const clients     = summaryRes.data || []
  const recentVisits: VisitRow[] = recentVisitsRes.data || []
  const allVisits   = allVisitsRes.data || []
  const masters     = mastersRes.data || []

  // ─ Compute snapshot signals ────────────────────────────────────────────────
  const atRisk    = clients.filter(c => c.status === 'at_risk')
  const active    = clients.filter(c => c.status === 'active')
  const avgCheck  = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + (c.avg_check || 0), 0) / clients.length)
    : 0
  const returnRate = clients.length > 0
    ? Math.round((active.length / clients.length) * 100)
    : 0

  // Empty slots estimate from retention rate
  const emptySlots = Math.max(2, Math.round((1 - returnRate / 100) * 6))

  // Top services
  const svcMap = new Map<string, number>()
  for (const v of allVisits) {
    if (v.service_name) svcMap.set(v.service_name.trim(), (svcMap.get(v.service_name.trim()) ?? 0) + 1)
  }
  const topServices = [...svcMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const salonType = detectSalonType(topServices.map(s => s[0]))
  const recentServiceNames = [...new Set(recentVisits.map(v => v.service_name).filter(Boolean) as string[])].slice(0, 6)
  const masterNames = masters.map(m => m.name).filter(Boolean) as string[]

  // Reviews from insights table (type: 'review')
  const reviewRows: ReviewRow[] = (reviewsRes.data || [])
    .filter(r => r.type === 'review')
    .map(r => {
      const val = typeof r.value === 'object' && r.value ? r.value as Record<string, unknown> : {}
      return {
        rating: Number(val['rating'] ?? 5),
        text: String(val['text'] ?? ''),
        created_at: r.created_at,
      }
    })

  // ─ Extract all events ──────────────────────────────────────────────────────
  const snapshotEvents = extractEventsFromSnapshot({
    at_risk_clients: atRisk.length,
    empty_slots: emptySlots,
    return_rate: returnRate,
    total_clients: clients.length,
  })

  const visitEvents = extractEventsFromVisits(recentVisits, avgCheck)
  const reviewEvents = extractEventsFromReviews(reviewRows)
  const seasonalEvent = extractSeasonalEvent()

  const allEvents = [...snapshotEvents, ...visitEvents, ...reviewEvents, seasonalEvent]

  // ─ Select primary event ────────────────────────────────────────────────────
  const primaryEvent = selectPrimaryEvent(allEvents)

  // No meaningful event above threshold (seasonal < 40 alone is too weak)
  if (!primaryEvent || (allEvents.length === 1 && primaryEvent.type === 'seasonal_pattern' && primaryEvent.weight < 40)) {
    return NextResponse.json({ post: 'NO_CONTENT_EVENT', type: null, source_events: [], insight: null })
  }

  const contentType = EVENT_TO_CONTENT_TYPE[primaryEvent.type]

  // ─ Build LLM prompt from event ────────────────────────────────────────────
  const userPrompt = buildContentPrompt({
    event: primaryEvent,
    contentType,
    salonType,
    recentServices: recentServiceNames,
    masterNames,
    avgCheck,
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 350,
    temperature: 0.78,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const post = response.choices[0].message.content?.trim() ?? ''

  // Reject if sounds like marketing (basic check)
  const marketingRedFlags = ['записывайтесь прямо сейчас', 'лучшие мастера', 'уникальный', 'трансформация', 'aida']
  const hasFlag = marketingRedFlags.some(f => post.toLowerCase().includes(f))
  if (hasFlag) {
    return NextResponse.json({ post: 'NO_CONTENT_EVENT', type: null, source_events: [], insight: null })
  }

  return NextResponse.json({
    type: contentType,
    type_label: CONTENT_TYPE_LABELS[contentType],
    post,
    source_events: allEvents.map(e => `${e.type} (weight=${e.weight}, source=${e.source})`),
    primary_event: primaryEvent.type,
    insight: `Источник: ${primaryEvent.source}. Событие: ${primaryEvent.type}. Вес: ${primaryEvent.weight}.`,
  })
}
