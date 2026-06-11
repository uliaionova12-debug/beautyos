import Link from 'next/link'
import { ArrowRight, Users, Star, Target, Megaphone, Sparkles, CheckCircle, BarChart3, Phone, Shield } from 'lucide-react'

const DIRECTORS = [
  {
    icon: Users,
    color: 'bg-sage/10 text-sage',
    title: 'Директор по возврату',
    desc: 'Определяет клиентов в зоне риска, считает потенциальную выручку и даёт конкретные имена — кому позвонить сегодня.',
  },
  {
    icon: Star,
    color: 'bg-amber-50 text-amber-600',
    title: 'Директор по репутации',
    desc: 'Мониторит отзывы на всех площадках, генерирует AI-ответы и отслеживает динамику рейтинга.',
  },
  {
    icon: Target,
    color: 'bg-blue-50 text-blue-600',
    title: 'Директор по конкурентам',
    desc: 'Анализирует ценовую политику, акции и слабые места конкурентов в вашем районе.',
  },
  {
    icon: Megaphone,
    color: 'bg-violet-50 text-violet-600',
    title: 'Директор по маркетингу',
    desc: 'Генерирует контент-план, идеи акций и офферы под сезон — всё готово к публикации.',
  },
]

const STATS = [
  { value: '38%', label: 'клиентов теряют салоны каждый год' },
  { value: '×4', label: 'дороже привлечь нового, чем вернуть старого' },
  { value: '2 мин', label: 'до первых AI-инсайтов после загрузки' },
]

const STEPS = [
  { num: '01', title: 'Загружаете данные', desc: 'CSV из вашей CRM или кассовой системы — DIKIDI, 1С, Excel' },
  { num: '02', title: 'AI анализирует базу', desc: 'Определяет статус каждого клиента, считает риски и потенциал' },
  { num: '03', title: 'Действуете сегодня', desc: 'Дашборд показывает главное: кому звонить, что отвечать, как расти' },
]

const FEATURES = [
  'Загрузка CSV из любой CRM за 2 минуты',
  'AI-скрипты для возврата каждого клиента',
  'Финансовый прогноз по каждому мастеру',
  'Тренд возвратности за весь период работы',
  'Мобильная версия — работает с телефона',
  'Безопасно: данные хранятся в вашем контуре',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-graphite">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-md border-b border-parchment">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-graphite">BeautyOS</span>
            <span className="text-[10px] font-semibold text-sage bg-sage/10 px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-sm text-dusk hover:text-graphite transition-colors">Как работает</a>
            <a href="#directors" className="text-sm text-dusk hover:text-graphite transition-colors">AI директора</a>
            <Link href="/pricing" className="text-sm text-dusk hover:text-graphite transition-colors">Тарифы</Link>
          </nav>
          <Link
            href="/role"
            className="bg-sage text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Войти в систему
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
              <span className="text-xs text-sage font-semibold uppercase tracking-wider">AI-платформа для салонов красоты</span>
            </div>

            <h1 className="text-[3rem] md:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-6">
              Ваши клиенты<br />
              уходят.<br />
              <span className="text-sage">AI их возвращает.</span>
            </h1>

            <p className="text-lg md:text-xl text-dusk leading-relaxed mb-10 max-w-xl">
              BeautyOS анализирует вашу клиентскую базу, находит тех, кто вот-вот уйдёт,
              и говорит конкретно: кому позвонить сегодня, что сказать и сколько денег вы вернёте.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/join/salon"
                className="inline-flex items-center justify-center gap-2 bg-sage text-white px-8 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-sage/20"
              >
                Загрузить базу бесплатно
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/role"
                className="inline-flex items-center justify-center gap-2 border border-parchment text-dusk px-8 py-4 rounded-xl text-base font-medium hover:border-sage hover:text-sage transition-colors"
              >
                <Sparkles size={16} />
                Посмотреть демо
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 px-6 border-y border-parchment bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STATS.map(s => (
              <div key={s.value} className="text-center md:text-left">
                <p className="text-4xl font-bold text-graphite mb-2">{s.value}</p>
                <p className="text-sm text-dusk leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Просто и быстро</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Три шага до первых результатов</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.num} className="bg-card border border-parchment rounded-2xl p-8">
                <p className="text-4xl font-bold text-parchment mb-4">{step.num}</p>
                <h3 className="text-lg font-semibold text-graphite mb-2">{step.title}</h3>
                <p className="text-sm text-dusk leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW BLOCK */}
      <section className="py-16 px-6 bg-sage/5">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-parchment rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Главное действие на сегодня</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Дашборд говорит прямо</h2>
                <p className="text-dusk leading-relaxed mb-6">
                  Никаких таблиц с сотнями строк. Каждое утро BeautyOS говорит:
                  «Позвони 5 клиентам мастера Анны — вернёшь 45 000 ₽».
                </p>
                <div className="flex flex-col gap-3">
                  {['Конкретные имена и телефоны', 'Персональный скрипт для каждого', 'Прогноз выручки с точностью до рубля'].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-sage shrink-0" />
                      <span className="text-sm text-dusk">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini dashboard mockup */}
              <div className="bg-cream rounded-2xl p-6 border border-parchment">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                  <p className="text-[10px] text-sage font-semibold uppercase tracking-wider">Главное действие</p>
                </div>
                <p className="text-base font-semibold text-graphite mb-1">
                  Позвонить 7 клиентам мастера Анны
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-emerald-600 font-bold text-lg">63 000 ₽</span>
                  <span className="text-dusk text-sm">· 84% вероятность</span>
                </div>
                <div className="flex items-center gap-2 text-sage text-sm font-semibold">
                  <Phone size={13} />
                  Открыть мастера
                  <ArrowRight size={13} />
                </div>

                <div className="mt-5 pt-4 border-t border-parchment grid grid-cols-3 gap-3">
                  {([['234', 'клиента'], ['18', 'в риске'], ['−89 т ₽', 'ущерб']] as const).map(([v, l]) => (
                    <div key={l}>
                      <p className="text-sm font-bold text-graphite">{v}</p>
                      <p className="text-[10px] text-dusk">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI DIRECTORS */}
      <section id="directors" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Команда AI</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Четыре AI-директора</h2>
            <p className="text-dusk max-w-lg mx-auto">
              Каждый специализируется на своём направлении и работает 24/7 без выходных и совещаний.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DIRECTORS.map(d => (
              <div key={d.title} className="bg-card border border-parchment rounded-2xl p-7 hover:shadow-md hover:shadow-graphite/5 transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${d.color}`}>
                  <d.icon size={22} />
                </div>
                <h3 className="text-base font-semibold text-graphite mb-2">{d.title}</h3>
                <p className="text-sm text-dusk leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/role"
              className="inline-flex items-center gap-2 bg-sage text-white px-8 py-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles size={16} />
              Попробовать AI директора
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES LIST */}
      <section className="py-16 px-6 bg-card border-y border-parchment">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Всё включено</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Без лишнего</h2>
              <p className="text-dusk">Только то, что реально влияет на деньги.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-sage shrink-0" />
                  <span className="text-sm text-dusk">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RETENTION TREND SHOWCASE */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Mini trend chart mockup */}
            <div className="bg-card border border-parchment rounded-2xl p-7">
              <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-1">Тренд возвратности</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-graphite">68%</span>
                <span className="text-sm font-semibold text-emerald-600">+6% к прошлому</span>
              </div>
              <svg viewBox="0 0 280 80" className="w-full mb-3" style={{ height: 80 }}>
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3A5C32" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3A5C32" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 65 L 40 60 L 80 55 L 120 50 L 160 45 L 200 38 L 240 30 L 280 20 L 280 80 L 0 80 Z" fill="url(#heroGrad)" />
                <path d="M 0 65 L 40 60 L 80 55 L 120 50 L 160 45 L 200 38 L 240 30 L 280 20" fill="none" stroke="#3A5C32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {([0, 40, 80, 120, 160, 200, 240, 280] as const).map((x, i) => {
                  const ys = [65, 60, 55, 50, 45, 38, 30, 20]
                  return <circle key={x} cx={x} cy={ys[i]} r="3" fill="#3A5C32" />
                })}
              </svg>
              <div className="flex justify-between">
                <span className="text-xs text-dusk/50">Янв</span>
                <span className="text-xs text-dusk/50">Авг</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Измеримый рост</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Видите динамику,<br />а не цифры</h2>
              <p className="text-dusk leading-relaxed mb-6">
                После каждой загрузки данных BeautyOS строит тренд.
                Вы видите — возвратность растёт или падает, и когда именно что изменилось.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
                  <BarChart3 size={18} className="text-sage" />
                </div>
                <p className="text-sm text-dusk">История всех загрузок — в одном графике</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-sage rounded-3xl p-12 text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield size={16} className="opacity-70" />
              <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Бесплатно для старта</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Загрузите базу<br />и увидите результат<br />через 2 минуты
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Никаких переговоров и демо-звонков. Просто CSV — и вы уже знаете,
              сколько денег можно вернуть этой неделей.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/join/salon"
                className="inline-flex items-center justify-center gap-2 bg-white text-sage px-8 py-4 rounded-xl text-base font-semibold hover:opacity-95 transition-opacity"
              >
                Начать бесплатно
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-medium border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Посмотреть тарифы
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-parchment">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-graphite">BeautyOS</span>
          <div className="flex gap-6">
            <Link href="/pricing" className="text-xs text-dusk hover:text-graphite transition-colors">Тарифы</Link>
            <Link href="/role" className="text-xs text-dusk hover:text-graphite transition-colors">Войти</Link>
            <Link href="/join/salon" className="text-xs text-dusk hover:text-graphite transition-colors">Регистрация</Link>
          </div>
          <p className="text-xs text-dusk/50">© 2025 BeautyOS. AI для салонов красоты.</p>
        </div>
      </footer>

    </div>
  )
}
