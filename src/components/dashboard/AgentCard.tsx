'use client'

import Link from 'next/link'
import { LucideIcon, Lock } from 'lucide-react'

interface Props {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  status: 'active' | 'soon'
  metric?: string
  metricLabel?: string
}

export function AgentCard({ title, description, icon: Icon, href, status, metric, metricLabel }: Props) {
  const inner = (
    <div className={`
      rounded-2xl border p-5 h-full transition-all duration-200
      ${status === 'active'
        ? 'bg-card border-parchment hover:border-sage/40 hover:shadow-sm cursor-pointer'
        : 'bg-cream border-parchment opacity-50 cursor-not-allowed'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${status === 'active' ? 'bg-sage/10' : 'bg-parchment'}`}>
          {status === 'active'
            ? <Icon size={18} className="text-sage" />
            : <Lock size={18} className="text-dusk/40" />
          }
        </div>
        {status === 'soon' && (
          <span className="text-xs text-dusk/60 font-medium bg-cream px-2 py-0.5 rounded-full border border-parchment">
            Скоро
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-graphite mb-1">{title}</p>
      <p className="text-xs text-dusk leading-relaxed">{description}</p>
      {metric && (
        <div className="mt-4 pt-4 border-t border-parchment">
          <p className="text-lg font-bold text-graphite">{metric}</p>
          <p className="text-xs text-dusk">{metricLabel}</p>
        </div>
      )}
    </div>
  )

  if (status === 'active' && href) {
    return <Link href={href}>{inner}</Link>
  }

  return inner
}
