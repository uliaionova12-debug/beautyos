'use client'

import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface Props {
  // Called with the final transcript — caller appends to their input state
  onTranscript: (text: string) => void
  disabled?: boolean
  // Visual variants to match different chat UIs
  variant?: 'default' | 'sage' | 'graphite'
  size?: 'sm' | 'md'
}

const ERROR_MESSAGES: Record<string, string> = {
  permission_denied: 'Нет доступа к микрофону. Разрешите доступ в настройках браузера.',
  no_speech:         'Не удалось распознать речь. Попробуйте ещё раз.',
  network:           'Ошибка сети при распознавании. Проверьте подключение.',
  not_supported:     'Голосовой ввод не поддерживается в этом браузере.',
  unknown:           'Не удалось получить доступ к микрофону. Продолжайте ввод текста вручную.',
}

export function VoiceButton({ onTranscript, disabled, variant = 'default', size = 'md' }: Props) {
  const { listening, supported, error, toggle, clearError } = useVoiceInput(onTranscript)

  if (!supported) return null

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const ico = size === 'sm' ? 14 : 16

  const baseClass = `${dim} relative rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95`

  const colorClass = listening
    ? 'bg-terracotta text-white'
    : variant === 'sage'
      ? 'bg-cream border border-parchment text-dusk hover:border-sage hover:text-sage'
      : variant === 'graphite'
        ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
        : 'bg-cream border border-parchment text-dusk hover:border-graphite/40 hover:text-graphite'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={listening ? 'Остановить запись' : 'Говорить голосом'}
        className={`${baseClass} ${colorClass} ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {listening && (
          <span className="absolute inset-0 rounded-xl bg-terracotta animate-ping opacity-25 pointer-events-none" />
        )}
        {error ? <MicOff size={ico} /> : <Mic size={ico} />}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-graphite text-white text-xs rounded-xl px-3 py-2.5 shadow-lg z-50 leading-relaxed">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
          <button
            onClick={clearError}
            className="block mt-1.5 text-white/60 hover:text-white underline underline-offset-2 transition-colors"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  )
}
