'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FinancialImpact } from '@/components/retention/FinancialImpact'
import { ClientRiskList } from '@/components/retention/ClientRiskList'
import { Client, RetentionAnalysis } from '@/types'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

type Tab = 'at_risk' | 'lost' | 'masters'

export default function RetentionPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const [tab, setTab] = useState<Tab>('at_risk')
  const [atRisk, setAtRisk] = useState<Client[]>([])
  const [lost, setLost] = useState<Client[]>([])
  const [analysis, setAnalysis] = useState<RetentionAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!salonId) { setLoading(false); return }

    Promise.all([
      fetch(`/api/clients?salon_id=${salonId}&status=at_risk&limit=100`).then(r => r.json()),
      fetch(`/api/clients?salon_id=${salonId}&status=lost&limit=100`).then(r => r.json()),
      fetch(`/api/summary?salon_id=${salonId}`).then(r => r.json()),
    ]).then(([riskData, lostData, summaryData]) => {
      const riskClients: Client[] = riskData.clients || []
      const lostClients: Client[] = lostData.clients || []
      setAtRisk(riskClients)
      setLost(lostClients)

      const totalFinancialImpact = lostClients.reduce((sum, c) => {
        const interval = c.avg_interval_days || 30
        const monthsLost = Math.max(0, c.days_since_last_visit - interval) / 30
        const visitsLost = monthsLost / (interval / 30)
        return sum + Math.round(c.avg_check * visitsLost)
      }, 0)

      setAnalysis({
        salon_id: salonId,
        period_days: 90,
        total_clients: summaryData.total_clients || 0,
        active_clients: summaryData.active_clients || 0,
        at_risk_clients: riskClients.length,
        lost_clients: lostClients.length,
        total_financial_impact: totalFinancialImpact,
        retention_rate: (summaryData.retention_rate || 0) / 100,
        at_risk_list: riskClients,
        lost_list: lostClients,
        masters: summaryData.masters || [],
        ai_insights: [],
        ai_recommendation: '',
        analyzed_at: new Date().toISOString(),
      })

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [salonId])

  if (!salonId) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-dusk mb-4">Данные не загружены</p>
          <Link href="/join/salon" className="text-sage hover:opacity-80 transition-opacity">← Загрузить данные</Link>
        </div>
      </div>
    )
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'at_risk', label: 'Позвонить сейчас', count: atRisk.length },
    { key: 'lost', label: 'Потеряны', count: lost.length },
    { key: 'masters', label: 'Мастера', count: 0 },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Дашборд
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sage/10 rounded-xl">
            <Users size={20} className="text-sage" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Директор по возврату</h1>
            <p className="text-sm text-dusk">Возвратность клиентов и финансовые потери</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-parchment rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-parchment rounded w-1/3 mb-3" />
                <div className="h-4 bg-parchment rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {analysis && <div className="mb-8"><FinancialImpact analysis={analysis} /></div>}

            {/* Табы */}
            <div className="flex gap-1 bg-cream border border-parchment p-1 rounded-xl mb-6">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-graphite text-white'
                      : 'text-dusk hover:text-graphite'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? 'bg-white/20' : 'bg-parchment'
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
                salonId={salonId}
                title="Не были 30–90 дней — позвоните сегодня"
                emptyText="Все клиенты активны — отлично!"
              />
            )}
            {tab === 'lost' && (
              <ClientRiskList
                clients={lost}
                salonName="Салон красоты"
                salonId={salonId}
                title="Потеряны (90+ дней) — уже выбрали другой салон"
                emptyText="Потерянных клиентов нет — отличный результат!"
              />
            )}
            {tab === 'masters' && (
              <div className="text-dusk text-sm text-center py-12">
                Загрузите данные для анализа мастеров
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
