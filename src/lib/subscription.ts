import { supabaseAdmin } from '@/lib/supabase'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface SubscriptionInfo {
  status: SubscriptionStatus
  daysLeft: number          // days remaining in trial (0 if expired or active)
  trialEndsAt: string | null
  activeUntil: string | null
  planName: string
}

// Returns subscription for salon_id, creating a 7-day trial if none exists.
export async function getOrCreateSubscription(salonId: string): Promise<SubscriptionInfo> {
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('salon_id', salonId)
    .single()

  let row = existing

  if (!row) {
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: created } = await supabaseAdmin
      .from('subscriptions')
      .insert({ salon_id: salonId, status: 'trial', trial_ends_at: trialEnd })
      .select()
      .single()
    row = created
  }

  if (!row) {
    // Fallback: treat as active if DB fails
    return { status: 'active', daysLeft: 0, trialEndsAt: null, activeUntil: null, planName: 'starter' }
  }

  // Resolve actual status: expire trial if time passed
  let status: SubscriptionStatus = row.status
  if (status === 'trial' && row.trial_ends_at && new Date(row.trial_ends_at) < new Date()) {
    status = 'expired'
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('salon_id', salonId)
  }

  let daysLeft = 0
  if (status === 'trial' && row.trial_ends_at) {
    const ms = new Date(row.trial_ends_at).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  }

  return {
    status,
    daysLeft,
    trialEndsAt: row.trial_ends_at ?? null,
    activeUntil: row.active_until ?? null,
    planName: row.plan_name ?? 'starter',
  }
}

// Lightweight check: is this salon allowed to use paid features?
export async function isSubscriptionActive(salonId: string): Promise<boolean> {
  const info = await getOrCreateSubscription(salonId)
  return info.status === 'trial' || info.status === 'active'
}
