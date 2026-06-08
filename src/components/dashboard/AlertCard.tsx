'use client'

import { Insight } from '@/types'
import { AlertTriangle, TrendingDown, Info } from 'lucide-react'

const PRIORITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-red-950/50',
    border: 'border-red-800/50',
    iconColor: 'text-red-400',
    badge: 'bg-red-900/60 text-red-300',
    badgeText: 'Критично',
  },
  warning: {
    icon: TrendingDown,
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/40',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-900/50 text-amber-300',
    badgeText: 'Внимание',
  },
  info: {
    icon: Info,
    bg: 'bg-zinc-900',
    border: 'border-zinc-800',
    iconColor: 'text-zinc-400',
    badge: 'bg-zinc-800 text-zinc-400',
    badgeText: 'Инфо',
  },
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн ₽'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' тыс ₽'
  return n + ' ₽'
}

interface Props {
  insight: Insight
  onAction?: () => void
}

export function AlertCard({ insight, onAction }: Props) {
  const cfg = PRIORITY_CONFIG[insight.priority]
  const Icon = cfg.icon

  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 ${cfg.iconColor}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.badgeText}
            </span>
            {insight.financial_impact > 0 && (
              <span className="text-xs font-mono text-red-400">
                −{formatMoney(insight.financial_impact)}
              </span>
            )}
          </div>
          <p className="text-white font-semibold text-sm leading-snug">{insight.title}</p>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{insight.body}</p>
          {insight.action_label && onAction && (
            <button
              onClick={onAction}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {insight.action_label} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
