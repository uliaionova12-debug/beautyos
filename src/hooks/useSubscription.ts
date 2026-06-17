'use client'

import { useEffect, useState } from 'react'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'loading'

export interface SubscriptionState {
  status: SubscriptionStatus
  daysLeft: number
  loading: boolean
}

const cache = new Map<string, { data: SubscriptionState; ts: number }>()
const TTL = 60_000 // 1 minute

export function useSubscription(salonId: string | null): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({ status: 'loading', daysLeft: 0, loading: true })

  useEffect(() => {
    if (!salonId) {
      setState({ status: 'active', daysLeft: 0, loading: false })
      return
    }

    const cached = cache.get(salonId)
    if (cached && Date.now() - cached.ts < TTL) {
      setState(cached.data)
      return
    }

    fetch(`/api/subscription?salon_id=${salonId}`)
      .then(r => r.json())
      .then(data => {
        const next: SubscriptionState = {
          status:   data.status ?? 'active',
          daysLeft: data.daysLeft ?? 0,
          loading:  false,
        }
        cache.set(salonId, { data: next, ts: Date.now() })
        setState(next)
      })
      .catch(() => {
        // Fail open
        setState({ status: 'active', daysLeft: 0, loading: false })
      })
  }, [salonId])

  return state
}
