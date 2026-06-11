'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Мои данные в безопасности?',
    a: 'Да. Данные хранятся в защищённой базе Supabase (EU-region), передаются по HTTPS. Мы не продаём и не передаём данные третьим лицам. Вы можете удалить все данные в любой момент.',
  },
  {
    q: 'У меня нет CSV. Как загрузить данные?',
    a: 'Из DIKIDI и YClients можно выгрузить CSV в один клик: Отчёты → Клиенты → Экспорт. Если вы ведёте учёт в Excel — просто сохраните файл в CSV. Наш менеджер поможет с форматом бесплатно.',
  },
  {
    q: 'Есть ли интеграция с DIKIDI или YClients?',
    a: 'Сейчас работаем через CSV-импорт — это занимает 2 минуты и не требует технических знаний. Прямая API-интеграция с DIKIDI и YClients в разработке, выйдет в Q3 2025.',
  },
  {
    q: 'Как долго ждать первых результатов?',
    a: 'Первые инсайты — через 2 минуты после загрузки данных. Первые реально вернувшиеся клиенты — как правило, в первые 3–7 дней после того, как начинаете звонить по списку BeautyOS.',
  },
  {
    q: 'Подходит ли BeautyOS для небольшого салона?',
    a: 'Да, тариф Старт рассчитан на базы от 50 клиентов. Чем меньше база — тем проще работать: все клиенты на виду, и вы знаете каждого лично. BeautyOS просто напомнит, кто из них давно не приходил.',
  },
  {
    q: 'Что если я не умею работать с технологиями?',
    a: 'Весь онбординг занимает 3 шага: загрузить файл, посмотреть список, позвонить. Никакой настройки, никаких интеграций. Если возникнет вопрос — напишите в чат, ответим в течение 2 часов.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div>
      <div className="text-center mb-12">
        <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Частые вопросы</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Всё, что хотели спросить</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-card border border-parchment rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-cream/50 transition-colors"
            >
              <span className="text-sm font-semibold text-graphite pr-4">{faq.q}</span>
              <ChevronDown
                size={18}
                className={`text-dusk shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5">
                <p className="text-sm text-dusk leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
