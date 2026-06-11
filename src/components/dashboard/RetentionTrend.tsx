'use client'

interface Snapshot {
  snapshot_date: string
  retention_rate: number
  total_clients: number
  active_clients: number
  at_risk_clients: number
  lost_clients: number
}

interface RetentionTrendProps {
  snapshots: Snapshot[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function RetentionTrend({ snapshots }: RetentionTrendProps) {
  if (!snapshots || snapshots.length < 2) return null

  const rates = snapshots.map(s => s.retention_rate)
  const min = Math.max(0, Math.min(...rates) - 5)
  const max = Math.min(100, Math.max(...rates) + 5)
  const range = max - min || 10

  const W = 280
  const H = 80
  const PAD = { left: 0, right: 0, top: 8, bottom: 4 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const points = snapshots.map((s, i) => {
    const x = PAD.left + (i / (snapshots.length - 1)) * chartW
    const y = PAD.top + chartH - ((s.retention_rate - min) / range) * chartH
    return { x, y, ...s }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`

  const last = snapshots[snapshots.length - 1]
  const prev = snapshots[snapshots.length - 2]
  const delta = last.retention_rate - prev.retention_rate
  const deltaColor = delta >= 0 ? 'text-emerald-600' : 'text-red-500'
  const deltaSign = delta >= 0 ? '+' : ''

  return (
    <div className="bg-card border border-parchment rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Тренд возвратности</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-graphite">{last.retention_rate}%</span>
            <span className={`text-sm font-semibold ${deltaColor}`}>
              {deltaSign}{delta}% к прошлому
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-dusk">{snapshots.length} загрузок</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C9A7E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7C9A7E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#retGrad)" />
        <path d={pathD} fill="none" stroke="#7C9A7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#7C9A7E" />
        ))}
      </svg>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-dusk/60">{formatDate(snapshots[0].snapshot_date)}</span>
        <span className="text-xs text-dusk/60">{formatDate(last.snapshot_date)}</span>
      </div>
    </div>
  )
}
