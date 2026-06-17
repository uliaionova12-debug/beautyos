'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppGuide } from './AppGuide'

const ALLOWED_PREFIXES = [
  '/dashboard',
  '/actions',
  '/execution',
  '/client',
  '/beauty-companion',
  '/marketing',
  '/retention',
  '/reputation',
  '/master',
  '/ai-director',
  '/ai-coach',
  '/booking',
  '/join',
  '/explain',
  '/subscription',
]

function shouldShow(pathname: string): boolean {
  return ALLOWED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export function AppGuideWrapper() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null
  if (!shouldShow(pathname)) return null

  return <AppGuide currentPage={pathname} />
}
