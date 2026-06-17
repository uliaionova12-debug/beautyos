export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSubscription } from '@/lib/subscription'

// GET /api/subscription?salon_id=X
// Returns subscription status, creating a 7-day trial if none exists.
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  try {
    const info = await getOrCreateSubscription(salonId)
    return NextResponse.json(info)
  } catch (err) {
    console.error('Subscription check error:', err)
    // Fail open — never block user due to subscription check errors
    return NextResponse.json({ status: 'active', daysLeft: 0, trialEndsAt: null, activeUntil: null, planName: 'starter' })
  }
}
