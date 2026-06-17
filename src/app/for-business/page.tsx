export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  HeartHandshake,
  MessageSquareText,
  PenLine,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { RoiCalculator } from '@/components/landing/RoiCalculator'
import { FaqSection } from '@/components/landing/FaqSection'
import { AppScreenshots } from '@/components/landing/AppScreenshots'
import { NeuroConsultant, ConsultantTeaser } from '@/components/landing/NeuroConsultant'
import { ContactSection } from '@/components/landing/ContactSection'
import { ForWhomSection } from '@/components/landing/ForWhomSection'

/* eslint-disable @next/next/no-img-element */

const DEMO_SALON_ID = '2e908b6f-5e39-44a3-bf9b-477db21dfaa9'

const CAPABILITIES = [
  {
    icon: Users,
    title: 'Возвращает клиентов',
    text: 'Показывает, кто давно не приходил, кто в зоне риска и кому стоит написать сегодня.',
  },
  {
    icon: BarChart3,
    title: 'Показывает потери и точки роста',
    text: 'Считает финансовые потоки, пустые окна, потерянных клиентов и потенциал возврата.',
  },
  {
    icon: CheckCircle,
    title: 'Даёт конкретные действия',
    text: 'Не просто аналитика — система показывает, что сделать сегодня, чтобы вернуть деньги.',
  },
  {
    icon: PenLine,
    title: 'Пишет маркетинг',
    text: 'AI-маркетолог создаёт контент не по шаблону, а из задач бизнеса и жизни салона.',
  },
  {
    icon: HeartHandshake,
    title: 'Заботится о клиентах между визитами',
    text: 'Beauty Companion напоминает об уходе, помогает записаться и поддерживает связь с клиентом.',
  },
  {
    icon: Star,
    title: 'Помогает с отзывами',
    text: 'Собирает площадки отзывов, помогает отвечать и не терять репутацию.',
  },
]

const AI_TEAM = [
  {
    icon: Bot,
    title: 'AI Director',
    text: 'Видит финансовую картину, дефициты и приоритетные действия.',
    href: `/dashboard?salon_id=${DEMO_SALON_ID}`,
  },
  {
    icon: PenLine,
    title: 'AI Marketing Director',
    text: 'Помогает решить бизнес-задачу через контент: заполнить окна, вернуть клиентов, поднять чек.',
    href: `/marketing?salon_id=${DEMO_SALON_ID}`,
  },
  {
    icon: HeartHandshake,
    title: 'Beauty Companion',
    text: 'Личный помощник клиента между визитами: уход, запись, история процедур, отзывы.',
    href: '/beauty-companion',
  },
  {
    icon: Star,
    title: 'Reputation Director',
    text: 'Следит за отзывами, площадками и ответами.',
    href: `/reputation?salon_id=${DEMO_SALON_ID}`,
  },
  {
    icon: MessageSquareText,
    title: 'AI Consultant',
    text: 'Объясняет, где что находится в приложении и какую кнопку нажать.',
    href: '/explain',
  },
  {
    icon: CheckCircle,
    title: 'Execution Assistant',
    text: 'Превращает аналитику в конкретные шаги и готовые сообщения.',
    href: `/actions?salon_id=${DEMO_SALON_ID}`,
  },
]

const HOW_IT_WORKS = [
  {
    title: 'Загружаете данные',
    text: 'DIKIDI, CSV, Excel или ручной ввод.',
  },
  {
    title: 'Система строит карту бизнеса',
    text: 'Видно клиентов, деньги, дефициты и точки роста.',
  },
  {
    title: 'AI выбирает приоритеты',
    text: 'Что делать сегодня: кого вернуть, где закрыть окна, как увеличить чек.',
  },
  {
    title: 'Получаете готовые действия',
    text: 'Сообщения клиентам, сценарии для мастеров, контент и план.',
  },
  {
    title: 'Клиенты возвращаются в систему',
    text: 'Через персональные ссылки, Beauty Companion, запись и отзывы.',
  },
]

const CLIENT_FEATURES = [
  'видеть историю посещений',
  'получить рекомендации по уходу',
  'записаться снова',
  'оставить отзыв',
  'получать мягкие напоминания между визитами',
]

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-cream text-graphite">
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-md border-b border-parchment">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-dusk hover:text-sage transition-colors">
              <ArrowLeft size={14} />
              Назад
            </Link>
            <span className="text-base font-bold tracking-tight">BeautyOS</span>
            <span className="text-[10px] font-semibold text-sage bg-sage/10 px-2 py-0.5 rounded-full uppercase tracking-wider">AI OS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#capabilities" className="text-sm text-dusk hover:text-graphite transition-colors">Что умеет</a>
            <a href="#team" className="text-sm text-dusk hover:text-graphite transition-colors">AI-команда</a>
            <a href="#screens" className="text-sm text-dusk hover:text-graphite transition-colors">Экраны</a>
            <a href="#calculator" className="text-sm text-dusk hover:text-graphite transition-colors">Калькулятор</a>
          </nav>
          <Link href="/explain" className="bg-sage text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Войти
          </Link>
        </div>
      </header>

      <main>
        <section className="relative min-h-[calc(100svh-76px)] flex items-center pt-24 md:pt-28 pb-8 md:pb-10 px-5 md:px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/landing-screens/beauty-atmosphere-clean.png"
              alt=""
              className="absolute inset-y-0 right-0 w-full lg:w-[62%] h-full object-cover object-center opacity-25 lg:opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 to-cream/30" />
            <div className="absolute inset-0 bg-gradient-to-b from-cream via-transparent to-cream/95" />
          </div>
          <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.78fr_1.22fr] gap-8 lg:gap-12 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-blush/90 text-terracotta text-[11px] font-semibold uppercase tracking-[0.18em] px-4 py-2 rounded-full mb-5">
                <Sparkles size={14} />
                AI operating system для beauty-бизнеса
              </div>
              <h1 className="font-serif text-[2.7rem] md:text-[4.15rem] lg:text-[4.45rem] font-medium leading-[0.94] tracking-tight mb-6">
                BeautyOS для роста
                <span className="block text-rose italic">beauty-бизнеса</span>
              </h1>
              <p className="text-base md:text-lg text-dusk leading-relaxed mb-7 max-w-lg">
                AI-платформа анализирует записи, клиентов и доход, показывает точки роста
                и даёт готовые действия: кого вернуть, что написать и где теряются деньги.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/dashboard?salon_id=${DEMO_SALON_ID}`}
                  className="inline-flex items-center justify-center gap-2 bg-sage text-white px-7 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-sage/20"
                >
                  Посмотреть демо
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#forwhom"
                  className="inline-flex items-center justify-center gap-2 border border-parchment bg-card/85 text-graphite px-7 py-3.5 rounded-full text-sm font-semibold hover:border-sage/40 transition-colors"
                >
                  Для кого BeautyOS?
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-5 bg-blush/80 rounded-[2.5rem] rotate-1" />
              <div className="absolute -right-6 top-6 bottom-10 w-[74%] rounded-[2.5rem] bg-card/70 border border-white/70 shadow-2xl shadow-graphite/10" />
              <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[560px]">
                <div className="relative z-10 w-[min(76vw,420px)] lg:w-[min(38vw,430px)] h-[min(58svh,560px)] overflow-hidden rounded-[1.9rem] shadow-2xl shadow-graphite/20 border border-white/70 bg-card">
                  <img
                    src="/landing-screens/dashboard.png"
                    alt="Дашборд BeautyOS с финансовой и клиентской картой бизнеса"
                    className="w-full h-auto"
                  />
                </div>
                <img
                  src="/landing-screens/actions.png"
                  alt="BeautyOS показывает действия и точки роста"
                  className="absolute z-20 left-0 bottom-6 w-[30%] max-w-[210px] rounded-[1.35rem] shadow-2xl shadow-graphite/20 border border-white/70 hidden md:block"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 md:px-6 pb-20 bg-cream">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
            <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-parchment shadow-2xl shadow-graphite/10">
              <img
                src="/landing-screens/beauty-atmosphere-clean.png"
                alt="Мягкая эстетика BeautyOS для beauty-бизнеса"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-graphite/35 via-transparent to-cream/10" />
              <div className="absolute left-6 bottom-6 right-6 max-w-md">
                <p className="text-xs text-white/70 font-semibold uppercase tracking-[0.22em] mb-3">BeautyOS</p>
                <h2 className="font-serif text-4xl md:text-5xl font-medium leading-[0.95] text-white">
                  Красота, которая помнит о вас
                </h2>
              </div>
            </div>
            <div className="bg-card border border-parchment rounded-[2rem] p-8 md:p-10 flex flex-col justify-center">
              <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-3">Между визитами</p>
              <h2 className="text-3xl font-bold tracking-tight mb-5">Клиент чувствует заботу даже после выхода из салона</h2>
              <p className="text-dusk leading-relaxed mb-6">
                BeautyOS помогает сохранить связь: напомнить об уходе, предложить следующий визит,
                подготовить сообщение и вернуть клиента в запись без давления.
              </p>
              <div className="space-y-3">
                {['персональные рекомендации после процедуры', 'готовые сообщения для возврата клиентов', 'мягкое сопровождение до следующей записи'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={17} className="text-sage shrink-0" />
                    <span className="text-sm text-dusk">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="py-20 px-5 md:px-6 bg-card border-y border-parchment">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Система вместо разрозненных инструментов</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Что умеет BeautyOS</h2>
              <p className="text-dusk leading-relaxed">
                BeautyOS соединяет аналитику, действия, маркетинг и клиентское сопровождение в один рабочий слой для владельца и команды.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CAPABILITIES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-cream border border-parchment rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-sage/10 text-sage flex items-center justify-center mb-5">
                    <Icon size={21} />
                  </div>
                  <h3 className="font-semibold text-graphite mb-2">{title}</h3>
                  <p className="text-sm text-dusk leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-5 md:px-6 bg-blush">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 items-center">
            <div>
              <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-3">Карта бизнеса</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">Сначала видно, где теряются клиенты и деньги</h2>
              <p className="text-dusk leading-relaxed mb-6">
                После загрузки данных BeautyOS собирает финансовую и клиентскую картину: средний чек,
                активных клиентов, потери, зоны риска и потенциал возврата.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['клиенты', 'активные, в риске, потерянные'],
                  ['деньги', 'потоки, ущерб, потенциал'],
                  ['окна', 'свободные слоты и расписание'],
                  ['рост', 'приоритеты на сегодня'],
                ].map(([title, text]) => (
                  <div key={title} className="bg-card border border-parchment rounded-2xl p-4">
                    <p className="text-sm font-semibold text-graphite mb-1">{title}</p>
                    <p className="text-xs text-dusk leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-parchment rounded-[2rem] p-4 md:p-6 shadow-xl shadow-graphite/10">
              <img
                src="/landing-screens/dashboard.png"
                alt="Финансовая и клиентская карта BeautyOS"
                className="w-full max-w-sm mx-auto rounded-[1.75rem] shadow-xl shadow-graphite/10"
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-5 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">От данных к действию</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Как работает BeautyOS</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {HOW_IT_WORKS.map((step, index) => (
                <div key={step.title} className="bg-card border border-parchment rounded-2xl p-5">
                  <p className="text-4xl font-bold text-parchment mb-4">{index + 1}</p>
                  <h3 className="font-semibold text-graphite mb-2">{step.title}</h3>
                  <p className="text-sm text-dusk leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="py-20 px-5 md:px-6 bg-card border-y border-parchment">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">AI-команда внутри бизнеса</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">В вашем салоне появляется команда AI-помощников</h2>
              <p className="text-dusk leading-relaxed">
                Каждый помощник отвечает за свою часть работы: деньги, клиентов, контент, репутацию, сопровождение и выполнение.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {AI_TEAM.map(({ icon: Icon, title, text, href }) => (
                <Link key={title} href={href} className="group bg-cream border border-parchment rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-blush text-terracotta flex items-center justify-center mb-5">
                    <Icon size={21} />
                  </div>
                  <h3 className="font-semibold text-graphite mb-2">{title}</h3>
                  <p className="text-sm text-dusk leading-relaxed mb-5">{text}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage group-hover:gap-2 transition-all">
                    Посмотреть <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-5 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-3">Не ещё одна база клиентов</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">BeautyOS — это не CRM</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-card border border-parchment rounded-3xl p-8">
                <h3 className="text-xl font-semibold mb-6">CRM</h3>
                {['хранит клиентов', 'показывает записи', 'ведёт календарь', 'фиксирует историю'].map(item => (
                  <div key={item} className="flex items-center gap-3 py-3 border-b border-parchment last:border-0">
                    <div className="w-2 h-2 rounded-full bg-dusk/30" />
                    <span className="text-dusk">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-sage text-white rounded-3xl p-8 shadow-xl shadow-sage/20">
                <h3 className="text-xl font-semibold mb-6">BeautyOS</h3>
                {[
                  'анализирует, где теряются деньги',
                  'подсказывает, что делать',
                  'помогает вернуть клиентов',
                  'пишет тексты и контент',
                  'сопровождает клиентов между визитами',
                  'работает как AI-команда внутри бизнеса',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 py-3 border-b border-white/15 last:border-0">
                    <CheckCircle size={16} className="shrink-0" />
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ForWhomSection />

        <section className="py-20 px-5 md:px-6 bg-blush border-y border-parchment">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
            <div>
              <p className="text-xs text-terracotta font-semibold uppercase tracking-wider mb-3">Beauty Companion</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">Клиенты тоже получают свой личный кабинет</h2>
              <p className="text-dusk leading-relaxed mb-6">
                Салон отправляет персональную ссылку, и клиент попадает в Beauty Companion.
                Там сохраняется связь между визитами, где часто и теряется повторная запись.
              </p>
              <div className="space-y-3">
                {CLIENT_FEATURES.map(feature => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle size={17} className="text-sage shrink-0" />
                    <span className="text-dusk">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <img
                src="/landing-screens/client-companion.png"
                alt="Клиентский экран Beauty Companion"
                className="w-full rounded-[1.75rem] shadow-2xl shadow-graphite/15 border border-white/70"
              />
              <img
                src="/landing-screens/companion-profile.png"
                alt="Профиль Beauty Companion с рекомендациями по уходу"
                className="w-full rounded-[1.75rem] shadow-2xl shadow-graphite/15 border border-white/70 mt-10"
              />
            </div>
          </div>
        </section>

        <AppScreenshots />

        <section id="calculator" className="py-20 px-5 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4">
              <p className="text-sm text-dusk">Посчитайте, сколько денег теряется прямо сейчас — и сколько можно вернуть</p>
            </div>
            <RoiCalculator />
          </div>
        </section>

        <ContactSection />

        <section className="py-20 px-5 md:px-6 bg-cream">
          <div className="max-w-6xl mx-auto">
            <FaqSection />
            <ConsultantTeaser />
          </div>
        </section>

        <section className="py-24 px-5 md:px-6 bg-graphite text-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield size={16} className="opacity-60" />
              <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">Начните с карты бизнеса</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Загрузите данные и посмотрите, где сейчас теряются клиенты, деньги и возможности роста
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/dashboard?salon_id=${DEMO_SALON_ID}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-sage px-8 py-4 rounded-xl text-base font-semibold hover:opacity-95 transition-opacity"
              >
                Посмотреть демо BeautyOS
                <ArrowRight size={18} />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-medium border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Связаться
              </a>
            </div>
          </div>
        </section>
      </main>

      <NeuroConsultant />

      <footer className="py-10 px-5 md:px-6 border-t border-parchment bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <span className="text-sm font-bold text-graphite">BeautyOS</span>
            <div className="flex flex-wrap gap-6">
              <Link href="/pricing" className="text-xs text-dusk hover:text-graphite transition-colors">Тарифы</Link>
              <Link href="/explain" className="text-xs text-dusk hover:text-graphite transition-colors">Войти</Link>
              <Link href="/join/salon" className="text-xs text-dusk hover:text-graphite transition-colors">Регистрация</Link>
              <a href="https://t.me/beautyos_ai" target="_blank" rel="noopener noreferrer" className="text-xs text-dusk hover:text-graphite transition-colors">
                Telegram
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-5 border-t border-parchment">
            <p className="text-xs text-dusk/50">© 2025 BeautyOS. AI-платформа для beauty-бизнеса.</p>
            <div className="flex gap-5">
              <Link href="/privacy" className="text-xs text-dusk/50 hover:text-dusk transition-colors">Политика обработки данных</Link>
              <a href="mailto:hello@beautyos.ai" className="text-xs text-dusk/50 hover:text-dusk transition-colors">hello@beautyos.ai</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
