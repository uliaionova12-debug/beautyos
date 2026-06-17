/* eslint-disable @next/next/no-img-element */

const SCREENS = [
  {
    title: 'Карта бизнеса',
    caption: 'Видно доход, клиентов, потери и потенциал роста.',
    src: '/landing-screens/dashboard.png',
  },
  {
    title: 'Приоритетные действия',
    caption: 'Система показывает, что стоит сделать сегодня.',
    src: '/landing-screens/actions.png',
  },
  {
    title: 'Пошаговое выполнение',
    caption: 'Готовые шаги, тексты и ожидаемый финансовый эффект.',
    src: '/landing-screens/execution.png',
  },
  {
    title: 'AI-маркетолог',
    caption: 'Контент создаётся из бизнес-задачи, а не из пустого шаблона.',
    src: '/landing-screens/marketing-tasks.png',
  },
  {
    title: 'Канал и формат',
    caption: 'BeautyOS адаптирует площадку, формат и визуал под задачу.',
    src: '/landing-screens/marketing-platform.png',
  },
  {
    title: 'Генерация визуала',
    caption: 'Можно создать визуал AI, выбрать фото или снять материал.',
    src: '/landing-screens/visual-generator.png',
  },
  {
    title: 'Beauty Companion',
    caption: 'Клиент получает персональный уход и связь между визитами.',
    src: '/landing-screens/client-companion.png',
  },
  {
    title: 'Кабинет клиента',
    caption: 'Персональная ссылка для истории, рекомендаций и записи.',
    src: '/landing-screens/client-cabinet.png',
  },
]

export function AppScreenshots() {
  return (
    <section id="screens" className="py-20 px-5 md:px-6 bg-sage/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Реальный продукт</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Посмотрите, как это выглядит внутри</h2>
          <p className="text-dusk max-w-xl mx-auto">
            Без абстрактных AI-мокапов: только экраны, которые уже есть в BeautyOS.
          </p>
        </div>

        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 -mx-5 px-5 md:mx-0 md:px-0">
          {SCREENS.map(screen => (
            <article
              key={screen.title}
              className="snap-start shrink-0 w-[78vw] sm:w-[330px] bg-card border border-parchment rounded-3xl p-4 shadow-xl shadow-graphite/5"
            >
              <div className="bg-cream rounded-[1.75rem] p-3 mb-5">
                <img
                  src={screen.src}
                  alt={screen.title}
                  className="w-full rounded-[1.35rem] shadow-lg shadow-graphite/10"
                />
              </div>
              <h3 className="font-semibold text-graphite mb-2">{screen.title}</h3>
              <p className="text-sm text-dusk leading-relaxed">{screen.caption}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
