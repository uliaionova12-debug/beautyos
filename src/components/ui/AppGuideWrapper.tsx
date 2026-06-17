'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppGuide } from './AppGuide'

// for-business has its own NeuroConsultant — skip to avoid duplicate
const EXCLUDED = ['/for-business']

export function AppGuideWrapper() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null
  if (EXCLUDED.some(p => pathname === p || pathname.startsWith(p + '/'))) return null

  return <AppGuide currentPage={pathname} />
}
