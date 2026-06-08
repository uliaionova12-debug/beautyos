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
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-sm text-red-600 font-semibold uppercase tracking-wider mb-2">
          Финансовый ущерб за 90 дней
        </p>
        <p className="text-5xl font-bold text-graphite tracking-tight">
          {formatMoney(analysis.total_financial_impact)}
        </p>
        <p className="text-sm text-red-500 mt-2">
          Потеряно {analysis.lost_clients} клиентов из {analysis.total_clients}
        </p>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card border border-parchment rounded-xl p-4">
          <p className="text-2xl font-bold text-graphite">{analysis.total_clients}</p>
          <p className="text-xs text-dusk mt-1">Всего клиентов</p>
        </div>
        <div className="bg-card border border-parchment rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">{analysis.active_clients}</p>
          <p className="text-xs text-dusk mt-1">Активных</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-600">{analysis.at_risk_clients}</p>
          <p className="text-xs text-dusk mt-1">В группе риска</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">{analysis.lost_clients}</p>
          <p className="text-xs text-dusk mt-1">Потеряно</p>
        </div>
      </div>

      {/* Возвратность */}
      <div className="bg-card border border-parchment rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-dusk">Возвратность клиентов</p>
          <p className="text-sm font-bold text-graphite">{retentionPct}%</p>
        </div>
        <div className="h-2 bg-parchment rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              retentionPct >= 70 ? 'bg-emerald-500' :
              retentionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${retentionPct}%` }}
          />
        </div>
        <p className="text-xs text-dusk/60 mt-1">
          Норма для салона красоты: 60–75%
        </p>
      </div>
    </div>
  )
}
