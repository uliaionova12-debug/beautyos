'use client'

import { useState, useMemo } from 'react'

export function RoiCalculator() {
  const [clients, setClients] = useState(350)
  const [avgCheck, setAvgCheck] = useState(2500)

  const result = useMemo(() => {
    const atRisk = Math.round(clients * 0.30)
    const returned = Math.round(atRisk * 0.40)
    const monthly = returned * avgCheck
    const planCost = 3990
    const paybackDays = monthly > 0 ? Math.ceil((planCost / monthly) * 30) : 0
    return { atRisk, returned, monthly, paybackDays }
  }, [clients, avgCheck])

  return (
    <div className="bg-card border border-parchment rounded-3xl p-8 md:p-10">
      <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-2">Калькулятор окупаемости</p>
      <h2 className="text-2xl md:text-3xl font-bold text-graphite mb-8">Сколько вы можете вернуть?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Sliders */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-graphite">Клиентская база</label>
              <span className="text-sm font-bold text-sage">{clients} клиентов</span>
            </div>
            <input
              type="range" min={100} max={2000} step={50}
              value={clients}
              onChange={e => setClients(Number(e.target.value))}
              className="w-full accent-sage h-2 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-dusk/50 mt-1">
              <span>100</span><span>2 000</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-graphite">Средний чек</label>
              <span className="text-sm font-bold text-sage">{avgCheck.toLocaleString('ru-RU')} ₽</span>
            </div>
            <input
              type="range" min={500} max={8000} step={500}
              value={avgCheck}
              onChange={e => setAvgCheck(Number(e.target.value))}
              className="w-full accent-sage h-2 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-dusk/50 mt-1">
              <span>500 ₽</span><span>8 000 ₽</span>
            </div>
          </div>

          <p className="text-xs text-dusk/60 leading-relaxed">
            Расчёт основан на средних показателях: 30% клиентов в зоне риска, 40% из них возвращаются после звонка.
          </p>
        </div>

        {/* Result */}
        <div className="bg-sage/5 border border-sage/20 rounded-2xl p-7 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <p className="text-xs text-dusk mb-1">Клиентов в зоне риска</p>
              <p className="text-3xl font-bold text-graphite">{result.atRisk}</p>
            </div>
            <div>
              <p className="text-xs text-dusk mb-1">Можно вернуть в месяц</p>
              <p className="text-3xl font-bold text-graphite">{result.returned}</p>
            </div>
            <div className="pt-4 border-t border-sage/20">
              <p className="text-xs text-dusk mb-1">Потенциальный доход</p>
              <p className="text-4xl font-bold text-emerald-600">
                {result.monthly.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-xs text-dusk mt-1">в месяц при 40% возврате</p>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl p-4 border border-sage/20">
            <p className="text-xs text-dusk">BeautyOS окупается за</p>
            <p className="text-2xl font-bold text-sage">{result.paybackDays} дней</p>
            <p className="text-xs text-dusk/60">при тарифе 3 990 ₽/мес</p>
          </div>
        </div>
      </div>
    </div>
  )
}
