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
        ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-pointer'
        : 'bg-zinc-950 border-zinc-900 opacity-60 cursor-not-allowed'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${status === 'active' ? 'bg-blue-500/10' : 'bg-zinc-800'}`}>
          {status === 'active'
            ? <Icon size={18} className="text-blue-400" />
            : <Lock size={18} className="text-zinc-600" />
          }
        </div>
        {status === 'soon' && (
          <span className="text-xs text-zinc-600 font-medium bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            Скоро
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      {metric && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-lg font-bold text-white">{metric}</p>
          <p className="text-xs text-zinc-500">{metricLabel}</p>
        </div>
      )}
    </div>
  )

  if (status === 'active' && href) {
    return <Link href={href}>{inner}</Link>
  }

  return inner
}
