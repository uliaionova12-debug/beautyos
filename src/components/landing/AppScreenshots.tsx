import { Phone, ArrowRight, Sparkles, Star, Users, Target, Megaphone } from 'lucide-react'

export function AppScreenshots() {
  return (
    <section className="py-20 px-6 bg-sage/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs text-sage font-semibold uppercase tracking-wider mb-3">Реальный интерфейс</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Так выглядит BeautyOS</h2>
          <p className="text-dusk max-w-lg mx-auto">Никаких перегруженных таблиц — только то, что важно сегодня.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* SCREEN 1: Dashboard */}
          <div>
            <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-4 ml-1">Главный дашборд</p>
            <div className="bg-cream rounded-3xl shadow-2xl shadow-graphite/10 overflow-hidden border border-parchment">
              {/* Fake browser bar */}
              <div className="bg-parchment/60 px-4 py-2.5 flex items-center gap-2 border-b border-parchment">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-terracotta/40" />
                  <div className="w-3 h-3 rounded-full bg-amber-300/60" />
                  <div className="w-3 h-3 rounded-full bg-sage/40" />
                </div>
                <div className="flex-1 bg-white/70 rounded-md mx-3 px-3 py-1 text-[10px] text-dusk/50">beautyos-bice.vercel.app/dashboard</div>
              </div>

              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-graphite">BeautyOS</p>
                    <p className="text-xs text-dusk">вторник, 10 июня · 09:14</p>
                  </div>
                  <span className="text-xs text-dusk">Сменить роль</span>
                </div>

                {/* Daily Action */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sage" />
                    <p className="text-[9px] text-sage font-semibold uppercase tracking-wider">Главное действие на сегодня</p>
                  </div>
                  <p className="text-sm font-semibold text-graphite mb-1">Позвонить 7 клиентам мастера Анны</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-600 font-bold text-sm">63 000 ₽</span>
                    <span className="text-dusk/40 text-xs">·</span>
                    <span className="text-dusk text-xs">84% вероятность</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sage text-xs font-semibold">
                    <Phone size={11} />Открыть мастера<ArrowRight size={11} />
                  </div>
                </div>

                {/* Main metric */}
                <div className="bg-blush border border-terracotta/20 rounded-xl p-4">
                  <p className="text-[9px] text-terracotta font-semibold uppercase tracking-wider mb-2">Сегодня можно вернуть</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-bold text-graphite">18</span>
                    <span className="text-base text-dusk pb-0.5">клиентов</span>
                  </div>
                  <p className="text-dusk text-xs mb-1">Потенциальная выручка</p>
                  <p className="text-lg font-bold text-emerald-600 mb-3">287 000 ₽</p>
                  <div className="w-full bg-sage text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs">
                    Вернуть клиентов <ArrowRight size={13} />
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2">
                  {[['234', 'Всего клиентов', 'bg-card'], ['12', 'Потеряно', 'bg-red-50'], ['−41 тыс', 'Ущерб', 'bg-card']].map(([v, l, bg]) => (
                    <div key={l} className={`${bg} border border-parchment rounded-xl p-3`}>
                      <p className="text-sm font-bold text-graphite">{v}</p>
                      <p className="text-[9px] text-dusk mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>

                {/* AI Director CTA */}
                <div className="flex items-center justify-between bg-sage text-white rounded-xl p-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="opacity-80" />
                    <div>
                      <p className="text-xs font-semibold">AI Директор</p>
                      <p className="text-[9px] opacity-60">Задайте любой вопрос</p>
                    </div>
                  </div>
                  <span className="text-xs opacity-70">→</span>
                </div>

                {/* Agent grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Users, label: 'Директор по\nвозврату', color: 'text-sage' },
                    { icon: Star, label: 'Директор по\nрепутации', color: 'text-amber-600' },
                    { icon: Target, label: 'Директор по\nконкурентам', color: 'text-blue-600' },
                    { icon: Megaphone, label: 'Директор по\nмаркетингу', color: 'text-violet-600' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="bg-card border border-parchment rounded-xl p-3 flex items-center gap-2">
                      <Icon size={14} className={color} />
                      <p className="text-[9px] font-medium text-graphite whitespace-pre-line leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SCREEN 2: Client list */}
          <div className="space-y-8">
            <div>
              <p className="text-xs text-dusk font-semibold uppercase tracking-wider mb-4 ml-1">Список клиентов мастера</p>
              <div className="bg-cream rounded-3xl shadow-2xl shadow-graphite/10 overflow-hidden border border-parchment">
                <div className="bg-parchment/60 px-4 py-2.5 flex items-center gap-2 border-b border-parchment">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-terracotta/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-300/60" />
                    <div className="w-3 h-3 rounded-full bg-sage/40" />
                  </div>
                  <div className="flex-1 bg-white/70 rounded-md mx-3 px-3 py-1 text-[10px] text-dusk/50">beautyos-bice.vercel.app/master</div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-graphite">Анна Семёнова</p>
                      <p className="text-xs text-dusk">7 клиентов требуют внимания</p>
                    </div>
                    <span className="text-xs bg-terracotta/10 text-terracotta font-semibold px-2.5 py-1 rounded-full">В риске</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'Марина К.', days: 45, check: '2 400 ₽', score: 87 },
                      { name: 'Ольга Т.', days: 38, check: '3 100 ₽', score: 79 },
                      { name: 'Светлана В.', days: 52, check: '1 900 ₽', score: 74 },
                      { name: 'Ирина М.', days: 41, check: '2 700 ₽', score: 68 },
                    ].map((c) => (
                      <div key={c.name} className="bg-card border border-parchment rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-graphite">{c.name}</p>
                          <p className="text-[9px] text-dusk">Нет {c.days} дн · чек {c.check}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-1.5 rounded-full bg-parchment overflow-hidden">
                            <div className="h-full bg-sage rounded-full" style={{ width: `${c.score}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-sage">{c.score}%</span>
                          <Phone size={12} className="text-sage" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-3.5">
                    <p className="text-[9px] text-violet-600 font-semibold uppercase tracking-wider mb-1">AI-скрипт для Марины К.</p>
                    <p className="text-[10px] text-dusk leading-relaxed">«Марина, добрый день! Это Анна из студии. Давно не виделись — хотела узнать, как ваши ноготки? У нас сейчас акция на гель-лак...»</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
