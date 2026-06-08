'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FinancialImpact } from '@/components/retention/FinancialImpact'
import { ClientRiskList } from '@/components/retention/ClientRiskList'
import { Client, RetentionAnalysis, Master } from '@/types'
import { ArrowLeft, Users, TrendingDown } from 'lucide-react'
import Link from 'next/link'

type Tab = 'at_risk' | 'lost' | 'masters'

export default function RetentionPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [tab, setTab] = useState<Tab>('at_risk')
  const [atRisk, setAtRisk] = useState<Client[]>([])
  const [lost, setLost] = useState<Client[]>([])
  const [analysis, setAnalysis] = useState<RetentionAnalysis | null>(null)
  const [masters, setMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!salonId) { setLoading(false); return }

    Promise.all([
      fetch(`/api/clients?salon_id=${salonId}&status=at_risk&limit=100`).then(r => r.json()),
      fetch(`/api/clients?salon_id=${salonId}&status=lost&limit=100`).then(r => r.json()),
    ]).then(([riskData, lostData]) => {
      const riskClients: Client[] = riskData.clients || []
      const lostClients: Client[] = lostData.clients || []
      setAtRisk(riskClients)
      setLost(lostClients)

      // Считаем сводку на клиенте
      const totalFinancialImpact = lostClients.reduce((sum, c) => {
        const interval = c.avg_interval_days || 30
        const monthsLost = Math.max(0, c.days_since_last_visit - interval) / 30
        const visitsLost = monthsLost / (interval / 30)
        return sum + Math.round(c.avg_check * visitsLost)
      }, 0)

      setAnalysis({
        salon_id: salonId,
        period_days: 90,
        total_clients: 0,
        active_clients: 0,
        at_risk_clients: riskClients.length,
        lost_clients: lostClients.length,
        total_financial_impact: totalFinancialImpact,
        retention_rate: 0,
        at_risk_list: riskClients,
        lost_list: lostClients,
        masters: [],
        ai_insights: [],
        ai_recommendation: '',
        analyzed_at: new Date().toISOString(),
      })

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [salonId])

  if (!salonId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Данные не загружены</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Вернуться на главную</Link>
        </div>
      </div>
    )
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'at_risk', label: 'Группа риска', count: atRisk.length },
    { key: 'lost', label: 'Потеряны', count: lost.length },
    { key: 'masters', label: 'Мастера', count: masters.length },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Назад */}
        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Дашборд
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Директор по возврату</h1>
            <p className="text-sm text-zinc-500">Возвратность клиентов и финансовые потери</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-zinc-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {analysis && <div className="mb-8"><FinancialImpact analysis={analysis} /></div>}

            {/* Табы */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-6">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? 'bg-black/10' : 'bg-zinc-800'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'at_risk' && (
              <ClientRiskList
                clients={atRisk}
                salonName="Салон красоты"
                title="Клиенты в группе риска"
                emptyText="Клиентов в группе риска нет"
              />
            )}
            {tab === 'lost' && (
              <ClientRiskList
                clients={lost}
                salonName="Салон красоты"
                title="Потерянные клиенты"
                emptyText="Потерянных клиентов нет — отличный результат!"
              />
            )}
            {tab === 'masters' && (
              <div className="text-zinc-500 text-sm text-center py-12">
                Загрузите данные для анализа мастеров
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
