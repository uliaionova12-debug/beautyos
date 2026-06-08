import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream overflow-hidden">

      {/* Floating header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 md:px-12 py-6">
        <span className="text-base font-semibold tracking-tight text-graphite select-none">
          BeautyOS
        </span>
        <Link
          href="/role"
          className="text-sm font-medium text-dusk hover:text-sage transition-colors"
        >
          Войти
        </Link>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row min-h-screen">

        {/* Text column — below image on mobile, left on desktop */}
        <div className="order-2 md:order-1 md:w-[42%] flex items-center px-7 py-10 md:px-16 md:py-0 bg-cream">
          <div className="max-w-sm w-full pt-6 md:pt-0">

            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-terracotta mb-7">
              AI-помощник в мире красоты
            </p>

            <h1 className="text-[2.5rem] md:text-[3rem] font-light leading-[1.1] text-graphite mb-6 tracking-tight">
              Красота,<br />
              которая помнит<br />
              <em className="not-italic font-semibold">о Вас.</em>
            </h1>

            <p className="text-[15px] text-dusk leading-relaxed mb-10 max-w-[280px]">
              Персональный помощник, который запоминает ваши предпочтения и напоминает о визитах.
            </p>

            <div className="flex flex-col gap-4">
              <Link
                href="/client"
                className="inline-flex items-center gap-2.5 bg-sage text-white px-8 py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity w-fit"
              >
                🌸 Забочусь о себе
              </Link>

              <Link
                href="/role"
                className="text-sm font-medium text-dusk hover:text-terracotta transition-colors"
              >
                Beauty Pro →
              </Link>
            </div>

          </div>
        </div>

        {/* Image column — top on mobile, right on desktop */}
        <div
          className="order-1 md:order-2 md:w-[58%] h-[52vh] md:h-screen relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #DCCAB8 0%, #E9D9CC 30%, #EFE2D8 60%, #F5EDE8 100%)' }}
        >
          {/* Photo — gradient shows as fallback */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          {/* Left-side fade on desktop to blend into text column */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-cream to-transparent hidden md:block" />
        </div>

      </div>
    </div>
  )
}
