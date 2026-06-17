'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Users, TrendingUp, Map, ChevronRight, ChevronDown } from 'lucide-react'

const STEPS = [
  { n: 1, Icon: Upload,     text: 'Загрузка данных (DIKIDI / CSV / вручную)' },
  { n: 2, Icon: Users,      text: 'Анализ клиентов и записей' },
  { n: 3, Icon: TrendingUp, text: 'Расчёт финансовых потоков и возврата' },
  { n: 4, Icon: Map,        text: 'Формирование карты бизнеса и точек роста' },
]

const FOR_WHOM = [
  'мастера маникюра и педикюра',
  'студии красоты',
  'косметологи',
  'специалисты по эпиляции',
  'массажисты',
  'бровисты и лэшмейкеры',
  'визажисты и стилисты',
  'парикмахеры',
  'небольшие салоны красоты',
]

const INSIGHTS = [
  'где теряются клиенты',
  'кто давно не возвращался',
  'какие окна в расписании не приносят деньги',
  'где можно повысить средний чек',
  'какие клиенты готовы вернуться',
  'какие действия принесут результат быстрее всего',
]

function Collapsible({ title, note, items }: { title: string; note: string; items: string[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-card border border-parchment rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-parchment/30 transition-colors"
      >
        <span className="text-sm font-semibold text-graphite">{title}</span>
        <ChevronDown
          size={16}
          className={`text-dusk/50 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-parchment/60">
          <ul className="mt-4 space-y-2.5">
            {items.map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-sage/60 shrink-0 mt-[7px]" />
                <span className="text-sm text-graphite/80 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-dusk/60 leading-relaxed border-t border-parchment/60 pt-4">
            {note}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ExplainPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''
  const next = salonId ? `/join/salon?salon_id=${salonId}` : '/join/salon'

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors">
            <ArrowLeft size={14} />
            Главная
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-bold text-dusk/40 uppercase tracking-widest mb-3">BeautyOS</p>
          <h1 className="text-2xl font-bold text-graphite leading-snug">
            Финансовый и клиентский<br />анализ вашего бизнеса
          </h1>
          <p className="text-sm text-dusk mt-3 leading-relaxed">
            Система проанализирует записи, клиентов и доход и сформирует карту бизнеса с точками роста.
          </p>
        </div>

        {/* Positioning blocks */}
        <div className="space-y-2.5 mb-8">
          <Collapsible
            title="Для кого BeautyOS"
            items={FOR_WHOM}
            note="Система подойдёт и самостоятельному мастеру, и салону с командой."
          />
          <Collapsible
            title="Что помогает увидеть система"
            items={INSIGHTS}
            note="Главная задача — не просто показать цифры, а подсказать, что делать дальше."
          />
        </div>

        <div className="space-y-3 mb-10">
          {STEPS.map(({ n, Icon, text }) => (
            <div key={n} className="flex items-center gap-4 bg-card border border-parchment rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 bg-parchment rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-dusk">{n}</span>
              </div>
              <p className="text-sm text-graphite/80 leading-snug flex-1">{text}</p>
              <Icon size={14} className="text-dusk/30 shrink-0" />
            </div>
          ))}
        </div>

        <Link
          href={next}
          className="w-full flex items-center justify-center gap-2 bg-graphite text-white font-semibold text-base rounded-2xl py-4 hover:bg-graphite/90 active:scale-95 transition-all shadow-md shadow-graphite/10"
        >
          Начать анализ
          <ChevronRight size={18} />
        </Link>

      </div>
    </div>
  )
}
