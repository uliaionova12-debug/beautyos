'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { TrialBanner } from './TrialBanner'

const APP_PREFIXES = [
  '/dashboard', '/actions', '/execution', '/client', '/beauty-companion',
  '/marketing', '/retention', '/reputation', '/master', '/ai-director',
  '/ai-coach', '/booking', '/subscription',
]

function isAppPage(pathname: string) {
  return APP_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function dismissKey(salonId: string, daysLeft: number, status: string) {
  const today = new Date().toISOString().slice(0, 10)
  return `trial_banner_${salonId}_${status}_${daysLeft}_${today}`
}

export function TrialBannerWrapper() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const salonId     = searchParams.get('salon_id') || ''
  const { status, daysLeft, loading } = useSubscription(salonId || null)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !salonId || loading) return
    const key = dismissKey(salonId, daysLeft, status)
    setDismissed(localStorage.getItem(key) === '1')
  }, [mounted, salonId, daysLeft, status, loading])

  if (!mounted || !salonId || loading) return null
  if (!isAppPage(pathname)) return null

  // Expired: always show, no dismiss
  if (status === 'expired') {
    return <TrialBanner daysLeft={0} status="expired" salonId={salonId} onDismiss={() => {}} />
  }

  // Trial notifications: show only once per day per milestone
  if (status === 'trial' && daysLeft <= 3 && !dismissed) {
    return (
      <TrialBanner
        daysLeft={daysLeft}
        status="trial"
        salonId={salonId}
        onDismiss={() => {
          const key = dismissKey(salonId, daysLeft, status)
          localStorage.setItem(key, '1')
          setDismissed(true)
        }}
      />
    )
  }

  return null
}
