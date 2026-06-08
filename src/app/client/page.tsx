'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Star, Gift, Heart } from 'lucide-react'

const NEXT_SLOTS = [
  { date: '12 июня', time: '17:00', master: 'Наташа' },
  { date: '13 июня', time: '19:00', master: 'Наташа' },
  { date: '14 июня', time: '11:00', master: 'Ольга' },
]

const HISTORY = [
  { date: '10 мая 2026', service: 'Маникюр + гель', master: 'Наташа', amount: '2 800 ₽' },
  { date: '12 апреля 2026', service: 'Маникюр + педикюр', master: 'Наташа', amount: '3 800 ₽' },
  { date: '15 марта 2026', service: 'Маникюр + гель', master: 'Наташа', amount: '2 800 ₽' },
]

export default function ClientPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto px-4 py-8">

        <Link
          href={`/role?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Сменить роль
        </Link>

        {/* Приветствие */}
        <div className="mb-8">
          <p className="text-zinc-500 text-sm mb-1">Добрый день</p>
          <h1 className="text-2xl font-bold">Юлия</h1>
        </div>

        {/* Следующий визит */}
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-700/30 rounded-2xl p-5 mb-4">
          <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-2">
            Рекомендуем записаться
          </p>
          <p className="text-white font-semibold mb-1">
            Ваш следующий визит через <span className="text-purple-300">8 дней</span>
          </p>
          <p className="text-zinc-400 text-sm mb-4">
            Наташа ждёт вас — маникюр выглядит лучше всего каждые 4 недели
          </p>
          <div className="space-y-2">
            {NEXT_SLOTS.map((slot, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between bg-black/30 hover:bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-purple-400" />
                  <span className="text-sm text-white">{slot.date}, {slot.time}</span>
                </div>
                <span className="text-xs text-zinc-400">{slot.master}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Calendar, label: 'Записаться' },
            { icon: Star, label: 'Мой мастер' },
            { icon: Gift, label: 'Бонусы' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 flex flex-col items-center gap-2 hover:border-zinc-600 transition-colors"
            >
              <Icon size={18} className="text-zinc-400" />
              <span className="text-xs text-zinc-500">{label}</span>
            </button>
          ))}
        </div>

        {/* История */}
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
            История визитов
          </p>
          <div className="space-y-2">
            {HISTORY.map((h, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white font-medium">{h.service}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{h.date} · {h.master}</p>
                </div>
                <span className="text-sm text-zinc-400">{h.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Beauty AI Assistant */}
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className="text-pink-400" />
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Beauty AI</p>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Наташа специализируется на укреплении натуральных ногтей. После 3 месяцев регулярного ухода ваши ногти стали заметно крепче — продолжайте в том же темпе!
          </p>
        </div>

        <p className="text-xs text-zinc-700 text-center mt-8">
          Интерфейс клиента · BeautyOS
        </p>
      </div>
    </div>
  )
}
