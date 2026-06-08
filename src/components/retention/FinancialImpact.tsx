'use client'

import { RetentionAnalysis } from '@/types'

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

interface Props {
  analysis: RetentionAnalysis
}

export function FinancialImpact({ analysis }: Props) {
  const retentionPct = Math.round(analysis.retention_rate * 100)

  return (
    <div className="space-y-4">
      {/* Главный удар */}
      <div className="bg-red-950/30 border border-red-800/40 rounded-2xl p-6">
        <p className="text-sm text-red-400 font-medium uppercase tracking-wider mb-2">
          Финансовый ущерб за 90 дней
        </p>
        <p className="text-5xl font-bold text-white tracking-tight">
          {formatMoney(analysis.total_financial_impact)}
        </p>
        <p className="text-sm text-red-400/80 mt-2">
          Потеряно {analysis.lost_clients} клиентов из {analysis.total_clients}
        </p>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{analysis.total_clients}</p>
          <p className="text-xs text-zinc-500 mt-1">Всего клиентов</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">{analysis.active_clients}</p>
          <p className="text-xs text-zinc-500 mt-1">Активных</p>
        </div>
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{analysis.at_risk_clients}</p>
          <p className="text-xs text-zinc-500 mt-1">В группе риска</p>
        </div>
        <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">{analysis.lost_clients}</p>
          <p className="text-xs text-zinc-500 mt-1">Потеряно</p>
        </div>
      </div>

      {/* Возвратность */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-zinc-400">Возвратность клиентов</p>
          <p className="text-sm font-bold text-white">{retentionPct}%</p>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              retentionPct >= 70 ? 'bg-emerald-500' :
              retentionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${retentionPct}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          Норма для салона красоты: 60–75%
        </p>
      </div>
    </div>
  )
}
