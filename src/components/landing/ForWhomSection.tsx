'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const BLOCKS = [
  {
    title: 'Специалисты',
    items: [
      'Мастера маникюра и педикюра',
      'Косметологи',
      'Массажисты',
      'Мастера эпиляции',
      'Бровисты и лэшмейкеры',
      'Визажисты',
      'Стилисты',
      'Парикмахеры',
    ],
  },
  {
    title: 'Форматы бизнеса',
    items: [
      'Самостоятельные мастера',
      'Студии красоты',
      'Небольшие салоны',
      'Команды мастеров',
      'Сети салонов',
    ],
  },
  {
    title: 'Если вы работаете по записи',
    text: 'BeautyOS подходит любому beauty-бизнесу, где важны повторные визиты, запись, клиентская база и возврат клиентов.',
  },
]

export function ForWhomSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="forwhom" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Аудитория</p>
          <h2 className="text-3xl md:text-4xl font-bold text-graphite">Для кого BeautyOS</h2>
        </div>
        <div className="space-y-3">
          {BLOCKS.map((block, i) => (
            <div key={block.title} className="bg-card border border-parchment rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-blush/30 transition-colors"
              >
                <span className="font-semibold text-graphite">{block.title}</span>
                <ChevronDown
                  size={18}
                  className={`text-dusk transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-6 border-t border-parchment">
                  {'items' in block && block.items ? (
                    <div className="flex flex-wrap gap-2 pt-4">
                      {block.items.map(item => (
                        <span
                          key={item}
                          className="bg-cream text-graphite text-sm px-4 py-2 rounded-full border border-parchment"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dusk leading-relaxed pt-4">{'text' in block ? block.text : ''}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
