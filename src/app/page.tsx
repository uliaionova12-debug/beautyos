import Link from 'next/link'
import { ArrowRight, Users, Star, Target, Megaphone, Sparkles, CheckCircle, Phone, Shield, Quote } from 'lucide-react'
import { RoiCalculator } from '@/components/landing/RoiCalculator'
import { FaqSection } from '@/components/landing/FaqSection'
import { AppScreenshots } from '@/components/landing/AppScreenshots'
import { NeuroConsultant, ConsultantTeaser } from '@/components/landing/NeuroConsultant'
import { ContactSection } from '@/components/landing/ContactSection'

/* eslint-disable @next/next/no-img-element */

const DEMO_SALON_ID = '2e908b6f-5e39-44a3-bf9b-477db21dfaa9'

const DIRECTORS = [
  {
    icon: Users, color: 'bg-sage/10 text-sage',
    title: 'Директор по возврату',
    desc: 'Определяет клиентов в зоне риска, считает потенциальную выручку и даёт список — кому позвонить сегодня.',
    href: '/retention',
  },
  {
    icon: Star, color: 'bg-amber-50 text-amber-600',
    title: 'Директор по репутации',
    desc: 'Мониторит отзывы, генерирует AI-ответы и отслеживает динамику рейтинга на всех площадках.',
    href: '/reputation',
  },
  {
    icon: Target, color: 'bg-blue-50 text-blue-600',
    title: 'Директор по конкурентам',
    desc: 'Анализирует ценовую политику, акции и слабые места конкурентов в вашем районе.',
    href: '/competitors',
  },
  {
    icon: Megaphone, color: 'bg-violet-50 text-violet-600',
    title: 'Директор по маркетингу',
    desc: 'Генерирует контент-план, идеи акций и офферы под сезон — готовые к публикации.',
    href: '/marketing',
  },
]

const TESTIMONIALS = [
  {
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Ольга Смирнова',
    role: 'Владелец салона «Олива», Москва',
    text: 'Загрузила базу в пятницу. В понедельник позвонила 8 клиентам по списку — вернулись 5. За неделю +64 000 ₽. Я просто не верила, что это так просто.',
    result: '+64 000 ₽ за неделю',
  },
  {
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Наталья Козлова',
    role: 'Сеть студий «Лаванда», Санкт-Петербург',
    text: 'У нас 3 точки и 9 мастеров. BeautyOS сразу показал, что у одного мастера возвратность 38% — мы бы никогда не увидели это в таблицах. Теперь знаем, с кем работать.',
    result: 'Нашли узкое место за 2 минуты',
  },
  {
    photo: 'https://randomuser.me/api/portraits/women/83.jpg',
    name: 'Марина Волкова',
    role: 'Студия маникюра Nails Pro, Краснодар',
    text: 'Думала, что теряю клиентов из-за цен. Оказалось — просто никто им не звонил между визитами. Смешно и грустно. Теперь звоним — и всё изменилось.',
    result: 'Возвратность выросла с 52% до 71%',
  },
]

const CASES = [
  {
    salon: 'Студия «Эстет»',
    city: 'Москва · 4 мастера',
    before: '48%',
    after: '73%',
    revenue: '+187 000 ₽',
    period: 'за 1 месяц',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80&auto=format&fit=crop',
  },
  {
    salon: 'Beauty Room',
    city: 'Санкт-Петербург · 2 мастера',
    before: '41%',
    after: '68%',
    revenue: '+94 000 ₽',
    period: 'за 3 недели',
    img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80&auto=format&fit=crop',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-graphite">

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-md border-b border-parchment">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">BeautyOS</span>
            <span className="text-[10px] font-semibold text-sage bg-sage/10 px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#cases" className="text-sm text-dusk hover:text-graphite transition-colors">Кейсы</a>
            <a href="#directors" className="text-sm text-dusk hover:text-graphite transition-colors">AI директора</a>
            <a href="#calculator" className="text-sm text-dusk hover:text-graphite transition-colors">Калькулятор</a>
            <Link href="/pricing" className="text-sm text-dusk hover:text-graphite transition-colors">Тарифы</Link>
          </nav>
          <Link href="/role" className="bg-sage text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Войти
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="min-h-screen flex flex-col md:flex-row pt-16">
        {/* Text */}
        <div className="flex-1 flex items-center px-8 md:px-16 py-16 md:py-0 bg-cream order-2 md:order-1">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
              <span className="text-xs text-sage font-semibold uppercase tracking-wider">AI-платформа для салонов красоты</span>
            </div>
            <h1 className="text-[2.8rem] md:text-[3.8rem] font-bold leading-[1.05] tracking-tight mb-6">
              Ваши клиенты<br />уходят.<br />
              <span className="text-sage">AI их возвращает.</span>
            </h1>
            <p className="text-lg text-dusk leading-relaxed mb-8 max-w-md">
              BeautyOS анализирует клиентскую базу и каждое утро говорит конкретно:
              кому позвонить, что сказать и сколько денег вы вернёте сегодня.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/join/salon"
                className="inline-flex items-center justify-center gap-2 bg-sage text-white px-8 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-sage/20">
                Загрузить базу бесплатно
                <ArrowRight size={18} />
              </Link>
              <Link href={`/dashboard?salon_id=${DEMO_SALON_ID}`}
                className="inline-flex items-center justify-center gap-2 border-2 border-sage text-sage px-8 py-4 rounded-xl text-base font-semibold hover:bg-sage hover:text-white transition-colors">
                <Sparkles size={16} />
                Открыть демо-дашборд
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {['44', '68', '83', '32'].map(n => (
                  <img key={n} src={`https://randomuser.me/api/portraits/women/${n}.jpg`} alt=""
                    className="w-9 h-9 rounded-full border-2 border-cream object-cover" />
                ))}
              </div>
              <p className="text-sm text-dusk"><span className="font-semibold text-graphite">50+ салонов</span> уже используют BeautyOS</p>
            </div>
          </div>
        </div>

        {/* Photo */}
        <div className="md:w-[48%] h-64 md:h-auto relative order-1 md:order-2 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&q=85&auto=format&fit=crop"
            alt="Мастер в салоне красоты"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-transparent to-transparent md:block hidden" />
          {/* Floating metric */}
          <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl px-5 py-4 hidden md:block">
            <p className="text-xs text-dusk mb-1">Возвратность этой недели</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-graphite">71%</span>
              <span className="text-sm font-semibold text-emerald-600">↑ +6%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-14 px-6 bg-graphite text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {[
            { value: '38%', label: 'клиентов уходят из салона каждый год' },
            { value: '×4', label: 'дороже привлечь нового, чем вернуть старого' },
            { value: '2 мин', label: 'до первых AI-инсайтов после загрузки базы' },
          ].map(s => (
            <div key={s.value}>
              <p className="text-5xl font-bold mb-2">{s.value}</p>
              <p className="text-white/60 text-sm leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Просто и быстро</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Три шага до первых денег</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01', bg: 'bg-blush', emoji: '📂',
                title: 'Загружаете данные',
                desc: 'CSV из DIKIDI, YClients или Excel — 2 минуты, никаких технических знаний',
                detail: 'Поддерживаем форматы всех популярных CRM в России',
              },
              {
                num: '02', bg: 'bg-violet-50', emoji: '✦',
                title: 'AI анализирует базу',
                desc: 'Каждый клиент получает статус: активный, в риске или потерянный',
                detail: 'Расчёт по интервалам визитов, среднему чеку и поведенческим паттернам',
              },
              {
                num: '03', bg: 'bg-sage/10', emoji: '📞',
                title: 'Звоните и зарабатываете',
                desc: 'Список готов, скрипты готовы, прогноз выручки — перед вами',
                detail: 'Персональный AI-скрипт для каждого клиента по имени',
              },
            ].map(step => (
              <div key={step.num} className="bg-card border border-parchment rounded-2xl overflow-hidden">
                <div className={`${step.bg} h-40 flex items-center justify-center`}>
                  <span className="text-6xl">{step.emoji}</span>
                </div>
                <div className="p-6">
                  <p className="text-4xl font-bold text-parchment mb-3">{step.num}</p>
                  <h3 className="text-base font-semibold text-graphite mb-2">{step.title}</h3>
                  <p className="text-sm text-dusk leading-relaxed mb-3">{step.desc}</p>
                  <p className="text-xs text-dusk/60 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP SCREENSHOTS ─── */}
      <AppScreenshots />

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="py-16 px-6 bg-sage/5">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-parchment rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Photo */}
              <div className="relative h-64 md:h-auto min-h-[320px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&auto=format&fit=crop"
                  alt="Владелец салона за работой с данными"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 hidden md:block" />
              </div>
              {/* Text */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Главное действие на сегодня</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Дашборд говорит прямо</h2>
                <p className="text-dusk leading-relaxed mb-6">
                  Никаких таблиц. Каждое утро BeautyOS говорит:
                  «Позвони 5 клиентам мастера Анны — вернёшь 45 000 ₽».
                </p>
                {[
                  'Конкретные имена и номера телефонов',
                  'Персональный скрипт для каждого клиента',
                  'Прогноз выручки с точностью до рубля',
                  'История визитов и предпочтений',
                ].map(f => (
                  <div key={f} className="flex items-center gap-3 mb-3">
                    <CheckCircle size={16} className="text-sage shrink-0" />
                    <span className="text-sm text-dusk">{f}</span>
                  </div>
                ))}
                {/* Mini mockup */}
                <div className="mt-6 bg-cream rounded-2xl p-5 border border-parchment">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                    <p className="text-[10px] text-sage font-semibold uppercase tracking-wider">Главное действие</p>
                  </div>
                  <p className="text-sm font-semibold text-graphite mb-1">Позвонить 7 клиентам мастера Анны</p>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">63 000 ₽</span>
                    <span className="text-dusk text-xs">· 84% вероятность</span>
                  </div>
                  <div className="flex items-center gap-2 text-sage text-xs font-semibold mt-3">
                    <Phone size={11} />Открыть мастера<ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CASES ─── */}
      <section id="cases" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Реальные результаты</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Что получают салоны</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {CASES.map(c => (
              <div key={c.salon} className="bg-card border border-parchment rounded-2xl overflow-hidden">
                <div className="h-48 overflow-hidden relative">
                  <img src={c.img} alt={c.salon} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 text-white">
                    <p className="font-semibold">{c.salon}</p>
                    <p className="text-xs opacity-70">{c.city}</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div>
                      <p className="text-xs text-dusk mb-1">Было</p>
                      <p className="text-xl font-bold text-terracotta">{c.before}</p>
                      <p className="text-xs text-dusk">возвратность</p>
                    </div>
                    <div>
                      <p className="text-xs text-dusk mb-1">Стало</p>
                      <p className="text-xl font-bold text-sage">{c.after}</p>
                      <p className="text-xs text-dusk">возвратность</p>
                    </div>
                    <div>
                      <p className="text-xs text-dusk mb-1">Доход</p>
                      <p className="text-xl font-bold text-emerald-600">{c.revenue}</p>
                      <p className="text-xs text-dusk">{c.period}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── TESTIMONIALS ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-card border border-parchment rounded-2xl p-7">
                <Quote size={24} className="text-sage/30 mb-4" />
                <p className="text-sm text-dusk leading-relaxed mb-6">«{t.text}»</p>
                <div className="border-t border-parchment pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={t.photo} alt={t.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-parchment" />
                    <div>
                      <p className="text-sm font-semibold text-graphite">{t.name}</p>
                      <p className="text-xs text-dusk">{t.role}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <p className="text-xs font-semibold text-emerald-700">{t.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI DIRECTORS ─── */}
      <section id="directors" className="py-20 px-6 bg-card border-y border-parchment">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Команда AI</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Четыре AI-директора</h2>
            <p className="text-dusk max-w-lg mx-auto">Каждый специализируется на своём направлении и работает 24/7.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {DIRECTORS.map(d => (
              <div key={d.title} className="bg-cream border border-parchment rounded-2xl p-7 hover:shadow-md transition-shadow flex flex-col">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${d.color}`}>
                  <d.icon size={22} />
                </div>
                <h3 className="text-base font-semibold text-graphite mb-2">{d.title}</h3>
                <p className="text-sm text-dusk leading-relaxed mb-5 flex-1">{d.desc}</p>
                <Link
                  href={`${d.href}?salon_id=${DEMO_SALON_ID}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage hover:opacity-70 transition-opacity"
                >
                  Посмотреть в деле <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/role"
              className="inline-flex items-center gap-2 bg-sage text-white px-8 py-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              <Sparkles size={16} />Попробовать AI директора
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ─── */}
      <section id="calculator" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <RoiCalculator />
        </div>
      </section>

      {/* ─── КОНТАКТ ─── */}
      <ContactSection />

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <FaqSection />
          <ConsultantTeaser />
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-graphite/80" />
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield size={16} className="opacity-60" />
            <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">Бесплатно для старта</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Загрузите базу и увидите<br />результат через 2 минуты
          </h2>
          <p className="text-white/70 mb-10 text-lg max-w-xl mx-auto">
            Никаких переговоров. Просто CSV — и вы уже знаете,
            сколько денег можно вернуть этой неделей.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join/salon"
              className="inline-flex items-center justify-center gap-2 bg-white text-sage px-8 py-4 rounded-xl text-base font-semibold hover:opacity-95 transition-opacity">
              Начать бесплатно
              <ArrowRight size={18} />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-medium border border-white/30 text-white hover:bg-white/10 transition-colors">
              Посмотреть тарифы
            </Link>
          </div>
        </div>
      </section>

      {/* ─── НЕЙРОКОНСУЛЬТАНТ (плавающая кнопка + чат) ─── */}
      <NeuroConsultant />

      {/* ─── FOOTER ─── */}
      <footer className="py-10 px-6 border-t border-parchment bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <span className="text-sm font-bold text-graphite">BeautyOS</span>
            <div className="flex flex-wrap gap-6">
              <Link href="/pricing" className="text-xs text-dusk hover:text-graphite transition-colors">Тарифы</Link>
              <Link href="/role" className="text-xs text-dusk hover:text-graphite transition-colors">Войти</Link>
              <Link href="/join/salon" className="text-xs text-dusk hover:text-graphite transition-colors">Регистрация</Link>
              <a href="https://t.me/beautyos_ai" target="_blank" rel="noopener noreferrer"
                className="text-xs text-dusk hover:text-graphite transition-colors">Telegram</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-5 border-t border-parchment">
            <p className="text-xs text-dusk/50">© 2025 BeautyOS. AI для салонов красоты.</p>
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
