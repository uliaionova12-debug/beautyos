export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/bookings/slots?master_id=X&date=YYYY-MM-DD
// Returns available time slots for a specific date — purely deterministic, no AI
export async function GET(req: NextRequest) {
  const masterId = req.nextUrl.searchParams.get('master_id')
  const date     = req.nextUrl.searchParams.get('date')

  if (!masterId || !date) {
    return NextResponse.json({ error: 'master_id and date required' }, { status: 400 })
  }

  // day_of_week: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  // 1. Get master's availability for this day of week
  const { data: avail } = await supabaseAdmin
    .from('availability')
    .select('*')
    .eq('master_id', masterId)
    .eq('day_of_week', dayOfWeek)
    .eq('active', true)
    .single()

  if (!avail) {
    return NextResponse.json({ slots: [], available: false })
  }

  // 2. Get existing bookings for this date (non-cancelled)
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('booking_time, duration')
    .eq('master_id', masterId)
    .eq('booking_date', date)
    .neq('status', 'cancelled')

  const bookedTimes = new Set((existing ?? []).map(b => b.booking_time.slice(0, 5)))

  // 3. Generate slots deterministically
  const slots = generateSlots(avail.start_time, avail.end_time, avail.slot_duration, bookedTimes)

  return NextResponse.json({ slots, available: slots.length > 0 })
}

// Pure function — no side effects, no randomness
function generateSlots(
  startTime: string,
  endTime: string,
  durationMin: number,
  booked: Set<string>
): string[] {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)

  const startMins = sh * 60 + sm
  const endMins   = eh * 60 + em

  const slots: string[] = []

  for (let t = startMins; t + durationMin <= endMins; t += durationMin) {
    const h  = Math.floor(t / 60)
    const m  = t % 60
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    const label = `${hh}:${mm}`

    if (!booked.has(label)) {
      slots.push(label)
    }
  }

  return slots
}
