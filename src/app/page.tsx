import Link from 'next/link'
import { Bell, Heart, Calendar, Star, ChevronRight, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream overflow-hidden">

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 md:px-12 py-6">
        <span className="text-base font-semibold tracking-tight text-graphite select-none">
          BeautyOS<sup className="text-rose text-[10px] font-bold ml-0.5 relative -top-1">+</sup>
        </span>
        <Link
          href="/role"
          className="text-sm font-medium text-dusk hover:text-rose transition-colors"
        >
          Войти
        </Link>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row min-h-screen">

        {/* Text column */}
        <div className="order-2 md:order-1 md:w-[44%] flex items-center px-7 py-10 md:px-16 md:py-0 bg-cream">
          <div className="max-w-sm w-full pt-8 md:pt-0">

            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-rose mb-7">
              AI-помощник в мире красоты
            </p>

            <h1 className="font-serif text-[2.7rem] md:text-[3.2rem] leading-[1.06] text-graphite mb-6 tracking-tight">
              Красота,<br />
              которая помнит<br />
              <span className="text-rose">о Вас</span>.
            </h1>

            <p className="text-[15px] text-dusk leading-relaxed mb-10 max-w-[285px]">
              Персональный помощник, который запоминает ваши предпочтения и заботится о вас между визитами.
            </p>

            <div className="flex flex-col gap-3.5">
              <Link
                href="/client"
                className="inline-flex items-center gap-2.5 bg-rose text-white px-8 py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity w-fit shadow-sm shadow-rose/20"
              >
                🌸 Забочусь о себе
              </Link>

              <Link
                href="/role"
                className="inline-flex items-center gap-2 border border-rose/25 text-rose/80 hover:text-rose hover:border-rose/50 px-8 py-4 rounded-full text-sm font-medium transition-colors w-fit"
              >
                ✨ Территория профи
              </Link>
            </div>

            {/* Feature icons */}
            <div className="flex gap-8 mt-12 md:mt-14">
              {[
                { icon: Calendar, label1: 'Напоминания', label2: 'о визитах' },
                { icon: Heart,    label1: 'Персональные', label2: 'рекомендации' },
                { icon: Star,     label1: 'Премиум', label2: 'сервис' },
              ].map(({ icon: Icon, label1, label2 }) => (
                <div key={label1} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center">
                    <Icon size={16} className="text-rose" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-dusk leading-tight">{label1}</p>
                    <p className="text-[11px] text-dusk leading-tight">{label2}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Image column */}
        <div
          className="order-1 md:order-2 md:w-[56%] h-[55vh] md:h-screen relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #E8C3CA 0%, #EFD4D9 30%, #F5E4E7 60%, #FAF0F2 100%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.pexels.com/photos/12088508/pexels-photo-12088508.jpeg?auto=compress&cs=tinysrgb&w=1260&h=840&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />

          {/* Left fade into text column on desktop */}
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-cream to-transparent hidden md:block" />

          {/* Floating UI cards — xl screens only */}
          <div className="absolute right-5 top-0 bottom-0 hidden xl:flex flex-col justify-center gap-3 pointer-events-none">

            {/* Notification */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-graphite/10 p-4 w-52">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 bg-rose/12 rounded-md flex items-center justify-center">
                  <Bell size={11} className="text-rose" />
                </div>
                <span className="text-[9px] font-bold text-rose uppercase tracking-widest">Напоминание</span>
              </div>
              <p className="text-[11px] text-graphite leading-relaxed">Не забудьте нанести увлажняющий крем перед выходом</p>
              <p className="text-[10px] text-dusk/60 mt-1.5">Сегодня, 09:00</p>
            </div>

            {/* Recommendation */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-graphite/10 p-4 w-52">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 bg-rose/12 rounded-md flex items-center justify-center">
                  <Heart size={11} className="text-rose" />
                </div>
                <span className="text-[9px] font-bold text-rose uppercase tracking-widest">Рекомендация</span>
              </div>
              <p className="text-[11px] text-graphite leading-relaxed">После окрашивания рекомендуем питательную маску для волос</p>
              <div className="flex items-center gap-0.5 mt-1.5">
                <span className="text-[10px] text-rose font-semibold">Подробнее</span>
                <ChevronRight size={9} className="text-rose" />
              </div>
            </div>

            {/* Next appointment */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-graphite/10 p-4 w-52">
              <p className="text-[9px] font-semibold text-dusk/70 uppercase tracking-wider mb-1.5">Ваш следующий визит</p>
              <p className="text-sm font-bold text-graphite">Маникюр</p>
              <p className="text-[11px] text-dusk mt-0.5">24 мая, 14:00</p>
              <p className="text-[10px] text-dusk/50 mt-0.5">Студия красоты Beauty Lab</p>
              <div className="flex items-center gap-0.5 mt-1.5">
                <span className="text-[10px] text-rose font-semibold">Посмотреть запись</span>
                <ChevronRight size={9} className="text-rose" />
              </div>
            </div>

            {/* Beauty Companion */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-graphite/10 p-3.5 w-52 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-rose/10 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-rose" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-graphite">Beauty Companion</p>
                <p className="text-[10px] text-dusk leading-tight mt-0.5">Всегда на связи, чтобы ваша красота сияла</p>
              </div>
              <ChevronRight size={11} className="text-rose shrink-0" />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
