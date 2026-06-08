'use client'

export const dynamic = 'force-dynamic'

// MOCK — данные статические, реальный источник: OpenAI + контент-история (V2)

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Calendar, Lightbulb, Tag, Copy } from 'lucide-react'

const MOCK_POSTS = [
  {
    id: '1',
    type: 'Акция',
    platform: 'Instagram',
    title: 'Весеннее обновление',
    text: '🌸 Апрель — время обновиться! Окрашивание + уход Olaplex = ваш образ на сезон. Запись в директ. Первые 10 заявок — скидка 15%.',
    emoji: '🌸',
    scheduled: '10 апреля',
    color: 'bg-pink-950/30 border-pink-800/30',
    textColor: 'text-pink-400',
  },
  {
    id: '2',
    type: 'Лояльность',
    platform: 'ВКонтакте',
    title: 'Спасибо за доверие',
    text: '💛 За каждые 5 визитов — бесплатная укладка. Мы помним каждого клиента. Уточняйте у администратора.',
    emoji: '💛',
    scheduled: '15 апреля',
    color: 'bg-yellow-950/30 border-yellow-800/30',
    textColor: 'text-yellow-400',
  },
  {
    id: '3',
    type: 'Полезный контент',
    platform: 'Telegram',
    title: 'Советы по уходу',
    text: '💆 Три правила ухода за окрашенными волосами дома: 1) Мыть прохладной водой, 2) Маска раз в неделю, 3) UV-спрей перед выходом. Сохраняй!',
    emoji: '💆',
    scheduled: '18 апреля',
    color: 'bg-blue-950/30 border-blue-800/30',
    textColor: 'text-blue-400',
  },
  {
    id: '4',
    type: 'Возврат клиентов',
    platform: 'WhatsApp',
    title: 'Личное сообщение',
    text: 'Привет! Мы скучаем 🙂 Не были у нас уже 2 месяца. Специально для вас — скидка 500 ₽ на следующий визит. Запишитесь до конца недели.',
    emoji: '🙂',
    scheduled: '21 апреля',
    color: 'bg-emerald-950/30 border-emerald-800/30',
    textColor: 'text-emerald-400',
  },
]

const MOCK_IDEAS = [
  { icon: '🎂', title: 'День рождения клиента', desc: 'Автоматическое поздравление + скидка' },
  { icon: '☀️', title: 'Летние трансформации', desc: 'Серия постов — тренды лета 2026' },
  { icon: '📸', title: 'Until/After контент', desc: 'Фото результата с разрешения клиента' },
  { icon: '🏆', title: 'Мастер месяца', desc: 'Голосование в stories, повышает доверие' },
]

export default function MarketingPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon_id') || ''

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <Megaphone size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Директор по маркетингу</h1>
            <p className="text-sm text-zinc-500">Контент-план и идеи для роста</p>
          </div>
          <span className="ml-auto text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1">
            Mock-данные
          </span>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">4</p>
            <p className="text-xs text-zinc-500 mt-1">Постов в плане</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">+23%</p>
            <p className="text-xs text-zinc-500 mt-1">Охват за месяц</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-xs text-zinc-500 mt-1">Платформы</p>
          </div>
        </div>

        {/* Контент-план */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-zinc-500" />
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Контент-план на апрель</p>
          </div>
          <div className="space-y-3">
            {MOCK_POSTS.map(post => (
              <div key={post.id} className={`rounded-xl p-4 border ${post.color}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${post.textColor}`}>{post.type}</span>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{post.platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">{post.scheduled}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(post.text)}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-white mb-1.5">{post.title}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{post.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Идеи */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-zinc-500" />
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Идеи для следующего месяца</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_IDEAS.map(idea => (
              <div key={idea.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-2xl mb-2">{idea.icon}</p>
                <p className="text-sm font-medium text-white mb-1">{idea.title}</p>
                <p className="text-xs text-zinc-500">{idea.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-r from-orange-950/40 to-amber-950/30 border border-orange-800/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-orange-400" />
            <p className="text-sm font-semibold text-white">Акция месяца</p>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            AI предлагает: скидка 500 ₽ для клиентов, не приходивших 60+ дней.
            Охватит ~{Math.round(Math.random() * 30 + 25)} клиентов. Ожидаемый возврат: 8–12 записей.
          </p>
          <button
            onClick={() => alert('В полной версии: создание кампании и авторассылка')}
            className="text-sm font-semibold text-orange-300 hover:text-orange-200 transition-colors"
          >
            Запустить кампанию →
          </button>
        </div>

      </div>
    </div>
  )
}
