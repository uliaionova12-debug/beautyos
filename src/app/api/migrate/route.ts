export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SECRET = 'beautyos-migrate-2026'

// Checks which columns/tables are present in the DB.
// GET /api/migrate?secret=beautyos-migrate-2026
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks = await Promise.all([
    check('masters',          'external_booking_url'),
    check('salons',           'booking_url'),
    check('salons',           'salon_slug'),
    check('clients',          'primary_master_name'),
    check('insights',         'type'),
    check('insights',         'value'),
    tableExists('data_uploads'),
    tableExists('analysis_snapshots'),
    tableExists('bookings'),
    tableExists('services'),
    tableExists('availability'),
    tableExists('subscriptions'),
    tableExists('leads'),
  ])

  const allOk = checks.every(c => c.ok)
  return NextResponse.json({ allOk, checks })
}

async function check(table: string, column: string) {
  const { error } = await supabaseAdmin
    .from(table as never)
    .select(column)
    .limit(1)
  const ok = !error || !error.message.includes('does not exist')
  return { name: `${table}.${column}`, ok, error: ok ? undefined : error?.message }
}

async function tableExists(table: string) {
  const { error } = await supabaseAdmin
    .from(table as never)
    .select('id')
    .limit(1)
  const ok = !error || !error.message.includes('does not exist')
  return { name: table, ok, error: ok ? undefined : error?.message }
}
