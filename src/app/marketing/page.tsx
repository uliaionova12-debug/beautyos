'use client'

export const dynamic = 'force-dynamic'

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
    scheduled: '10 апреля',
    cardColor: 'bg-pink-50 border-pink-200',
    typeColor: 'text-pink-600',
  },
  {
    id: '2',
    type: 'Лояльность',
    platform: 'ВКонтакте',
    title: 'Спасибо за доверие',
    text: '💛 За каждые 5 визитов — бесплатная укладка. Мы помним каждого клиента. Уточняйте у администратора.',
    scheduled: '15 апреля',
    cardColor: 'bg-yellow-50 border-yellow-200',
    typeColor: 'text-yellow-700',
  },
  {
    id: '3',
    type: 'Полезный контент',
    platform: 'Telegram',
    title: 'Советы по уходу',
    text: '💆 Три правила ухода за окрашенными волосами дома: 1) Мыть прохладной водой, 2) Маска раз в неделю, 3) UV-спрей перед выходом. Сохраняй!',
    scheduled: '18 апреля',
    cardColor: 'bg-blue-50 border-blue-200',
    typeColor: 'text-blue-700',
  },
  {
    id: '4',
    type: 'Возврат клиентов',
    platform: 'WhatsApp',
    title: 'Личное сообщение',
    text: 'Привет! Мы скучаем 🙂 Не были у нас уже 2 месяца. Специально для вас — скидка 500 ₽ на следующий визит. Запишитесь до конца недели.',
    scheduled: '21 апреля',
    cardColor: 'bg-emerald-50 border-emerald-200',
    typeColor: 'text-emerald-700',
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
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link
          href={`/dashboard?salon_id=${salonId}`}
          className="flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Дашборд
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-terracotta/10 rounded-xl">
            <Megaphone size={20} className="text-terracotta" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite">Директор по маркетингу</h1>
            <p className="text-sm text-dusk">Контент-план и идеи для роста</p>
          </div>
          <span className="ml-auto text-xs text-dusk/60 bg-cream border border-parchment rounded-full px-2.5 py-1">
            Mock-данные
          </span>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-parchment rounded-xl p-4">
            <p className="text-2xl font-bold text-graphite">4</p>
            <p className="text-xs text-dusk mt-1">Постов в плане</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-600">+23%</p>
            <p className="text-xs text-dusk mt-1">Охват за месяц</p>
          </div>
          <div className="bg-card border border-parchment rounded-xl p-4">
            <p className="text-2xl font-bold text-graphite">3</p>
            <p className="text-xs text-dusk mt-1">Платформы</p>
          </div>
        </div>

        {/* Контент-план */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-dusk" />
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Контент-план на апрель</p>
          </div>
          <div className="space-y-3">
            {MOCK_POSTS.map(post => (
              <div key={post.id} className={`rounded-xl p-4 border ${post.cardColor}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${post.typeColor}`}>{post.type}</span>
                    <span className="text-xs text-dusk/40">·</span>
                    <span className="text-xs text-dusk">{post.platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dusk/60">{post.scheduled}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(post.text)}
                      className="text-dusk/40 hover:text-sage transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-graphite mb-1.5">{post.title}</p>
                <p className="text-sm text-dusk leading-relaxed">{post.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Идеи */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-dusk" />
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider">Идеи для следующего месяца</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_IDEAS.map(idea => (
              <div key={idea.title} className="bg-card border border-parchment rounded-xl p-4">
                <p className="text-2xl mb-2">{idea.icon}</p>
                <p className="text-sm font-semibold text-graphite mb-1">{idea.title}</p>
                <p className="text-xs text-dusk">{idea.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-terracotta" />
            <p className="text-sm font-semibold text-graphite">Акция месяца</p>
          </div>
          <p className="text-sm text-dusk mb-3">
            AI предлагает: скидка 500 ₽ для клиентов, не приходивших 60+ дней.
            Охватит ~{Math.round(Math.random() * 30 + 25)} клиентов. Ожидаемый возврат: 8–12 записей.
          </p>
          <button
            onClick={() => alert('В полной версии: создание кампании и авторассылка')}
            className="text-sm font-semibold text-terracotta hover:opacity-80 transition-opacity"
          >
            Запустить кампанию →
          </button>
        </div>

      </div>
    </div>
  )
}
