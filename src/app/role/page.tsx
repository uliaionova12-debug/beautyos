'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Scissors, User } from 'lucide-react'

const ROLES = [
  {
    key: 'owner',
    icon: Building2,
    title: 'Владелец',
    description: 'Управляю салоном. Хочу видеть прибыль, возвратность и загрузку мастеров.',
    color: 'blue',
  },
  {
    key: 'master',
    icon: Scissors,
    title: 'Мастер',
    description: 'Работаю в салоне. Хочу видеть своих клиентов и рекомендации по их удержанию.',
    color: 'purple',
  },
  {
    key: 'client',
    icon: User,
    title: 'Клиент',
    description: 'Посещаю салон. Хочу видеть историю, напоминания и записаться к мастеру.',
    color: 'emerald',
  },
]

const COLOR_MAP = {
  blue: {
    bg: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    icon: 'bg-blue-500/10 text-blue-400',
    active: 'border-blue-500/50 bg-blue-500/5',
  },
  purple: {
    bg: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    icon: 'bg-purple-500/10 text-purple-400',
    active: 'border-purple-500/50 bg-purple-500/5',
  },
  emerald: {
    bg: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    icon: 'bg-emerald-500/10 text-emerald-400',
    active: 'border-emerald-500/50 bg-emerald-500/5',
  },
}

export default function RolePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const salonId = searchParams.get('salon_id') || ''

  function choose(role: string) {
    if (role === 'owner') router.push(`/dashboard?salon_id=${salonId}`)
    else if (role === 'master') router.push(`/master?salon_id=${salonId}`)
    else router.push(`/client?salon_id=${salonId}`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight mb-2">BeautyOS</h1>
          <p className="text-zinc-500 text-sm">Кто вы в этом салоне?</p>
        </div>

        <div className="space-y-3">
          {ROLES.map(role => {
            const Icon = role.icon
            const colors = COLOR_MAP[role.color as keyof typeof COLOR_MAP]
            return (
              <button
                key={role.key}
                onClick={() => choose(role.key)}
                className={`w-full text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-all duration-200 ${colors.bg} group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl shrink-0 transition-colors ${colors.icon}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{role.title}</p>
                    <p className="text-sm text-zinc-500 mt-0.5 leading-snug">{role.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-zinc-700 text-center mt-8">
          Роль можно сменить в любой момент
        </p>
      </div>
    </div>
  )
}
