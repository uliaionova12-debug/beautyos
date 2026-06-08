'use client'

import { useState } from 'react'
import { RetentionAnalysis } from '@/types'
import { Info, X } from 'lucide-react'

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return n.toLocaleString('ru-RU') + ' ₽'
}

interface Explanation {
  title: string
  value: string
  period: string
  formula: string
  source: string
  details: string[]
}

function ExplainModal({ exp, onClose }: { exp: Explanation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-graphite/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-cream rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Как рассчитано</p>
            <p className="text-base font-bold text-graphite">{exp.title}: {exp.value}</p>
          </div>
          <button onClick={onClose} className="text-dusk/40 hover:text-graphite transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-card border border-parchment rounded-xl p-3">
            <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-1">Период</p>
            <p className="text-sm text-graphite">{exp.period}</p>
          </div>

          <div className="bg-card border border-parchment rounded-xl p-3">
            <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-1">Формула</p>
            <p className="text-sm text-graphite font-mono">{exp.formula}</p>
          </div>

          <div className="bg-card border border-parchment rounded-xl p-3">
            <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-2">Исходные данные</p>
            <ul className="space-y-1">
              {exp.details.map((d, i) => (
                <li key={i} className="text-sm text-graphite flex items-start gap-1.5">
                  <span className="text-dusk/40 mt-0.5">·</span>{d}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-parchment rounded-xl p-3">
            <p className="text-[10px] font-semibold text-dusk uppercase tracking-wider mb-1">Источник данных</p>
            <p className="text-sm text-graphite">{exp.source}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="ml-1.5 text-dusk/30 hover:text-rose transition-colors"
      title="Как рассчитано">
      <Info size={13} />
    </button>
  )
}

interface Props {
  analysis: RetentionAnalysis
}

export function FinancialImpact({ analysis }: Props) {
  const [modal, setModal] = useState<Explanation | null>(null)
  const retentionPct = Math.round(analysis.retention_rate * 100)

  const explanations: Record<string, Explanation> = {
    impact: {
      title: 'Финансовый ущерб',
      value: formatMoney(analysis.total_financial_impact),
      period: 'Последние 90 дней',
      formula: 'Σ (avg_check × кол-во пропущенных визитов) по каждому потерянному клиенту',
      source: 'Загруженные данные визитов из CRM',
      details: [
        `Потеряно клиентов: ${analysis.lost_clients}`,
        `Среднее время без визита у потерянных: более 2.5× их обычного интервала`,
        `Для каждого клиента: (дней без визита − интервал) / 30 × avg_check`,
      ],
    },
    total: {
      title: 'Всего клиентов',
      value: String(analysis.total_clients),
      period: 'Все визиты в базе',
      formula: 'Уникальные клиенты по номеру телефона или имени',
      source: 'Загруженные данные визитов',
      details: [
        `Клиенты с совпадающим телефоном объединяются в одну запись`,
        `Клиенты без телефона идентифицируются по имени`,
        `Итого уникальных: ${analysis.total_clients}`,
      ],
    },
    active: {
      title: 'Активных',
      value: String(analysis.active_clients),
      period: 'Последние 90 дней',
      formula: 'Клиенты, чей последний визит в пределах 1.5× среднего интервала',
      source: 'Загруженные данные визитов',
      details: [
        `Активных: ${analysis.active_clients} из ${analysis.total_clients}`,
        `Условие: дней с последнего визита < средний интервал × 1.5`,
        `Средний интервал считается по истории визитов каждого клиента`,
      ],
    },
    at_risk: {
      title: 'В группе риска',
      value: String(analysis.at_risk_clients),
      period: 'Последние 90 дней',
      formula: 'Клиенты, чей последний визит между 1.5× и 2.5× среднего интервала',
      source: 'Загруженные данные визитов',
      details: [
        `В группе риска: ${analysis.at_risk_clients}`,
        `Условие: интервал × 1.5 < дней без визита < интервал × 2.5`,
        `Без звонка вероятно перейдут в «потерянных»`,
      ],
    },
    lost: {
      title: 'Потеряно',
      value: String(analysis.lost_clients),
      period: 'Последние 90 дней',
      formula: 'Клиенты, чей последний визит более 2.5× среднего интервала назад',
      source: 'Загруженные данные визитов',
      details: [
        `Потеряно: ${analysis.lost_clients}`,
        `Условие: дней без визита > средний интервал × 2.5`,
        `Для клиентов с 1 визитом интервал принимается равным 30 дням`,
      ],
    },
    retention: {
      title: 'Возвратность',
      value: `${retentionPct}%`,
      period: 'По всей базе клиентов',
      formula: `${analysis.active_clients} / ${analysis.total_clients} × 100 = ${retentionPct}%`,
      source: 'Загруженные данные визитов',
      details: [
        `Всего клиентов в базе: ${analysis.total_clients}`,
        `Активных (приходят в срок): ${analysis.active_clients}`,
        `Норма для салона красоты: 60–75%`,
        retentionPct >= 60 ? '✓ Показатель в норме' : '⚠ Показатель ниже нормы — нужна работа с базой',
      ],
    },
  }

  return (
    <>
      {modal && <ExplainModal exp={modal} onClose={() => setModal(null)} />}

      <div className="space-y-4">
        {/* Финансовый ущерб */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center mb-2">
            <p className="text-sm text-red-600 font-semibold uppercase tracking-wider">
              Финансовый ущерб за 90 дней
            </p>
            <InfoButton onClick={() => setModal(explanations.impact)} />
          </div>
          <p className="text-5xl font-bold text-graphite tracking-tight">
            {formatMoney(analysis.total_financial_impact)}
          </p>
          <p className="text-sm text-red-500 mt-2">
            Потеряно {analysis.lost_clients} клиентов из {analysis.total_clients}
          </p>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { key: 'total',   value: analysis.total_clients,  label: 'Всего клиентов', cls: 'bg-card border-parchment',      val: 'text-graphite' },
            { key: 'active',  value: analysis.active_clients, label: 'Активных',       cls: 'bg-card border-parchment',      val: 'text-emerald-600' },
            { key: 'at_risk', value: analysis.at_risk_clients,label: 'В группе риска', cls: 'bg-amber-50 border-amber-200',  val: 'text-amber-600' },
            { key: 'lost',    value: analysis.lost_clients,   label: 'Потеряно',       cls: 'bg-red-50 border-red-200',      val: 'text-red-600' },
          ].map(m => (
            <div key={m.key} className={`border rounded-xl p-4 ${m.cls}`}>
              <div className="flex items-start justify-between">
                <p className={`text-2xl font-bold ${m.val}`}>{m.value}</p>
                <InfoButton onClick={() => setModal(explanations[m.key])} />
              </div>
              <p className="text-xs text-dusk mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Возвратность */}
        <div className="bg-card border border-parchment rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <p className="text-sm text-dusk">Возвратность клиентов</p>
              <InfoButton onClick={() => setModal(explanations.retention)} />
            </div>
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
          <p className="text-xs text-dusk/60 mt-1">Норма для салона красоты: 60–75%</p>
        </div>
      </div>
    </>
  )
}
