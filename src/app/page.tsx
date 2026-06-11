'use client'

import Link from 'next/link'
import { Calendar, Heart, Star, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as Navigator & { standalone?: boolean }).standalone
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (isIOS) { setShowIOSHint(true); return }
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
  }

  const showInstallBtn = !installed && (isIOS || !!installPrompt)

  return (
    <div className="h-screen bg-cream overflow-hidden relative">

      {/* Full-screen hero image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
      />

      {/* Gradient overlay — bottom fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/70 to-transparent" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 py-6">
        <span className="text-base font-semibold tracking-tight text-graphite select-none">
          BeautyOS<sup className="text-rose text-[10px] font-bold ml-0.5 relative -top-1">+</sup>
        </span>
        <div className="flex items-center gap-3">
          {showInstallBtn && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 text-xs font-medium text-rose border border-rose/30 px-3 py-1.5 rounded-full hover:bg-rose/5 transition-colors"
            >
              <Plus size={12} />
              На экран
            </button>
          )}
          <Link href="/role" className="text-sm font-medium text-dusk hover:text-rose transition-colors">
            Войти
          </Link>
        </div>
      </header>

      {/* iOS install hint */}
      {showIOSHint && (
        <div className="absolute bottom-36 left-4 right-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4">
          <p className="text-sm text-graphite font-medium mb-1">Добавить на экран «Домой»</p>
          <p className="text-xs text-dusk leading-relaxed">Нажмите <span className="font-semibold">Поделиться</span> → <span className="font-semibold">«На экран «Домой»</span></p>
          <button onClick={() => setShowIOSHint(false)} className="mt-3 text-xs text-rose font-medium">Понятно</button>
        </div>
      )}

      {/* Content — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-7 pb-10 pt-6">

        <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-rose mb-4">
          Ваш спутник красоты
        </p>

        <h1 className="font-serif text-[2.4rem] leading-[1.06] text-graphite mb-4 tracking-tight">
          Красота,<br />
          которая помнит<br />
          <span className="text-rose">о Вас</span>.
        </h1>

        <p className="text-[14px] text-dusk leading-relaxed mb-7 max-w-[280px]">
          Заботится о Вас между визитами, помнит предпочтения и помогает сохранять результат.
        </p>

        <div className="flex flex-col gap-3">
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

        {/* Feature icons — hidden on very small screens */}
        <div className="hidden sm:flex gap-8 mt-8">
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
  )
}
