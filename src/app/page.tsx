import Link from 'next/link'
import { Calendar, Heart, Star } from 'lucide-react'

const CARDS = [
  '🌸 Юлия, сегодня не забудьте масло для кутикулы.',
  '🌸 После окрашивания волосам нужна дополнительная защита.',
  '🌸 Через 5 дней лучше обновить маникюр.',
  '🌸 Ваш любимый мастер освободил окно в пятницу.',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream overflow-hidden">

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 md:px-12 py-5 md:py-6">
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

        {/* Image column — mobile: compact strip, desktop: full half */}
        <div
          className="order-1 md:order-2 md:w-[56%] h-[34vh] md:h-screen relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #D5C9BC 0%, #E2D8CC 30%, #EDE5DA 60%, #F5F0E8 100%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />

          {/* Left fade into text column on desktop */}
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-cream to-transparent hidden md:block" />

          {/* Floating companion messages — xl screens only */}
          <div className="absolute right-5 top-0 bottom-0 hidden xl:flex flex-col justify-center gap-3 pointer-events-none">
            <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-rose/60 mb-1 text-right pr-1">
              BeautyOS<sup className="text-[7px] ml-0.5">+</sup>
            </p>
            {CARDS.map((text, i) => (
              <div
                key={i}
                className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg shadow-graphite/8 px-4 py-3.5 w-56"
              >
                <p className="text-[12px] text-graphite leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Text column */}
        <div className="order-2 md:order-1 md:w-[44%] flex items-start md:items-center px-7 py-5 md:px-16 md:py-0 bg-cream">
          <div className="max-w-sm w-full pt-1 md:pt-0">

            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-rose mb-3 md:mb-7">
              Ваш спутник красоты
            </p>

            <h1 className="font-serif text-[2.2rem] md:text-[3.2rem] leading-[1.0] md:leading-[1.06] text-graphite mb-3 md:mb-6 tracking-tight">
              Красота,<br />
              которая помнит<br />
              <span className="text-rose">о Вас</span>.
            </h1>

            {/* Subtitle: short on mobile, full on desktop */}
            <p className="md:hidden text-[13px] text-dusk leading-relaxed mb-6 max-w-[285px]">
              Ваш спутник красоты: напоминает о визитах, помнит предпочтения и помогает сохранять результат.
            </p>
            <p className="hidden md:block text-[15px] text-dusk leading-relaxed mb-10 max-w-[285px]">
              Ваш спутник красоты, который заботится о Вас между визитами, помнит Ваши предпочтения и помогает сохранять результат каждый день.
            </p>

            <div className="flex flex-col gap-2.5 md:gap-3.5">
              <Link
                href="/client"
                className="inline-flex items-center gap-2.5 bg-rose text-white px-8 py-3.5 md:py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity w-fit shadow-sm shadow-rose/20"
              >
                🌸 Забочусь о себе
              </Link>

              <Link
                href="/role"
                className="inline-flex items-center gap-2 border border-rose/25 text-rose/80 hover:text-rose hover:border-rose/50 px-8 py-3.5 md:py-4 rounded-full text-sm font-medium transition-colors w-fit"
              >
                ✨ Территория профи
              </Link>
            </div>

            {/* Feature icons — desktop only */}
            <div className="hidden md:flex gap-8 mt-14">
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

      </div>
    </div>
  )
}
